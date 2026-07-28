import type {
  PoolClient,
} from "pg";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  UserIdentityRecord,
} from "../src/domains/identity/identity.types.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationTokenExpiredError,
  AuthenticationTokenInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  EmailVerificationTokenRecord,
} from "../src/domains/authentication/authentication-token.types.js";

import {
  AUTHENTICATION_SERVICE_POLICY,
  createAuthenticationService,
  type AuthenticationServiceDependencies,
} from "../src/domains/authentication/authentication.service.js";

const VERIFIED_AT =
  new Date(
    "2026-07-28T12:05:00.000Z"
  );

const USER_RECORD:
  UserIdentityRecord = {
    id:
      "00000000-0000-4000-8000-000000000201",

    email:
      "person@example.com",

    passwordHash:
      "persisted-password-hash",

    fullName:
      "Example Person",

    status:
      "pending_verification",

    emailVerifiedAt:
      null,

    lastLoginAt:
      null,

    failedLoginAttempts:
      0,

    lockedUntil:
      null,

    createdAt:
      new Date(
        "2026-07-28T12:00:00.000Z"
      ),

    updatedAt:
      new Date(
        "2026-07-28T12:00:00.000Z"
      ),

    deletedAt:
      null,

    rowVersion:
      "1",
  };

const TOKEN_RECORD:
  EmailVerificationTokenRecord = {
    id:
      "00000000-0000-4000-8000-000000000202",

    userId:
      USER_RECORD.id,

    tokenDigest:
      "a".repeat(
        64
      ),

    purpose:
      "signup",

    attemptCount:
      0,

    createdAt:
      USER_RECORD.createdAt,

    expiresAt:
      new Date(
        "2026-07-28T12:10:00.000Z"
      ),

    consumedAt:
      null,

    invalidatedAt:
      null,
  };

const VERIFIED_USER_RECORD:
  UserIdentityRecord = {
    ...USER_RECORD,

    status:
      "active",

    emailVerifiedAt:
      VERIFIED_AT,

    updatedAt:
      VERIFIED_AT,

    rowVersion:
      "2",
  };

function createVerificationTestContext() {
  const executor =
    {
      query:
        vi.fn(),
    } as unknown as PoolClient;

  const findUserByEmailMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "findUserByEmail"
      ]
    >();

  const findPendingEmailVerificationTokenMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "findPendingEmailVerificationToken"
      ]
    >();

  const recordEmailVerificationAttemptMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "recordEmailVerificationAttempt"
      ]
    >();

  const consumeEmailVerificationTokenMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "consumeEmailVerificationToken"
      ]
    >();

  const markUserEmailVerifiedMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "markUserEmailVerified"
      ]
    >();

  const verifyAuthenticationSecretDigestMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "verifyAuthenticationSecretDigest"
      ]
    >();

  const runDatabaseTransaction:
    AuthenticationServiceDependencies[
      "runDatabaseTransaction"
    ] =
    async <T>(
      operation:
        (
          client:
            PoolClient
        ) => Promise<T>
    ): Promise<T> => {
      return await operation(
        executor
      );
    };

  findUserByEmailMock
    .mockResolvedValue(
      USER_RECORD
    );

  findPendingEmailVerificationTokenMock
    .mockResolvedValue(
      TOKEN_RECORD
    );

  recordEmailVerificationAttemptMock
    .mockResolvedValue({
      ...TOKEN_RECORD,

      attemptCount:
        1,
    });

  consumeEmailVerificationTokenMock
    .mockResolvedValue({
      ...TOKEN_RECORD,

      consumedAt:
        VERIFIED_AT,
    });

  markUserEmailVerifiedMock
    .mockResolvedValue(
      VERIFIED_USER_RECORD
    );

  verifyAuthenticationSecretDigestMock
    .mockReturnValue(
      true
    );

  const service =
    createAuthenticationService({
      runDatabaseTransaction,

      findUserByEmail:
        findUserByEmailMock,

      findPendingEmailVerificationToken:
        findPendingEmailVerificationTokenMock,

      recordEmailVerificationAttempt:
        recordEmailVerificationAttemptMock,

      consumeEmailVerificationToken:
        consumeEmailVerificationTokenMock,

      markUserEmailVerified:
        markUserEmailVerifiedMock,

      verifyAuthenticationSecretDigest:
        verifyAuthenticationSecretDigestMock,

      now:
        () => VERIFIED_AT,
    });

  return {
    executor,

    service,

    findUserByEmailMock,

    findPendingEmailVerificationTokenMock,

    recordEmailVerificationAttemptMock,

    consumeEmailVerificationTokenMock,

    markUserEmailVerifiedMock,

    verifyAuthenticationSecretDigestMock,
  };
}

