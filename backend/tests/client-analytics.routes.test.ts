import Fastify
  from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createClientAnalyticsRoutes,
} from "../src/routes/client-analytics.routes.js";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

describe(
  "Client Analytics routes",
  () => {
    it(
      "uses the authenticated Client organization and never accepts organizationId from query",
      async () => {
        const getOverview =
          vi
            .fn()
            .mockResolvedValue({
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
            });

        const app =
          Fastify();

        await app.register(
          createClientAnalyticsRoutes({
            authenticateClientRequest:
              vi
                .fn()
                .mockResolvedValue({
                  userId:
                    USER_ID,

                  organizationId:
                    ORGANIZATION_ID,
                }),

            service: {
              getOverview,
            },
          })
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-10",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          getOverview
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          startDate:
            "2026-08-01",

          endDate:
            "2026-08-10",

          campaignId:
            null,
        });

        await app.close();
      }
    );

    it(
      "rejects organizationId supplied by the caller",
      async () => {
        const getOverview =
          vi.fn();

        const app =
          Fastify();

        await app.register(
          createClientAnalyticsRoutes({
            authenticateClientRequest:
              vi
                .fn()
                .mockResolvedValue({
                  userId:
                    USER_ID,

                  organizationId:
                    ORGANIZATION_ID,
                }),

            service: {
              getOverview,
            },
          })
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-10&organizationId=00000000-0000-4000-8000-000000009999",
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          getOverview
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects malformed campaign IDs",
      async () => {
        const getOverview =
          vi.fn();

        const app =
          Fastify();

        await app.register(
          createClientAnalyticsRoutes({
            authenticateClientRequest:
              vi
                .fn()
                .mockResolvedValue({
                  userId:
                    USER_ID,

                  organizationId:
                    ORGANIZATION_ID,
                }),

            service: {
              getOverview,
            },
          })
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-10&campaignId=bad-id",
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          getOverview
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);