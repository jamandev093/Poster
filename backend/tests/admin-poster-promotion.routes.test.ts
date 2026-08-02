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
  PosterPromotionError,
} from "../src/application/monetization/poster-promotion.errors.js";

import type {
  AdminPosterPromotionService,
} from "../src/application/monetization/admin-poster-promotion.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import type {
  PosterPromotionRecord,
} from "../src/domains/monetization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminPosterPromotionRoutes,
} from "../src/routes/admin-poster-promotion.routes.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date(
    "2026-08-02T10:00:00.000Z"
  );

const RECORD:
  PosterPromotionRecord = {
  campaign: {
    id:
      CAMPAIGN_ID,

    campaignReference:
      "CMP-POSTER-ABCDEF123456",

    sourceRequestId:
      null,

    organizationId:
      ORGANIZATION_ID,

    name:
      "Poster Career Discovery",

    campaignType:
      "poster_promotion",

    origin:
      "admin_internal",

    status:
      "scheduled",

    placements: [
      "home",
    ],

    scheduledStartDate:
      "2026-08-10",

    scheduledEndDate:
      "2026-08-31",

    readinessStatus:
      "ready",

    commercialStatus:
      "approved",

    deliveryEligible:
      false,

    createdByUserId:
      ADMIN_ID,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  },

  creative: {
    campaignId:
      CAMPAIGN_ID,

    purpose:
      "Promote a Poster-owned career knowledge collection.",

    headline:
      "Discover career knowledge",

    body:
      "Explore an authoritative Poster collection for professional learning.",

    callToAction:
      "Explore",

    destinationUrl:
      "https://getpostar.com/collections/career-growth",

    disclosure:
      "Promoted by Poster",

    media: {
      assetId:
        ASSET_ID,

      type:
        "image",

      fileName:
        "career-growth.webp",

      mimeType:
        "image/webp",

      sizeBytes:
        2048,
    },

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  },
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

function createPayload() {
  return {
    organizationId:
      ORGANIZATION_ID,

    name:
      RECORD.campaign.name,

    placements:
      RECORD.campaign.placements,

    scheduledStartDate:
      RECORD.campaign.scheduledStartDate,

    scheduledEndDate:
      RECORD.campaign.scheduledEndDate,

    mode:
      "schedule" as const,

    purpose:
      RECORD.creative.purpose,

    headline:
      RECORD.creative.headline,

    body:
      RECORD.creative.body,

    callToAction:
      RECORD.creative.callToAction,

    destinationUrl:
      RECORD.creative.destinationUrl,

    media:
      RECORD.creative.media,
  };
}

function createServiceMocks() {
  const get =
    vi.fn()
      .mockResolvedValue(
        RECORD
      );

  const create =
    vi.fn()
      .mockResolvedValue(
        RECORD
      );

  const update =
    vi.fn()
      .mockResolvedValue(
        RECORD
      );

  const service = {
    get,
    create,
    update,
  } satisfies
    AdminPosterPromotionService;

  return {
    get,
    create,
    update,
    service,
  };
}

async function buildTestApp(
  service:
    AdminPosterPromotionService,
  authorizationContext:
    AuthorizationContext |
    null
): Promise<
  FastifyInstance
> {
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
    adminPosterPromotionRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Admin Poster Promotion HTTP routes",
  () => {
    it(
      "creates a Poster Promotion using the authenticated Admin identity",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
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
              "/api/v1/admin/monetization/poster-promotions",

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          mocks.create
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.create
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId:
              ADMIN_ID,

            organizationId:
              ORGANIZATION_ID,

            campaignReference:
              expect.stringMatching(
                /^CMP-POSTER-[A-F0-9]{12}$/
              ),

            name:
              RECORD.campaign.name,

            mode:
              "schedule",
          })
        );

        expect(
          response.json()
        ).toMatchObject({
          campaign: {
            id:
              CAMPAIGN_ID,

            createdAt:
              NOW.toISOString(),

            updatedAt:
              NOW.toISOString(),
          },

          creative: {
            campaignId:
              CAMPAIGN_ID,

            createdAt:
              NOW.toISOString(),

            updatedAt:
              NOW.toISOString(),
          },
        });

        await app.close();
      }
    );

    it(
      "returns an authoritative Poster Promotion detail",
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
              `/api/v1/admin/monetization/poster-promotions/${CAMPAIGN_ID}`,
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

        await app.close();
      }
    );

    it(
      "returns 404 when the Poster Promotion does not exist",
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
              `/api/v1/admin/monetization/poster-promotions/${CAMPAIGN_ID}`,
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
              "POSTER_PROMOTION_NOT_FOUND",
          },
        });

        await app.close();
      }
    );

    it(
      "updates a Poster Promotion using both row versions",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const payload = {
          ...createPayload(),

          expectedCampaignRowVersion:
            "1",

          expectedCreativeRowVersion:
            "1",
        };

        delete (
          payload as {
            organizationId?:
              string;
          }
        ).organizationId;

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              `/api/v1/admin/monetization/poster-promotions/${CAMPAIGN_ID}`,

            payload,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.update
        ).toHaveBeenCalledWith({
          campaignId:
            CAMPAIGN_ID,

          actorUserId:
            ADMIN_ID,

          expectedCampaignRowVersion:
            "1",

          expectedCreativeRowVersion:
            "1",

          name:
            RECORD.campaign.name,

          placements:
            RECORD.campaign.placements,

          scheduledStartDate:
            RECORD.campaign.scheduledStartDate,

          scheduledEndDate:
            RECORD.campaign.scheduledEndDate,

          mode:
            "schedule",

          purpose:
            RECORD.creative.purpose,

          headline:
            RECORD.creative.headline,

          body:
            RECORD.creative.body,

          callToAction:
            RECORD.creative.callToAction,

          destinationUrl:
            RECORD.creative.destinationUrl,

          media:
            RECORD.creative.media,
        });

        await app.close();
      }
    );

    it(
      "rejects client-supplied protected campaign fields",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
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
              "/api/v1/admin/monetization/poster-promotions",

            payload: {
              ...createPayload(),

              actorUserId:
                "00000000-0000-4000-8000-000000000999",

              campaignReference:
                "CMP-CLIENT-CONTROLLED",

              campaignType:
                "poster_promotion",

              deliveryEligible:
                true,

              commercialStatus:
                "funded",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.create
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects a mutation without campaign-management permission",
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
              "POST",

            url:
              "/api/v1/admin/monetization/poster-promotions",

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.create
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps Poster Promotion concurrency errors to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.update
          .mockRejectedValue(
            new PosterPromotionError({
              code:
                "POSTER_PROMOTION_CREATIVE_CONFLICT",

              message:
                "The Poster Promotion creative changed after it was loaded.",

              statusCode:
                409,
            })
          );

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "monetization.campaigns.manage",
            ])
          );

        const payload = {
          ...createPayload(),

          expectedCampaignRowVersion:
            "1",

          expectedCreativeRowVersion:
            "1",
        };

        delete (
          payload as {
            organizationId?:
              string;
          }
        ).organizationId;

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              `/api/v1/admin/monetization/poster-promotions/${CAMPAIGN_ID}`,

            payload,
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
              "POSTER_PROMOTION_CREATIVE_CONFLICT",
          },
        });

        await app.close();
      }
    );
  }
);