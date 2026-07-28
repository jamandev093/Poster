import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationForbiddenError,
  InvalidCredentialsError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  UserIdentityRecord,
  UserSessionRecord,
} from "../src/domains/identity/identity.types.js";

import {
  createLoginSessionService,
  type LoginSessionServiceDependencies,
} from "../src/application/authentication/login-session.service.js";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const LOGGED_IN_AT =
  new Date(
    "2026-07-28T18:00:00.000Z"
  );

const SESSION_EXPIRES_AT =
  new Date(
    LOGGED_IN_AT.getTime() +
      30 * 24 * 60 * 60 * 1000
  );

const USER_RECORD:
  UserIdentityRecord = {
    id:
      "00000000-0000-4000-8000-000000000701",

    email:
      "person@example.com",

    passwordHash:
      "$argon2id$stored-test-hash",

    fullName:
      "Example Person",

    status:
      "active",

    emailVerifiedAt:
      new Date(
        "2026-07-28T17:00:00.000Z"
      ),

    lastLoginAt:
      null,

    failedLoginAttempts:
      0,

    lockedUntil:
      null,

    createdAt:
      new Date(
        "2026-07-28T16:00:00.000Z"
      ),

    updatedAt:
      new Date(
        "2026-07-28T17:00:00.000Z"
      ),

    deletedAt:
      null,

    rowVersion:
      "7",
  };

const UPDATED_USER_RECORD:
  UserIdentityRecord = {
    ...USER_RECORD,

    lastLoginAt:
      LOGGED_IN_AT,

    updatedAt:
      LOGGED_IN_AT,

    rowVersion:
      "8",
  };

const SESSION_RECORD:
  UserSessionRecord = {
    id:
      "00000000-0000-4000-8000-000000000702",

    userId:
      USER_RECORD.id,

    organizationId:
      null,

    refreshTokenDigest:
      "a".repeat(
        64
      ),

    ipAddress:
      "127.0.0.1",

    userAgent:
      "Poster Test Agent",

    createdAt:
      LOGGED_IN_AT,

    lastSeenAt:
      LOGGED_IN_AT,

    expiresAt:
      SESSION_EXPIRES_AT,

    revokedAt:
      null,

    revocationReason:
      null,
  };

const TEST_EXECUTOR:
  DatabaseQueryExecutor = {
    query:
      vi.fn(),
  } as unknown as DatabaseQueryExecutor;

function createTestContext() {
  const findUserByEmailMock =
    vi.fn<
      LoginSessionServiceDependencies[
        "findUserByEmail"
      ]
    >();

  const verifyPasswordMock =
    vi.fn<
      LoginSessionServiceDependencies[
        "verifyPassword"
      ]
    >();

  const createOpaqueTokenPairMock =
    vi.fn<
      LoginSessionServiceDependencies[
        "createOpaqueTokenPair"
      ]
    >();

  const recordSuccessfulUserLoginMock =
    vi.fn<
      LoginSessionServiceDependencies[
        "recordSuccessfulUserLogin"
      ]
    >();

  const createUserSessionMock =
    vi.fn<
      LoginSessionServiceDependencies[
        "createUserSession"
      ]
    >();

  const transactionRunner:
    LoginSessionServiceDependencies[
      "runDatabaseTransaction"
    ] =
    async (
      operation
    ) => {
      return await operation(
        TEST_EXECUTOR
      );
    };

  const service =
    createLoginSessionService({
      runDatabaseTransaction:
        transactionRunner,

      findUserByEmail:
        findUserByEmailMock,

      verifyPassword:
        verifyPasswordMock,

      createOpaqueTokenPair:
        createOpaqueTokenPairMock,

      recordSuccessfulUserLogin:
        recordSuccessfulUserLoginMock,

      createUserSession:
        createUserSessionMock,

      now:
        () =>
          new Date(
            LOGGED_IN_AT.getTime()
          ),
    });

  return {
    service,

    findUserByEmailMock,

    verifyPasswordMock,

    createOpaqueTokenPairMock,

    recordSuccessfulUserLoginMock,

    createUserSessionMock,
  };
}

