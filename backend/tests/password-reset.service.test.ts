import type {
  PoolClient,
} from "pg";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPasswordResetService,
  type CreatePasswordResetServiceOptions,
} from "../src/application/authentication/password-reset.service.js";

import {
  AuthenticationTokenInvalidError,
  digestAuthenticationSecret,
} from "../src/domains/authentication/index.js";

import type {
  PasswordResetTokenRecord,
} from "../src/domains/authentication/authentication-token.types.js";

import type {
  UserIdentityRecord,
} from "../src/domains/identity/identity.types.js";

import type {
  EmailDeliveryMessage,
  EmailDeliveryProvider,
} from "../src/services/email/email-delivery.types.js";

const NOW =
  new Date(
    "2026-07-29T08:00:00.000Z"
  );

const USER:
  UserIdentityRecord = {
  id:
    "00000000-0000-4000-8000-000000000101",

  email:
    "person@example.com",

  passwordHash:
    "$argon2id$existing-test-hash",

  fullName:
    "Example Person",

  status:
    "active",

  emailVerifiedAt:
    new Date(
      "2026-07-28T08:00:00.000Z"
    ),

  lastLoginAt:
    null,

  failedLoginAttempts:
    0,

  lockedUntil:
    null,

  createdAt:
    new Date(
      "2026-07-28T07:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-07-29T07:00:00.000Z"
    ),

  deletedAt:
    null,

  rowVersion:
    "7",
};

const RESET_CODE =
  "123456";

const TOKEN:
  PasswordResetTokenRecord = {
  id:
    "00000000-0000-4000-8000-000000000301",

  userId:
    USER.id,

  tokenDigest:
    digestAuthenticationSecret(
      [
        USER.id,
        NOW.toISOString(),
        RESET_CODE,
      ].join(
        ":"
      )
    ),

  attemptCount:
    0,

  requestedIpAddress:
    "127.0.0.1",

  requestedUserAgent:
    "Poster Test",

  createdAt:
    NOW,

  expiresAt:
    new Date(
      "2026-07-29T08:15:00.000Z"
    ),

  consumedAt:
    null,

  invalidatedAt:
    null,
};

function createExecutor():
  PoolClient {
  return {
    query:
      vi.fn(),
  } as unknown as
    PoolClient;
}

function createTransactionRunner(
  executor:
    PoolClient
): NonNullable<
  CreatePasswordResetServiceOptions[
    "runDatabaseTransaction"
  ]
