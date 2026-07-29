import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AuthenticationSessionInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import {
  createOpaqueTokenPair,
  digestAuthenticationSecret,
} from "../../domains/authentication/token.security.js";

import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  UserIdentityRecord,
  UserSessionRecord,
} from "../../domains/identity/identity.types.js";

import {
  revokeUserSession,
} from "../../domains/identity/session.repository.js";

import {
  revokeUserSessionByRefreshTokenDigest,
  rotateUserSessionRefreshToken,
} from "../../domains/identity/session-lifecycle.repository.js";

import {
  findUserById,
} from "../../domains/identity/user.repository.js";

import type {
  AuthenticationSessionSummary,
} from "./login-session.types.js";

import type {
  LogoutAuthenticationSessionInput,
  LogoutAuthenticationSessionResult,
  RefreshAuthenticationSessionInput,
  RefreshAuthenticationSessionResult,
} from "./session-lifecycle.types.js";

const MAXIMUM_REFRESH_TOKEN_LENGTH =
  4096;

export type SessionLifecycleTransactionRunner =
  <T>(
    operation:
      (
        executor:
          DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export interface SessionLifecycleServiceDependencies {
  runDatabaseTransaction:
    SessionLifecycleTransactionRunner;

  createOpaqueTokenPair:
    typeof createOpaqueTokenPair;

  digestAuthenticationSecret:
    typeof digestAuthenticationSecret;

  rotateUserSessionRefreshToken:
    typeof rotateUserSessionRefreshToken;

  revokeUserSessionByRefreshTokenDigest:
    typeof revokeUserSessionByRefreshTokenDigest;

  revokeUserSession:
    typeof revokeUserSession;

  findUserById:
    typeof findUserById;

  now:
    () => Date;
}

export interface SessionLifecycleService {
  refresh:
    (
      input:
        RefreshAuthenticationSessionInput
    ) => Promise<
      RefreshAuthenticationSessionResult
    >;

  logout:
    (
      input:
        LogoutAuthenticationSessionInput
    ) => Promise<
      LogoutAuthenticationSessionResult
    >;
}

const DEFAULT_DEPENDENCIES:
  SessionLifecycleServiceDependencies = {
    runDatabaseTransaction:
      async (
        operation
      ) => {
        return await runDatabaseTransaction(
          operation
        );
      },

    createOpaqueTokenPair,

    digestAuthenticationSecret,

    rotateUserSessionRefreshToken,

    revokeUserSessionByRefreshTokenDigest,

    revokeUserSession,

    findUserById,

    now:
      () => new Date(),
  };

function normalizeRefreshToken(
  refreshToken: string
): string {
  const normalizedRefreshToken =
    refreshToken.trim();

  if (
    normalizedRefreshToken.length ===
      0 ||
    normalizedRefreshToken.length >
      MAXIMUM_REFRESH_TOKEN_LENGTH
  ) {
    throw new AuthenticationSessionInvalidError(
      "The supplied refresh token was empty or exceeded the accepted length."
    );
  }

  return normalizedRefreshToken;
}

function assertValidLifecycleDate(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Authentication session lifecycle time must be a valid date."
    );
  }
}

function accountMayRetainSession(
  user:
    UserIdentityRecord
): boolean {
  return (
    user.deletedAt ===
      null &&
    user.emailVerifiedAt !==
      null &&
    user.status ===
      "active"
  );
}

