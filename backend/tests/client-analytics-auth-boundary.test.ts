import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

describe(
  "Client Analytics authorization boundary",
  () => {
    it(
      "returns 401 instead of 500 for an unauthenticated Client analytics request",
      async () => {
        const clientAnalyticsService = {
          getOverview:
            vi.fn(),
        };

        const app =
          await buildApp({
            clientAnalyticsService:
              clientAnalyticsService as never,
          });

        try {
          const response =
            await app.inject({
              method:
                "GET",

              url:
                "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-11",
            });

          expect(
            response.statusCode
          ).toBe(
            401
          );

          expect(
            JSON.parse(
              response.payload
            )
          ).toEqual({
            error: {
              code:
                "CLIENT_ANALYTICS_AUTHENTICATION_REQUIRED",

              message:
                "Client authentication is required.",
            },
          });

          expect(
            clientAnalyticsService
              .getOverview
          ).not.toHaveBeenCalled();
        }
        finally {
          await app.close();
        }
      }
    );
  }
);
