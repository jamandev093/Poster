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

const SECOND_CONTENT_ID =
  "00000000-0000-4000-8000-000000000302";

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

const ARTICLE_SNAPSHOT = {
  title:
    "Original publisher article",

  summary:
    "A concise summary",

  publisher:
    "Example Publisher",

  publisherUrl:
    "example.com",

  image:
    "",

  publishedAt:
    "2026-08-07T10:00:00.000Z",

  discoveredAt:
    "2026-08-07T11:00:00.000Z",

  category:
    "Technology",

  originalUrl:
    "https://example.com/article",

  verified:
    true,
};

function createAuthorizationContextService(
  context:
    AuthorizationContext |
    null =
    AUTHORIZATION_CONTEXT
): AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue(
          context
        ),
  };
}

function createMobileUserActionsService(): {
  service:
    MobileUserActionsService;

  listBookmarks:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "listBookmarks"
        ]
      >
    >;

  getInteractionState:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "getInteractionState"
        ]
      >
    >;

  toggleBookmark:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "toggleBookmark"
        ]
      >
    >;

  markWorthReading:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "markWorthReading"
        ]
      >
    >;

  markHelpful:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "markHelpful"
        ]
      >
    >;

  submitFeedback:
    ReturnType<
      typeof vi.fn<
        MobileUserActionsService[
          "submitFeedback"
        ]
      >
    >;
} {
  const listBookmarks =
    vi.fn<
      MobileUserActionsService[
        "listBookmarks"
      ]
    >()
      .mockResolvedValue([
        {
          id:
            "bookmark-1",

          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          articleSnapshot:
            ARTICLE_SNAPSHOT,

          createdAt:
            "2026-08-07T12:00:00.000Z",
        },
      ]);

  const getInteractionState =
    vi.fn<
      MobileUserActionsService[
        "getInteractionState"
      ]
    >()
      .mockResolvedValue({
        bookmarkedIds: [
          CONTENT_ID,
        ],

        recommendedIds: [
          CONTENT_ID,
        ],

        helpfulIds: [
          SECOND_CONTENT_ID,
        ],
      });

  const toggleBookmark =
    vi.fn<
      MobileUserActionsService[
        "toggleBookmark"
      ]
    >()
      .mockResolvedValue({
        contentId:
          CONTENT_ID,

        bookmarked:
          true,
      });

  const markWorthReading =
    vi.fn<
      MobileUserActionsService[
        "markWorthReading"
      ]
    >()
      .mockResolvedValue({
        interactionType:
          "worth_reading",

        created:
          true,
      });

  const markHelpful =
    vi.fn<
      MobileUserActionsService[
        "markHelpful"
      ]
    >()
      .mockResolvedValue({
        interactionType:
          "helpful",

        created:
          true,
      });

  const submitFeedback =
    vi.fn<
      MobileUserActionsService[
        "submitFeedback"
      ]
    >()
      .mockResolvedValue({
        success:
          true,

        duplicate:
          false,
      });

  return {
    service: {
      listBookmarks,
      getInteractionState,
      toggleBookmark,
      markWorthReading,
      markHelpful,
      submitFeedback,
    },

    listBookmarks,
    getInteractionState,
    toggleBookmark,
    markWorthReading,
    markHelpful,
    submitFeedback,
  };
}

describe(
  "Mobile user actions routes",
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
      "lists authenticated Mobile bookmarks",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/actions/bookmarks",

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
          response.json()
        ).toEqual({
          bookmarks: [
            {
              id:
                "bookmark-1",

              userId:
                USER_ID,

              contentId:
                CONTENT_ID,

              articleSnapshot:
                ARTICLE_SNAPSHOT,

              createdAt:
                "2026-08-07T12:00:00.000Z",
            },
          ],
        });

        expect(
          actions.listBookmarks
        ).toHaveBeenCalledWith(
          USER_ID
        );
      }
    );

    it(
      "returns authenticated Mobile interaction state",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
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
          response.json()
        ).toEqual({
          bookmarkedIds: [
            CONTENT_ID,
          ],

          recommendedIds: [
            CONTENT_ID,
          ],

          helpfulIds: [
            SECOND_CONTENT_ID,
          ],
        });

        expect(
          actions.getInteractionState
        ).toHaveBeenCalledWith(
          USER_ID
        );
      }
    );

    it(
      "toggles authenticated Mobile bookmarks with an article snapshot",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/bookmarks/toggle",

            headers: {
              authorization:
                "Bearer valid.mobile",

              "content-type":
                "application/json",
            },

            payload: {
              contentId:
                CONTENT_ID,

              articleSnapshot:
                ARTICLE_SNAPSHOT,
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
          contentId:
            CONTENT_ID,

          bookmarked:
            true,
        });

        expect(
          actions.toggleBookmark
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          articleSnapshot:
            ARTICLE_SNAPSHOT,
        });
      }
    );

    it(
      "records worth-reading and helpful actions",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
          });

        const worthReadingResponse =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/worth-reading",

            headers: {
              authorization:
                "Bearer valid.mobile",

              "content-type":
                "application/json",
            },

            payload: {
              contentId:
                CONTENT_ID,
            },
          });

        expect(
          worthReadingResponse.statusCode
        ).toBe(
          200
        );

        expect(
          actions.markWorthReading
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,
        });

        const helpfulResponse =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/helpful",

            headers: {
              authorization:
                "Bearer valid.mobile",

              "content-type":
                "application/json",
            },

            payload: {
              contentId:
                SECOND_CONTENT_ID,
            },
          });

        expect(
          helpfulResponse.statusCode
        ).toBe(
          200
        );

        expect(
          actions.markHelpful
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            SECOND_CONTENT_ID,
        });
      }
    );

    it(
      "submits authenticated article feedback",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/feedback",

            headers: {
              authorization:
                "Bearer valid.mobile",

              "content-type":
                "application/json",
            },

            payload: {
              contentId:
                CONTENT_ID,

              reasonId:
                "misleading",
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
          success:
            true,

          duplicate:
            false,
        });

        expect(
          actions.submitFeedback
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          reasonId:
            "misleading",
        });
      }
    );

    it(
      "rejects unauthenticated Mobile action requests",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(
                null
              ),

            mobileUserActionsService:
              actions.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/actions/state",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          actions.getInteractionState
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects invalid Mobile action payloads before service execution",
      async () => {
        const actions =
          createMobileUserActionsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            mobileUserActionsService:
              actions.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/feedback",

            headers: {
              authorization:
                "Bearer valid.mobile",

              "content-type":
                "application/json",
            },

            payload: {
              contentId:
                "not-a-content-id",

              reasonId:
                "Invalid reason!",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          actions.submitFeedback
        ).not.toHaveBeenCalled();
      }
    );
  }
);
