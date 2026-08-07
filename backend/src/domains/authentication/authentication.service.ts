import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  normalizeIdentityEmail,
  normalizeRequiredIdentityText,
  type UserIdentityRecord,
} from "../identity/identity.types.js";

import {
  createUser,
  findUserByEmail,
  markUserEmailVerified,
} from "../identity/user.repository.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationConflictError,
  AuthenticationTokenExpiredError,
  AuthenticationTokenInvalidError,
} from "./authentication.errors.js";

import {
  consumeEmailVerificationToken,
  createEmailVerificationToken,
  findPendingEmailVerificationToken,
  recordEmailVerificationAttempt,
} from "./email-verification-token.repository.js";

import {
  hashPassword,
} from "./password.security.js";

import {
  createNumericVerificationCodePair,
  verifyAuthenticationSecretDigest,
} from "./token.security.js";

import type {
  AuthenticationAccountSummary,
  RegisterAuthenticationAccountInput,
  RegisterAuthenticationAccountResult,
  ResendSignupEmailInput,
  ResendSignupEmailResult,
  VerifySignupEmailInput,
  VerifySignupEmailResult,
} from "./authentication.service.types.js";

export const AUTHENTICATION_SERVICE_POLICY = {
  signupVerificationLifetimeMilliseconds:
    10 * 60 * 1000,

  signupVerificationMaximumAttempts:
    5,

  signupVerificationCodeDigits:
    6,
} as const;

const DUPLICATE_EMAIL_MESSAGE =
  "An account already exists for the normalized email address.";

export interface AuthenticationServiceDependencies {
  runDatabaseTransaction:
    typeof runDatabaseTransaction;

  findUserByEmail:
    typeof findUserByEmail;

  createUser:
    typeof createUser;

  createEmailVerificationToken:
    typeof createEmailVerificationToken;

  findPendingEmailVerificationToken:
    typeof findPendingEmailVerificationToken;

  recordEmailVerificationAttempt:
    typeof recordEmailVerificationAttempt;

  consumeEmailVerificationToken:
    typeof consumeEmailVerificationToken;

  markUserEmailVerified:
    typeof markUserEmailVerified;

  verifyAuthenticationSecretDigest:
    typeof verifyAuthenticationSecretDigest;

  hashPassword:
    typeof hashPassword;

  createNumericVerificationCodePair:
    typeof createNumericVerificationCodePair;

  now:
    () => Date;
}

export interface AuthenticationService {
  registerAuthenticationAccount:
    (
      input:
        RegisterAuthenticationAccountInput
    ) => Promise<
      RegisterAuthenticationAccountResult
    >;

  resendSignupEmail:
    (
      input:
        ResendSignupEmailInput
    ) => Promise<
      ResendSignupEmailResult
    >;
  verifySignupEmail:
    (
      input:
        VerifySignupEmailInput
    ) => Promise<
      VerifySignupEmailResult
    >;
}

const DEFAULT_AUTHENTICATION_SERVICE_DEPENDENCIES:
  AuthenticationServiceDependencies = {
    runDatabaseTransaction,

    findUserByEmail,

    createUser,

    createEmailVerificationToken,

    findPendingEmailVerificationToken,

    recordEmailVerificationAttempt,

    consumeEmailVerificationToken,

    markUserEmailVerified,

    verifyAuthenticationSecretDigest,

    hashPassword,

    createNumericVerificationCodePair,

    now:
      () => new Date(),
  };

function assertValidServiceDate(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Authentication service time must be a valid date."
    );
  }
}

function normalizeRegistrationEmail(
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

function normalizeRegistrationFullName(
  fullName: string
): string {
  const normalizedFullName =
    normalizeRequiredIdentityText(
      fullName
    );

  if (
    normalizedFullName.length ===
    0
  ) {
    throw new TypeError(
      "Full name is required."
    );
  }

  return normalizedFullName;
}

function normalizeSignupVerificationCode(
  code: string
): string {
  return code.trim();
}

function isSignupVerificationCodeFormatValid(
  code: string
): boolean {
  return new RegExp(
    `^\\d{${
      AUTHENTICATION_SERVICE_POLICY
        .signupVerificationCodeDigits
    }}$`
  ).test(
    code
  );
}

function mapAuthenticationAccountSummary(
  user:
    UserIdentityRecord
): AuthenticationAccountSummary {
  return {
    id:
      user.id,

    email:
      user.email,

    fullName:
      user.fullName,

    status:
      user.status,

    emailVerifiedAt:
      user.emailVerifiedAt,

    createdAt:
      user.createdAt,
  };
}

function isPostgreSqlUniqueViolation(
  error: unknown
): boolean {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return false;
  }

  return (
    error as {
      code?: unknown;
    }
  ).code ===
    "23505";
}

