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
  AuthenticationConflictError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  EmailVerificationTokenRecord,
} from "../src/domains/authentication/authentication-token.types.js";

import {
  AUTHENTICATION_SERVICE_POLICY,
  createAuthenticationService,
  type AuthenticationServiceDependencies,
} from "../src/domains/authentication/authentication.service.js";

const REGISTERED_AT =
  new Date(
    "2026-07-28T12:00:00.000Z"
  );

const EXPIRES_AT =
  new Date(
    REGISTERED_AT.getTime() +
      AUTHENTICATION_SERVICE_POLICY
        .signupVerificationLifetimeMilliseconds
  );

const USER_RECORD:
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
      REGISTERED_AT,

    updatedAt:
      REGISTERED_AT,

    deletedAt:
      null,

    rowVersion:
      "1",
  };

const TOKEN_RECORD:
  EmailVerificationTokenRecord = {
    id:
      "00000000-0000-4000-8000-000000000102",

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
      REGISTERED_AT,

    expiresAt:
      EXPIRES_AT,

    consumedAt:
      null,

    invalidatedAt:
      null,
  };

function createTestContext() {
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

  const createUserMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "createUser"
      ]
    >();

  const createEmailVerificationTokenMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "createEmailVerificationToken"
      ]
    >();

  const hashPasswordMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "hashPassword"
      ]
    >();

  const createNumericVerificationCodePairMock =
    vi.fn<
      AuthenticationServiceDependencies[
        "createNumericVerificationCodePair"
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

  hashPasswordMock.mockResolvedValue(
    "persisted-password-hash"
  );

  createNumericVerificationCodePairMock
    .mockReturnValue({
      code:
        "123456",

      digest:
        "a".repeat(
          64
        ),
    });

  createUserMock.mockResolvedValue(
    USER_RECORD
  );

  createEmailVerificationTokenMock
    .mockResolvedValue(
      TOKEN_RECORD
    );

  const service =
    createAuthenticationService({
      runDatabaseTransaction,

      findUserByEmail:
        findUserByEmailMock,

      createUser:
        createUserMock,

      createEmailVerificationToken:
        createEmailVerificationTokenMock,

      hashPassword:
        hashPasswordMock,

      createNumericVerificationCodePair:
        createNumericVerificationCodePairMock,

      now:
        () => REGISTERED_AT,
    });

  return {
    executor,

    service,

    findUserByEmailMock,

    createUserMock,

    createEmailVerificationTokenMock,

    hashPasswordMock,

    createNumericVerificationCodePairMock,
  };
}

describe(
  "Poster authentication service",
  () => {
    it(
      "registers an account and verification challenge atomically",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValueOnce(
            null
          )
          .mockResolvedValueOnce(
            null
          );

        const result =
          await context.service
            .registerAuthenticationAccount({
              email:
                "  PERSON@Example.COM ",

              password:
                "correct horse battery staple",

              fullName:
                "  Example Person  ",
            });

        expect(
          context.findUserByEmailMock
        ).toHaveBeenNthCalledWith(
          1,
          "person@example.com"
        );

        expect(
          context.findUserByEmailMock
        ).toHaveBeenNthCalledWith(
          2,
          "person@example.com",
          context.executor
        );

        expect(
          context.hashPasswordMock
        ).toHaveBeenCalledWith(
          "correct horse battery staple"
        );

        expect(
          context.createUserMock
        ).toHaveBeenCalledWith(
          {
            email:
              "person@example.com",

            passwordHash:
              "persisted-password-hash",

            fullName:
              "Example Person",
          },
          context.executor
        );

        expect(
          context
            .createEmailVerificationTokenMock
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_RECORD.id,

            tokenDigest:
              "a".repeat(
                64
              ),

            purpose:
              "signup",

            createdAt:
              REGISTERED_AT,

            expiresAt:
              EXPIRES_AT,
          },
          context.executor
        );

        expect(
          result
        ).toEqual({
          account: {
            id:
              USER_RECORD.id,

            email:
              USER_RECORD.email,

            fullName:
              USER_RECORD.fullName,

            status:
              USER_RECORD.status,

            emailVerifiedAt:
              null,

            createdAt:
              REGISTERED_AT,
          },

          emailVerification: {
            purpose:
              "signup",

            code:
              "123456",

            expiresAt:
              EXPIRES_AT,
          },
        });

        expect(
          Object.hasOwn(
            result.account,
            "passwordHash"
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects an already registered normalized email before hashing",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValue(
            USER_RECORD
          );

        await expect(
          context.service
            .registerAuthenticationAccount({
              email:
                "PERSON@example.com",

              password:
                "correct horse battery staple",

              fullName:
                "Example Person",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationConflictError
        );

        expect(
          context.hashPasswordMock
        ).not.toHaveBeenCalled();

        expect(
          context.createUserMock
        ).not.toHaveBeenCalled();

        expect(
          context
            .createEmailVerificationTokenMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "maps PostgreSQL email uniqueness races to a domain conflict",
      async () => {
        const context =
          createTestContext();

        context
          .findUserByEmailMock
          .mockResolvedValueOnce(
            null
          )
          .mockResolvedValueOnce(
            null
          );

        context
          .createUserMock
          .mockRejectedValue({
            code:
              "23505",
          });

        await expect(
          context.service
            .registerAuthenticationAccount({
              email:
                "person@example.com",

              password:
                "correct horse battery staple",

              fullName:
                "Example Person",
            })
        ).rejects.toBeInstanceOf(
          AuthenticationConflictError
        );

        expect(
          context
            .createEmailVerificationTokenMock
        ).not.toHaveBeenCalled();
      }
    );
  }
);