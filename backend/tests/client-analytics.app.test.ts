import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  ClientAnalyticsService,
} from "../src/application/monetization/client-analytics.service.js";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000001302";

const MEMBERSHIP_ID =
  "00000000-0000-4000-8000-000000001303";

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi
        .fn()
        .mockResolvedValue({
          userId:
            USER_ID,

          sessionId:
            SESSION_ID,

          email:
            "client@example.com",

          fullName:
            "Client Owner",

          accountStatus:
            "active",

          platformRoles:
            [],

          platformPermissions:
            [],

          organizationMemberships: [
            {
              membershipId:
                MEMBERSHIP_ID,

              organizationId:
                ORGANIZATION_ID,

              role:
                "owner",

              isPrimaryContact:
                true,
            },
          ],
        }),
  };
}

function createAnalyticsService():
  ClientAnalyticsService {
  return {
    getOverview:
      vi
        .fn<
          ClientAnalyticsService[
            "getOverview"
          ]
        >()
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
        }),
  };
}

describe(
  "Client Analytics app wiring",
  () => {
    it(
      "registers Client Analytics behind authenticated organization context",
      async () => {
        const clientAnalyticsService =
          createAnalyticsService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            clientAnalyticsService,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/client/analytics?startDate=2026-08-01&endDate=2026-08-10",

            headers: {
              authorization:
                "Bearer payload.signature",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          clientAnalyticsService
            .getOverview
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

        expect(
          response.json()
        ).toMatchObject({
          validImpressions:
            "100",

          validClicks:
            "20",

          validConversions:
            "4",

          ctr:
            0.2,
        });
      }
    );
  }
);