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
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/authorization.types.js";

const AUTHORIZED_CONTEXT:
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
    "content.read",
    "content.manage",
    "sources.read",
    "sources.manage",
    "reports.read",
    "reports.manage",
    "copyright.read",
    "copyright.manage",
    "audit.read",
  ],

  organizationMemberships:
    [],
};

function createAuthorizationContextService(
  context:
    AuthorizationContext
) {
  const resolveMock =
    vi.fn<
      AuthorizationContextService[
        "resolve"
      ]
    >();

  resolveMock
    .mockResolvedValue(
      context
    );

  const service:
    AuthorizationContextService = {
    resolve:
      resolveMock,
  };

  return {
    resolveMock,

    service,
  };
}

describe(
  "Poster Admin access authorization",
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
      "returns the authenticated Admin access context",
      async () => {
        const context =
          createAuthorizationContextService(
            AUTHORIZED_CONTEXT
          );

        app =
          await buildApp({
            authorizationContextService:
              context.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/access",

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
          context.resolveMock
        ).toHaveBeenCalledWith(
          "payload.signature"
        );

        expect(
          response.json()
        ).toEqual({
          account: {
            id:
              AUTHORIZED_CONTEXT.userId,

            email:
              AUTHORIZED_CONTEXT.email,

            fullName:
              AUTHORIZED_CONTEXT.fullName,

            status:
              "active",
          },

          access: {
            sessionId:
              AUTHORIZED_CONTEXT.sessionId,

            platformRoles: [
              "operations_admin",
            ],

            platformPermissions:
              AUTHORIZED_CONTEXT
                .platformPermissions,
          },

          organizations:
            [],
        });
      }
    );

    it(
      "requires authentication before entering Admin",
      async () => {
        const context =
          createAuthorizationContextService(
            AUTHORIZED_CONTEXT
          );

        app =
          await buildApp({
            authorizationContextService:
              context.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/access",
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

            message:
              "Authentication is required.",
          },
        });

        expect(
          context.resolveMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an authenticated identity without Admin permission",
      async () => {
        const context =
          createAuthorizationContextService({
            ...AUTHORIZED_CONTEXT,

            platformRoles:
              [],

            platformPermissions:
              [],
          });

        app =
          await buildApp({
            authorizationContextService:
              context.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/access",

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

            message:
              "You do not have permission to perform this action.",
          },
        });
      }
    );

    it(
      "rejects a malformed bearer header before resolving context",
      async () => {
        const context =
          createAuthorizationContextService(
            AUTHORIZED_CONTEXT
          );

        app =
          await buildApp({
            authorizationContextService:
              context.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/access",

            headers: {
              authorization:
                "Basic invalid",
            },
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
              "AUTH_ACCESS_TOKEN_INVALID",
          },
        });

        expect(
          context.resolveMock
        ).not.toHaveBeenCalled();
      }
    );
  }
);