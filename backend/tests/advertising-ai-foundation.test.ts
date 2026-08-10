import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiScoringService,
} from "../src/application/advertising-ai/index.js";

import {
  ADVERTISING_AI_ORGANIC_DATA_ALLOWED,
  assertAdvertisingAiLearningSignal,
  type AdvertisingAiScoreRequest,
} from "../src/domains/advertising-ai/index.js";

function request():
  AdvertisingAiScoreRequest {
  return {
    candidate: {
      candidateId:
        "ad-1",

      candidateType:
        "direct_sponsorship",

      campaignId:
        "campaign-1",

      placement:
        "home",

      frame:
        "full_width_sponsored_card",

      canonicalTopicIds: [
        "technology",
        "artificial-intelligence",
      ],

      evolvingTopicIds: [
        "large-language-models",
      ],

      tags: [
        "AI",
        "developer",
      ],

      basePriority:
        0.5,

      qualityScore:
        0.9,

      advertisingPerformanceScore:
        0.6,

      valueScore:
        0.7,
    },

    context: {
      placement:
        "home",

      frame:
        "full_width_sponsored_card",

      canonicalTopicIds: [
        "artificial-intelligence",
      ],

      evolvingTopicIds: [
        "large-language-models",
      ],

      tags: [
        "AI",
      ],

      query:
        null,

      personalizedAdsEnabled:
        true,

      selectedInterestTopicIds: [
        "artificial-intelligence",
      ],
    },

    eligibility: {
      campaignDeliveryEligible:
        true,

      placementAllowed:
        true,

      frameApproved:
        true,

      safetyAllowed:
        true,

      regionAllowed:
        true,

      deviceAllowed:
        true,

      frequencyAllowed:
        true,

      budgetAvailable:
        true,

      notHiddenByUser:
        true,
    },
  };
}

describe(
  "Advertising AI foundation",
  () => {

    it(
      "scores an eligible advertising candidate deterministically",
      () => {
        const service =
          createAdvertisingAiScoringService();

        const first =
          service.score(
            request()
          );

        const second =
          service.score(
            request()
          );

        expect(
          first
        ).toEqual(
          second
        );

        expect(
          first.eligible
        ).toBe(
          true
        );

        expect(
          first.score
        ).toBeGreaterThan(
          0
        );

        expect(
          first.engine
        ).toBe(
          "deterministic_fallback_v1"
        );

        expect(
          first.learningDomain
        ).toBe(
          "advertising"
        );
      }
    );

    it(
      "never allows scoring to override authoritative hard eligibility",
      () => {
        const service =
          createAdvertisingAiScoringService();

        const input =
          request();

        const result =
          service.score({
            ...input,

            eligibility: {
              ...input.eligibility,

              campaignDeliveryEligible:
                false,

              frequencyAllowed:
                false,
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.score
        ).toBe(
          0
        );

        expect(
          result.reasonCodes
        ).toEqual([
          "campaign_not_delivery_eligible",
          "frequency_blocked",
        ]);
      }
    );

    it(
      "does not use user interest personalization when personalized ads are disabled",
      () => {
        const service =
          createAdvertisingAiScoringService();

        const input =
          request();

        const result =
          service.score({
            ...input,

            context: {
              ...input.context,

              personalizedAdsEnabled:
                false,

              selectedInterestTopicIds: [
                "artificial-intelligence",
              ],
            },
          });

        expect(
          result.components
            .personalization
        ).toBe(
          0
        );
      }
    );

    it(
      "keeps organic Poster Brain learning signals outside Advertising AI",
      () => {
        expect(
          ADVERTISING_AI_ORGANIC_DATA_ALLOWED
        ).toBe(
          false
        );

        expect(
          () =>
            assertAdvertisingAiLearningSignal({
              domain:
                "organic",

              eventType:
                "click",

              candidateId:
                "story-1",

              campaignId:
                null,

              placement:
                "home",

              occurredAt:
                "2026-08-10T15:00:00.000Z",
            } as never)
        ).toThrow(
          "Advertising AI accepts advertising learning signals only."
        );
      }
    );

    it(
      "accepts a valid advertising-only learning signal",
      () => {
        const signal =
          assertAdvertisingAiLearningSignal({
            domain:
              "advertising",

            eventType:
              "impression",

            candidateId:
              "ad-1",

            campaignId:
              "campaign-1",

            placement:
              "home",

            occurredAt:
              "2026-08-10T15:00:00.000Z",
          });

        expect(
          signal.domain
        ).toBe(
          "advertising"
        );
      }
    );
  }
);