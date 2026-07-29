import {
  randomUUID,
} from "node:crypto";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  closeDatabasePool,
  executeDatabaseQuery,
} from "../src/database/index.js";

import {
  createClientCommercialRequestService,
} from "../src/application/monetization/client-commercial-request.service.js";

const createdUserIds:
  string[] =
    [];

const createdOrganizationIds:
  string[] =
    [];

async function createIdentity(
  email: string
): Promise<string> {
  const result =
    await executeDatabaseQuery<{
      id: string;
    }>(
      `
        INSERT INTO app.users (
          email,
          password_hash,
          full_name,
          status,
          email_verified_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'active',
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `,
      [
        email,
        "x".repeat(
          64
        ),
        "Commercial Workflow Test",
      ]
    );

  const id =
    result.rows[0]?.id;

  if (!id) {
    throw new Error(
      "Test user was not created."
    );
  }

  createdUserIds.push(
    id
  );

  return id;
}

async function createOrganization():
  Promise<string> {
  const result =
    await executeDatabaseQuery<{
      id: string;
    }>(
      `
        INSERT INTO app.organizations (
          legal_name,
          display_name,
          country_code,
          status
        )
        VALUES (
          $1,
          $2,
          'IN',
          'active'
        )
        RETURNING id
      `,
      [
        `Commercial Test ${randomUUID()}`,
        "Commercial Test",
      ]
    );

  const id =
    result.rows[0]?.id;

  if (!id) {
    throw new Error(
      "Test organization was not created."
    );
  }

  createdOrganizationIds.push(
    id
  );

  return id;
}

afterAll(
  async () => {
    try {
      if (
        createdOrganizationIds.length > 0
      ) {
        await executeDatabaseQuery(
          `
            DELETE FROM app.organizations
            WHERE id = ANY(
              $1::uuid[]
            )
          `,
          [
            createdOrganizationIds,
          ]
        );
      }

      if (
        createdUserIds.length > 0
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
  "Poster commercial-request repository workflow",
  () => {
    it(
      "persists an initial request and a controlled Client resubmission revision",
      async () => {
        const clientUserId =
          await createIdentity(
            `client-${randomUUID()}@example.test`
          );

        const adminUserId =
          await createIdentity(
            `admin-${randomUUID()}@example.test`
          );

        const organizationId =
          await createOrganization();

        const service =
          createClientCommercialRequestService({
            createReference:
              () =>
                `ADV-${
                  randomUUID()
                    .replaceAll(
                      "-",
                      ""
                    )
                    .slice(
                      0,
                      12
                    )
                    .toUpperCase()
                }`,
          });

        const created =
          await service.submit({
            organizationId,

            actorUserId:
              clientUserId,

            requestType:
              "direct_sponsorship",

            title:
              "Poster launch sponsorship",

            objective:
              "Reach technology readers.",

            destinationUrl:
              "https://example.com/campaign",

            requestedPlacements: [
              "home",
              "search",
            ],

            requestedStartDate:
              "2026-08-10",

            requestedEndDate:
              "2026-08-31",

            budgetMinorUnits:
              2500000,

            currencyCode:
              "INR",

            creativeSpec: {
              layout:
                "standard_16_9",

              mediaType:
                "image",
            },

            commercialTerms: {
              model:
                "fixed_sponsorship",
            },
          });

        expect(
          created.status
        ).toBe(
          "pending_review"
        );

        const changed =
          await executeDatabaseQuery<{
            row_version: string;
          }>(
            `
              UPDATE app.commercial_requests
              SET
                status = 'changes_requested',
                decided_at = CURRENT_TIMESTAMP,
                decided_by_user_id = $2::uuid,
                decision_note = 'Please update the destination URL.'
              WHERE id = $1::uuid
              RETURNING
                row_version::text
                  AS row_version
            `,
            [
              created.id,
              adminUserId,
            ]
          );

        const changedRowVersion =
          changed.rows[0]?.row_version;

        if (!changedRowVersion) {
          throw new Error(
            "Test request was not moved to changes_requested."
          );
        }

        const resubmitted =
          await service.resubmit({
            organizationId,

            actorUserId:
              clientUserId,

            requestId:
              created.id,

            expectedRowVersion:
              changedRowVersion,

            requestType:
              "direct_sponsorship",

            title:
              "Poster launch sponsorship",

            objective:
              "Reach technology readers.",

            destinationUrl:
              "https://example.com/revised-campaign",

            requestedPlacements: [
              "home",
              "search",
            ],

            requestedStartDate:
              "2026-08-10",

            requestedEndDate:
              "2026-08-31",

            budgetMinorUnits:
              2500000,

            currencyCode:
              "INR",

            creativeSpec: {
              layout:
                "standard_16_9",

              mediaType:
                "image",
            },

            commercialTerms: {
              model:
                "fixed_sponsorship",
            },
          });

        expect(
          resubmitted.status
        ).toBe(
          "updated"
        );

        if (
          resubmitted.status !== "updated"
        ) {
          throw new Error(
            "Expected an updated resubmission."
          );
        }

        expect(
          resubmitted.request.status
        ).toBe(
          "pending_review"
        );

        expect(
          resubmitted.request.destinationUrl
        ).toBe(
          "https://example.com/revised-campaign"
        );

        const revisionResult =
          await executeDatabaseQuery<{
            revision_count: string;
          }>(
            `
              SELECT
                count(*)::text
                  AS revision_count
              FROM app.commercial_request_revisions
              WHERE request_id = $1::uuid
            `,
            [
              created.id,
            ]
          );

        expect(
          revisionResult.rows[0]?.revision_count
        ).toBe(
          "2"
        );
      }
    );
  }
);
