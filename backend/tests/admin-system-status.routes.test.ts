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
  AdminSystemStatusService,
  AdminSystemStatusSnapshot,
} from "../src/application/system-status/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/index.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

import {
  adminSystemStatusRoutes,
} from "../src/routes/admin-system-status.routes.js";

const ADMIN_USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000102";

const GENERATED_AT =
  new Date(
    "2026-08-01T14:30:00.000Z"
  );

const DATABASE_CHECKED_AT =
  new Date(
    "2026-08-01T14:29:59.950Z"
  );

const SNAPSHOT:
  AdminSystemStatusSnapshot = {
  generatedAt:
    GENERATED_AT,

  environment:
    "test",

  summary: {
    total:
      7,

    operational:
      3,

    degraded:
      0,

    unavailable:
      0,

    notConnected:
      4,
  },

  groups: [
    {
      key:
        "core_services",

      title:
        "Core services",

      description:
        "Essential application and persistence services.",

      services: [
        {
          key:
            "admin_ui",

          name:
            "Admin UI",

          area:
            "Operations",

          status:
            "healthy",

          statusLabel:
            "Healthy",

          description:
            "The Admin interface loaded the protected System Status workspace.",

          checkedAt:
            GENERATED_AT,

          latencyMilliseconds:
            null,

          metadata:
            {},
        },

        {
          key:
            "backend_api",

          name:
            "Backend API",

          area:
            "Application service",

          status:
            "healthy",

          statusLabel:
            "Healthy",

          description:
            "The protected request was served successfully.",

          checkedAt:
            GENERATED_AT,

          latencyMilliseconds:
            null,

          metadata: {
            service:
              "poster-backend",
          },
        },

        {
          key:
            "postgresql",

          name:
            "PostgreSQL Database",

          area:
            "Persistence",

          status:
            "healthy",

          statusLabel:
            "Healthy",

          description:
            "The PostgreSQL health check completed successfully.",

          checkedAt:
            DATABASE_CHECKED_AT,

          latencyMilliseconds:
            24,

          metadata: {
            databaseName:
              "poster",

            currentSchema:
              "app",

            serverVersion:
              "17.5",
          },
        },
      ],
    },

    {
      key:
        "content_ingestion",

      title:
        "Content ingestion",

      description:
        "Permitted external content services.",

      services: [
        {
          key:
            "provider_apis",

          name:
            "Provider APIs",

          area:
            "External integrations",

          status:
            "not_connected",

          statusLabel:
            "Not connected",

          description:
            "No authoritative health probe is connected yet.",

          checkedAt:
            null,

          latencyMilliseconds:
            null,

          metadata:
            {},
        },

        {
          key:
            "rss_ingestion",

          name:
            "RSS Ingestion",

          area:
            "Feed synchronization",

          status:
            "not_connected",

          statusLabel:
            "Not connected",

          description:
            "No authoritative health probe is connected yet.",

          checkedAt:
            null,

          latencyMilliseconds:
            null,

          metadata:
            {},
        },
      ],
    },

    {
      key:
        "intelligence_communication",

      title:
        "Intelligence & communication",

      description:
        "Intelligence and communication services.",

      services: [
        {
          key:
            "ai_services",

          name:
            "AI Services",

          area:
            "Intelligence",

          status:
            "not_connected",

          statusLabel:
            "Not connected",

          description:
            "No authoritative health probe is connected yet.",

          checkedAt:
            null,

          latencyMilliseconds:
            null,

          metadata:
            {},
        },

        {
          key:
            "email_notifications",

          name:
            "Email Notifications",

          area:
            "Communication",

          status:
            "not_connected",

          statusLabel:
            "Not connected",

          description:
            "No authoritative health probe is connected yet.",

          checkedAt:
            null,

          latencyMilliseconds:
            null,

          metadata:
            {},
        },
      ],
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
  const getSnapshot =
    vi.fn()
      .mockResolvedValue(
        SNAPSHOT
      );

  return {
    getSnapshot,

    service: {
      getSnapshot,
    } as
      AdminSystemStatusService,
  };
}

async function buildTestApp(
  service:
    AdminSystemStatusService,
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
    adminSystemStatusRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Poster Admin System Status HTTP route",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns serialized authoritative health to an authorized Admin",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "system.status.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/system-status",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const body =
          response.json();

        expect(
          body.generatedAt
        ).toBe(
          GENERATED_AT
            .toISOString()
        );

        expect(
          body.environment
        ).toBe(
          "test"
        );

        expect(
          body.summary
        ).toEqual({
          total:
            7,

          operational:
            3,

          degraded:
            0,

          unavailable:
            0,

          notConnected:
            4,
        });

        expect(
          body.groups[0]
            .services[2]
        ).toMatchObject({
          key:
            "postgresql",

          status:
            "healthy",

          checkedAt:
            DATABASE_CHECKED_AT
              .toISOString(),

          latencyMilliseconds:
            24,

          metadata: {
            databaseName:
              "poster",

            currentSchema:
              "app",

            serverVersion:
              "17.5",
          },
        });

        expect(
          body.groups[1]
            .services[0]
        ).toMatchObject({
          key:
            "provider_apis",

          status:
            "not_connected",

          checkedAt:
            null,

          latencyMilliseconds:
            null,
        });

        expect(
          mocks.getSnapshot
        ).toHaveBeenCalledTimes(
          1
        );

        await app.close();
      }
    );

    it(
      "rejects an unauthenticated request",
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
              "/api/v1/admin/system-status",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          mocks.getSnapshot
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects an Admin without system.status.read",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "dashboard.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/system-status",
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.getSnapshot
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "does not expose database credentials or authenticated usernames",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "system.status.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/system-status",
          });

        const serialized =
          response.body;

        expect(
          serialized
        ).not.toContain(
          "poster_app"
        );

        expect(
          serialized
        ).not.toContain(
          "connectionString"
        );

        expect(
          serialized
        ).not.toContain(
          "password"
        );

        await app.close();
      }
    );
  }
);