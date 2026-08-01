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

import type {
  AdminCampaignService,
} from "../src/application/monetization/admin-campaign.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import type {
  MonetizationCampaignRecord,
} from "../src/domains/monetization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminCampaignRoutes,
} from "../src/routes/admin-campaign.routes.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const REQUEST_ID =
  "00000000-0000-4000-8000-000000001001";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000102";

const CREATED_AT =
  new Date(
    "2026-08-01T15:00:00.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-5001",

  sourceRequestId:
    REQUEST_ID,

  organizationId:
    ORGANIZATION_ID,

  name:
    "Publisher launch sponsorship",

  campaignType:
    "direct_sponsorship",

  origin:
    "client_request",

  status:
    "draft",

  placements: [
    "home",
    "search",
  ],

  scheduledStartDate:
    "2026-08-10",

  scheduledEndDate:
    "2026-08-31",

  readinessStatus:
    "pending_setup",

  commercialStatus:
    "pending_funding",

  deliveryEligible:
    false,

  createdByUserId:
    ADMIN_ID,

  createdAt:
    CREATED_AT,

  updatedAt:
    CREATED_AT,

  rowVersion:
    "1",
};

function createAuthorizationContext(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContext {
  return {
    userId:
      ADMIN_ID,

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
  const list =
    vi.fn()
      .mockResolvedValue({
        items: [
          CAMPAIGN,
        ],

        total:
          1,

        limit:
          50,

        offset:
          0,
      });

  const get =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  return {
    list,
    get,

    service: {
      list,
      get,
    } as AdminCampaignService,
  };
}

async function buildTestApp(
  service:
    AdminCampaignService,
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
    adminCampaignRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Poster Admin Campaign HTTP routes",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns serialized authoritative campaigns to an authorized Admin",
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
              `/api/v1/admin/monetization/campaigns?organizationId=${ORGANIZATION_ID}&status=draft&campaignType=direct_sponsorship&limit=50&offset=0`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.list
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          status:
            "draft",

          campaignType:
            "direct_sponsorship",

          limit:
            50,

          offset:
            0,
        });

        expect(
          response.json()
        ).toEqual({
          items: [
            {
              ...CAMPAIGN,

              createdAt:
                CREATED_AT
                  .toISOString(),

              updatedAt:
                CREATED_AT
                  .toISOString(),
            },
          ],

          total:
            1,

          limit:
            50,

          offset:
            0,
        });

        await app.close();
      }
    );

    it(
      "normalizes omitted optional campaign filters to null",
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
              "/api/v1/admin/monetization/campaigns",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.list
        ).toHaveBeenCalledWith({
          organizationId:
            null,

          status:
            null,

          campaignType:
            null,

          limit:
            50,

          offset:
            0,
        });

        await app.close();
      }
    );

    it(
      "returns one serialized campaign detail",
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
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.get
        ).toHaveBeenCalledWith(
          CAMPAIGN_ID
        );

        expect(
          response.json()
        ).toEqual({
          campaign: {
            ...CAMPAIGN,

            createdAt:
              CREATED_AT
                .toISOString(),

            updatedAt:
              CREATED_AT
                .toISOString(),
          },
        });

        await app.close();
      }
    );

    it(
      "returns 404 when the campaign does not exist",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.get
          .mockResolvedValue(
            null
          );

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
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}`,
          });

        expect(
          response.statusCode
        ).toBe(
          404
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "MONETIZATION_CAMPAIGN_NOT_FOUND",

            message:
              "The monetization campaign was not found.",
          },
        });

        await app.close();
      }
    );

    it(
      "rejects an unauthenticated request before calling the service",
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
              "/api/v1/admin/monetization/campaigns",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          mocks.list
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects an Admin without the campaign-read permission",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.requests.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/monetization/campaigns",
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.list
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects malformed campaign filters before service execution",
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
              "/api/v1/admin/monetization/campaigns?status=invalid",
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.list
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);