import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AdvertisingAiRankingRequest,
} from "../src/domains/advertising-ai/index.js";

import {
  createAdvertisingAiRuntimeRankingService,
} from "../src/application/advertising-ai/advertising-ai-runtime-ranking.service.js";

import type {
  AdvertisingAiPromotedModelRuntimeRecord,
} from "../src/application/advertising-ai/advertising-ai-promoted-model-scoring.service.js";

const CANDIDATE_ID =
  "ad-runtime-candidate";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000009901";

const MODEL_ID =
  "advertising-ai-model-runtime-v1";

const FEATURE_VERSION =
  "advertising-campaign-placement-v1";

function request(
  input: {
    readonly campaignId?:
      string |
      null;

    readonly hidden?:
      boolean;
  } = {}
):
  AdvertisingAiRankingRequest {
  return {
    context: {
      placement:
        "home",

      frame:
        "full_width_sponsored_card",

      canonicalTopicIds: [
        "technology",
      ],

      evolvingTopicIds:
        [],

      tags: [
        "cloud",
      ],

      query:
        "cloud",

      personalizedAdsEnabled:
        false,

      selectedInterestTopicIds:
        [],
    },

    candidates: [
      {
        candidate: {
          candidateId:
            CANDIDATE_ID,

          candidateType:
            "poster_promotion",

          campaignId:
            input.campaignId ===
              undefined
              ? CAMPAIGN_ID
              : input.campaignId,

          placement:
            "home",

          frame:
            "full_width_sponsored_card",

          canonicalTopicIds: [
            "technology",
          ],

          evolvingTopicIds:
            [],

          tags: [
            "cloud",
          ],

          basePriority:
            0.5,

          qualityScore:
            0.5,

          advertisingPerformanceScore:
            0.1,

          valueScore:
            0.5,
        },

        policy: {
          campaign: {
            deliveryEligible:
              true,

            placements: [
              "home",
            ],
          },

          decisions: {
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
          },

          hiddenMonetizationItemIds:
            input.hidden
              ? [
                  CANDIDATE_ID,
                ]
              : [],
        },
      },
    ],
  };
}

function model(
  input: {
    readonly status?:
      string;

    readonly intercept?:
      number;

    readonly weights?:
      readonly number[];

    readonly featureVersion?:
      string;
  } = {}
):
  AdvertisingAiPromotedModelRuntimeRecord {
  return {
    modelId:
      MODEL_ID,

    status:
      input.status ??
      "promoted",

    modelType:
      "hashed_logistic_ad_response_v1",

    featureVersion:
      input.featureVersion ??
      FEATURE_VERSION,

    featureDimension:
      256,

    intercept:
      input.intercept ??
      4,

    weights:
      input.weights ??
      Array.from(
        {
          length:
            256,
        },
        () =>
          0
      ),
  };
}

describe(
  "Advertising AI promoted-model runtime",
  () => {

    it(
      "scores eligible candidates with the promoted model",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  model(),
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked
        ).toHaveLength(
          1
        );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "promoted_model_v1"
        );

        expect(
          result.ranked[0]
            ?.modelVersion
        ).toBe(
          MODEL_ID
        );

        expect(
          result.ranked[0]
            ?.components
            .advertisingPerformance
        ).toBeGreaterThan(
          0.98
        );

        expect(
          result
            .organicRankingSignalsUsed
        ).toBe(
          false
        );
      }
    );

    it(
      "matches the Python campaign-placement hash contract",
      async () => {
        const weights =
          Array.from(
            {
              length:
                256,
            },
            () =>
              0
          );

        /*
         * Python Advertising AI feature map for:
         *
         * campaign:...9901           -> index 45, sign -1
         * placement:home             -> index 97, sign +1
         * campaign-placement:...home -> index 22, sign +1
         *
         * Give only index 22 a weight.
         */
        /*
         * Actual Python feature vector:
         *
         * 0  -> +1 constant bias feature
         * 45 -> -1 campaign feature
         * 97 -> +1 placement feature
         * 22 -> +1 campaign-placement feature
         *
         * Index 0 is deliberately non-zero below, but Python
         * _linear_score() skips it.
         *
         * Linear result:
         * 0.1
         * + (0.25 * -1)
         * + (-0.75 * 1)
         * + (2 * 1)
         * = 1.1
         */
        weights[0] =
          0.5;

        weights[45] =
          0.25;

        weights[97] =
          -0.75;

        weights[22] =
          2;

        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  model({
                    intercept:
                      0.1,

                    weights,
                  }),
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked[0]
            ?.components
            .advertisingPerformance
        ).toBeCloseTo(
          0.7502601055951177,
          12
        );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "promoted_model_v1"
        );
      }
    );

    it(
      "uses deterministic fallback when no promoted model exists",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  null,
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "deterministic_fallback_v1"
        );

        expect(
          result.ranked[0]
            ?.modelVersion
        ).toBeNull();
      }
    );

    it(
      "uses deterministic fallback when registry access fails",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () => {
                  throw new Error(
                    "database unavailable"
                  );
                },
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "deterministic_fallback_v1"
        );
      }
    );

    it(
      "uses deterministic fallback for an incompatible promoted artifact",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  model({
                    weights: [
                      0,
                      0,
                      0,
                    ],
                  }),
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "deterministic_fallback_v1"
        );
      }
    );

    it(
      "uses deterministic fallback for a non-promoted registry record",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  model({
                    status:
                      "candidate",
                  }),
            },
          });

        const result =
          await service.rank(
            request()
          );

        expect(
          result.ranked[0]
            ?.engine
        ).toBe(
          "deterministic_fallback_v1"
        );
      }
    );

    it(
      "does not let the model override authoritative eligibility",
      async () => {
        const service =
          createAdvertisingAiRuntimeRankingService({
            modelRegistryRepository: {
              getPromotedModel:
                async () =>
                  model({
                    intercept:
                      100,
                  }),
            },
          });

        const result =
          await service.rank(
            request({
              hidden:
                true,
            })
          );

        expect(
          result.ranked
        ).toHaveLength(
          0
        );

        expect(
          result.excluded
        ).toHaveLength(
          1
        );

        expect(
          result.excluded[0]
            ?.reasonCodes
        ).toContain(
          "hidden_by_user"
        );
      }
    );
  }
);