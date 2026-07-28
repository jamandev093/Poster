import {
  randomUUID,
} from "node:crypto";

import type {
  QueryResultRow,
} from "pg";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  closeDatabasePool,
  executeDatabaseQuery,
  runDatabaseTransaction,
} from "../src/database/index.js";

import {
  createOrganization,
  createOrganizationMembership,
  createUser,
  createUserSession,
  findOrganizationById,
  findOrganizationMembershipById,
  findUserById,
  findUserSessionById,
} from "../src/domains/identity/index.js";

interface RolledBackIdentityCountRow
  extends QueryResultRow {
  user_count: string;

  organization_count: string;

  membership_count: string;

  session_count: string;
}

interface CreatedIdentityIds {
  userId:
    | string
    | null;

  organizationId:
    | string
    | null;

  membershipId:
    | string
    | null;

  sessionId:
    | string
    | null;
}

const TRANSACTION_ROLLBACK_MARKER =
  "TRANSACTION_AWARE_IDENTITY_ROLLBACK";

describe(
  "Poster transaction-aware identity repositories",
  () => {
    afterAll(
      async () => {
        await closeDatabasePool();
      }
    );

    it(
      "uses one caller-provided client and rolls back the complete identity workflow",
      async () => {
        const uniqueValue =
          randomUUID();

        const email =
          `transaction-aware-${uniqueValue}@example.test`;

        const refreshTokenDigest =
          [
            randomUUID(),
            randomUUID(),
          ]
            .join("")
            .replaceAll(
              "-",
              ""
            );

        const createdIds:
          CreatedIdentityIds = {
          userId:
            null,

          organizationId:
            null,

          membershipId:
            null,

          sessionId:
            null,
        };

        await expect(
          runDatabaseTransaction(
            async (
              client
            ) => {
              const user =
                await createUser(
                  {
                    email,

                    passwordHash:
                      "$argon2id$v=19$m=65536,t=3,p=1$transaction$awareidentityrepositoryhash",

                    fullName:
                      "Transaction Aware Identity User",
                  },
                  client
                );

              const organization =
                await createOrganization(
                  {
                    legalName:
                      `Transaction Aware Legal ${uniqueValue}`,

                    displayName:
                      `Transaction Aware ${uniqueValue}`,

                    websiteUrl:
                      "https://example.test",

                    billingEmail:
                      email,

                    countryCode:
                      "IN",
                  },
                  client
                );

              const now =
                new Date();

              const membership =
                await createOrganizationMembership(
                  {
                    organizationId:
                      organization.id,

                    userId:
                      user.id,

                    role:
                      "owner",

                    status:
                      "active",

                    isPrimaryContact:
                      true,

                    invitedByUserId:
                      user.id,

                    invitedAt:
                      now,

                    joinedAt:
                      now,
                  },
                  client
                );

              const session =
                await createUserSession(
                  {
                    userId:
                      user.id,

                    organizationId:
                      organization.id,

                    refreshTokenDigest,

                    ipAddress:
                      "127.0.0.1",

                    userAgent:
                      "Poster transaction-aware repository test",

                    expiresAt:
                      new Date(
                        now.getTime() +
                          60_000
                      ),
                  },
                  client
                );

              createdIds.userId =
                user.id;

              createdIds.organizationId =
                organization.id;

              createdIds.membershipId =
                membership.id;

              createdIds.sessionId =
                session.id;

              await expect(
                findUserById(
                  user.id,
                  client
                )
              ).resolves.toMatchObject({
                id:
                  user.id,
              });

              await expect(
                findOrganizationById(
                  organization.id,
                  client
                )
              ).resolves.toMatchObject({
                id:
                  organization.id,
              });

              await expect(
                findOrganizationMembershipById(
                  membership.id,
                  client
                )
              ).resolves.toMatchObject({
                id:
                  membership.id,
              });

              await expect(
                findUserSessionById(
                  session.id,
                  client
                )
              ).resolves.toMatchObject({
                id:
                  session.id,
              });

              throw new Error(
                TRANSACTION_ROLLBACK_MARKER
              );
            }
          )
        ).rejects.toThrow(
          TRANSACTION_ROLLBACK_MARKER
        );

        expect(
          Object.values(
            createdIds
          )
        ).not.toContain(
          null
        );

        const rollbackResult =
          await executeDatabaseQuery<
            RolledBackIdentityCountRow
          >(
            `
              SELECT
                (
                  SELECT COUNT(*)::text
                  FROM app.users
                  WHERE id = $1::uuid
                ) AS user_count,

                (
                  SELECT COUNT(*)::text
                  FROM app.organizations
                  WHERE id = $2::uuid
                ) AS organization_count,

                (
                  SELECT COUNT(*)::text
                  FROM app.organization_memberships
                  WHERE id = $3::uuid
                ) AS membership_count,

                (
                  SELECT COUNT(*)::text
                  FROM app.user_sessions
                  WHERE id = $4::uuid
                ) AS session_count
            `,
            [
              createdIds.userId,
              createdIds.organizationId,
              createdIds.membershipId,
              createdIds.sessionId,
            ]
          );

        expect(
          rollbackResult.rows[0]
        ).toEqual({
          user_count:
            "0",

          organization_count:
            "0",

          membership_count:
            "0",

          session_count:
            "0",
        });
      }
    );
  }
);