> {
  return async <T>(
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
}

function createEmailProvider(
  capturedMessages:
    EmailDeliveryMessage[]
): EmailDeliveryProvider {
  return {
    providerName:
      "poster-test-email",

    async sendEmail(
      message
    ) {
      capturedMessages.push(
        message
      );

      return {
        provider:
          "poster-test-email",

        messageId:
          "password-reset-message-001",

        acceptedAt:
          NOW,
      };
    },
  };
}

describe(
  "Poster password-reset service",
  () => {
    it(
      "issues and delivers a reset code without exposing account existence in the result",
      async () => {
        const capturedMessages:
          EmailDeliveryMessage[] =
            [];

        const createToken =
          vi.fn()
            .mockResolvedValue(
              TOKEN
            );

        const service =
          createPasswordResetService({
            emailDeliveryProvider:
              createEmailProvider(
                capturedMessages
              ),

            findUserByEmail:
              vi.fn()
                .mockResolvedValue(
                  USER
                ),

            createPasswordResetToken:
              createToken,

            generateNumericVerificationCode:
              () => RESET_CODE,

            now:
              () => NOW,
          });

        await expect(
          service.request({
            email:
              " PERSON@Example.COM ",

            ipAddress:
              "127.0.0.1",

            userAgent:
              "Poster Test",
          })
        ).resolves.toEqual({
          status:
            "accepted",
        });

        expect(
          createToken
        ).toHaveBeenCalledWith({
          userId:
            USER.id,

          tokenDigest:
            TOKEN.tokenDigest,

          requestedIpAddress:
            "127.0.0.1",

          requestedUserAgent:
            "Poster Test",

          createdAt:
            NOW,

          expiresAt:
            TOKEN.expiresAt,
        });

        expect(
          capturedMessages
        ).toHaveLength(
          1
        );

        expect(
          capturedMessages[0]
        ).toMatchObject({
          category:
            "password_reset",

          to:
            USER.email,

          idempotencyKey:
            TOKEN.id,
        });

        expect(
          capturedMessages[0]
            ?.text
        ).toContain(
          RESET_CODE
        );
      }
    );

    it(
      "returns the same accepted response for an unknown email without creating a token",
      async () => {
        const capturedMessages:
          EmailDeliveryMessage[] =
            [];

        const createToken =
          vi.fn();

        const service =
          createPasswordResetService({
            emailDeliveryProvider:
              createEmailProvider(
                capturedMessages
              ),

            findUserByEmail:
              vi.fn()
                .mockResolvedValue(
                  null
                ),

            createPasswordResetToken:
              createToken,

            now:
              () => NOW,
          });

        await expect(
          service.request({
            email:
              "missing@example.com",
          })
        ).resolves.toEqual({
          status:
            "accepted",
        });

        expect(
          createToken
        ).not.toHaveBeenCalled();

        expect(
          capturedMessages
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "records a failed confirmation attempt before returning the public invalid-token error",
      async () => {
        const executor =
          createExecutor();

        const recordAttempt =
          vi.fn()
            .mockResolvedValue({
              ...TOKEN,

              attemptCount:
                1,
            });

        const service =
          createPasswordResetService({
            emailDeliveryProvider:
              createEmailProvider(
                []
              ),

            runDatabaseTransaction:
              createTransactionRunner(
                executor
              ),

            findUserByEmail:
              vi.fn()
                .mockResolvedValue(
                  USER
                ),

            findPendingPasswordResetToken:
              vi.fn()
                .mockResolvedValue(
                  TOKEN
                ),

            recordPasswordResetAttempt:
              recordAttempt,

            hashPassword:
              vi.fn()
                .mockResolvedValue(
                  "$argon2id$new-test-hash"
                ),

            now:
              () => NOW,
          });

        await expect(
          service.confirm({
            email:
              USER.email,

            code:
              "999999",

            password:
              "Poster-New-Password-2026!",
          })
        ).rejects.toBeInstanceOf(
          AuthenticationTokenInvalidError
        );

        expect(
          recordAttempt
        ).toHaveBeenCalledWith(
          {
            tokenDigest:
              TOKEN.tokenDigest,

            attemptedAt:
              NOW,

            maximumAttempts:
              5,
          },
          executor
        );
      }
    );

    it(
      "atomically updates the password, consumes the challenge, and revokes every session",
      async () => {
        const executor =
          createExecutor();

        const consumeToken =
          vi.fn()
            .mockResolvedValue({
              ...TOKEN,

              consumedAt:
                NOW,
            });

        const updatePassword =
          vi.fn()
            .mockResolvedValue({
              ...USER,

              passwordHash:
                "$argon2id$new-test-hash",

              rowVersion:
                "8",
            });

        const revokeSessions =
          vi.fn()
            .mockResolvedValue(
              3
            );

        const invalidateTokens =
          vi.fn()
            .mockResolvedValue(
              0
            );

        const service =
          createPasswordResetService({
            emailDeliveryProvider:
              createEmailProvider(
                []
              ),

            runDatabaseTransaction:
              createTransactionRunner(
                executor
              ),

            findUserByEmail:
              vi.fn()
                .mockResolvedValue(
                  USER
                ),

            findPendingPasswordResetToken:
              vi.fn()
                .mockResolvedValue(
                  TOKEN
                ),

            consumePasswordResetToken:
              consumeToken,

            updateUserPassword:
              updatePassword,

            revokeAllUserSessions:
              revokeSessions,

            invalidatePasswordResetTokens:
              invalidateTokens,

            hashPassword:
              vi.fn()
                .mockResolvedValue(
                  "$argon2id$new-test-hash"
                ),

            now:
              () => NOW,
          });

        await expect(
          service.confirm({
            email:
              USER.email,

            code:
              RESET_CODE,

            password:
              "Poster-New-Password-2026!",
          })
        ).resolves.toEqual({
          status:
            "password_updated",
        });

        expect(
          consumeToken
        ).toHaveBeenCalledWith(
          {
            tokenDigest:
              TOKEN.tokenDigest,

            consumedAt:
              NOW,

            maximumAttempts:
              5,
          },
          executor
        );

        expect(
          updatePassword
        ).toHaveBeenCalledWith(
          {
            userId:
              USER.id,

            expectedRowVersion:
              USER.rowVersion,

            passwordHash:
              "$argon2id$new-test-hash",
          },
          executor
        );

        expect(
          revokeSessions
        ).toHaveBeenCalledWith(
          {
            userId:
              USER.id,

            revokedAt:
              NOW,

            reason:
              "password_reset_completed",
          },
          executor
        );
      }
    );
  }
);