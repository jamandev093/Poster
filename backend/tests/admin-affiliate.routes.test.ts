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
  AffiliateError,
  type AdminAffiliateDetailRecord,
  type AdminAffiliateService,
} from "../src/application/monetization/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import {
  AFFILIATE_DISCLOSURE,
} from "../src/domains/monetization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminAffiliateRoutes,
} from "../src/routes/admin-affiliate.routes.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001601";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T13:30:00.000Z"
  );

const DETAIL:
  AdminAffiliateDetailRecord = {
  campaign: {
    id:
      CAMPAIGN_ID,

    campaignReference:
      "CMP-AFF-0001",

    sourceRequestId:
      "00000000-0000-4000-8000-000000001001",

    organizationId:
      "00000000-0000-4000-8000-000000001101",

    name:
      "Learning Partner Offer",

    campaignType:
      "affiliate",

    origin:
      "client_request",

    status:
      "draft",

    placements: [
      "search",
    ],

    scheduledStartDate:
      "2026-08-10",

    scheduledEndDate:
      "2026-08-31",

    readinessStatus:
      "pending_setup",

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

  metadata: {
    campaignId:
      CAMPAIGN_ID,

    partnerName:
      "Example Learning",

    offerName:
      "Professional Learning Offer",

    destinationUrl:
      "https://example.com/learning",

    disclosure:
      AFFILIATE_DISCLOSURE,

    commissionModel:
      "cpa",

    commissionTerms: {
      amountMinorUnits:
        50000,

      currencyCode:
        "INR",
    },

    trackingStatus:
      "pending_verification",

    trackingUrl:
      "https://track.example.com/click",

    payoutReadinessStatus:
      "not_ready",

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
    partnerName:
      DETAIL.metadata?.partnerName ??
      "",

    offerName:
      DETAIL.metadata?.offerName ??
      "",

    destinationUrl:
      DETAIL.metadata?.destinationUrl ??
      "",

    commissionModel:
      "cpa" as const,

    commissionTerms: {
      amountMinorUnits:
        50000,

      currencyCode:
        "INR",
    },

    trackingStatus:
      "pending_verification" as const,

    trackingUrl:
      "https://track.example.com/click",

    payoutReadinessStatus:
      "not_ready" as const,
  };
}

function createServiceMocks() {
  const get =
    vi.fn()
      .mockResolvedValue(
        DETAIL
      );

  const createMetadata =
    vi.fn()
      .mockResolvedValue(
        DETAIL
      );

  const updateMetadata =
    vi.fn()
      .mockResolvedValue(
        DETAIL
      );

  const service = {
    get,
    createMetadata,
    updateMetadata,
  } satisfies
    AdminAffiliateService;

  return {
    get,
    createMetadata,
    updateMetadata,
    service,
  };
}

async function buildApp(
  service:
    AdminAffiliateService,
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
    adminAffiliateRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Admin Affiliate HTTP routes",
  () => {
    it(
      "returns authoritative affiliate campaign detail",
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
              "GET",

            url:
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}`,
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
        ).toMatchObject({
          campaign: {
            id:
              CAMPAIGN_ID,

            createdAt:
              NOW.toISOString(),
          },

          metadata: {
            campaignId:
              CAMPAIGN_ID,

            disclosure:
              AFFILIATE_DISCLOSURE,

            createdAt:
              NOW.toISOString(),
          },
        });

        await app.close();
      }
    );

    it(
      "returns 404 when the affiliate campaign does not exist",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.get
          .mockResolvedValue(
            null
          );

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
              "GET",

            url:
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}`,
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
              "AFFILIATE_CAMPAIGN_NOT_FOUND",
          },
        });

        await app.close();
      }
    );

    it(
      "creates affiliate metadata using authenticated Admin identity and server disclosure",
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
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}/metadata`,

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          mocks.createMetadata
        ).toHaveBeenCalledWith({
          campaignId:
            CAMPAIGN_ID,

          actorUserId:
            ADMIN_ID,

          disclosure:
            AFFILIATE_DISCLOSURE,

          ...createPayload(),
        });

        await app.close();
      }
    );

    it(
      "updates affiliate metadata using row-version concurrency",
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
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}/metadata`,

            payload: {
              ...createPayload(),

              expectedRowVersion:
                "1",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.updateMetadata
        ).toHaveBeenCalledWith({
          campaignId:
            CAMPAIGN_ID,

          actorUserId:
            ADMIN_ID,

          expectedRowVersion:
            "1",

          disclosure:
            AFFILIATE_DISCLOSURE,

          ...createPayload(),
        });

        await app.close();
      }
    );

    it(
      "rejects client-supplied protected fields",
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
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}/metadata`,

            payload: {
              ...createPayload(),

              actorUserId:
                "00000000-0000-4000-8000-000000000999",

              disclosure:
                "Sponsored",

              rowVersion:
                "99",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.createMetadata
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects metadata mutation without campaign-management permission",
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
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}/metadata`,

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.createMetadata
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps affiliate row-version conflicts to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.updateMetadata
          .mockRejectedValue(
            new AffiliateError(
              "AFFILIATE_METADATA_VERSION_CONFLICT",
              "The affiliate metadata was updated by another operation. Refresh and try again."
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
              `/api/v1/admin/monetization/affiliates/${CAMPAIGN_ID}/metadata`,

            payload: {
              ...createPayload(),

              expectedRowVersion:
                "1",
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
              "AFFILIATE_METADATA_VERSION_CONFLICT",
          },
        });

        await app.close();
      }
    );
  }
);