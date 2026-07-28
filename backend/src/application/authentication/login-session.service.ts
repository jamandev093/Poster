import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationForbiddenError,
  InvalidCredentialsError,
} from "../../domains/authentication/authentication.errors.js";

import {
  verifyPassword,
} from "../../domains/authentication/password.security.js";

import {
  createOpaqueTokenPair,
} from "../../domains/authentication/token.security.js";

import {
  normalizeIdentityEmail,
  type CreateUserSessionInput,
  type UserIdentityRecord,
  type UserSessionRecord,
} from "../../domains/identity/identity.types.js";

import {
  createUserSession,
} from "../../domains/identity/session.repository.js";

import {
  findUserByEmail,
  recordSuccessfulUserLogin,
} from "../../domains/identity/user.repository.js";

import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  AuthenticationSessionSummary,
  LoginAuthenticationSessionInput,
  LoginAuthenticationSessionResult,
} from "./login-session.types.js";

export const LOGIN_SESSION_POLICY = {
  refreshTokenLifetimeMilliseconds:
    30 * 24 * 60 * 60 * 1000,
} as const;

export type LoginSessionTransactionRunner =
  <T>(
    operation:
      (
        executor:
          DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export interface LoginSessionServiceDependencies {
  runDatabaseTransaction:
    LoginSessionTransactionRunner;

  findUserByEmail:
    typeof findUserByEmail;

  verifyPassword:
    typeof verifyPassword;

  createOpaqueTokenPair:
    typeof createOpaqueTokenPair;

  recordSuccessfulUserLogin:
    typeof recordSuccessfulUserLogin;

  createUserSession:
    typeof createUserSession;

  now:
    () => Date;
}

export interface LoginSessionService {
  login:
    (
      input:
        LoginAuthenticationSessionInput
    ) => Promise<
      LoginAuthenticationSessionResult
    >;
}

const DEFAULT_LOGIN_SESSION_DEPENDENCIES:
  LoginSessionServiceDependencies = {
    runDatabaseTransaction:
      async (
        operation
      ) => {
        return await runDatabaseTransaction(
          operation
        );
      },

    findUserByEmail,

    verifyPassword,

    createOpaqueTokenPair,

    recordSuccessfulUserLogin,

    createUserSession,

    now:
      () => new Date(),
  };

function assertValidLoginDate(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Login time must be a valid date."
    );
  }
}

function normalizeLoginEmail(
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
    throw new InvalidCredentialsError();
  }

  return normalizedEmail;
}

function assertPasswordWasProvided(
  password: string
): void {
  if (
    password.length ===
    0
  ) {
    throw new InvalidCredentialsError();
  }
}

