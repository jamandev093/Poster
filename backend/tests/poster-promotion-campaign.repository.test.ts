import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createInternalPosterPromotionCampaign,
  updateInternalPosterPromotionCampaign,
} from "../src/domains/monetization/poster-promotion-campaign.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T09:45:00.000Z"
  );

const CAMPAIGN_ROW = {
  id:
    CAMPAIGN_ID,

  campaign_reference:
    "CMP-POSTER0001",

  source_request_id:
    null,

  organization_id:
    ORGANIZATION_ID,

  name:
    "Poster Career Discovery",

  campaign_type:
    "poster_promotion" as const,

  origin:
    "admin_internal" as const,

  status:
    "scheduled" as const,

  placements: [
    "home",
  ],

  scheduled_start_date:
    "2026-08-10",

  scheduled_end_date:
    "2026-08-31",

  readiness_status:
    "ready" as const,

  commercial_status:
    "approved" as const,

  delivery_eligible:
    false,

  created_by_user_id:
    ADMIN_ID,

  created_at:
    NOW,

  updated_at:
    NOW,

  row_version:
    "1",
};

function createExecutor(
  rowsByCall:
    readonly (
      readonly Record<
        string,
        unknown
      >[]
    )[]
) {
  const calls: {
    text:
      string;

    values:
      readonly unknown[];
  }[] =
    [];

  let callIndex =
    0;

  const executor = {
    query:
      async (
        text:
          string,
        values?:
          readonly unknown[]
      ) => {
        calls.push({
          text,

          values:
            values ??
            [],
        });

        const rows =
          rowsByCall[
            callIndex
          ] ??
          [];

        callIndex +=
          1;

        return {
          command:
            "",

          rowCount:
            rows.length,

          oid:
            0,

          fields:
            [],

          rows:
            Array.from(
              rows
            ),
        };
      },
  } as unknown as
    DatabaseQueryExecutor;

  return {
    calls,
    executor,
  };
}

describe(
  "Poster Promotion campaign repository",
  () => {
    it(
      "creates an internal Poster Promotion campaign",
      async () => {
        const mocks =
          createExecutor([
            [
              CAMPAIGN_ROW,
            ],
          ]);

        const result =
          await createInternalPosterPromotionCampaign(
            {
              actorUserId:
                ADMIN_ID,

              organizationId:
                ORGANIZATION_ID,

              campaignReference:
                "  CMP-POSTER0001  ",

              name:
                "  Poster Career Discovery  ",

              placements: [
                "home",
              ],

              scheduledStartDate:
                "2026-08-10",

              scheduledEndDate:
                "2026-08-31",

              status:
                "scheduled",

              readinessStatus:
                "ready",

              commercialStatus:
                "approved",

              createdAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual(
          expect.objectContaining({
            id:
              CAMPAIGN_ID,

            campaignType:
              "poster_promotion",

            origin:
              "admin_internal",

            commercialStatus:
              "approved",
          })
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "INSERT INTO app.monetization_campaigns"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          "CMP-POSTER0001",
          ORGANIZATION_ID,
          "Poster Career Discovery",
          [
            "home",
          ],
          "2026-08-10",
          "2026-08-31",
          "ready",
          "approved",
          ADMIN_ID,
          NOW,
        ]);
      }
    );

    it(
      "updates an internal Poster Promotion using row-version concurrency",
      async () => {
        const updatedRow = {
          ...CAMPAIGN_ROW,

          name:
            "Updated Poster Promotion",

          row_version:
            "2",
        };

        const mocks =
          createExecutor([
            [
              updatedRow,
            ],
          ]);

        const result =
          await updateInternalPosterPromotionCampaign(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              name:
                updatedRow.name,

              placements: [
                "home",
                "search",
              ],

              scheduledStartDate:
                "2026-08-10",

              scheduledEndDate:
                "2026-09-10",

              status:
                "scheduled",

              updatedAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "updated",

          campaign:
            expect.objectContaining({
              name:
                updatedRow.name,

              rowVersion:
                "2",
            }),
        });

        const normalizedSql =
          mocks.calls[0]?.text
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        expect(
          normalizedSql
        ).toContain(
          "row_version = row_version + 1"
        );

        expect(
          mocks.calls[0]?.values.slice(
            0,
            2
          )
        ).toEqual([
          CAMPAIGN_ID,
          "1",
        ]);
      }
    );

    it(
      "returns a conflict when the campaign row version is stale",
      async () => {
        const currentRow = {
          ...CAMPAIGN_ROW,

          row_version:
            "4",
        };

        const mocks =
          createExecutor([
            [],
            [
              currentRow,
            ],
          ]);

        const result =
          await updateInternalPosterPromotionCampaign(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              name:
                CAMPAIGN_ROW.name,

              placements: [
                "home",
              ],

              scheduledStartDate:
                CAMPAIGN_ROW.scheduled_start_date,

              scheduledEndDate:
                CAMPAIGN_ROW.scheduled_end_date,

              status:
                "scheduled",

              updatedAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "conflict",

          campaign:
            expect.objectContaining({
              rowVersion:
                "4",
            }),
        });

        expect(
          mocks.calls
        ).toHaveLength(
          2
        );
      }
    );

    it(
      "returns not found when the campaign no longer exists",
      async () => {
        const mocks =
          createExecutor([
            [],
            [],
          ]);

        const result =
          await updateInternalPosterPromotionCampaign(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              name:
                CAMPAIGN_ROW.name,

              placements: [
                "home",
              ],

              scheduledStartDate:
                CAMPAIGN_ROW.scheduled_start_date,

              scheduledEndDate:
                CAMPAIGN_ROW.scheduled_end_date,

              status:
                "draft",

              updatedAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "not_found",
        });
      }
    );
  }
);