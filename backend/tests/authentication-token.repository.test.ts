import {
  randomUUID,
} from "node:crypto";

import type {
  QueryResultRow,
} from "pg";

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
  createUser,
} from "../src/domains/identity/index.js";

import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createEmailVerificationToken,
  createNumericVerificationCodePair,
  createOpaqueTokenPair,
  createPasswordResetToken,
  findPendingEmailVerificationToken,
  hashPassword,
  invalidateEmailVerificationTokens,
  invalidatePasswordResetTokens,
  recordEmailVerificationAttempt,
} from "../src/domains/authentication/index.js";

interface TokenAuditDatabaseRow
  extends QueryResultRow {
  token_digest: string;

  consumed_at:
    | Date
    | null;

  invalidated_at:
    | Date
    | null;
}

const createdUserIds:
  string[] =
    [];

let testPasswordHash =
  "";

function shiftDate(
  value: Date,
  milliseconds: number
): Date {
  return new Date(
    value.getTime() +
      milliseconds
  );
}

async function createTestUser():
  Promise<string> {
  const user =
    await createUser({
      email:
        `auth-token-${randomUUID()}@example.test`,

      passwordHash:
        testPasswordHash,

      fullName:
        "Authentication Token Test User",
    });

  createdUserIds.push(
    user.id
  );

  return user.id;
}