/**
 * Issues a new signup email-verification challenge for one
 * still-pending account.
 */
export async function resendSignupEmail(
  input:
    ResendSignupEmailInput
): Promise<
  ResendSignupEmailResult
> {
  return await defaultAuthenticationService
    .resendSignupEmail(
      input
    );
}
/**
 * Creates an authentication service with replaceable
 * dependencies.
 *
 * Production uses the default database and security
 * implementations. Tests can provide isolated deterministic
 * implementations without weakening production behavior.
 */
export function createAuthenticationService(
  overrides:
    Partial<
      AuthenticationServiceDependencies
    > =
    {}
): AuthenticationService {
  const dependencies:
    AuthenticationServiceDependencies = {
      ...DEFAULT_AUTHENTICATION_SERVICE_DEPENDENCIES,
      ...overrides,
    };

  return {
    async registerAuthenticationAccount(
      input
    ) {
      const email =
        normalizeRegistrationEmail(
          input.email
        );

      const fullName =
        normalizeRegistrationFullName(
          input.fullName
        );

      const existingUserBeforeHashing =
        await dependencies
          .findUserByEmail(
            email
          );

      if (
        existingUserBeforeHashing
      ) {
        throw new AuthenticationConflictError(
          DUPLICATE_EMAIL_MESSAGE
        );
      }

      /*
       * Argon2 work is intentionally completed before checking
       * out a transaction-scoped database connection.
       */
      const passwordHash =
        await dependencies
          .hashPassword(
            input.password
          );

      const verificationCodePair =
        dependencies
          .createNumericVerificationCodePair();

      const registeredAt =
        dependencies.now();

      assertValidServiceDate(
        registeredAt
      );

      const expiresAt =
        new Date(
          registeredAt.getTime() +
            AUTHENTICATION_SERVICE_POLICY
              .signupVerificationLifetimeMilliseconds
        );

      try {
        const registration =
          await dependencies
            .runDatabaseTransaction(
              async (
                executor
              ) => {
                /*
                 * Re-check inside the transaction. PostgreSQL's
                 * unique email index remains the final authority
                 * for concurrent registration attempts.
                 */
                const existingUser =
                  await dependencies
                    .findUserByEmail(
                      email,
                      executor
                    );

                if (
                  existingUser
                ) {
                  throw new AuthenticationConflictError(
                    DUPLICATE_EMAIL_MESSAGE
                  );
                }

                const user =
                  await dependencies
                    .createUser(
                      {
                        email,

                        passwordHash,

                        fullName,
                      },
                      executor
                    );

                const verificationToken =
                  await dependencies
                    .createEmailVerificationToken(
                      {
                        userId:
                          user.id,

                        tokenDigest:
                          verificationCodePair.digest,

                        purpose:
                          "signup",

                        createdAt:
                          registeredAt,

                        expiresAt,
                      },
                      executor
                    );

                return {
                  user,

                  verificationToken,
                };
              }
            );

        return {
          account:
            mapAuthenticationAccountSummary(
              registration.user
            ),

          emailVerification: {
            purpose:
              "signup",

            tokenId:
              registration
                .verificationToken
                .id,

            code:
              verificationCodePair.code,

            expiresAt:
              registration
                .verificationToken
                .expiresAt,
          },
        };
      } catch (
        error
      ) {
        if (
          isPostgreSqlUniqueViolation(
            error
          )
        ) {
          throw new AuthenticationConflictError(
            DUPLICATE_EMAIL_MESSAGE
          );
        }

        throw error;
      }
    },

    async resendSignupEmail(
      input
    ) {
      const email =
        normalizeRegistrationEmail(
          input.email
        );

      const verificationCodePair =
        dependencies
          .createNumericVerificationCodePair();

      const requestedAt =
        dependencies.now();

      assertValidServiceDate(
        requestedAt
      );

      const expiresAt =
        new Date(
          requestedAt.getTime() +
            AUTHENTICATION_SERVICE_POLICY
              .signupVerificationLifetimeMilliseconds
        );

      const resend =
        await dependencies
          .runDatabaseTransaction(
            async (
              executor
            ) => {
              const user =
                await dependencies
                  .findUserByEmail(
                    email,
                    executor
                  );

              if (
                !user ||
                user.status !==
                  "pending_verification" ||
                user.emailVerifiedAt !==
                  null
              ) {
                throw new AuthenticationTokenInvalidError();
              }

              const verificationToken =
                await dependencies
                  .createEmailVerificationToken(
                    {
                      userId:
                        user.id,

                      tokenDigest:
                        verificationCodePair.digest,

                      purpose:
                        "signup",

                      createdAt:
                        requestedAt,

                      expiresAt,
                    },
                    executor
                  );

              return {
                user,

                verificationToken,
              };
            }
          );

      return {
        account:
          mapAuthenticationAccountSummary(
            resend.user
          ),

        emailVerification: {
          purpose:
            "signup",

          tokenId:
            resend
              .verificationToken
              .id,

          code:
            verificationCodePair.code,

          expiresAt:
            resend
              .verificationToken
              .expiresAt,
        },
      };
    },
    async verifySignupEmail(
      input
    ) {
      const email =
        normalizeRegistrationEmail(
          input.email
        );

      const code =
        normalizeSignupVerificationCode(
          input.code
        );

      const verifiedAt =
        dependencies.now();

      assertValidServiceDate(
        verifiedAt
      );

      const outcome =
        await dependencies
          .runDatabaseTransaction(
            async (
              executor
            ) => {
              const user =
                await dependencies
                  .findUserByEmail(
                    email,
                    executor
                  );

              if (
                !user ||
                user.status !==
                  "pending_verification" ||
                user.emailVerifiedAt !==
                  null
              ) {
                throw new AuthenticationTokenInvalidError();
              }

              const token =
                await dependencies
                  .findPendingEmailVerificationToken(
                    {
                      userId:
                        user.id,

                      purpose:
                        "signup",
                    },
                    executor
                  );

              if (!token) {
                throw new AuthenticationTokenInvalidError();
              }

              if (
                token.expiresAt.getTime() <=
                verifiedAt.getTime()
              ) {
                throw new AuthenticationTokenExpiredError();
              }

              if (
                token.attemptCount >=
                AUTHENTICATION_SERVICE_POLICY
                  .signupVerificationMaximumAttempts
              ) {
                throw new AuthenticationTokenInvalidError();
              }

              const matches =
                isSignupVerificationCodeFormatValid(
                  code
                ) &&
                dependencies
                  .verifyAuthenticationSecretDigest(
                    code,
                    token.tokenDigest
                  );

              if (!matches) {
                const attemptedToken =
                  await dependencies
                    .recordEmailVerificationAttempt(
                      {
                        tokenDigest:
                          token.tokenDigest,

                        attemptedAt:
                          verifiedAt,

                        maximumAttempts:
                          AUTHENTICATION_SERVICE_POLICY
                            .signupVerificationMaximumAttempts,
                      },
                      executor
                    );

                if (!attemptedToken) {
                  throw new AuthenticationConcurrencyError();
                }

                /*
                 * Return instead of throwing here so the failed
                 * attempt commits. The public error is raised
                 * after the transaction has completed.
                 */
                return {
                  status:
                    "invalid",
                } as const;
              }

              const consumedToken =
                await dependencies
                  .consumeEmailVerificationToken(
                    {
                      tokenDigest:
                        token.tokenDigest,

                      consumedAt:
                        verifiedAt,

                      maximumAttempts:
                        AUTHENTICATION_SERVICE_POLICY
                          .signupVerificationMaximumAttempts,
                    },
                    executor
                  );

              if (!consumedToken) {
                throw new AuthenticationConcurrencyError();
              }

              const verifiedUser =
                await dependencies
                  .markUserEmailVerified(
                    {
                      userId:
                        user.id,

                      expectedRowVersion:
                        user.rowVersion,

                      verifiedAt,
                    },
                    executor
                  );

              if (!verifiedUser) {
                throw new AuthenticationConcurrencyError();
              }

              return {
                status:
                  "verified",

                user:
                  verifiedUser,
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
        account:
          mapAuthenticationAccountSummary(
            outcome.user
          ),

        verifiedAt,
      };
    },
  };
}

const defaultAuthenticationService =
  createAuthenticationService();

/**
 * Registers one Poster account and its signup-verification
 * challenge atomically.
 */
export async function registerAuthenticationAccount(
  input:
    RegisterAuthenticationAccountInput
): Promise<
  RegisterAuthenticationAccountResult
> {
  return await defaultAuthenticationService
    .registerAuthenticationAccount(
      input
    );
}

/**
 * Verifies one signup email challenge and activates the
 * corresponding account atomically.
 */
export async function verifySignupEmail(
  input:
    VerifySignupEmailInput
): Promise<
  VerifySignupEmailResult
> {
  return await defaultAuthenticationService
    .verifySignupEmail(
      input
    );
}
