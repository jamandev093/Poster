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

import {
  mobileDiscoveryRoutes,
} from "../src/routes/mobile-discovery.routes.js";

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
        surface === "home"
          ? "next-home-cursor"
          : surface === "search"
            ? "next-search-cursor"
            : "next-trending-cursor",

      hasMore:
        true,

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
        surface === "search"
          ? "contract query"
          : null,

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
      "2026-08-08T05:30:00.000Z",
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
    authenticated:
      boolean;

    service:
      MobileDiscoveryService;
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
        (
          request as FastifyRequest & {
            authorizationContext?:
              AuthorizationContext;
          }
        ).authorizationContext =
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
  "Mobile discovery route contract",
  () => {
    let app:
      FastifyInstance | null =
        null;

    afterEach(
      async () => {
        if (app) {
          await app.close();
          app = null;
        }
      }
    );

    it(
      "preserves Home feed query, pagination, and refresh contract",
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
              "/api/v1/mobile/feed/home?category=technology&languageCode=en&regionCode=IN&limit=50&cursor=home-cursor&refreshMode=older",
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
            "home",

          query:
            null,

          category:
            "technology",

          languageCode:
            "en",

          regionCode:
            "IN",

          limit:
            50,

          cursor:
            "home-cursor",

          refreshMode:
            "older",
        });

        expect(
          response.json()
        ).toMatchObject({
          surface:
            "home",

          pagination: {
            nextCursor:
              "next-home-cursor",

            hasMore:
              true,

            refreshAfterSeconds:
              90,
          },

          recommendation: {
            organicRankingFirst:
              true,

            monetizationInsertedAfterOrganicRanking:
              true,
          },
        });
      }
    );

    it(
      "preserves Search query, taxonomy readiness, and search-engine contract",
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
              "/api/v1/mobile/search?query=contract%20query&category=ai&languageCode=en&regionCode=IN&limit=12&refreshMode=refresh",
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
            "contract query",

          category:
            "ai",

          languageCode:
            "en",

          regionCode:
            "IN",

          limit:
            12,

          cursor:
            null,

          refreshMode:
            "refresh",
        });

        expect(
          response.json()
        ).toMatchObject({
          surface:
            "search",

          pagination: {
            nextCursor:
              "next-search-cursor",

            refreshAfterSeconds:
              180,
          },

          searchEngine: {
            engine:
              "postgres_full_text",

            query:
              "contract query",

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
        });
      }
    );

    it(
      "preserves Trending surface, category, and trend-intelligence handoff contract",
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
              "/api/v1/mobile/feed/trending?category=markets&limit=20&refreshMode=initial",
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
            "markets",

          languageCode:
            null,

          regionCode:
            null,

          limit:
            20,

          cursor:
            null,

          refreshMode:
            "initial",
        });

        expect(
          response.json()
        ).toMatchObject({
          surface:
            "trending",

          pagination: {
            nextCursor:
              "next-trending-cursor",

            refreshAfterSeconds:
              60,
          },

          aiHandoff: {
            apiBackendLanguage:
              "typescript",

            aiServiceLanguage:
              "python",

            trendIntelligenceReady:
              true,
          },
        });
      }
    );

    it(
      "requires authentication across Home, Search, and Trending routes",
      async () => {
        const service =
          createService();

        app =
          await createRouteApp({
            authenticated:
              false,

            service,
          });

        const urls =
          [
            "/api/v1/mobile/feed/home",
            "/api/v1/mobile/search?query=contract",
            "/api/v1/mobile/feed/trending",
          ];

        for (
          const url of urls
        ) {
          const response =
            await app.inject({
              method:
                "GET",

              url,
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
        }

        expect(
          service.listFeed
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects invalid query params before discovery service execution",
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
              "/api/v1/mobile/search?query=contract&limit=51",
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
