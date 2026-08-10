import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiRankingService,
} from "../src/application/advertising-ai/index.js";

import type {
  AdvertisingAiCandidate,
  AdvertisingAiRankingCandidateInput,
  AdvertisingAiRankingRequest,
} from "../src/domains/advertising-ai/index.js";

function candidate(
  input: {
    readonly id:
      string;

    readonly topics?:
      readonly string[];

    readonly tags?:
      readonly string[];

    readonly quality?:
      number;

    readonly performance?:
      number;

    readonly value?:
      number;

    readonly priority?:
      number;
  }
):
  AdvertisingAiCandidate {
  return {
    candidateId:
      input.id,

    candidateType:
      "direct_sponsorship",

    campaignId:
      `campaign-${input.id}`,

    placement:
      "home",

    frame:
      "full_width_sponsored_card",

    canonicalTopicIds:
      input.topics ??
      [],

    evolvingTopicIds:
      [],

    tags:
      input.tags ??
      [],

    basePriority:
      input.priority ??
      0.5,

    qualityScore:
      input.quality ??
      0.5,

    advertisingPerformanceScore:
      input.performance ??
      0.5,

    valueScore:
      input.value ??
      0.5,
  };
}

function rankingCandidate(
  ad:
    AdvertisingAiCandidate,

  deliveryEligible =
    true
):
  AdvertisingAiRankingCandidateInput {
  return {
    candidate:
      ad,

    policy: {
      campaign: {
        deliveryEligible,

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
        [],

      programmatic:
        null,
    },
  };
}

function request(
  candidates:
    readonly AdvertisingAiRankingCandidateInput[]
):
  AdvertisingAiRankingRequest {
  return {
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
        "ai",
        "developer",
      ],

      query:
        "AI developer tools",

      personalizedAdsEnabled:
        false,

      selectedInterestTopicIds:
        [],
    },

    candidates,
  };
}

describe(
  "Advertising AI contextual candidate ranking",
  () => {

    it(
      "ranks the contextually relevant eligible candidate above an unrelated candidate",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const relevant =
          rankingCandidate(
            candidate({
              id:
                "relevant",

              topics: [
                "artificial-intelligence",
              ],

              tags: [
                "ai",
                "developer",
              ],

              quality:
                0.8,
            })
          );

        const unrelated =
          rankingCandidate(
            candidate({
              id:
                "unrelated",

              topics: [
                "gardening",
              ],

              tags: [
                "plants",
              ],

              quality:
                0.8,
            })
          );

        const result =
          service.rank(
            request([
              unrelated,
              relevant,
            ])
          );

        expect(
          result.ranked.map(
            item =>
              item.candidateId
          )
        ).toEqual([
          "relevant",
          "unrelated",
        ]);

        expect(
          result.ranked[0]
            ?.components
            .contextualRelevance
        ).toBeGreaterThan(
          result.ranked[1]
            ?.components
            .contextualRelevance ??
            0
        );
      }
    );

    it(
      "excludes policy-blocked candidates before they can compete on value or performance",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const blocked =
          rankingCandidate(
            candidate({
              id:
                "blocked",

              topics: [
                "artificial-intelligence",
              ],

              quality:
                1,

              performance:
                1,

              value:
                1,

              priority:
                1,
            }),

            false
          );

        const eligible =
          rankingCandidate(
            candidate({
              id:
                "eligible",

              topics: [
                "artificial-intelligence",
              ],

              quality:
                0.4,

              performance:
                0.4,

              value:
                0.4,
            })
          );

        const result =
          service.rank(
            request([
              blocked,
              eligible,
            ])
          );

        expect(
          result.ranked.map(
            item =>
              item.candidateId
          )
        ).toEqual([
          "eligible",
        ]);

        expect(
          result.excluded
        ).toEqual([
          {
            candidateId:
              "blocked",

            reasonCodes: [
              "campaign_not_delivery_eligible",
            ],
          },
        ]);
      }
    );

    it(
      "blocks candidates prepared for a different placement or frame",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const wrongPlacement =
          candidate({
            id:
              "wrong-placement",
          });

        const wrongFrame =
          candidate({
            id:
              "wrong-frame",
          });

        const result =
          service.rank(
            request([
              rankingCandidate({
                ...wrongPlacement,

                placement:
                  "search",
              }),

              rankingCandidate({
                ...wrongFrame,

                frame:
                  "three_card_sponsored_frame",
              }),
            ])
          );

        expect(
          result.ranked
        ).toEqual(
          []
        );

        expect(
          result.excluded[0]
            ?.reasonCodes
        ).toContain(
          "candidate_placement_context_mismatch"
        );

        expect(
          result.excluded[1]
            ?.reasonCodes
        ).toContain(
          "candidate_frame_context_mismatch"
        );
      }
    );

    it(
      "uses deterministic ranking and candidate id as the final tie break",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const a =
          rankingCandidate(
            candidate({
              id:
                "ad-a",

              topics: [
                "artificial-intelligence",
              ],
            })
          );

        const b =
          rankingCandidate(
            candidate({
              id:
                "ad-b",

              topics: [
                "artificial-intelligence",
              ],
            })
          );

        const first =
          service.rank(
            request([
              b,
              a,
            ])
          );

        const second =
          service.rank(
            request([
              a,
              b,
            ])
          );

        expect(
          first.ranked
        ).toEqual(
          second.ranked
        );

        expect(
          first.ranked.map(
            item =>
              item.candidateId
          )
        ).toEqual([
          "ad-a",
          "ad-b",
        ]);
      }
    );

    it(
      "applies a bounded ranking limit after eligibility and scoring",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const base =
          request([
            rankingCandidate(
              candidate({
                id:
                  "a",
              })
            ),

            rankingCandidate(
              candidate({
                id:
                  "b",
              })
            ),

            rankingCandidate(
              candidate({
                id:
                  "c",
              })
            ),
          ]);

        const result =
          service.rank({
            ...base,

            limit:
              2,
          });

        expect(
          result.eligibleCandidateCount
        ).toBe(
          3
        );

        expect(
          result.rankedCount
        ).toBe(
          2
        );

        expect(
          result.ranked.map(
            item =>
              item.rank
          )
        ).toEqual([
          1,
          2,
        ]);
      }
    );

    it(
      "rejects duplicate candidate ids instead of producing ambiguous ranks",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const first =
          rankingCandidate(
            candidate({
              id:
                "duplicate",
            })
          );

        const second =
          rankingCandidate(
            candidate({
              id:
                "duplicate",
            })
          );

        expect(
          () =>
            service.rank(
              request([
                first,
                second,
              ])
            )
        ).toThrow(
          "Duplicate Advertising AI candidate id"
        );
      }
    );

    it(
      "explicitly keeps organic Poster Brain ranking signals out of the advertising result",
      () => {
        const service =
          createAdvertisingAiRankingService();

        const result =
          service.rank(
            request([
              rankingCandidate(
                candidate({
                  id:
                    "ad-1",

                  topics: [
                    "artificial-intelligence",
                  ],
                })
              ),
            ])
          );

        expect(
          result.rankingDomain
        ).toBe(
          "advertising"
        );

        expect(
          result.organicRankingSignalsUsed
        ).toBe(
          false
        );
      }
    );
  }
);