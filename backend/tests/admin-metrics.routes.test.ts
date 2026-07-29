import type {
  FastifyInstance,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AdminUserMetricsService,
} from "../src/application/admin-metrics/admin-user-metrics.service.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/authorization.types.js";

const GENERATED_AT =
  new Date(
    "2026-07-29T06:00:00.000Z"
  );

const BASE_CONTEXT:
  AuthorizationContext = {
  userId:
    "00000000-0000-4000-8000-000000000101",

  sessionId:
    "00000000-0000-4000-8000-000000000201",

  email:
    "admin@getpostar.com",

  fullName:
    "Poster Admin",

  accountStatus:
    "active",

  platformRoles: [
    "operations_admin",
  ],

  platformPermissions: [
    "admin.access",
    "dashboard.read",
    "users.metrics.read",
  ],

  organizationMemberships:
    [],
};

function createAuthorizationContextService(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue({
          ...BASE_CONTEXT,

          platformPermissions:
            permissions,
        }),
  };
}

function createUserMetricsService() {
  const getSnapshot =
    vi.fn<
      AdminUserMetricsService[
        "getSnapshot"
      ]
    >();

  getSnapshot
    .mockResolvedValue({
      totalUsers:
        8250,

      dailyActiveUsers:
        1420,

      monthlyActiveUsers:
        6780,

      liveActiveUsers:
        184,

      generatedAt:
        GENERATED_AT,

      windows: {
        dailyActiveHours:
          24,

        monthlyActiveDays:
          30,

        liveActiveMinutes:
          5,
      },
    });

  const service:
    AdminUserMetricsService = {
    getSnapshot,
  };

  return {
    getSnapshot,

    service,
  };
}

describe(
  "Poster Admin metrics HTTP routes",
  () => {
    let app:
      FastifyInstance |
      null =
        null;

    afterEach(
      async () => {
        if (
          app
        ) {
          await app.close();

          app =
            null;
        }
      }
    );

    it(
      "returns protected user metrics to an authorized Admin",
      async () => {
        const metrics =
          createUserMetricsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "users.metrics.read",
              ]),

            adminUserMetricsService:
              metrics.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/metrics",

            headers: {
              authorization:
                "Bearer payload.signature",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toEqual({
          generatedAt:
            "2026-07-29T06:00:00.000Z",

          windows: {
            dailyActiveHours:
              24,

            monthlyActiveDays:
              30,

            liveActiveMinutes:
              5,
          },

          metrics: {
            totalUsers:
              8250,

            dailyActiveUsers:
              1420,

            monthlyActiveUsers:
              6780,

            liveActiveUsers:
              184,
          },
        });

        expect(
          metrics.getSnapshot
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "returns the compact dashboard summary with dashboard permission",
      async () => {
        const metrics =
          createUserMetricsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "dashboard.read",
              ]),

            adminUserMetricsService:
              metrics.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/dashboard/summary",

            headers: {
              authorization:
                "Bearer payload.signature",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toEqual({
          generatedAt:
            "2026-07-29T06:00:00.000Z",

          users: {
            windows: {
              dailyActiveHours:
                24,

              monthlyActiveDays:
                30,

              liveActiveMinutes:
                5,
            },

            metrics: {
              totalUsers:
                8250,

              dailyActiveUsers:
                1420,

              monthlyActiveUsers:
                6780,

              liveActiveUsers:
                184,
            },
          },
        });
      }
    );

    it(
      "requires authentication before reading user metrics",
      async () => {
        const metrics =
          createUserMetricsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "users.metrics.read",
              ]),

            adminUserMetricsService:
              metrics.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/metrics",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_REQUIRED",
          },
        });

        expect(
          metrics.getSnapshot
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an Admin without the required metrics permission",
      async () => {
        const metrics =
          createUserMetricsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
              ]),

            adminUserMetricsService:
              metrics.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/metrics",

            headers: {
              authorization:
                "Bearer payload.signature",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_FORBIDDEN",
          },
        });

        expect(
          metrics.getSnapshot
        ).not.toHaveBeenCalled();
      }
    );
  }
);