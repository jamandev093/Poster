import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AdminAnalyticsError,
  type AdminAnalyticsService,
} from "../src/application/monetization/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import type {
  MonetizationAnalyticsOverviewRecord,
} from "../src/domains/monetization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminAnalyticsRoutes,
} from "../src/routes/admin-analytics.routes.js";

const ADMIN_USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000102";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WATERMARK =
  new Date(
    "2026-08-31T12:00:00.000Z"
  );

const OVERVIEW:
  MonetizationAnalyticsOverviewRecord = {
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
    WATERMARK,

  finalizedMetricRows:
    4,

  totalMetricRows:
    6,

  placements: [
    {
      placement:
        "home",

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
    },
  ],

  campaigns: [
    {
      campaignId:
        CAMPAIGN_ID,

      campaignReference:
        "CMP-5001",

      campaignName:
        "Publisher launch sponsorship",

      campaignType:
        "direct_sponsorship",

      campaignStatus:
        "active",

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
        WATERMARK,

      finalizedMetricRows:
        4,

      totalMetricRows:
        6,
    },
  ],
};

function createAuthorizationContext(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContext {
  return {
    userId:
      ADMIN_USER_ID,

    sessionId:
      SESSION_ID,

    email:
      "admin@getpostar.com",

    fullName:
      "Poster Admin",

    accountStatus:
      "active",

    platformRoles: [
      "operations_admin",
    ],

    platformPermissions:
      permissions,

    organizationMemberships:
      [],
  };
}

function createServiceMocks() {
  const getOverview =
    vi.fn()
      .mockResolvedValue(
        OVERVIEW
      );

  return {
    getOverview,

    service: {
      getOverview,
    } as AdminAnalyticsService,
  };
}

async function buildTestApp(
  service:
    AdminAnalyticsService,
  authorizationContext:
    AuthorizationContext |
    null
): Promise<FastifyInstance> {
  const app =
    Fastify({
      logger:
        false,
    });

  app.addHook(
    "onRequest",
    async request => {
      Object.defineProperty(
        request,
        "authorizationContext",
        {
          configurable:
            true,

          enumerable:
            true,

          value:
            authorizationContext,

          writable:
            true,
        }
      );
    }
  );

  registerErrorHandler(
    app
  );

  await app.register(
    adminAnalyticsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Poster Admin Analytics HTTP route",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns serialized authoritative Analytics to an authorized Admin",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.analytics.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              `/api/v1/admin/monetization/analytics?startDate=2026-08-01&endDate=2026-08-31&campaignId=${CAMPAIGN_ID}&organizationId=${ORGANIZATION_ID}`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.getOverview
        ).toHaveBeenCalledWith({
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-31",

          campaignId:
            CAMPAIGN_ID,

          organizationId:
            ORGANIZATION_ID,
        });

        expect(
          response.json()
        ).toMatchObject({
          startDate:
            "2026-08-01",

          endDate:
            "2026-08-31",

          validImpressions:
            "100",

          validClicks:
            "10",

          ctr:
            0.1,

          latestSourceEventWatermark:
            WATERMARK
              .toISOString(),

          campaigns: [
            {
              campaignId:
                CAMPAIGN_ID,

              latestSourceEventWatermark:
                WATERMARK
                  .toISOString(),
            },
          ],
        });

        await app.close();
      }
    );

    it(
      "normalizes omitted optional Analytics filters to null",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.analytics.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/analytics?startDate=2026-08-01&endDate=2026-08-31",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.getOverview
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

        await app.close();
      }
    );

    it(
      "rejects an unauthenticated Analytics request",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            null
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/analytics?startDate=2026-08-01&endDate=2026-08-31",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          mocks.getOverview
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects an Admin without monetization.analytics.read",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/analytics?startDate=2026-08-01&endDate=2026-08-31",
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.getOverview
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects malformed Analytics query values before service execution",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.analytics.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/analytics?startDate=2026-08-01&endDate=2026-08-31&campaignId=invalid",
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.getOverview
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps operational Analytics range failures to 422",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.getOverview
          .mockRejectedValue(
            new AdminAnalyticsError(
              "ANALYTICS_DATE_RANGE_TOO_LARGE",
              "Analytics date ranges cannot exceed 366 days."
            )
          );

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.analytics.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/analytics?startDate=2025-01-01&endDate=2026-08-01",
          });

        expect(
          response.statusCode
        ).toBe(
          422
        );

        expect(
          response.json()
        ).toEqual({
          error: {
            code:
              "ANALYTICS_DATE_RANGE_TOO_LARGE",

            message:
              "Analytics date ranges cannot exceed 366 days.",
          },
        });

        await app.close();
      }
    );
  }
);