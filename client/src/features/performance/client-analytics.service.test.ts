import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "../workspace/services/client-api.service",
  () => ({
    requestPosterApiJson:
      vi.fn(),
  })
);

import {
  buildClientAnalyticsPath,
} from "./client-analytics.service";

describe(
  "Client Analytics service",
  () => {
    it(
      "builds the authenticated Client analytics path without exposing organizationId",
      () => {
        const path =
          buildClientAnalyticsPath({
            startDate:
              "2026-08-01",

            endDate:
              "2026-08-10",
          });

        expect(path).toBe(
          "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-10"
        );

        expect(path).not.toContain(
          "organizationId"
        );
      }
    );
  }
);