import {
  randomUUID,
} from "node:crypto";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  closeDatabasePool,
  executeDatabaseQuery,
} from "../src/database/index.js";

import {
  createNumericVerificationCodePair,
  createPasswordResetToken,
  findPendingPasswordResetToken,
  hashPassword,
  recordPasswordResetAttempt,
} from "../src/domains/authentication/index.js";

import {
  createUser,
} from "../src/domains/identity/index.js";

const createdUserIds:
  string[] =
    [];

let passwordHash =
  "";

beforeAll(
  async () => {
    passwordHash =
      await hashPassword(
        "Poster-Password-Reset-Repository-Test-2026!"
      );
  }
);

afterAll(
  async () => {
    try {
      if (
        createdUserIds.length >
        0
      ) {
        await executeDatabaseQuery(
          `
            DELETE FROM app.users
            WHERE id = ANY(
              $1::uuid[]
            )
          `,
          [
            createdUserIds,
          ]
        );
      }
    } finally {
      await closeDatabasePool();
    }
  }
);

describe(
  "Poster password-reset repository attempts",
  () => {
    it(
      "finds the pending token, records failures, and invalidates it at the limit",
      async () => {
        const user =
          await createUser({
            email:
              `password-reset-${randomUUID()}@example.test`,

            passwordHash,

            fullName:
              "Password Reset Repository Test",
          });

        createdUserIds.push(
          user.id
        );

        const codePair =
          createNumericVerificationCodePair();

        const createdAt =
          new Date();

        const token =
          await createPasswordResetToken({
            userId:
              user.id,

            tokenDigest:
              codePair.digest,

            requestedIpAddress:
              "127.0.0.1",

            requestedUserAgent:
              "Poster Repository Test",

            createdAt,

            expiresAt:
              new Date(
                createdAt.getTime() +
                15 * 60 * 1000
              ),
          });

        expect(
          token.attemptCount
        ).toBe(
          0
        );

        await expect(
          findPendingPasswordResetToken({
            userId:
              user.id,
          })
        ).resolves.toMatchObject({
          id:
            token.id,

          attemptCount:
            0,
        });

        const firstAttempt =
          await recordPasswordResetAttempt({
            tokenDigest:
              token.tokenDigest,

            attemptedAt:
              new Date(
                createdAt.getTime() +
                1000
              ),

            maximumAttempts:
              3,
          });

        expect(
          firstAttempt
        ).toMatchObject({
          attemptCount:
            1,

          invalidatedAt:
            null,
        });

        const secondAttempt =
          await recordPasswordResetAttempt({
            tokenDigest:
              token.tokenDigest,

            attemptedAt:
              new Date(
                createdAt.getTime() +
                2000
              ),

            maximumAttempts:
              3,
          });

        expect(
          secondAttempt
        ).toMatchObject({
          attemptCount:
            2,

          invalidatedAt:
            null,
        });

        const finalAttempt =
          await recordPasswordResetAttempt({
            tokenDigest:
              token.tokenDigest,

            attemptedAt:
              new Date(
                createdAt.getTime() +
                3000
              ),

            maximumAttempts:
              3,
          });

        expect(
          finalAttempt
        ).toMatchObject({
          attemptCount:
            3,

          invalidatedAt:
            expect.any(
              Date
            ),
        });

        await expect(
          findPendingPasswordResetToken({
            userId:
              user.id,
          })
        ).resolves.toBeNull();
      }
    );
  }
);