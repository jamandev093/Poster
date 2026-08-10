import type {
  AdvertisingAiCandidate,
  AdvertisingAiRequestContext,
  AdvertisingAiScoreComponents,
} from "./advertising-ai.types.js";

import type {
  AdvertisingAiEligibilityPolicyInput,
} from "./advertising-ai-eligibility.policy.js";

export interface AdvertisingAiRankingCandidateInput {
  readonly candidate:
    AdvertisingAiCandidate;

  /*
   * The ranking layer supplies candidate identity/type/
   * placement/frame itself so callers cannot evaluate policy
   * for one candidate and score another.
   */
  readonly policy:
    Omit<
      AdvertisingAiEligibilityPolicyInput,
      "candidateId" |
      "candidateType" |
      "placement" |
      "frame"
    >;
}

export interface AdvertisingAiRankingRequest {
  readonly context:
    AdvertisingAiRequestContext;

  readonly candidates:
    readonly AdvertisingAiRankingCandidateInput[];

  readonly limit?:
    number;
}

export interface AdvertisingAiRankedCandidate {
  readonly rank:
    number;

  readonly candidateId:
    string;

  readonly campaignId:
    string |
    null;

  readonly score:
    number;

  readonly components:
    AdvertisingAiScoreComponents;

  readonly engine:
    "deterministic_fallback_v1";

  readonly modelVersion:
    null;

  readonly learningDomain:
    "advertising";
}

export interface AdvertisingAiExcludedCandidate {
  readonly candidateId:
    string;

  readonly reasonCodes:
    readonly string[];
}

export interface AdvertisingAiRankingResult {
  readonly requestedCandidateCount:
    number;

  readonly eligibleCandidateCount:
    number;

  readonly excludedCandidateCount:
    number;

  readonly rankedCount:
    number;

  readonly ranked:
    readonly AdvertisingAiRankedCandidate[];

  readonly excluded:
    readonly AdvertisingAiExcludedCandidate[];

  readonly rankingDomain:
    "advertising";

  readonly organicRankingSignalsUsed:
    false;
}