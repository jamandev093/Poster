import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createSessionLifecycleService,
  type SessionLifecycleServiceDependencies,
} from "../src/application/authentication/session-lifecycle.service.js";

import {
  AuthenticationSessionInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  UserIdentityRecord,
  UserSessionRecord,
} from "../src/domains/identity/identity.types.js";

const NOW =
  new Date(
    "2026-07-29T07:00:00.000Z"
  );

const USER:
  UserIdentityRecord = {
  id:
    "00000000-0000-4000-8000-000000000101",

  email:
    "person@example.com",

  passwordHash:
    "persisted-password-hash",

  fullName:
    "Example Person",

  status:
    "active",

  emailVerifiedAt:
    new Date(
      "2026-07-28T07:00:00.000Z"
    ),

  lastLoginAt:
    new Date(
      "2026-07-29T06:00:00.000Z"
    ),

  failedLoginAttempts:
    0,

  lockedUntil:
    null,

  createdAt:
    new Date(
      "2026-07-28T06:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-07-29T06:00:00.000Z"
    ),

  deletedAt:
    null,

  rowVersion:
    "4",
};

const SESSION:
  UserSessionRecord = {
  id:
    "00000000-0000-4000-8000-000000000201",

  userId:
    USER.id,

  organizationId:
    null,

  refreshTokenDigest:
    "b".repeat(
      64
    ),

  ipAddress:
    "127.0.0.1",

  userAgent:
    "Poster Test",

  createdAt:
    new Date(
      "2026-07-29T06:00:00.000Z"
    ),

  lastSeenAt:
    NOW,

  expiresAt:
    new Date(
      "2026-08-28T06:00:00.000Z"
    ),

  revokedAt:
    null,

  revocationReason:
    null,
};

function createExecutor():
  DatabaseQueryExecutor {
  return {
    query:
      vi.fn(),
  } as unknown as
    DatabaseQueryExecutor;
}

function createTransactionRunner(
  executor:
    DatabaseQueryExecutor
): SessionLifecycleServiceDependencies[
  "runDatabaseTransaction"
] {
  return async (
    operation
  ) => {
    return await operation(
      executor
    );
  };
}

describe(
  "Poster authentication session lifecycle service",
  () => {
    it(
      "rotates a refresh token and returns only the replacement raw token",
      async () => {
        const executor =
          createExecutor();

        const rotate =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "rotateUserSessionRefreshToken"
            ]
          >();

        rotate
          .mockResolvedValue({
            status:
              "rotated",

            session:
              SESSION,
          });

        const findUserById =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "findUserById"
            ]
          >();

        findUserById
          .mockResolvedValue(
            USER
          );

        const service =
          createSessionLifecycleService({
            runDatabaseTransaction:
              createTransactionRunner(
                executor
              ),

            createOpaqueTokenPair:
              () => ({
                token:
                  "replacement-refresh-token",

                digest:
                  "b".repeat(
                    64
                  ),
              }),

            digestAuthenticationSecret:
              () =>
                "a".repeat(
                  64
                ),

            rotateUserSessionRefreshToken:
              rotate,

            findUserById,

            now:
              () => NOW,
          });

        await expect(
          service.refresh({
            refreshToken:
              "current-refresh-token",

            ipAddress:
              "127.0.0.1",

            userAgent:
              "Poster Test",
          })
        ).resolves.toEqual({
          account: {
            id:
              USER.id,

            email:
              USER.email,

            fullName:
              USER.fullName,

            status:
              USER.status,

            emailVerifiedAt:
              USER.emailVerifiedAt,

            createdAt:
              USER.createdAt,
          },

          session: {
            id:
              SESSION.id,

            userId:
              SESSION.userId,

            organizationId:
              SESSION.organizationId,

            createdAt:
              SESSION.createdAt,

            expiresAt:
              SESSION.expiresAt,
          },

          refreshToken:
            "replacement-refresh-token",
        });

        expect(
          rotate
        ).toHaveBeenCalledWith(
          {
            currentRefreshTokenDigest:
              "a".repeat(
                64
              ),

            replacementRefreshTokenDigest:
              "b".repeat(
                64
              ),

            rotatedAt:
              NOW,
          },
          executor
        );
      }
    );

    it(
      "commits replay handling and then rejects the refresh",
      async () => {
        const executor =
          createExecutor();

        const rotate =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "rotateUserSessionRefreshToken"
            ]
          >();

        rotate
          .mockResolvedValue({
            status:
              "replayed",

            sessionId:
              SESSION.id,

            userId:
              USER.id,
          });

        const findUserById =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "findUserById"
            ]
          >();

        const service =
          createSessionLifecycleService({
            runDatabaseTransaction:
              createTransactionRunner(
                executor
              ),

            createOpaqueTokenPair:
              () => ({
                token:
                  "unused-replacement-token",

                digest:
                  "b".repeat(
                    64
                  ),
              }),

            digestAuthenticationSecret:
              () =>
                "a".repeat(
                  64
                ),

            rotateUserSessionRefreshToken:
              rotate,

            findUserById,

            now:
              () => NOW,
          });

        await expect(
          service.refresh({
            refreshToken:
              "replayed-refresh-token",
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );

        expect(
          findUserById
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "revokes a rotated session when the account is no longer active",
      async () => {
        const executor =
          createExecutor();

        const revoke =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "revokeUserSession"
            ]
          >();

        revoke
          .mockResolvedValue({
            ...SESSION,

            revokedAt:
              NOW,

            revocationReason:
              "account_not_eligible_for_session_refresh",
          });

        const service =
          createSessionLifecycleService({
            runDatabaseTransaction:
              createTransactionRunner(
                executor
              ),

            createOpaqueTokenPair:
              () => ({
                token:
                  "replacement-refresh-token",

                digest:
                  "b".repeat(
                    64
                  ),
              }),

            digestAuthenticationSecret:
              () =>
                "a".repeat(
                  64
                ),

            rotateUserSessionRefreshToken:
              vi.fn()
                .mockResolvedValue({
                  status:
                    "rotated",

                  session:
                    SESSION,
                }),

            findUserById:
              vi.fn()
                .mockResolvedValue({
                  ...USER,

                  status:
                    "suspended",
                }),

            revokeUserSession:
              revoke,

            now:
              () => NOW,
          });

        await expect(
          service.refresh({
            refreshToken:
              "current-refresh-token",
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );

        expect(
          revoke
        ).toHaveBeenCalledWith(
          {
            sessionId:
              SESSION.id,

            revokedAt:
              NOW,

            reason:
              "account_not_eligible_for_session_refresh",
          },
          executor
        );
      }
    );

    it(
      "revokes the refresh-token session during logout",
      async () => {
        const revokeByDigest =
          vi.fn<
            SessionLifecycleServiceDependencies[
              "revokeUserSessionByRefreshTokenDigest"
            ]
          >();

        revokeByDigest
          .mockResolvedValue({
            ...SESSION,

            revokedAt:
              NOW,

            revocationReason:
              "user_logout",
          });

        const service =
          createSessionLifecycleService({
            digestAuthenticationSecret:
              () =>
                "a".repeat(
                  64
                ),

            revokeUserSessionByRefreshTokenDigest:
              revokeByDigest,

            now:
              () => NOW,
          });

        await expect(
          service.logout({
            refreshToken:
              "logout-refresh-token",
          })
        ).resolves.toEqual({
          revoked:
            true,
        });

        expect(
          revokeByDigest
        ).toHaveBeenCalledWith({
          refreshTokenDigest:
            "a".repeat(
              64
            ),

          revokedAt:
            NOW,

          reason:
            "user_logout",
        });
      }
    );
  }
);