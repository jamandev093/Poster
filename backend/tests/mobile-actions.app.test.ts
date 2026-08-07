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
  MobileUserActionsService,
} from "../src/application/mobile-actions/index.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000201";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000301";

const AUTHORIZATION_CONTEXT:
  AuthorizationContext = {
  userId:
    USER_ID,

  sessionId:
    SESSION_ID,

  email:
    "reader@example.com",

  fullName:
    "Poster Reader",

  accountStatus:
    "active",

  platformRoles:
    [],

  platformPermissions:
    [],

  organizationMemberships:
    [],
};

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue(
          AUTHORIZATION_CONTEXT
        ),
  };
}

function createMobileUserActionsService():
  MobileUserActionsService {
  return {
    listBookmarks:
      vi.fn()
        .mockResolvedValue(
          []
        ),

    getInteractionState:
      vi.fn()
        .mockResolvedValue({
          bookmarkedIds:
            [],

          recommendedIds:
            [],

          helpfulIds:
            [],
        }),

    toggleBookmark:
      vi.fn()
        .mockResolvedValue({
          contentId:
            CONTENT_ID,

          bookmarked:
            true,
        }),

    markWorthReading:
      vi.fn()
        .mockResolvedValue({
          interactionType:
            "worth_reading",

          created:
            true,
        }),

    markHelpful:
      vi.fn()
        .mockResolvedValue({
          interactionType:
            "helpful",

          created:
            true,
        }),

    submitFeedback:
      vi.fn()
        .mockResolvedValue({
          success:
            true,

          duplicate:
            false,
        }),
  };
}

describe(
  "Mobile actions app wiring",
  () => {
    let app:
      FastifyInstance |
      undefined;

    afterEach(
      async () => {
        await app?.close();

        app =
          undefined;
      }
    );

    it(
      "registers Mobile action routes in the main app behind auth context",
      async () => {
        const authorizationContextService =
          createAuthorizationContextService();

        const mobileUserActionsService =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService,

            mobileUserActionsService,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/actions/state",

            headers: {
              authorization:
                "Bearer valid.mobile",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          authorizationContextService.resolve
        ).toHaveBeenCalledWith(
          "valid.mobile"
        );

        expect(
          mobileUserActionsService
            .getInteractionState
        ).toHaveBeenCalledWith(
          USER_ID
        );

        expect(
          response.json()
        ).toEqual({
          bookmarkedIds:
            [],

          recommendedIds:
            [],

          helpfulIds:
            [],
        });
      }
    );
  }
);
