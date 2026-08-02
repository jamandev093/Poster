import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  AFFILIATE_DISCLOSURE,
} from "../src/domains/monetization/affiliate.types.js";

import {
  createAffiliateMetadata,
  findAffiliateMetadataByCampaignId,
  updateAffiliateMetadata,
} from "../src/domains/monetization/affiliate.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001601";

const NOW =
  new Date(
    "2026-08-02T12:00:00.000Z"
  );

const ROW = {
  campaign_id:
    CAMPAIGN_ID,

  partner_name:
    "Example Learning",

  offer_name:
    "Professional Learning Offer",

  destination_url:
    "https://example.com/learning",

  disclosure:
    AFFILIATE_DISCLOSURE,

  commission_model:
    "cpa" as const,

  commission_terms: {
    amountMinorUnits:
      50000,

    currencyCode:
      "INR",
  },

  tracking_status:
    "pending_verification" as const,

  tracking_url:
    "https://track.example.com/click",

  payout_readiness_status:
    "not_ready" as const,

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
  "Affiliate metadata repository",
  () => {
    it(
      "finds metadata by campaign id",
      async () => {
        const mocks =
          createExecutor([
            [
              ROW,
            ],
          ]);

        const result =
          await findAffiliateMetadataByCampaignId(
            CAMPAIGN_ID,
            mocks.executor
          );

        expect(
          result
        ).toEqual(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            partnerName:
              ROW.partner_name,

            disclosure:
              AFFILIATE_DISCLOSURE,
          })
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "FROM app.affiliate_campaign_metadata"
        );
      }
    );

    it(
      "creates affiliate metadata",
      async () => {
        const mocks =
          createExecutor([
            [
              ROW,
            ],
          ]);

        const result =
          await createAffiliateMetadata(
            {
              campaignId:
                CAMPAIGN_ID,

              partnerName:
                "  Example Learning  ",

              offerName:
                "  Professional Learning Offer  ",

              destinationUrl:
                "  https://example.com/learning  ",

              disclosure:
                AFFILIATE_DISCLOSURE,

              commissionModel:
                "cpa",

              commissionTerms:
                ROW.commission_terms,

              trackingStatus:
                "pending_verification",

              trackingUrl:
                "  https://track.example.com/click  ",

              payoutReadinessStatus:
                "not_ready",

              createdAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result.partnerName
        ).toBe(
          "Example Learning"
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "INSERT INTO app.affiliate_campaign_metadata"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          CAMPAIGN_ID,
          "Example Learning",
          "Professional Learning Offer",
          "https://example.com/learning",
          AFFILIATE_DISCLOSURE,
          "cpa",
          ROW.commission_terms,
          "pending_verification",
          "https://track.example.com/click",
          "not_ready",
          NOW,
        ]);
      }
    );

    it(
      "updates affiliate metadata with row-version concurrency",
      async () => {
        const updatedRow = {
          ...ROW,

          row_version:
            "2",

          tracking_status:
            "active" as const,
        };

        const mocks =
          createExecutor([
            [
              updatedRow,
            ],
          ]);

        const result =
          await updateAffiliateMetadata(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              partnerName:
                ROW.partner_name,

              offerName:
                ROW.offer_name,

              destinationUrl:
                ROW.destination_url,

              disclosure:
                AFFILIATE_DISCLOSURE,

              commissionModel:
                "cpa",

              commissionTerms:
                ROW.commission_terms,

              trackingStatus:
                "active",

              trackingUrl:
                ROW.tracking_url,

              payoutReadinessStatus:
                "not_ready",

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

          metadata:
            expect.objectContaining({
              rowVersion:
                "2",

              trackingStatus:
                "active",
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
      }
    );

    it(
      "returns a conflict when the metadata row version is stale",
      async () => {
        const currentRow = {
          ...ROW,

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
          await updateAffiliateMetadata(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              partnerName:
                ROW.partner_name,

              offerName:
                ROW.offer_name,

              destinationUrl:
                ROW.destination_url,

              disclosure:
                AFFILIATE_DISCLOSURE,

              commissionModel:
                "cpa",

              commissionTerms:
                ROW.commission_terms,

              trackingStatus:
                "active",

              trackingUrl:
                ROW.tracking_url,

              payoutReadinessStatus:
                "ready",

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

          metadata:
            expect.objectContaining({
              rowVersion:
                "4",
            }),
        });
      }
    );

    it(
      "returns not found when metadata no longer exists",
      async () => {
        const mocks =
          createExecutor([
            [],
            [],
          ]);

        const result =
          await updateAffiliateMetadata(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              partnerName:
                ROW.partner_name,

              offerName:
                ROW.offer_name,

              destinationUrl:
                ROW.destination_url,

              disclosure:
                AFFILIATE_DISCLOSURE,

              commissionModel:
                "cpa",

              commissionTerms:
                ROW.commission_terms,

              trackingStatus:
                "active",

              trackingUrl:
                ROW.tracking_url,

              payoutReadinessStatus:
                "ready",

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