describe(
  "Poster login and session service",
  () => {
    it(
      "verifies credentials and atomically creates a revocable session",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValueOnce(
            USER_RECORD
          )
          .mockResolvedValueOnce(
            USER_RECORD
          );

        context
          .verifyPasswordMock
          .mockResolvedValue(
            true
          );

        context
          .createOpaqueTokenPairMock
          .mockReturnValue({
            token:
              "raw-refresh-token",

            digest:
              SESSION_RECORD
                .refreshTokenDigest,
          });

        context
          .recordSuccessfulUserLoginMock
          .mockResolvedValue(
            UPDATED_USER_RECORD
          );

        context
          .createUserSessionMock
          .mockResolvedValue(
            SESSION_RECORD
          );

        const result =
          await context.service
            .login({
              email:
                " PERSON@EXAMPLE.COM ",

              password:
                "correct password",

              ipAddress:
                "127.0.0.1",

              userAgent:
                "Poster Test Agent",
            });

        expect(
          context.verifyPasswordMock
        ).toHaveBeenCalledWith(
          "correct password",
          USER_RECORD.passwordHash
        );

        expect(
          context.recordSuccessfulUserLoginMock
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_RECORD.id,

            expectedRowVersion:
              USER_RECORD.rowVersion,

            loggedInAt:
              LOGGED_IN_AT,
          },
          TEST_EXECUTOR
        );

        expect(
          context.createUserSessionMock
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_RECORD.id,

            organizationId:
              null,

            refreshTokenDigest:
              SESSION_RECORD
                .refreshTokenDigest,

            ipAddress:
              "127.0.0.1",

            userAgent:
              "Poster Test Agent",

            expiresAt:
              SESSION_EXPIRES_AT,
          },
          TEST_EXECUTOR
        );

        expect(
          result.refreshToken
        ).toBe(
          "raw-refresh-token"
        );

        expect(
          result.account
        ).not.toHaveProperty(
          "passwordHash"
        );

        expect(
          result.session
        ).not.toHaveProperty(
          "refreshTokenDigest"
        );

        expect(
          result.session.id
        ).toBe(
          SESSION_RECORD.id
        );
      }
    );

    it(
      "returns the same credentials error for an unknown email and an invalid password",
      async () => {
        const unknownContext =
          createTestContext();

        unknownContext
          .findUserByEmailMock
          .mockResolvedValue(
            null
          );

        await expect(
          unknownContext.service
            .login({
              email:
                "unknown@example.com",

              password:
                "incorrect password",
            })
        ).rejects.toBeInstanceOf(
          InvalidCredentialsError
        );

        const passwordContext =
          createTestContext();

        passwordContext
          .findUserByEmailMock
          .mockResolvedValue(
            USER_RECORD
          );

        passwordContext
          .verifyPasswordMock
          .mockResolvedValue(
            false
          );

        await expect(
          passwordContext.service
            .login({
              email:
                USER_RECORD.email,

              password:
                "incorrect password",
            })
        ).rejects.toBeInstanceOf(
          InvalidCredentialsError
        );

        expect(
          passwordContext
            .createUserSessionMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a valid password until the account is active and email verified",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValue({
            ...USER_RECORD,

            status:
              "pending_verification",

            emailVerifiedAt:
              null,
          });

        context
          .verifyPasswordMock
          .mockResolvedValue(
            true
          );

        await expect(
          context.service
            .login({
              email:
                USER_RECORD.email,

              password:
                "correct password",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationForbiddenError
        );

        expect(
          context
            .createOpaqueTokenPairMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rolls back session creation when the successful-login row version loses a race",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValueOnce(
            USER_RECORD
          )
          .mockResolvedValueOnce(
            USER_RECORD
          );

        context
          .verifyPasswordMock
          .mockResolvedValue(
            true
          );

        context
          .createOpaqueTokenPairMock
          .mockReturnValue({
            token:
              "raw-refresh-token",

            digest:
              SESSION_RECORD
                .refreshTokenDigest,
          });

        context
          .recordSuccessfulUserLoginMock
          .mockResolvedValue(
            null
          );

        await expect(
          context.service
            .login({
              email:
                USER_RECORD.email,

              password:
                "correct password",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationConcurrencyError
        );

        expect(
          context
            .createUserSessionMock
        ).not.toHaveBeenCalled();
      }
    );
  }
);