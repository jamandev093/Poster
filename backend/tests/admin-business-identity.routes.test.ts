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
  BusinessIdentityError,
  type AdminBusinessIdentityService,
} from "../src/application/business-identity/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import type {
  BusinessIdentityRecord,
} from "../src/domains/business-identity/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminBusinessIdentityRoutes,
} from "../src/routes/admin-business-identity.routes.js";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T15:30:00.000Z"
  );

const IDENTITY:
  BusinessIdentityRecord = {
  key:
    "official",

  publicBrandName:
    "Poster",

  legalBusinessName:
    null,

  websiteUrl:
    "https://getpostar.com",

  officialBusinessEmail:
    "hello@getpostar.com",

  supportEmail:
    "hello@getpostar.com",

  publisherRelationsEmail:
    "publishers@getpostar.com",

  advertisingEmail:
    "ads@getpostar.com",

  copyrightEmail:
    "copyright@getpostar.com",

  signalUrl:
    "https://signal.me/#example",

  signalLabel:
    "Contact Poster on Signal",

  copyrightPortalUrl:
    "https://copyright.getpostar.com",

  clientPortalUrl:
    "https://client.getpostar.com",

  socialLinks:
    {},

  updatedByUserId:
    ADMIN_ID,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "2",
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
    publicBrandName:
      "Poster",

    legalBusinessName:
      null,

    websiteUrl:
      "https://getpostar.com",

    officialBusinessEmail:
      "hello@getpostar.com",

    supportEmail:
      "hello@getpostar.com",

    publisherRelationsEmail:
      "publishers@getpostar.com",

    advertisingEmail:
      "ads@getpostar.com",

    copyrightEmail:
      "copyright@getpostar.com",

    signalUrl:
      "https://signal.me/#example",

    signalLabel:
      "Contact Poster on Signal",

    copyrightPortalUrl:
      "https://copyright.getpostar.com",

    clientPortalUrl:
      "https://client.getpostar.com",

    socialLinks:
      {},

    expectedRowVersion:
      "2",
  };
}

function createServiceMocks() {
  const getOfficial =
    vi.fn()
      .mockResolvedValue(
        IDENTITY
      );

  const updateOfficial =
    vi.fn()
      .mockResolvedValue(
        IDENTITY
      );

  const service = {
    getOfficial,
    updateOfficial,
  } satisfies
    AdminBusinessIdentityService;

  return {
    getOfficial,
    updateOfficial,
    service,
  };
}

async function buildApp(
  service:
    AdminBusinessIdentityService,
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
    adminBusinessIdentityRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Admin Business Identity HTTP routes",
  () => {
    it(
      "returns the official business identity to an authorized Admin",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "operations.business_identity.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/operations/business-identity",
          });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.json()
        ).toMatchObject({
          identity: {
            key:
              "official",

            officialBusinessEmail:
              "hello@getpostar.com",

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
      "updates the official business identity using the authenticated Admin identity",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "operations.business_identity.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/admin/operations/business-identity",

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          mocks.updateOfficial
        ).toHaveBeenCalledWith({
          actorUserId:
            ADMIN_ID,

          ...createPayload(),
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
              "operations.business_identity.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/admin/operations/business-identity",

            payload: {
              ...createPayload(),

              updatedByUserId:
                "00000000-0000-4000-8000-000000000999",

              rowVersion:
                "99",
            },
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          mocks.updateOfficial
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects updates without business identity management permission",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "operations.business_identity.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/admin/operations/business-identity",

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(403);

        expect(
          mocks.updateOfficial
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps row-version conflicts to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.updateOfficial
          .mockRejectedValue(
            new BusinessIdentityError({
              code:
                "BUSINESS_IDENTITY_VERSION_CONFLICT",

              message:
                "The official business identity was changed by another admin. Refresh and try again.",

              statusCode:
                409,
            })
          );

        const app =
          await buildApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "operations.business_identity.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/admin/operations/business-identity",

            payload:
              createPayload(),
          });

        expect(
          response.statusCode
        ).toBe(409);

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "BUSINESS_IDENTITY_VERSION_CONFLICT",
          },
        });

        await app.close();
      }
    );
  }
);