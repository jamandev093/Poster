import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  mobileDiscoveryRoutes,
} from "../src/routes/mobile-discovery.routes.js";

import type {
  MobileDiscoveryFeedResponse,
  MobileDiscoveryService,
} from "../src/application/mobile-discovery/index.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/authorization.types.js";

import {
  registerErrorHandler,
} from "../src/plugins/error-handler.js";

const AUTHORIZATION_CONTEXT:
  AuthorizationContext = {
  userId:
    "00000000-0000-4000-8000-000000001001",

  sessionId:
    "00000000-0000-4000-8000-000000001002",

  email:
    "mobile@example.com",

  fullName:
    "Mobile User",

  accountStatus:
    "active",

  platformRoles:
    [],

  platformPermissions:
    [],

  organizationMemberships:
    [],
};

function createResponse(
  surface:
    MobileDiscoveryFeedResponse[
      "surface"
    ]
): MobileDiscoveryFeedResponse {
  return {
    surface,

    items:
      [],

    adSlots:
      [],

    pagination: {
      nextCursor:
        null,

      hasMore:
        false,

      refreshAfterSeconds:
        surface === "trending"
          ? 60
          : surface === "search"
            ? 180
            : 90,

      refreshMode:
        "initial",
    },

    searchEngine: {
      engine:
        "postgres_full_text",

      query:
        null,

      fullTextEnabled:
        true,

      semanticSearchReady:
        true,

      publisherSearchReady:
        true,

      topicSearchReady:
        true,

      committedQueryRequiredForTaxonomyMutation:
        true,
    },

    recommendation: {
      organicRankingFirst:
        true,

      personalizationReady:
        true,

      sourceDiversityReady:
        true,

      negativeFeedbackReady:
        true,

      repeatedExposureControlReady:
        true,

      monetizationInsertedAfterOrganicRanking:
        true,
    },

    aiHandoff: {
      apiBackendLanguage:
        "typescript",

      aiServiceLanguage:
        "python",

      classificationReady:
        true,

      embeddingsReady:
        true,

      semanticDeduplicationReady:
        true,

      rankingAssistReady:
        true,

      trendIntelligenceReady:
        true,
    },

    generatedAt:
      "2026-08-07T12:00:00.000Z",
  };
}

function createService():
  MobileDiscoveryService {
  return {
    listFeed:
      vi.fn(
        async (
          input
        ) =>
          createResponse(
            input.surface
          )
      ),
  };
}

async function createRouteApp(
  input: {
    authenticated: boolean;

    service: MobileDiscoveryService;
  }
): Promise<FastifyInstance> {
  const app =
    Fastify({
      logger:
        false,
    });

  registerErrorHandler(
    app
  );

  if (
    input.authenticated
  ) {
    app.addHook(
      "onRequest",
      async (
        request:
          FastifyRequest
      ) => {
        request.authorizationContext =
          AUTHORIZATION_CONTEXT;
      }
    );
  }

  await app.register(
    mobileDiscoveryRoutes,
    {
      prefix:
        "/api/v1/mobile",

      service:
        input.service,
    }
  );

  return app;
}

describe(
  "Mobile discovery routes",
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
      "serves authenticated Home infinite feed route",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              true,

            service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/feed/home?limit=12&languageCode=en&regionCode=IN",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toMatchObject({
          surface:
            "home",

          pagination: {
            refreshAfterSeconds:
              90,
          },

          recommendation: {
            organicRankingFirst:
              true,

            monetizationInsertedAfterOrganicRanking:
              true,
          },

          aiHandoff: {
            apiBackendLanguage:
              "typescript",

            aiServiceLanguage:
              "python",
          },
        });

        expect(
          service.listFeed
        ).toHaveBeenCalledWith({
          surface:
            "home",

          query:
            null,

          category:
            null,

          languageCode:
            "en",

          regionCode:
            "IN",

          limit:
            12,

          cursor:
            null,

          refreshMode:
            null,
        });
      }
    );

    it(
      "serves authenticated Trending infinite feed route",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              true,

            service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/feed/trending?category=technology&refreshMode=refresh&limit=20",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          service.listFeed
        ).toHaveBeenCalledWith({
          surface:
            "trending",

          query:
            null,

          category:
            "technology",

          languageCode:
            null,

          regionCode:
            null,

          limit:
            20,

          cursor:
            null,

          refreshMode:
            "refresh",
        });
      }
    );

    it(
      "serves authenticated Search route with query and cursor params",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              true,

            service,
          });

        const cursor =
          encodeURIComponent(
            JSON.stringify({
              surface:
                "search",

              score:
                "0.810000",

              discoveredAt:
                "2026-08-07T11:00:00.000Z",

              id:
                "00000000-0000-4000-8000-000000000901",
            })
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              `/api/v1/mobile/search?query=artificial%20intelligence&cursor=${cursor}&refreshMode=older`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          service.listFeed
        ).toHaveBeenCalledWith({
          surface:
            "search",

          query:
            "artificial intelligence",

          category:
            null,

          languageCode:
            null,

          regionCode:
            null,

          limit:
            null,

          cursor:
            JSON.stringify({
              surface:
                "search",

              score:
                "0.810000",

              discoveredAt:
                "2026-08-07T11:00:00.000Z",

              id:
                "00000000-0000-4000-8000-000000000901",
            }),

          refreshMode:
            "older",
        });
      }
    );

    it(
      "requires authentication for Mobile discovery routes",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              false,

            service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/feed/home",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          service.listFeed
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_REQUIRED",
          },
        });
      }
    );

    it(
      "rejects invalid route query params before service execution",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              true,

            service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/search?limit=500",
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          service.listFeed
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "REQUEST_VALIDATION_FAILED",
          },
        });
      }
    );
  }
);
