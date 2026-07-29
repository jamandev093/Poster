import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationTokenExpiredError,
  AuthenticationTokenInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import {
  consumePasswordResetToken,
  createPasswordResetToken,
  findPendingPasswordResetToken,
  invalidatePasswordResetTokens,
  recordPasswordResetAttempt,
} from "../../domains/authentication/password-reset-token.repository.js";

import {
  hashPassword,
} from "../../domains/authentication/password.security.js";

import {
  digestAuthenticationSecret,
  generateNumericVerificationCode,
  verifyAuthenticationSecretDigest,
} from "../../domains/authentication/token.security.js";

import {
  normalizeIdentityEmail,
  type UserIdentityRecord,
} from "../../domains/identity/identity.types.js";

import {
  revokeAllUserSessions,
} from "../../domains/identity/session.repository.js";

import {
  findUserByEmail,
  updateUserPassword,
} from "../../domains/identity/user.repository.js";

import {
  createPasswordResetEmailMessage,
} from "../../services/email/email-delivery.templates.js";

import type {
  EmailDeliveryProvider,
} from "../../services/email/email-delivery.types.js";

import type {
  ConfirmPasswordResetInput,
  ConfirmPasswordResetResult,
  RequestPasswordResetInput,
  RequestPasswordResetResult,
} from "./password-reset.types.js";

export const PASSWORD_RESET_POLICY = {
  lifetimeMilliseconds:
    15 * 60 * 1000,

  maximumAttempts:
    5,

  codeDigits:
    6,
} as const;

export interface CreatePasswordResetServiceOptions {
  emailDeliveryProvider:
    EmailDeliveryProvider;

  runDatabaseTransaction?:
    typeof runDatabaseTransaction;

  findUserByEmail?:
    typeof findUserByEmail;

  createPasswordResetToken?:
    typeof createPasswordResetToken;

  findPendingPasswordResetToken?:
    typeof findPendingPasswordResetToken;

  recordPasswordResetAttempt?:
    typeof recordPasswordResetAttempt;

  consumePasswordResetToken?:
    typeof consumePasswordResetToken;

  invalidatePasswordResetTokens?:
    typeof invalidatePasswordResetTokens;

  updateUserPassword?:
    typeof updateUserPassword;

  revokeAllUserSessions?:
    typeof revokeAllUserSessions;

  hashPassword?:
    typeof hashPassword;

  generateNumericVerificationCode?:
    typeof generateNumericVerificationCode;

  digestAuthenticationSecret?:
    typeof digestAuthenticationSecret;

  verifyAuthenticationSecretDigest?:
    typeof verifyAuthenticationSecretDigest;

  createPasswordResetEmailMessage?:
    typeof createPasswordResetEmailMessage;

  now?:
    () => Date;
}

export interface PasswordResetService {
  request:
    (
      input:
        RequestPasswordResetInput
    ) => Promise<
      RequestPasswordResetResult
    >;

  confirm:
    (
      input:
        ConfirmPasswordResetInput
    ) => Promise<
      ConfirmPasswordResetResult
    >;
}

function assertValidPasswordResetDate(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Password-reset service time must be a valid date."
    );
  }
}

function normalizePasswordResetEmail(
  email: string
): string {
  const normalizedEmail =
    normalizeIdentityEmail(
      email
    );

  if (
    normalizedEmail.length ===
    0
  ) {
    throw new TypeError(
      "Email is required."
    );
  }

  return normalizedEmail;
}

function normalizePasswordResetCode(
  code: string
): string {
  return code.trim();
}

function isPasswordResetCodeFormatValid(
  code: string
): boolean {
  return new RegExp(
    `^\\d{${
      PASSWORD_RESET_POLICY
        .codeDigits
    }}$`
  ).test(
    code
  );
}

function userMayResetPassword(
  user:
    UserIdentityRecord
): boolean {
  return (
    user.deletedAt ===
      null &&
    user.status ===
      "active" &&
    user.emailVerifiedAt !==
      null
  );
}

function createPasswordResetDigestSecret(
  userId: string,
  createdAt: Date,
  code: string
): string {
  return [
    userId,
    createdAt.toISOString(),
    code,
  ].join(
    ":"
  );
}

/**
 * Creates the Poster password-reset workflow.
 *
 * Request responses are intentionally generic so callers
 * cannot determine whether an email address has an account.
 * Password replacement, token consumption, and global session
 * revocation are completed in one PostgreSQL transaction.
 */