describe(
  "Poster signup email verification service",
  () => {
    it(
      "consumes the signup token and activates the account atomically",
      async () => {
        const context =
          createVerificationTestContext();

        const result =
          await context.service
            .verifySignupEmail({
              email:
                "  PERSON@Example.COM ",

              code:
                " 123456 ",
            });

        expect(
          context.findUserByEmailMock
        ).toHaveBeenCalledWith(
          "person@example.com",
          context.executor
        );

        expect(
          context
            .findPendingEmailVerificationTokenMock
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_RECORD.id,

            purpose:
              "signup",
          },
          context.executor
        );

        expect(
          context
            .verifyAuthenticationSecretDigestMock
        ).toHaveBeenCalledWith(
          "123456",
          TOKEN_RECORD.tokenDigest
        );

        expect(
          context
            .recordEmailVerificationAttemptMock
        ).not.toHaveBeenCalled();

        expect(
          context
            .consumeEmailVerificationTokenMock
        ).toHaveBeenCalledWith(
          {
            tokenDigest:
              TOKEN_RECORD.tokenDigest,

            consumedAt:
              VERIFIED_AT,

            maximumAttempts:
              AUTHENTICATION_SERVICE_POLICY
                .signupVerificationMaximumAttempts,
          },
          context.executor
        );

        expect(
          context.markUserEmailVerifiedMock
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_RECORD.id,

            expectedRowVersion:
              USER_RECORD.rowVersion,

            verifiedAt:
              VERIFIED_AT,
          },
          context.executor
        );

        expect(
          result
        ).toEqual({
          account: {
            id:
              VERIFIED_USER_RECORD.id,

            email:
              VERIFIED_USER_RECORD.email,

            fullName:
              VERIFIED_USER_RECORD.fullName,

            status:
              "active",

            emailVerifiedAt:
              VERIFIED_AT,

            createdAt:
              VERIFIED_USER_RECORD.createdAt,
          },

          verifiedAt:
            VERIFIED_AT,
        });
      }
    );

    it(
      "records an incorrect code before returning an invalid-token error",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .verifyAuthenticationSecretDigestMock
          .mockReturnValue(
            false
          );

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "654321",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenInvalidError
        );

        expect(
          context
            .recordEmailVerificationAttemptMock
        ).toHaveBeenCalledWith(
          {
            tokenDigest:
              TOKEN_RECORD.tokenDigest,

            attemptedAt:
              VERIFIED_AT,

            maximumAttempts:
              AUTHENTICATION_SERVICE_POLICY
                .signupVerificationMaximumAttempts,
          },
          context.executor
        );

        expect(
          context
            .consumeEmailVerificationTokenMock
        ).not.toHaveBeenCalled();

        expect(
          context.markUserEmailVerifiedMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "counts malformed verification codes without hashing them",
      async () => {
        const context =
          createVerificationTestContext();

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "12x",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenInvalidError
        );

        expect(
          context
            .verifyAuthenticationSecretDigestMock
        ).not.toHaveBeenCalled();

        expect(
          context
            .recordEmailVerificationAttemptMock
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "returns the expired-token error without consuming or activating",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .findPendingEmailVerificationTokenMock
          .mockResolvedValue({
            ...TOKEN_RECORD,

            expiresAt:
              VERIFIED_AT,
          });

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "123456",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenExpiredError
        );

        expect(
          context
            .recordEmailVerificationAttemptMock
        ).not.toHaveBeenCalled();

        expect(
          context
            .consumeEmailVerificationTokenMock
        ).not.toHaveBeenCalled();

        expect(
          context.markUserEmailVerifiedMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects replay when no pending signup token remains",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .findPendingEmailVerificationTokenMock
          .mockResolvedValue(
            null
          );

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "123456",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenInvalidError
        );

        expect(
          context
            .verifyAuthenticationSecretDigestMock
        ).not.toHaveBeenCalled();

        expect(
          context.markUserEmailVerifiedMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a token that already reached the attempt limit",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .findPendingEmailVerificationTokenMock
          .mockResolvedValue({
            ...TOKEN_RECORD,

            attemptCount:
              AUTHENTICATION_SERVICE_POLICY
                .signupVerificationMaximumAttempts,
          });

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "123456",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenInvalidError
        );

        expect(
          context
            .verifyAuthenticationSecretDigestMock
        ).not.toHaveBeenCalled();

        expect(
          context
            .recordEmailVerificationAttemptMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "surfaces concurrent token consumption as a retryable conflict",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .consumeEmailVerificationTokenMock
          .mockResolvedValue(
            null
          );

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "123456",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationConcurrencyError
        );

        expect(
          context.markUserEmailVerifiedMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rolls back when optimistic user activation loses a race",
      async () => {
        const context =
          createVerificationTestContext();

        context
          .markUserEmailVerifiedMock
          .mockResolvedValue(
            null
          );

        await expect(
          context.service
            .verifySignupEmail({
              email:
                USER_RECORD.email,

              code:
                "123456",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationConcurrencyError
        );
      }
    );
  }
);