beforeAll(
  async () => {
    testPasswordHash =
      await hashPassword(
        "Poster-Repository-Test-Password-2026!"
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
            WHERE id = ANY($1::uuid[])
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
  "Poster authentication token repositories",
  () => {
    it(
      "stores only email-verification digests and supersedes an older active token",
      async () => {
        const userId =
          await createTestUser();

        const createdAt =
          new Date();

        const firstPair =
          createNumericVerificationCodePair();

        const secondPair =
          createNumericVerificationCodePair();

        const firstToken =
          await createEmailVerificationToken({
            userId,

            tokenDigest:
              firstPair.digest,

            purpose:
              "signup",

            createdAt,

            expiresAt:
              shiftDate(
                createdAt,
                10 * 60 * 1000
              ),
          });

        const secondCreatedAt =
          shiftDate(
            createdAt,
            10
          );

        const secondToken =
          await createEmailVerificationToken({
            userId,

            tokenDigest:
              secondPair.digest,

            purpose:
              "signup",

            createdAt:
              secondCreatedAt,

            expiresAt:
              shiftDate(
                secondCreatedAt,
                10 * 60 * 1000
              ),
          });

        const firstAudit =
          await executeDatabaseQuery<
            TokenAuditDatabaseRow
          >(
            `
              SELECT
                token_digest,
                consumed_at,
                invalidated_at
              FROM app.email_verification_tokens
              WHERE id = $1::uuid
            `,
            [
              firstToken.id,
            ]
          );

        const secondAudit =
          await executeDatabaseQuery<
            TokenAuditDatabaseRow
          >(
            `
              SELECT
                token_digest,
                consumed_at,
                invalidated_at
              FROM app.email_verification_tokens
              WHERE id = $1::uuid
            `,
            [
              secondToken.id,
            ]
          );

        expect(
          firstAudit.rows[0]?.token_digest
        ).toBe(
          firstPair.digest
        );

        expect(
          firstAudit.rows[0]?.token_digest
        ).not.toBe(
          firstPair.code
        );

        expect(
          firstAudit.rows[0]?.invalidated_at
        ).toBeInstanceOf(
          Date
        );

        expect(
          secondAudit.rows[0]?.token_digest
        ).toBe(
          secondPair.digest
        );

        expect(
          secondAudit.rows[0]?.token_digest
        ).not.toBe(
          secondPair.code
        );

        expect(
          secondAudit.rows[0]?.invalidated_at
        ).toBeNull();
      }
    );

    it(
      "increments email-verification attempts and invalidates the token at the maximum",
      async () => {
        const userId =
          await createTestUser();

        const createdAt =
          new Date();

        const pair =
          createNumericVerificationCodePair();

        await createEmailVerificationToken({
          userId,

          tokenDigest:
            pair.digest,

          purpose:
            "signup",

          createdAt,

          expiresAt:
            shiftDate(
              createdAt,
              10 * 60 * 1000
            ),
        });

        const firstAttempt =
          await recordEmailVerificationAttempt({
            tokenDigest:
              pair.digest,

            attemptedAt:
              shiftDate(
                createdAt,
                1000
              ),

            maximumAttempts:
              3,
          });

        const secondAttempt =
          await recordEmailVerificationAttempt({
            tokenDigest:
              pair.digest,

            attemptedAt:
              shiftDate(
                createdAt,
                2000
              ),

            maximumAttempts:
              3,
          });

        const thirdAttempt =
          await recordEmailVerificationAttempt({
            tokenDigest:
              pair.digest,

            attemptedAt:
              shiftDate(
                createdAt,
                3000
              ),

            maximumAttempts:
              3,
          });

        const fourthAttempt =
          await recordEmailVerificationAttempt({
            tokenDigest:
              pair.digest,

            attemptedAt:
              shiftDate(
                createdAt,
                4000
              ),

            maximumAttempts:
              3,
          });

        expect(
          firstAttempt?.attemptCount
        ).toBe(
          1
        );

        expect(
          firstAttempt?.invalidatedAt
        ).toBeNull();

        expect(
          secondAttempt?.attemptCount
        ).toBe(
          2
        );

        expect(
          thirdAttempt?.attemptCount
        ).toBe(
          3
        );

        expect(
          thirdAttempt?.invalidatedAt
        ).toBeInstanceOf(
          Date
        );

        expect(
          fourthAttempt
        ).toBeNull();

        await expect(
          consumeEmailVerificationToken({
            tokenDigest:
              pair.digest,

            consumedAt:
              shiftDate(
                createdAt,
                5000
              ),

            maximumAttempts:
              3,
          })
        ).resolves.toBeNull();
      }
    );

    it(
      "consumes an email-verification token exactly once",
      async () => {
        const userId =
          await createTestUser();

        const createdAt =
          new Date();

        const pair =
          createOpaqueTokenPair();

        await createEmailVerificationToken({
          userId,

          tokenDigest:
            pair.digest,

          purpose:
            "email_change",

          createdAt,

          expiresAt:
            shiftDate(
              createdAt,
              10 * 60 * 1000
            ),
        });

        const firstConsumption =
          await consumeEmailVerificationToken({
            tokenDigest:
              pair.digest,

            consumedAt:
              shiftDate(
                createdAt,
                1000
              ),

            maximumAttempts:
              3,
          });

        const secondConsumption =
          await consumeEmailVerificationToken({
            tokenDigest:
              pair.digest,

            consumedAt:
              shiftDate(
                createdAt,
                2000
              ),

            maximumAttempts:
              3,
          });

        expect(
          firstConsumption?.consumedAt
        ).toBeInstanceOf(
          Date
        );

        expect(
          secondConsumption
        ).toBeNull();
      }
    );

    it(
      "stores only password-reset digests, supersedes older tokens, and consumes once",
      async () => {
        const userId =
          await createTestUser();

        const createdAt =
          new Date();

        const firstPair =
          createOpaqueTokenPair();

        const secondPair =
          createOpaqueTokenPair();

        const firstToken =
          await createPasswordResetToken({
            userId,

            tokenDigest:
              firstPair.digest,

            requestedIpAddress:
              "127.0.0.1",

            requestedUserAgent:
              "Poster Test Agent",

            createdAt,

            expiresAt:
              shiftDate(
                createdAt,
                15 * 60 * 1000
              ),
          });

        const secondCreatedAt =
          shiftDate(
            createdAt,
            10
          );

        const secondToken =
          await createPasswordResetToken({
            userId,

            tokenDigest:
              secondPair.digest,

            requestedIpAddress:
              "127.0.0.1",

            requestedUserAgent:
              "  Poster Test Agent  ",

            createdAt:
              secondCreatedAt,

            expiresAt:
              shiftDate(
                secondCreatedAt,
                15 * 60 * 1000
              ),
          });

        const firstAudit =
          await executeDatabaseQuery<
            TokenAuditDatabaseRow
          >(
            `
              SELECT
                token_digest,
                consumed_at,
                invalidated_at
              FROM app.password_reset_tokens
              WHERE id = $1::uuid
            `,
            [
              firstToken.id,
            ]
          );

        expect(
          firstAudit.rows[0]?.token_digest
        ).toBe(
          firstPair.digest
        );

        expect(
          firstAudit.rows[0]?.token_digest
        ).not.toBe(
          firstPair.token
        );

        expect(
          firstAudit.rows[0]?.invalidated_at
        ).toBeInstanceOf(
          Date
        );

        expect(
          secondToken.requestedIpAddress
        ).toBe(
          "127.0.0.1"
        );

        expect(
          secondToken.requestedUserAgent
        ).toBe(
          "Poster Test Agent"
        );

        const firstConsumption =
          await consumePasswordResetToken({
            tokenDigest:
              secondPair.digest,

            consumedAt:
              shiftDate(
                secondCreatedAt,
                1000
              ),
          });

        const secondConsumption =
          await consumePasswordResetToken({
            tokenDigest:
              secondPair.digest,

            consumedAt:
              shiftDate(
                secondCreatedAt,
                2000
              ),
          });

        expect(
          firstConsumption?.consumedAt
        ).toBeInstanceOf(
          Date
        );

        expect(
          secondConsumption
        ).toBeNull();
      }
    );

    it(
      "rejects expired tokens and explicitly invalidates active user tokens",
      async () => {
        const userId =
          await createTestUser();

        const now =
          new Date();

        const expiredCreatedAt =
          shiftDate(
            now,
            -120_000
          );

        const expiredAt =
          shiftDate(
            now,
            -60_000
          );

        const expiredEmailPair =
          createOpaqueTokenPair();

        const expiredResetPair =
          createOpaqueTokenPair();

        await createEmailVerificationToken({
          userId,

          tokenDigest:
            expiredEmailPair.digest,

          purpose:
            "signup",

          createdAt:
            expiredCreatedAt,

          expiresAt:
            expiredAt,
        });

        await createPasswordResetToken({
          userId,

          tokenDigest:
            expiredResetPair.digest,

          createdAt:
            expiredCreatedAt,

          expiresAt:
            expiredAt,
        });

        await expect(
          consumeEmailVerificationToken({
            tokenDigest:
              expiredEmailPair.digest,

            consumedAt:
              now,

            maximumAttempts:
              3,
          })
        ).resolves.toBeNull();

        await expect(
          consumePasswordResetToken({
            tokenDigest:
              expiredResetPair.digest,

            consumedAt:
              now,
          })
        ).resolves.toBeNull();

        const activeEmailPair =
          createOpaqueTokenPair();

        const activeResetPair =
          createOpaqueTokenPair();

        await createEmailVerificationToken({
          userId,

          tokenDigest:
            activeEmailPair.digest,

          purpose:
            "email_change",

          createdAt:
            now,

          expiresAt:
            shiftDate(
              now,
              10 * 60 * 1000
            ),
        });

        await createPasswordResetToken({
          userId,

          tokenDigest:
            activeResetPair.digest,

          createdAt:
            now,

          expiresAt:
            shiftDate(
              now,
              10 * 60 * 1000
            ),
        });

        const invalidatedEmailCount =
          await invalidateEmailVerificationTokens({
            userId,

            purpose:
              "email_change",

            invalidatedAt:
              shiftDate(
                now,
                1000
              ),
          });

        const invalidatedResetCount =
          await invalidatePasswordResetTokens({
            userId,

            invalidatedAt:
              shiftDate(
                now,
                1000
              ),
          });

        expect(
          invalidatedEmailCount
        ).toBe(
          1
        );

        expect(
          invalidatedResetCount
        ).toBeGreaterThanOrEqual(
          1
        );

        await expect(
          consumeEmailVerificationToken({
            tokenDigest:
              activeEmailPair.digest,

            consumedAt:
              shiftDate(
                now,
                2000
              ),

            maximumAttempts:
              3,
          })
        ).resolves.toBeNull();

        await expect(
          consumePasswordResetToken({
            tokenDigest:
              activeResetPair.digest,

            consumedAt:
              shiftDate(
                now,
                2000
              ),
          })
        ).resolves.toBeNull();
      }
    );


    it(
      "returns an expired pending signup token for service-level error classification",
      async () => {
        const userId =
          await createTestUser();

        const now =
          new Date();

        const createdAt =
          shiftDate(
            now,
            -120_000
          );

        const expiresAt =
          shiftDate(
            now,
            -60_000
          );

        const verificationPair =
          createNumericVerificationCodePair();

        const createdToken =
          await createEmailVerificationToken({
            userId,

            tokenDigest:
              verificationPair.digest,

            purpose:
              "signup",

            createdAt,

            expiresAt,
          });

        const pendingToken =
          await findPendingEmailVerificationToken({
            userId,

            purpose:
              "signup",
          });

        expect(
          pendingToken?.id
        ).toBe(
          createdToken.id
        );

        expect(
          pendingToken?.expiresAt.getTime()
        ).toBe(
          expiresAt.getTime()
        );

        expect(
          pendingToken?.consumedAt
        ).toBeNull();

        expect(
          pendingToken?.invalidatedAt
        ).toBeNull();
      }
    );

  }
);