export function createPasswordResetService(
  options:
    CreatePasswordResetServiceOptions
): PasswordResetService {
  const executeTransaction =
    options.runDatabaseTransaction ??
    runDatabaseTransaction;

  const findUser =
    options.findUserByEmail ??
    findUserByEmail;

  const createResetToken =
    options.createPasswordResetToken ??
    createPasswordResetToken;

  const findPendingResetToken =
    options.findPendingPasswordResetToken ??
    findPendingPasswordResetToken;

  const recordResetAttempt =
    options.recordPasswordResetAttempt ??
    recordPasswordResetAttempt;

  const consumeResetToken =
    options.consumePasswordResetToken ??
    consumePasswordResetToken;

  const invalidateResetTokens =
    options.invalidatePasswordResetTokens ??
    invalidatePasswordResetTokens;

  const replaceUserPassword =
    options.updateUserPassword ??
    updateUserPassword;

  const revokeSessions =
    options.revokeAllUserSessions ??
    revokeAllUserSessions;

  const createPasswordHash =
    options.hashPassword ??
    hashPassword;

  const createCode =
    options.generateNumericVerificationCode ??
    generateNumericVerificationCode;

  const digestSecret =
    options.digestAuthenticationSecret ??
    digestAuthenticationSecret;

  const verifySecretDigest =
    options.verifyAuthenticationSecretDigest ??
    verifyAuthenticationSecretDigest;

  const createEmailMessage =
    options.createPasswordResetEmailMessage ??
    createPasswordResetEmailMessage;

  const now =
    options.now ??
    (() => new Date());

  return {
    async request(
      input
    ) {
      const email =
        normalizePasswordResetEmail(
          input.email
        );

      const requestedAt =
        now();

      assertValidPasswordResetDate(
        requestedAt
      );

      const user =
        await findUser(
          email
        );

      if (
        !user ||
        !userMayResetPassword(
          user
        )
      ) {
        return {
          status:
            "accepted",
        };
      }

      const code =
        createCode(
          PASSWORD_RESET_POLICY
            .codeDigits
        );

      const expiresAt =
        new Date(
          requestedAt.getTime() +
            PASSWORD_RESET_POLICY
              .lifetimeMilliseconds
        );

      const tokenDigest =
        digestSecret(
          createPasswordResetDigestSecret(
            user.id,
            requestedAt,
            code
          )
        );

      const token =
        await createResetToken({
          userId:
            user.id,

          tokenDigest,

          requestedIpAddress:
            input.ipAddress ??
            null,

          requestedUserAgent:
            input.userAgent ??
            null,

          createdAt:
            requestedAt,

          expiresAt,
        });

      const message =
        createEmailMessage({
          recipientEmail:
            user.email,

          recipientName:
            user.fullName,

          resetCode:
            code,

          expiresAt:
            token.expiresAt,

          idempotencyKey:
            token.id,
        });

      try {
        await options
          .emailDeliveryProvider
          .sendEmail(
            message
          );
      } catch {
        /*
         * Preserve the generic HTTP outcome while preventing an
         * undelivered challenge from remaining usable.
         */
        await invalidateResetTokens({
          userId:
            user.id,

          invalidatedAt:
            requestedAt,
        });
      }

      return {
        status:
          "accepted",
      };
    },

    async confirm(
      input
    ) {
      const email =
        normalizePasswordResetEmail(
          input.email
        );

      const code =
        normalizePasswordResetCode(
          input.code
        );

      /*
       * Complete Argon2 work before checking out a transaction
       * connection.
       */
      const passwordHash =
        await createPasswordHash(
          input.password
        );

      const confirmedAt =
        now();

      assertValidPasswordResetDate(
        confirmedAt
      );

      const outcome =
        await executeTransaction(
          async (
            executor
          ) => {
            const user =
              await findUser(
                email,
                executor
              );

            if (
              !user ||
              !userMayResetPassword(
                user
              )
            ) {
              throw new AuthenticationTokenInvalidError();
            }

            const token =
              await findPendingResetToken(
                {
                  userId:
                    user.id,
                },
                executor
              );

            if (
              !token
            ) {
              throw new AuthenticationTokenInvalidError();
            }

            if (
              token.expiresAt.getTime() <=
              confirmedAt.getTime()
            ) {
              throw new AuthenticationTokenExpiredError();
            }

            if (
              token.attemptCount >=
              PASSWORD_RESET_POLICY
                .maximumAttempts
            ) {
              throw new AuthenticationTokenInvalidError();
            }

            const matches =
              isPasswordResetCodeFormatValid(
                code
              ) &&
              verifySecretDigest(
                createPasswordResetDigestSecret(
                  user.id,
                  token.createdAt,
                  code
                ),
                token.tokenDigest
              );

            if (
              !matches
            ) {
              const attemptedToken =
                await recordResetAttempt(
                  {
                    tokenDigest:
                      token.tokenDigest,

                    attemptedAt:
                      confirmedAt,

                    maximumAttempts:
                      PASSWORD_RESET_POLICY
                        .maximumAttempts,
                  },
                  executor
                );

              if (
                !attemptedToken
              ) {
                throw new AuthenticationConcurrencyError();
              }

              return {
                status:
                  "invalid",
              } as const;
            }

            const consumedToken =
              await consumeResetToken(
                {
                  tokenDigest:
                    token.tokenDigest,

                  consumedAt:
                    confirmedAt,

                  maximumAttempts:
                    PASSWORD_RESET_POLICY
                      .maximumAttempts,
                },
                executor
              );

            if (
              !consumedToken
            ) {
              throw new AuthenticationConcurrencyError();
            }

            const updatedUser =
              await replaceUserPassword(
                {
                  userId:
                    user.id,

                  expectedRowVersion:
                    user.rowVersion,

                  passwordHash,
                },
                executor
              );

            if (
              !updatedUser
            ) {
              throw new AuthenticationConcurrencyError();
            }

            await revokeSessions(
              {
                userId:
                  user.id,

                revokedAt:
                  confirmedAt,

                reason:
                  "password_reset_completed",
              },
              executor
            );

            await invalidateResetTokens(
              {
                userId:
                  user.id,

                invalidatedAt:
                  confirmedAt,
              },
              executor
            );

            return {
              status:
                "updated",
            } as const;
          }
        );

      if (
        outcome.status ===
        "invalid"
      ) {
        throw new AuthenticationTokenInvalidError();
      }

      return {
        status:
          "password_updated",
      };
    },
  };
}