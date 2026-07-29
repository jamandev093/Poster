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
  runDatabaseTransaction,
} from "../src/database/database.transaction.js";

import {
  createOpaqueTokenPair,
  hashPassword,
} from "../src/domains/authentication/index.js";

import {
  createUser,
  createUserSession,
  findActiveUserSessionByDigest,
  findUserSessionById,
  revokeUserSessionByRefreshTokenDigest,
  rotateUserSessionRefreshToken,
} from "../src/domains/identity/index.js";

const createdUserIds:
  string[] =
    [];

let passwordHash =
  "";

async function createTestSession() {
  const user =
    await createUser({
      email:
        `session-lifecycle-${randomUUID()}@example.test`,

      passwordHash,

      fullName:
        "Session Lifecycle Repository Test",
    });

  createdUserIds.push(
    user.id
  );

  const refreshToken =
    createOpaqueTokenPair();

  const session =
    await createUserSession({
      userId:
        user.id,

      organizationId:
        null,

      refreshTokenDigest:
        refreshToken.digest,

      ipAddress:
        "127.0.0.1",

      userAgent:
        "Poster Repository Test",

      expiresAt:
        new Date(
          Date.now() +
          60 * 60 * 1000
        ),
    });

  return {
    user,

    session,

    refreshToken,
  };
}

beforeAll(
  async () => {
    passwordHash =
      await hashPassword(
        "Poster-Session-Lifecycle-Test-Password-2026!"
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
  "Poster session-lifecycle repository",
  () => {
    it(
      "rotates one digest and revokes the session when the old digest is replayed",
      async () => {
        const created =
          await createTestSession();

        const replacement =
          createOpaqueTokenPair();

        const rotatedAt =
          new Date();

        const rotationResult =
          await runDatabaseTransaction(
            async (
              executor
            ) => {
              return await rotateUserSessionRefreshToken(
                {
                  currentRefreshTokenDigest:
                    created
                      .refreshToken
                      .digest,

                  replacementRefreshTokenDigest:
                    replacement.digest,

                  rotatedAt,
                },
                executor
              );
            }
          );

        expect(
          rotationResult.status
        ).toBe(
          "rotated"
        );

        await expect(
          findActiveUserSessionByDigest(
            created
              .refreshToken
              .digest
          )
        ).resolves.toBeNull();

        await expect(
          findActiveUserSessionByDigest(
            replacement.digest
          )
        ).resolves.toMatchObject({
          id:
            created.session.id,

          refreshTokenDigest:
            replacement.digest,

          revokedAt:
            null,
        });

        const replayResult =
          await runDatabaseTransaction(
            async (
              executor
            ) => {
              return await rotateUserSessionRefreshToken(
                {
                  currentRefreshTokenDigest:
                    created
                      .refreshToken
                      .digest,

                  replacementRefreshTokenDigest:
                    createOpaqueTokenPair()
                      .digest,

                  rotatedAt:
                    new Date(
                      rotatedAt.getTime() +
                      1000
                    ),
                },
                executor
              );
            }
          );

        expect(
          replayResult
        ).toMatchObject({
          status:
            "replayed",

          sessionId:
            created.session.id,

          userId:
            created.user.id,
        });

        await expect(
          findUserSessionById(
            created.session.id
          )
        ).resolves.toMatchObject({
          revokedAt:
            expect.any(
              Date
            ),

          revocationReason:
            "refresh_token_replay_detected",
        });
      }
    );

    it(
      "revokes a session when logout supplies a rotated historical digest",
      async () => {
        const created =
          await createTestSession();

        const replacement =
          createOpaqueTokenPair();

        await rotateUserSessionRefreshToken({
          currentRefreshTokenDigest:
            created
              .refreshToken
              .digest,

          replacementRefreshTokenDigest:
            replacement.digest,

          rotatedAt:
            new Date(),
        });

        const revoked =
          await revokeUserSessionByRefreshTokenDigest({
            refreshTokenDigest:
              created
                .refreshToken
                .digest,

            revokedAt:
              new Date(),

            reason:
              "user_logout",
          });

        expect(
          revoked
        ).toMatchObject({
          id:
            created.session.id,

          revokedAt:
            expect.any(
              Date
            ),

          revocationReason:
            "user_logout",
        });
      }
    );
  }
);