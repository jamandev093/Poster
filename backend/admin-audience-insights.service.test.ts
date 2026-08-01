import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminAudienceInsightsService,
} from "./src/application/audience-insights/admin-audience-insights.service.js";

import type {
  AudienceInsightTopicRecord,
  AudiencePrivacySettingsRecord,
} from "./src/domains/audience-insights/audience-insights.types.js";

const GENERATED_AT =
  new Date(
    "2026-08-01T07:00:00.000Z"
  );

const PRIVACY:
  AudiencePrivacySettingsRecord = {
  settingKey:
    "default",

  minimumReportableAudience:
    100,

  minimumCampaignAudience:
    250,

  createdAt:
    GENERATED_AT,

  updatedAt:
    GENERATED_AT,

  rowVersion:
    "1",
};

const TOPICS:
  AudienceInsightTopicRecord[] = [
  {
    topicId:
      "00000000-0000-4000-8000-000000000301",

    topicSlug:
      "technology",

    topicName:
      "Technology",

    parentTopicId:
      null,

    totalRegisteredUsers:
      10_000,

    totalInterestedUsers:
      1_500,

    previousInterestedUsers:
      1_200,

    activeInterestedUsers:
      800,

    campaignEligibleUsers:
      600,
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

    totalRegisteredUsers:
      10_000,

    totalInterestedUsers:
      40,

    previousInterestedUsers:
      30,

    activeInterestedUsers:
      15,

    campaignEligibleUsers:
      8,
  },
];

describe(
  "Admin Audience Insights service",
  () => {
    it(
      "builds a privacy-filtered aggregate snapshot with growth",
      async () => {
        const readPrivacy =
          vi.fn()
            .mockResolvedValue(
              PRIVACY
            );

        const readTopics =
          vi.fn()
            .mockResolvedValue(
              TOPICS
            );

        const service =
          createAdminAudienceInsightsService({
            dependencies: {
              now:
                () =>
                  GENERATED_AT,

              readPrivacy,

              readTopics,
            },
          });

        const snapshot =
          await service
            .getSnapshot();

        expect(
          readTopics
        ).toHaveBeenCalledWith({
          observedAt:
            GENERATED_AT,

          activeSince:
            new Date(
              "2026-07-02T07:00:00.000Z"
            ),
        });

        expect(
          snapshot
        ).toEqual({
          generatedAt:
            GENERATED_AT,

          activeWindowDays:
            30,

          privacy: {
            minimumReportableAudience:
              100,

            minimumCampaignAudience:
              250,
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
                1_500,

              previousInterestedUsers:
                1_200,

              activeInterestedUsers:
                800,

              audiencePercentage:
                15,

              growthCount:
                300,

              growthPercentage:
                25,

              campaignEligibleUsers:
                600,

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
      "rejects an invalid generation time before repository reads",
      async () => {
        const readPrivacy =
          vi.fn();

        const readTopics =
          vi.fn();

        const service =
          createAdminAudienceInsightsService({
            dependencies: {
              now:
                () =>
                  new Date(
                    Number.NaN
                  ),

              readPrivacy,

              readTopics,
            },
          });

        await expect(
          service.getSnapshot()
        ).rejects.toThrow(
          "Audience Insights generation time is invalid."
        );

        expect(
          readPrivacy
        ).not.toHaveBeenCalled();

        expect(
          readTopics
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "propagates repository failures without returning partial data",
      async () => {
        const service =
          createAdminAudienceInsightsService({
            dependencies: {
              now:
                () =>
                  GENERATED_AT,

              readPrivacy:
                vi.fn()
                  .mockResolvedValue(
                    PRIVACY
                  ),

              readTopics:
                vi.fn()
                  .mockRejectedValue(
                    new Error(
                      "Database unavailable"
                    )
                  ),
            },
          });

        await expect(
          service.getSnapshot()
        ).rejects.toThrow(
          "Database unavailable"
        );
      }
    );
  }
);