function mapAccountSummary(
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

function mapSessionSummary(
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

type RefreshTransactionResult =
  | {
      status: "refreshed";

      user:
        UserIdentityRecord;

      session:
        UserSessionRecord;
    }
  | {
      status: "invalid";

      reason: string;
    };

/**
 * Creates the authoritative refresh and logout service.
 *
 * Refresh-token replacement and replay detection occur inside
 * one PostgreSQL transaction. A replay revocation is committed
 * before the public session-invalid error is thrown.
 */
export function createSessionLifecycleService(
  overrides:
    Partial<
      SessionLifecycleServiceDependencies
    > =
    {}
): SessionLifecycleService {
  const dependencies:
    SessionLifecycleServiceDependencies = {
      ...DEFAULT_DEPENDENCIES,
      ...overrides,
    };

  return {
    async refresh(
      input
    ) {
      const refreshToken =
        normalizeRefreshToken(
          input.refreshToken
        );

      const refreshedAt =
        dependencies.now();

      assertValidLifecycleDate(
        refreshedAt
      );

      const suppliedDigest =
        dependencies
          .digestAuthenticationSecret(
            refreshToken
          );

      const replacementPair =
        dependencies
          .createOpaqueTokenPair();

      const transactionResult =
        await dependencies
          .runDatabaseTransaction(
            async (
              executor
            ): Promise<
              RefreshTransactionResult
            > => {
              const rotationResult =
                await dependencies
                  .rotateUserSessionRefreshToken(
                    {
                      currentRefreshTokenDigest:
                        suppliedDigest,

                      replacementRefreshTokenDigest:
                        replacementPair.digest,

                      rotatedAt:
                        refreshedAt,
                    },
                    executor
                  );

              if (
                rotationResult.status ===
                  "replayed"
              ) {
                return {
                  status:
                    "invalid",

                  reason:
                    "A rotated refresh token was replayed and the session was revoked.",
                };
              }

              if (
                rotationResult.status ===
                  "invalid"
              ) {
                return {
                  status:
                    "invalid",

                  reason:
                    "The supplied refresh token did not identify an active session.",
                };
              }

              const user =
                await dependencies
                  .findUserById(
                    rotationResult
                      .session
                      .userId,
                    executor
                  );

              if (
                !user ||
                !accountMayRetainSession(
                  user
                )
              ) {
                await dependencies
                  .revokeUserSession(
                    {
                      sessionId:
                        rotationResult
                          .session
                          .id,

                      revokedAt:
                        refreshedAt,

                      reason:
                        "account_not_eligible_for_session_refresh",
                    },
                    executor
                  );

                return {
                  status:
                    "invalid",

                  reason:
                    "The account is not eligible to retain an authenticated session.",
                };
              }

              return {
                status:
                  "refreshed",

                user,

                session:
                  rotationResult
                    .session,
              };
            }
          );

      if (
        transactionResult.status ===
          "invalid"
      ) {
        throw new AuthenticationSessionInvalidError(
          transactionResult.reason
        );
      }

      return {
        account:
          mapAccountSummary(
            transactionResult.user
          ),

        session:
          mapSessionSummary(
            transactionResult.session
          ),

        refreshToken:
          replacementPair.token,
      };
    },

    async logout(
      input
    ) {
      const refreshToken =
        normalizeRefreshToken(
          input.refreshToken
        );

      const loggedOutAt =
        dependencies.now();

      assertValidLifecycleDate(
        loggedOutAt
      );

      const refreshTokenDigest =
        dependencies
          .digestAuthenticationSecret(
            refreshToken
          );

      const revokedSession =
        await dependencies
          .revokeUserSessionByRefreshTokenDigest({
            refreshTokenDigest,

            revokedAt:
              loggedOutAt,

            reason:
              "user_logout",
          });

      return {
        revoked:
          revokedSession !==
          null,
      };
    },
  };
}

const defaultSessionLifecycleService =
  createSessionLifecycleService();

export async function refreshAuthenticationSession(
  input:
    RefreshAuthenticationSessionInput
): Promise<
  RefreshAuthenticationSessionResult
> {
  return await defaultSessionLifecycleService
    .refresh(
      input
    );
}

export async function logoutAuthenticationSession(
  input:
    LogoutAuthenticationSessionInput
): Promise<
  LogoutAuthenticationSessionResult
> {
  return await defaultSessionLifecycleService
    .logout(
      input
    );
}