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
  MobileDiscoveryFeedResponse,
  MobileDiscoveryService,
} from "../src/application/mobile-discovery/index.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/authorization.types.js";

const AUTHORIZATION_CONTEXT:
  AuthorizationContext = {
  userId:
    "00000000-0000-4000-8000-000000001101",

  sessionId:
    "00000000-0000-4000-8000-000000001102",

  email:
    "mobile-app@example.com",

  fullName:
    "Mobile App User",

  accountStatus:
    "active",

  platformRoles:
    [],

  platformPermissions:
    [],

  organizationMemberships:
    [],
};

const MOBILE_DISCOVERY_RESPONSE:
  MobileDiscoveryFeedResponse = {
  surface:
    "home",

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
      90,

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

function createMobileDiscoveryService():
  MobileDiscoveryService {
  return {
    listFeed:
      vi.fn()
        .mockResolvedValue(
          MOBILE_DISCOVERY_RESPONSE
        ),
  };
}

describe(
  "Mobile discovery app wiring",
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
      "registers Mobile discovery routes in the main app behind auth context",
      async () => {
        const mobileDiscoveryService =
          createMobileDiscoveryService();

        const authorizationContextService =
          createAuthorizationContextService();

        app =
          await buildApp({
            authorizationContextService,

            mobileDiscoveryService,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/mobile/feed/home?limit=10",

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
          mobileDiscoveryService.listFeed
        ).toHaveBeenCalledWith({
          surface:
            "home",

          query:
            null,

          category:
            null,

          languageCode:
            null,

          regionCode:
            null,

          limit:
            10,

          cursor:
            null,

          refreshMode:
            null,
        });

        expect(
          response.json()
        ).toMatchObject({
          surface:
            "home",

          pagination: {
            refreshAfterSeconds:
              90,
          },
        });
      }
    );
  }
);
