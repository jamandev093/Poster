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
  AdminContentService,
} from "./src/application/content-sources/index.js";

import type {
  AuthorizationContextService,
} from "./src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "./src/domains/authorization/authorization.types.js";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const SOURCE_ID =
  "00000000-0000-4000-8000-000000000401";

const CONTENT_RECORD = {
  id:
    CONTENT_ID,

  publicId:
    "CNT-2003",

  sourceId:
    SOURCE_ID,

  title:
    "AI agents are changing software workflows",

  publisherName:
    "Example Tech",

  originalUrl:
    "https://example.com/ai-agents-workflows",

  acquisitionMethod:
    "rss" as const,

  status:
    "active" as const,

  publishedAt:
    new Date(
      "2026-07-19T00:00:00.000Z"
    ),

  addedAt:
    new Date(
      "2026-07-19T08:40:00.000Z"
    ),

  removedAt:
    null,

  removalReason:
    null,

  removalNote:
    null,

  copyrightCaseId:
    null,

  copyrightClaimant:
    null,

  preventReimport:
    false,

  createdAt:
    new Date(
      "2026-07-19T08:40:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-07-19T08:40:00.000Z"
    ),

  rowVersion:
    "1",
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
    "content.read",
    "content.manage",
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

function createContentService() {
  const list =
    vi.fn<
      AdminContentService[
        "list"
      ]
    >()
      .mockResolvedValue([
        CONTENT_RECORD,
      ]);

  const getById =
    vi.fn<
      AdminContentService[
        "getById"
      ]
    >()
      .mockResolvedValue({
        record:
          CONTENT_RECORD,

        audit:
          [],
      });

  const remove =
    vi.fn<
      AdminContentService[
        "remove"
      ]
    >()
      .mockResolvedValue({
        record: {
          ...CONTENT_RECORD,

          status:
            "removed",

          removedAt:
            new Date(
              "2026-08-01T08:30:00.000Z"
            ),

          removalReason:
            "copyright",

          removalNote:
            "Rights-holder request.",

          copyrightCaseId:
            "CR-1001",

          copyrightClaimant:
            "BBC",

          preventReimport:
            true,

          updatedAt:
            new Date(
              "2026-08-01T08:30:00.000Z"
            ),

          rowVersion:
            "2",
        },

        audit:
          [],
      });

  const restore =
    vi.fn<
      AdminContentService[
        "restore"
      ]
    >()
      .mockResolvedValue({
        record:
          CONTENT_RECORD,

        audit:
          [],
      });

  return {
    list,
    getById,
    remove,
    restore,

    service: {
      list,
      getById,
      remove,
      restore,
    } satisfies AdminContentService,
  };
}

describe(
  "Poster Admin Content HTTP routes",
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
      "returns authoritative content to an authorized Admin",
      async () => {
        const content =
          createContentService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "content.read",
              ]),

            adminContentService:
              content.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/content",

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
          response.json().records
        ).toHaveLength(
          1
        );

        expect(
          response.json().records[0]
        ).toMatchObject({
          publicId:
            "CNT-2003",

          publisherName:
            "Example Tech",

          status:
            "active",

          rowVersion:
            "1",
        });

        expect(
          content.list
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "removes content using the authenticated Admin identity",
      async () => {
        const content =
          createContentService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "content.manage",
              ]),

            adminContentService:
              content.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/content/${CONTENT_ID}/remove`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "1",

              reason:
                "copyright",

              note:
                "Rights-holder request.",

              copyrightCaseId:
                "CR-1001",

              copyrightClaimant:
                "BBC",

              preventReimport:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          content.remove
        ).toHaveBeenCalledWith({
          contentId:
            CONTENT_ID,

          expectedRowVersion:
            "1",

          reason:
            "copyright",

          note:
            "Rights-holder request.",

          copyrightCaseId:
            "CR-1001",

          copyrightClaimant:
            "BBC",

          preventReimport:
            true,

          actorUserId:
            BASE_CONTEXT.userId,

          actorLabel:
            BASE_CONTEXT.fullName,
        });
      }
    );

    it(
      "rejects copyright removal without claimant verification fields",
      async () => {
        const content =
          createContentService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "content.manage",
              ]),

            adminContentService:
              content.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/content/${CONTENT_ID}/remove`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "1",

              reason:
                "copyright",

              preventReimport:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          content.remove
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects content mutation without content.manage",
      async () => {
        const content =
          createContentService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "content.read",
              ]),

            adminContentService:
              content.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/content/${CONTENT_ID}/restore`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "2",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          content.restore
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects unauthenticated content access",
      async () => {
        const content =
          createContentService();

        app =
          await buildApp({
            adminContentService:
              content.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/content",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          content.list
        ).not.toHaveBeenCalled();
      }
    );
  }
);