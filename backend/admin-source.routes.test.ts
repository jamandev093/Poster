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
} from "./src/app.js";

import type {
  AdminSourceService,
} from "./src/application/content-sources/index.js";

import type {
  AuthorizationContextService,
} from "./src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "./src/domains/authorization/authorization.types.js";

const SOURCE_ID =
  "00000000-0000-4000-8000-000000000401";

const SOURCE_RECORD = {
  id:
    SOURCE_ID,

  publicId:
    "SRC-1001",

  name:
    "Reuters",

  websiteUrl:
    "https://www.reuters.com",

  acquisitionMethod:
    "api" as const,

  status:
    "active" as const,

  health:
    "healthy" as const,

  displayPolicy:
    "Use provider-permitted API preview fields.",

  operationalNote:
    null,

  lastSyncAt:
    new Date(
      "2026-08-01T08:20:00.000Z"
    ),

  lastSyncError:
    null,

  createdAt:
    new Date(
      "2026-07-19T08:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-01T08:20:00.000Z"
    ),

  pausedAt:
    null,

  blockedAt:
    null,

  rowVersion:
    "1",

  activeContentCount:
    3240,
};

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
    "sources.read",
    "sources.manage",
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

function createSourceService() {
  const list =
    vi.fn<
      AdminSourceService[
        "list"
      ]
    >()
      .mockResolvedValue([
        SOURCE_RECORD,
      ]);

  const getById =
    vi.fn<
      AdminSourceService[
        "getById"
      ]
    >()
      .mockResolvedValue({
        source:
          SOURCE_RECORD,

        audit: [
          {
            id:
              "00000000-0000-4000-8000-000000000601",

            entityType:
              "source",

            sourceId:
              SOURCE_ID,

            contentId:
              null,

            action:
              "Source sync completed successfully",

            actorUserId:
              null,

            actorLabel:
              "System",

            metadata:
              {},

            occurredAt:
              new Date(
                "2026-08-01T08:20:00.000Z"
              ),
          },
        ],
      });

  const pause =
    vi.fn<
      AdminSourceService[
        "pause"
      ]
    >()
      .mockResolvedValue({
        ...SOURCE_RECORD,

        status:
          "paused",

        pausedAt:
          new Date(
            "2026-08-01T08:30:00.000Z"
          ),

        rowVersion:
          "2",
      });

  const enable =
    vi.fn<
      AdminSourceService[
        "enable"
      ]
    >()
      .mockResolvedValue(
        SOURCE_RECORD
      );

  const unblock =
    vi.fn<
      AdminSourceService[
        "unblock"
      ]
    >()
      .mockResolvedValue(
        SOURCE_RECORD
      );

  const block =
    vi.fn<
      AdminSourceService[
        "block"
      ]
    >()
      .mockResolvedValue({
        ...SOURCE_RECORD,

        status:
          "blocked",

        blockedAt:
          new Date(
            "2026-08-01T08:30:00.000Z"
          ),

        rowVersion:
          "2",
      });

  return {
    list,
    getById,
    pause,
    enable,
    unblock,
    block,

    service: {
      list,
      getById,
      pause,
      enable,
      unblock,
      block,
    } satisfies AdminSourceService,
  };
}

describe(
  "Poster Admin Source HTTP routes",
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
      "returns authoritative sources to an authorized Admin",
      async () => {
        const sources =
          createSourceService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "sources.read",
              ]),

            adminSourceService:
              sources.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/sources",

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
          response.json().sources
        ).toHaveLength(
          1
        );

        expect(
          response.json().sources[0]
        ).toMatchObject({
          publicId:
            "SRC-1001",

          name:
            "Reuters",

          status:
            "active",

          activeContentCount:
            3240,
        });
      }
    );

    it(
      "pauses a source using the authenticated Admin identity",
      async () => {
        const sources =
          createSourceService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "sources.manage",
              ]),

            adminSourceService:
              sources.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/sources/${SOURCE_ID}/pause`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
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
          sources.pause
        ).toHaveBeenCalledWith({
          sourceId:
            SOURCE_ID,

          expectedRowVersion:
            "1",

          actorUserId:
            BASE_CONTEXT.userId,

          actorLabel:
            BASE_CONTEXT.fullName,
        });
      }
    );

    it(
      "blocks a source and forwards the existing-content decision",
      async () => {
        const sources =
          createSourceService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "sources.manage",
              ]),

            adminSourceService:
              sources.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/sources/${SOURCE_ID}/block`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "1",

              removeExistingContent:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          sources.block
        ).toHaveBeenCalledWith({
          sourceId:
            SOURCE_ID,

          expectedRowVersion:
            "1",

          removeExistingContent:
            true,

          actorUserId:
            BASE_CONTEXT.userId,

          actorLabel:
            BASE_CONTEXT.fullName,
        });
      }
    );

    it(
      "rejects source mutation without sources.manage",
      async () => {
        const sources =
          createSourceService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "sources.read",
              ]),

            adminSourceService:
              sources.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/sources/${SOURCE_ID}/pause`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "1",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          sources.pause
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects unauthenticated source access",
      async () => {
        const sources =
          createSourceService();

        app =
          await buildApp({
            adminSourceService:
              sources.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/sources",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          sources.list
        ).not.toHaveBeenCalled();
      }
    );
  }
);