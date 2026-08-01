import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminAnalyticsService,
  type AdminAnalyticsServiceDependencies,
} from "../src/application/monetization/index.js";

const OVERVIEW = {
  startDate:
    "2026-08-01",

  endDate:
    "2026-08-31",

  validImpressions:
    "100",

  invalidImpressions:
    "4",

  duplicateImpressions:
    "3",

  validClicks:
    "10",

  invalidClicks:
    "2",

  duplicateClicks:
    "1",

  validConversions:
    "2",

  invalidConversions:
    "1",

  duplicateConversions:
    "0",

  unattributedConversions:
    "1",

  ctr:
    0.1,

  latestSourceEventWatermark:
    new Date(
      "2026-08-31T12:00:00.000Z"
    ),

  finalizedMetricRows:
    4,

  totalMetricRows:
    6,

  placements:
    [],

  campaigns:
    [],
};

function createDependencies() {
  const readOverview =
    vi.fn()
      .mockResolvedValue(
        OVERVIEW
      );

  const dependencies = {
    readOverview,
  } as unknown as
    AdminAnalyticsServiceDependencies;

  return {
    dependencies,
    readOverview,
  };
}

describe(
  "Admin Analytics service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns authoritative Analytics totals for a valid range",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAnalyticsService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.getOverview({
            startDate:
              "2026-08-01",

            endDate:
              "2026-08-31",

            campaignId:
              null,

            organizationId:
              null,
          });

        expect(
          mocks.readOverview
        ).toHaveBeenCalledWith({
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-31",

          campaignId:
            null,

          organizationId:
            null,
        });

        expect(
          result.ctr
        ).toBe(
          0.1
        );
      }
    );

    it(
      "preserves campaign and organization filters",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAnalyticsService({
            dependencies:
              mocks.dependencies,
          });

        await service.getOverview({
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-31",

          campaignId:
            "00000000-0000-4000-8000-000000001201",

          organizationId:
            "00000000-0000-4000-8000-000000001101",
        });

        expect(
          mocks.readOverview
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              "00000000-0000-4000-8000-000000001201",

            organizationId:
              "00000000-0000-4000-8000-000000001101",
          })
        );
      }
    );

    it(
      "rejects an invalid calendar date",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAnalyticsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getOverview({
            startDate:
              "2026-02-31",

            endDate:
              "2026-03-01",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_DATE_RANGE_INVALID",
        });

        expect(
          mocks.readOverview
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a reversed date range",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAnalyticsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getOverview({
            startDate:
              "2026-08-31",

            endDate:
              "2026-08-01",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_DATE_RANGE_INVALID",
        });
      }
    );

    it(
      "rejects ranges larger than the operational limit",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAnalyticsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getOverview({
            startDate:
              "2025-01-01",

            endDate:
              "2026-08-01",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_DATE_RANGE_TOO_LARGE",
        });

        expect(
          mocks.readOverview
        ).not.toHaveBeenCalled();
      }
    );
  }
);