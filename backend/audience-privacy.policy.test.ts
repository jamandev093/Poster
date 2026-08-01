import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyAudiencePrivacyPolicy,
} from "./src/domains/audience-insights/audience-privacy.policy.js";

import type {
  AudienceInsightTopicRecord,
  AudiencePrivacySettingsRecord,
} from "./src/domains/audience-insights/audience-insights.types.js";

const PRIVACY:
  AudiencePrivacySettingsRecord = {
  settingKey:
    "default",

  minimumReportableAudience:
    100,

  minimumCampaignAudience:
    250,

  createdAt:
    new Date(
      "2026-08-01T06:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-01T06:00:00.000Z"
    ),

  rowVersion:
    "1",
};

function createTopic(
  overrides:
    Partial<
      AudienceInsightTopicRecord
    > =
    {}
): AudienceInsightTopicRecord {
  return {
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

    ...overrides,
  };
}

describe(
  "Audience Insights privacy policy",
  () => {
    it(
      "suppresses values when the current audience is below the reporting threshold",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalInterestedUsers:
                99,

              previousInterestedUsers:
                120,

              activeInterestedUsers:
                40,

              campaignEligibleUsers:
                30,
            }),
            PRIVACY
          );

        expect(
          result
        ).toEqual({
          topicId:
            "00000000-0000-4000-8000-000000000301",

          topicSlug:
            "technology",

          topicName:
            "Technology",

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
        });
      }
    );

    it(
      "suppresses growth when the previous audience is below the reporting threshold",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalInterestedUsers:
                500,

              previousInterestedUsers:
                99,
            }),
            PRIVACY
          );

        expect(
          result.isSuppressed
        ).toBe(
          true
        );

        expect(
          result.growthCount
        ).toBeNull();

        expect(
          result.growthPercentage
        ).toBeNull();
      }
    );

    it(
      "calculates positive audience growth",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalInterestedUsers:
                1_500,

              previousInterestedUsers:
                1_200,
            }),
            PRIVACY
          );

        expect(
          result.isSuppressed
        ).toBe(
          false
        );

        expect(
          result.growthCount
        ).toBe(
          300
        );

        expect(
          result.growthPercentage
        ).toBe(
          25
        );
      }
    );

    it(
      "calculates negative audience growth",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalInterestedUsers:
                800,

              previousInterestedUsers:
                1_000,
            }),
            PRIVACY
          );

        expect(
          result.growthCount
        ).toBe(
          -200
        );

        expect(
          result.growthPercentage
        ).toBe(
          -20
        );
      }
    );

    it(
      "marks a topic campaign eligible at the campaign threshold",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              campaignEligibleUsers:
                250,
            }),
            PRIVACY
          );

        expect(
          result.isCampaignEligible
        ).toBe(
          true
        );
      }
    );

    it(
      "returns zero audience share when there are no registered users",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalRegisteredUsers:
                0,

              totalInterestedUsers:
                100,

              previousInterestedUsers:
                100,
            }),
            PRIVACY
          );

        expect(
          result.audiencePercentage
        ).toBe(
          0
        );
      }
    );

    it(
      "rounds percentages to two decimal places",
      () => {
        const result =
          applyAudiencePrivacyPolicy(
            createTopic({
              totalRegisteredUsers:
                3_000,

              totalInterestedUsers:
                1_000,

              previousInterestedUsers:
                750,
            }),
            PRIVACY
          );

        expect(
          result.audiencePercentage
        ).toBe(
          33.33
        );

        expect(
          result.growthPercentage
        ).toBe(
          33.33
        );
      }
    );
  }
);