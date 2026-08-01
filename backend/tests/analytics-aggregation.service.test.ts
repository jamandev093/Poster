import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "../src/database/database.transaction.js",
  () => ({
    runDatabaseTransaction:
      async <T>(
        operation:
          (
            executor:
              never
          ) => Promise<T>
      ): Promise<T> =>
        await operation(
          undefined as never
        ),
  })
);

import {
  createAnalyticsAggregationService,
  type AnalyticsAggregationServiceDependencies,
} from "../src/application/monetization/index.js";

import type {
  MonetizationCampaignRecord,
  MonetizationDailyMetricRecord,
  MonetizationEventPlacement,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const NOW =
  new Date(
    "2026-08-01T17:00:00.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-5001",

  sourceRequestId:
    null,

  organizationId:
    "00000000-0000-4000-8000-000000001101",

  name:
    "Analytics campaign",

  campaignType:
    "direct_sponsorship",

  origin:
    "client_request",

  status:
    "active",

  placements: [
    "home",
    "search",
  ],

  scheduledStartDate:
    "2026-08-01",

  scheduledEndDate:
    "2026-08-31",

  readinessStatus:
    "ready",

  commercialStatus:
    "funded",

  deliveryEligible:
    true,

  createdByUserId:
    "00000000-0000-4000-8000-000000000101",

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "3",
};

function createMetric(
  placement:
    MonetizationEventPlacement,
  finalizedAt:
    Date |
    null
): MonetizationDailyMetricRecord {
  return {
    campaignId:
      CAMPAIGN_ID,

    metricDate:
      "2026-08-01",

    placement,

    validImpressions:
      "10",

    invalidImpressions:
      "1",

    duplicateImpressions:
      "2",

    validClicks:
      "3",

    invalidClicks:
      "1",

    duplicateClicks:
      "0",

    validConversions:
      "1",

    invalidConversions:
      "0",

    duplicateConversions:
      "0",

    unattributedConversions:
      "1",

    sourceEventWatermark:
      NOW,

    finalizedAt,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  };
}

function createDependencies() {
  const findCampaign =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  const aggregateDailyMetric =
    vi.fn()
      .mockImplementation(
        async input =>
          createMetric(
            input.placement,
            input.finalizedAt
          )
      );

  const dependencies = {
    findCampaign,
    aggregateDailyMetric,

    now:
      () =>
        NOW,
  } as unknown as
    AnalyticsAggregationServiceDependencies;

  return {
    dependencies,
    findCampaign,
    aggregateDailyMetric,
  };
}

describe(
  "Analytics aggregation service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "aggregates every enabled campaign placement",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsAggregationService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.aggregateCampaignDay({
            campaignId:
              CAMPAIGN_ID,

            metricDate:
              "2026-08-01",
          });

        expect(
          mocks.aggregateDailyMetric
        ).toHaveBeenCalledTimes(
          2
        );

        expect(
          mocks.aggregateDailyMetric
        ).toHaveBeenNthCalledWith(
          1,
          {
            campaignId:
              CAMPAIGN_ID,

            metricDate:
              "2026-08-01",

            placement:
              "home",

            finalizedAt:
              null,
          },
          undefined
        );

        expect(
          result.map(
            metric =>
              metric.placement
          )
        ).toEqual([
          "home",
          "search",
        ]);
      }
    );

    it(
      "records one shared finalization timestamp",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsAggregationService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.aggregateCampaignDay({
            campaignId:
              CAMPAIGN_ID,

            metricDate:
              "2026-08-01",

            finalize:
              true,
          });

        expect(
          result.every(
            metric =>
              metric.finalizedAt ===
              NOW
          )
        ).toBe(
          true
        );
      }
    );

    it(
      "rejects an invalid metric date before repository access",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsAggregationService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.aggregateCampaignDay({
            campaignId:
              CAMPAIGN_ID,

            metricDate:
              "2026-02-31",
          })
        ).rejects.toThrow(
          "Analytics metric date is invalid."
        );

        expect(
          mocks.findCampaign
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects aggregation for a missing campaign",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign
          .mockResolvedValue(
            null
          );

        const service =
          createAnalyticsAggregationService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.aggregateCampaignDay({
            campaignId:
              CAMPAIGN_ID,

            metricDate:
              "2026-08-01",
          })
        ).rejects.toThrow(
          "The campaign selected for Analytics aggregation was not found."
        );

        expect(
          mocks.aggregateDailyMetric
        ).not.toHaveBeenCalled();
      }
    );
  }
);