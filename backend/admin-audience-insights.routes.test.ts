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
  AdminAudienceInsightsService,
} from "./src/application/audience-insights/admin-audience-insights.service.js";

import type {
  AuthorizationContextService,
} from "./src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "./src/domains/authorization/authorization.types.js";

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
    "users.audience_insights.read",
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

function createAudienceInsightsService() {
  const getSnapshot =
    vi.fn<
      AdminAudienceInsightsService[
        "getSnapshot"
      ]
    >();

  getSnapshot
    .mockResolvedValue({
      generatedAt:
        new Date(
          "2026-08-01T06:30:00.000Z"
        ),

      activeWindowDays:
        30,

      privacy: {
        minimumReportableAudience:
          100,

        minimumCampaignAudience:
          100,
      },

      topics: [
        {
          topicId:
            "00000000-0000-4000-8000-000000000301",

          topicSlug:
            "technology",

          topicName:
            "Technology",

          parentTopicId:
            null,

          isSuppressed:
            false,

          totalInterestedUsers:
            1_250,

          previousInterestedUsers:
            1_000,

          activeInterestedUsers:
            740,

          audiencePercentage:
            15.15,

          growthCount:
            250,

          growthPercentage:
            25,

          campaignEligibleUsers:
            620,

          isCampaignEligible:
            true,
        },

        {
          topicId:
            "00000000-0000-4000-8000-000000000302",

          topicSlug:
            "rare-topic",

          topicName:
            "Rare Topic",

          parentTopicId:
            null,

          isSuppressed:
            true,

          totalInterestedUsers:
            null,

          previousInterestedUsers:
            null,

          activeInterestedUsers:
            null,

          audiencePercentage:
            null,

          growthCount:
            null,

          growthPercentage:
            null,

          campaignEligibleUsers:
            null,

          isCampaignEligible:
            false,
        },
      ],
    });

  return {
    getSnapshot,

    service: {
      getSnapshot,
    } satisfies AdminAudienceInsightsService,
  };
}

describe(
  "Poster Admin Audience Insights HTTP route",
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
      "returns growth-aware aggregate Audience Insights",
      async () => {
        const audienceInsights =
          createAudienceInsightsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "users.audience_insights.read",
              ]),

            adminAudienceInsightsService:
              audienceInsights.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/audience-insights",

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
            "2026-08-01T06:30:00.000Z",

          activeWindowDays:
            30,

          privacy: {
            minimumReportableAudience:
              100,

            minimumCampaignAudience:
              100,
          },

          topics: [
            {
              topicId:
                "00000000-0000-4000-8000-000000000301",

              topicSlug:
                "technology",

              topicName:
                "Technology",

              parentTopicId:
                null,

              isSuppressed:
                false,

              totalInterestedUsers:
                1_250,

              previousInterestedUsers:
                1_000,

              activeInterestedUsers:
                740,

              audiencePercentage:
                15.15,

              growthCount:
                250,

              growthPercentage:
                25,

              campaignEligibleUsers:
                620,

              isCampaignEligible:
                true,
            },

            {
              topicId:
                "00000000-0000-4000-8000-000000000302",

              topicSlug:
                "rare-topic",

              topicName:
                "Rare Topic",

              parentTopicId:
                null,

              isSuppressed:
                true,

              totalInterestedUsers:
                null,

              previousInterestedUsers:
                null,

              activeInterestedUsers:
                null,

              audiencePercentage:
                null,

              growthCount:
                null,

              growthPercentage:
                null,

              campaignEligibleUsers:
                null,

              isCampaignEligible:
                false,
            },
          ],
        });
      }
    );

    it(
      "rejects an Admin without the Audience Insights permission",
      async () => {
        const audienceInsights =
          createAudienceInsightsService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService([
                "admin.access",
                "users.metrics.read",
              ]),

            adminAudienceInsightsService:
              audienceInsights.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/audience-insights",

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
          audienceInsights.getSnapshot
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an unauthenticated request",
      async () => {
        const audienceInsights =
          createAudienceInsightsService();

        app =
          await buildApp({
            adminAudienceInsightsService:
              audienceInsights.service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/users/audience-insights",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          audienceInsights.getSnapshot
        ).not.toHaveBeenCalled();
      }
    );
  }
);