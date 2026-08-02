import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  transitionMonetizationCampaignStatus,
  updateMonetizationCampaignOperations,
} from "../src/domains/monetization/campaign.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

function createDatabaseRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id:
      CAMPAIGN_ID,

    campaign_reference:
      "CMP-5001",

    source_request_id:
      null,

    organization_id:
      "00000000-0000-4000-8000-000000001101",

    name:
      "Poster campaign",

    campaign_type:
      "poster_promotion",

    origin:
      "admin_internal",

    status:
      "draft",

    placements: [
      "home",
    ],

    scheduled_start_date:
      "2026-08-10",

    scheduled_end_date:
      "2026-08-31",

    readiness_status:
      "pending_setup",

    commercial_status:
      "approved",

    delivery_eligible:
      false,

    created_by_user_id:
      "00000000-0000-4000-8000-000000000101",

    created_at:
      new Date(
        "2026-08-01T10:00:00.000Z"
      ),

    updated_at:
      new Date(
        "2026-08-01T10:00:00.000Z"
      ),

    row_version:
      "2",

    ...overrides,
  };
}

function createExecutor(
  rowsByCall: unknown[][]
) {
  const query =
    vi.fn();

  for (
    const rows of
      rowsByCall
  ) {
    query.mockResolvedValueOnce({
      rows,
      rowCount:
        rows.length,
      command:
        "UPDATE",
      oid:
        0,
      fields:
        [],
    });
  }

  return {
    query,
    executor: {
      query,
    } as unknown as
      DatabaseQueryExecutor,
  };
}

describe(
  "campaign operations repository",
  () => {
    it(
      "updates shared operational campaign fields using optimistic concurrency",
      async () => {
        const updatedRow =
          createDatabaseRow({
            name:
              "Updated Poster campaign",
            readiness_status:
              "ready",
            row_version:
              "3",
          });

        const mocks =
          createExecutor([
            [
              updatedRow,
            ],
          ]);

        const result =
          await updateMonetizationCampaignOperations(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "2",

              name:
                " Updated Poster campaign ",

              placements: [
                "home",
                "search",
              ],

              scheduledStartDate:
                "2026-08-10",

              scheduledEndDate:
                "2026-08-31",

              readinessStatus:
                "ready",
            },

            mocks.executor
          );

        expect(
          result.status
        ).toBe(
          "updated"
        );

        expect(
          mocks.query
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.query.mock.calls[0]?.[1]
        ).toEqual([
          CAMPAIGN_ID,
          "2",
          "Updated Poster campaign",
          [
            "home",
            "search",
          ],
          "2026-08-10",
          "2026-08-31",
          "ready",
        ]);
      }
    );

    it(
      "returns the current campaign when an operational update conflicts",
      async () => {
        const currentRow =
          createDatabaseRow({
            row_version:
              "4",
          });

        const mocks =
          createExecutor([
            [],
            [
              currentRow,
            ],
          ]);

        const result =
          await updateMonetizationCampaignOperations(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "2",

              name:
                "Poster campaign",

              placements: [
                "home",
              ],

              scheduledStartDate:
                "2026-08-10",

              scheduledEndDate:
                "2026-08-31",

              readinessStatus:
                "pending_setup",
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
          mocks.query
        ).toHaveBeenCalledTimes(
          2
        );
      }
    );

    it(
      "transitions campaign status and derives delivery eligibility in the database",
      async () => {
        const activeRow =
          createDatabaseRow({
            status:
              "active",
            readiness_status:
              "ready",
            delivery_eligible:
              true,
            row_version:
              "3",
          });

        const mocks =
          createExecutor([
            [
              activeRow,
            ],
          ]);

        const result =
          await transitionMonetizationCampaignStatus(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "2",

              targetStatus:
                "active",
            },

            mocks.executor
          );

        expect(
          result.status
        ).toBe(
          "updated"
        );

        expect(
          mocks.query.mock.calls[0]?.[1]
        ).toEqual([
          CAMPAIGN_ID,
          "2",
          "active",
        ]);

        const sql =
          String(
            mocks.query.mock.calls[0]?.[0]
          );

        expect(
          sql
        ).toContain(
          "CURRENT_DATE BETWEEN"
        );

        expect(
          sql
        ).toContain(
          "$3 = 'active'"
        );
      }
    );

    it(
      "returns not found when the campaign does not exist",
      async () => {
        const mocks =
          createExecutor([
            [],
            [],
          ]);

        const result =
          await transitionMonetizationCampaignStatus(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              targetStatus:
                "paused",
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