function assertAccountMayLogin(
  user:
    UserIdentityRecord,
  loggedInAt:
    Date
): void {
  if (
    user.lockedUntil &&
    user.lockedUntil.getTime() >
      loggedInAt.getTime()
  ) {
    /*
     * Use the generic credentials error so account lock state
     * is not exposed to an unauthenticated caller.
     */
    throw new InvalidCredentialsError();
  }

  if (
    user.emailVerifiedAt ===
      null ||
    user.status ===
      "pending_verification"
  ) {
    throw new AuthenticationForbiddenError(
      "The account must complete email verification before login."
    );
  }

  if (
    user.status !==
    "active"
  ) {
    throw new AuthenticationForbiddenError(
      "The account is not active and cannot create a session."
    );
  }
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

function mapAuthenticationSessionSummary(
  session:
    UserSessionRecord
): AuthenticationSessionSummary {
  return {
    id:
      session.id,

    userId:
      session.userId,

    organizationId:
      session.organizationId,

    createdAt:
      session.createdAt,

    expiresAt:
      session.expiresAt,
  };
}

function createSessionInput(
  input:
    LoginAuthenticationSessionInput,
  userId:
    string,
  refreshTokenDigest:
    string,
  expiresAt:
    Date
): CreateUserSessionInput {
  return {
    userId,

    organizationId:
      null,

    refreshTokenDigest,

    ipAddress:
      input.ipAddress ??
      null,

    userAgent:
      input.userAgent ??
      null,

    expiresAt,
  };
}

/**
 * Creates the Poster login and revocable-session service.
 *
 * Argon2 password verification happens before a PostgreSQL
 * transaction is opened.
 *
 * The successful-login write and session insertion then occur
 * atomically using one transaction-scoped executor.
 */
export function createLoginSessionService(
  overrides:
    Partial<
      LoginSessionServiceDependencies
    > =
    {}
): LoginSessionService {
  const dependencies:
    LoginSessionServiceDependencies = {
      ...DEFAULT_LOGIN_SESSION_DEPENDENCIES,
      ...overrides,
    };

  return {
    async login(
      input
    ) {
      const email =
        normalizeLoginEmail(
          input.email
        );

      assertPasswordWasProvided(
        input.password
      );

      const loggedInAt =
        dependencies.now();

      assertValidLoginDate(
        loggedInAt
      );

      const candidateUser =
        await dependencies
          .findUserByEmail(
            email
          );

      if (
        !candidateUser
      ) {
        /*
         * The public response remains identical to an invalid
         * password. HTTP-level throttling will be introduced at
         * the authentication protection boundary.
         */
        throw new InvalidCredentialsError();
      }

      const passwordMatches =
        await dependencies
          .verifyPassword(
            input.password,
            candidateUser.passwordHash
          );

      if (
        !passwordMatches
      ) {
        throw new InvalidCredentialsError();
      }

      assertAccountMayLogin(
        candidateUser,
        loggedInAt
      );

      const refreshTokenPair =
        dependencies
          .createOpaqueTokenPair();

      const expiresAt =
        new Date(
          loggedInAt.getTime() +
            LOGIN_SESSION_POLICY
              .refreshTokenLifetimeMilliseconds
        );

      const result =
        await dependencies
          .runDatabaseTransaction(
            async (
              executor
            ) => {
              /*
               * Re-read the identity inside the transaction so
               * status, verification, lock, password, and row
               * version changes cannot be silently ignored.
               */
              const currentUser =
                await dependencies
                  .findUserByEmail(
                    email,
                    executor
                  );

              if (
                !currentUser ||
                currentUser.id !==
                  candidateUser.id ||
                currentUser.passwordHash !==
                  candidateUser.passwordHash
              ) {
                throw new InvalidCredentialsError();
              }

              assertAccountMayLogin(
                currentUser,
                loggedInAt
              );

              const updatedUser =
                await dependencies
                  .recordSuccessfulUserLogin(
                    {
                      userId:
                        currentUser.id,

                      expectedRowVersion:
                        currentUser.rowVersion,

                      loggedInAt,
                    },
                    executor
                  );

              if (
                !updatedUser
              ) {
                throw new AuthenticationConcurrencyError();
              }

              const session =
                await dependencies
                  .createUserSession(
                    createSessionInput(
                      input,
                      updatedUser.id,
                      refreshTokenPair.digest,
                      expiresAt
                    ),
                    executor
                  );

              return {
                user:
                  updatedUser,

                session,
              };
            }
          );

      return {
        account:
          mapAuthenticationAccountSummary(
            result.user
          ),

        session:
          mapAuthenticationSessionSummary(
            result.session
          ),

        refreshToken:
          refreshTokenPair.token,
      };
    },
  };
}

const defaultLoginSessionService =
  createLoginSessionService();

/**
 * Creates a revocable Poster login session using the default
 * production repositories and security implementations.
 */
export async function loginAuthenticationSession(
  input:
    LoginAuthenticationSessionInput
): Promise<
  LoginAuthenticationSessionResult
> {
  return await defaultLoginSessionService
    .login(
      input
    );
}