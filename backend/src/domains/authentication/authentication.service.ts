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
} from "../identity/user.repository.js";

import {
  AuthenticationConflictError,
} from "./authentication.errors.js";

import {
  createEmailVerificationToken,
} from "./email-verification-token.repository.js";

import {
  hashPassword,
} from "./password.security.js";

import {
  createNumericVerificationCodePair,
} from "./token.security.js";

import type {
  AuthenticationAccountSummary,
  RegisterAuthenticationAccountInput,
  RegisterAuthenticationAccountResult,
} from "./authentication.service.types.js";

export const AUTHENTICATION_SERVICE_POLICY = {
  signupVerificationLifetimeMilliseconds:
    10 * 60 * 1000,
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
}

const DEFAULT_AUTHENTICATION_SERVICE_DEPENDENCIES:
  AuthenticationServiceDependencies = {
    runDatabaseTransaction,

    findUserByEmail,

    createUser,

    createEmailVerificationToken,

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