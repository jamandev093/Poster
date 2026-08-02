import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CampaignOperationsError,
} from "../src/application/monetization/index.js";

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

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T05:00:00.000Z"
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
    "Poster campaign",

  campaignType:
    "poster_promotion",

  origin:
    "admin_internal",

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
    "approved",

  deliveryEligible:
    true,

  createdByUserId:
    ADMIN_ID,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "3",
};

function createAuthorizationContext(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContext {
  return {
    userId:
      ADMIN_ID,

    sessionId:
      "00000000-0000-4000-8000-000000000102",

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
    vi.fn();

  const get =
    vi.fn();

  const updateOperations =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  const transition =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  const service = {
    list,
    get,
    updateOperations,
    transition,
  } satisfies AdminCampaignService;

  return {
    service,
    updateOperations,
    transition,
  };
}

async function buildApp(
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
  "Admin campaign mutation routes",
  () => {
    it(
      "updates campaign operations using the authenticated Admin identity",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/operations`,

            payload: {
              expectedRowVersion:
                "2",

              name:
                "Poster campaign",

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

              reason:
                "Creative approved.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.updateOperations
        ).toHaveBeenCalledWith({
          campaignId:
            CAMPAIGN_ID,

          actorUserId:
            ADMIN_ID,

          expectedRowVersion:
            "2",

          name:
            "Poster campaign",

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

          reason:
            "Creative approved.",
        });

        await app.close();
      }
    );

    it(
      "executes an authorized lifecycle transition",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/transitions`,

            payload: {
              expectedRowVersion:
                "2",

              action:
                "activate",

              reason:
                "Ready for delivery.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.transition
        ).toHaveBeenCalledWith({
          campaignId:
            CAMPAIGN_ID,

          actorUserId:
            ADMIN_ID,

          expectedRowVersion:
            "2",

          action:
            "activate",

          reason:
            "Ready for delivery.",
        });

        await app.close();
      }
    );

    it(
      "rejects a mutation without campaign-management permission",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/transitions`,

            payload: {
              expectedRowVersion:
                "2",

              action:
                "pause",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.transition
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects client-supplied actor and delivery eligibility fields",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/operations`,

            payload: {
              expectedRowVersion:
                "2",

              name:
                "Poster campaign",

              placements: [
                "home",
              ],

              scheduledStartDate:
                "2026-08-01",

              scheduledEndDate:
                "2026-08-31",

              readinessStatus:
                "ready",

              actorUserId:
                "00000000-0000-4000-8000-000000000999",

              deliveryEligible:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.updateOperations
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps a row-version conflict to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.transition
          .mockRejectedValue(
            new CampaignOperationsError(
              "CAMPAIGN_VERSION_CONFLICT",
              "The campaign was updated by another operation. Refresh and try again."
            )
          );

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/transitions`,

            payload: {
              expectedRowVersion:
                "2",

              action:
                "pause",

              reason:
                "Temporary pause.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          409
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "CAMPAIGN_VERSION_CONFLICT",
          },
        });

        await app.close();
      }
    );

    it(
      "maps campaign validation issues to HTTP 400 details",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.updateOperations
          .mockRejectedValue(
            new CampaignOperationsError(
              "CAMPAIGN_OPERATION_INVALID",
              "The campaign operational update is invalid.",
              [
                {
                  field:
                    "scheduledEndDate",

                  code:
                    "date_order",

                  message:
                    "The campaign end date cannot be earlier than the start date.",
                },
              ]
            )
          );

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              `/api/v1/admin/monetization/campaigns/${CAMPAIGN_ID}/operations`,

            payload: {
              expectedRowVersion:
                "2",

              name:
                "Poster campaign",

              placements: [
                "home",
              ],

              scheduledStartDate:
                "2026-08-20",

              scheduledEndDate:
                "2026-08-10",

              readinessStatus:
                "ready",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "CAMPAIGN_OPERATION_INVALID",

            details: [
              {
                path:
                  "scheduledEndDate",

                message:
                  "The campaign end date cannot be earlier than the start date.",
              },
            ],
          },
        });

        await app.close();
      }
    );
  }
);