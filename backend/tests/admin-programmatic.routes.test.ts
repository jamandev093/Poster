import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AdminProgrammaticOverview,
  AdminProgrammaticService,
} from "../src/application/monetization/index.js";

import {
  ProgrammaticError,
} from "../src/application/monetization/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminProgrammaticRoutes,
} from "../src/routes/admin-programmatic.routes.js";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const PROVIDER_ID =
  "00000000-0000-4000-8000-000000001701";

const MAPPING_ID =
  "00000000-0000-4000-8000-000000001702";

const NOW =
  new Date(
    "2026-08-02T14:30:00.000Z"
  );

const OVERVIEW:
  AdminProgrammaticOverview = {
  providers: [
    {
      id:
        PROVIDER_ID,

      providerKey:
        "google_ad_manager",

      displayName:
        "Google Ad Manager",

      status:
        "disabled",

      healthStatus:
        "unknown",

      notes:
        null,

      createdAt:
        NOW,

      updatedAt:
        NOW,

      rowVersion:
        "1",
    },
  ],

  slotMappings: [
    {
      id:
        MAPPING_ID,

      providerId:
        PROVIDER_ID,

      screen:
        "home",

      placement:
        "home_sponsored_card",

      frame:
        "full_width_sponsored_card",

      status:
        "disabled",

      safetyRules:
        {},

      regionRules:
        {},

      deviceRules:
        {},

      frequencyRules:
        {},

      fallbackRules:
        {},

      createdAt:
        NOW,

      updatedAt:
        NOW,

      rowVersion:
        "1",
    },
  ],
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

function createProviderPayload() {
  return {
    providerKey:
      "google_ad_manager",

    displayName:
      "Google Ad Manager",

    status:
      "disabled" as const,

    healthStatus:
      "unknown" as const,

    notes:
      null,
  };
}

function createSlotMappingPayload() {
  return {
    providerId:
      PROVIDER_ID,

    screen:
      "home" as const,

    placement:
      "home_sponsored_card",

    frame:
      "full_width_sponsored_card" as const,

    status:
      "disabled" as const,

    safetyRules:
      {},

    regionRules:
      {},

    deviceRules:
      {},

    frequencyRules:
      {},

    fallbackRules:
      {},
  };
}

function createServiceMocks() {
  const list =
    vi.fn()
      .mockResolvedValue(
        OVERVIEW
      );

  const createProvider =
    vi.fn()
      .mockResolvedValue(
        OVERVIEW.providers[0]
      );

  const createSlotMapping =
    vi.fn()
      .mockResolvedValue(
        OVERVIEW.slotMappings[0]
      );

  const service = {
    list,
    createProvider,
    createSlotMapping,
  } satisfies
    AdminProgrammaticService;

  return {
    list,
    createProvider,
    createSlotMapping,
    service,
  };
}

async function buildApp(
  service:
    AdminProgrammaticService,
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
    adminProgrammaticRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Admin Programmatic HTTP routes",
  () => {
    it(
      "returns authoritative programmatic overview",
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
              "/api/v1/admin/monetization/programmatic",
          });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.json()
        ).toMatchObject({
          providers: [
            {
              id:
                PROVIDER_ID,

              createdAt:
                NOW.toISOString(),
            },
          ],

          slotMappings: [
            {
              id:
                MAPPING_ID,

              frame:
                "full_width_sponsored_card",

              createdAt:
                NOW.toISOString(),
            },
          ],
        });

        await app.close();
      }
    );

    it(
      "creates providers with authenticated Admin identity",
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
              "/api/v1/admin/monetization/programmatic/providers",

            payload:
              createProviderPayload(),
          });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          mocks.createProvider
        ).toHaveBeenCalledWith({
          actorUserId:
            ADMIN_ID,

          ...createProviderPayload(),
        });

        await app.close();
      }
    );

    it(
      "creates locked slot mappings with authenticated Admin identity",
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
              "/api/v1/admin/monetization/programmatic/slot-mappings",

            payload:
              createSlotMappingPayload(),
          });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          mocks.createSlotMapping
        ).toHaveBeenCalledWith({
          actorUserId:
            ADMIN_ID,

          ...createSlotMappingPayload(),
        });

        await app.close();
      }
    );

    it(
      "rejects protected client-supplied fields",
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
              "/api/v1/admin/monetization/programmatic/providers",

            payload: {
              ...createProviderPayload(),

              actorUserId:
                "00000000-0000-4000-8000-000000000999",

              rowVersion:
                "99",
            },
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          mocks.createProvider
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects provider mutation without campaign-management permission",
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
              "/api/v1/admin/monetization/programmatic/providers",

            payload:
              createProviderPayload(),
          });

        expect(
          response.statusCode
        ).toBe(403);

        expect(
          mocks.createProvider
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps programmatic validation errors to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.createSlotMapping
          .mockRejectedValue(
            new ProgrammaticError(
              "PROGRAMMATIC_SLOT_MAPPING_INVALID",
              "The programmatic slot mapping is invalid.",
              [
                {
                  field:
                    "frame",

                  code:
                    "unsupported",

                  message:
                    "Only existing Poster-approved sponsored frames are allowed.",
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
              "POST",

            url:
              "/api/v1/admin/monetization/programmatic/slot-mappings",

            payload:
              createSlotMappingPayload(),
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "PROGRAMMATIC_SLOT_MAPPING_INVALID",
          },
        });

        await app.close();
      }
    );
  }
);