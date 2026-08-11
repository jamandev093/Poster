import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createClientAnalyticsService,
} from "../src/application/monetization/client-analytics.service.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

describe(
  "Client Analytics service",
  () => {
    it(
      "forces the authenticated organization into the analytics repository query",
      async () => {
        const overview = {
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-10",

          validImpressions:
            "100",

          invalidImpressions:
            "0",

          duplicateImpressions:
            "0",

          validClicks:
            "20",

          invalidClicks:
            "0",

          duplicateClicks:
            "0",

          validConversions:
            "4",

          invalidConversions:
            "0",

          duplicateConversions:
            "0",

          unattributedConversions:
            "0",

          ctr:
            0.2,

          latestSourceEventWatermark:
            null,

          finalizedMetricRows:
            1,

          totalMetricRows:
            1,

          placements:
            [],

          campaigns:
            [],
        };

        const readOverview =
          vi
            .fn()
            .mockResolvedValue(
              overview
            );

        const service =
          createClientAnalyticsService({
            dependencies: {
              readOverview,
            },
          });

        await service.getOverview({
          organizationId:
            ORGANIZATION_ID,

          startDate:
            "2026-08-01",

          endDate:
            "2026-08-10",
        });

        expect(
          readOverview
        ).toHaveBeenCalledWith({
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-10",

          campaignId:
            null,

          organizationId:
            ORGANIZATION_ID,
        });
      }
    );

    it(
      "rejects invalid date order",
      async () => {
        const service =
          createClientAnalyticsService({
            dependencies: {
              readOverview:
                vi.fn(),
            },
          });

        await expect(
          service.getOverview({
            organizationId:
              ORGANIZATION_ID,

            startDate:
              "2026-08-10",

            endDate:
              "2026-08-01",
          })
        ).rejects.toMatchObject({
          code:
            "CLIENT_ANALYTICS_DATE_RANGE_INVALID",
        });
      }
    );

    it(
      "rejects ranges longer than 366 days",
      async () => {
        const service =
          createClientAnalyticsService({
            dependencies: {
              readOverview:
                vi.fn(),
            },
          });

        await expect(
          service.getOverview({
            organizationId:
              ORGANIZATION_ID,

            startDate:
              "2025-01-01",

            endDate:
              "2026-01-02",
          })
        ).rejects.toMatchObject({
          code:
            "CLIENT_ANALYTICS_DATE_RANGE_TOO_LARGE",
        });
      }
    );
  }
);