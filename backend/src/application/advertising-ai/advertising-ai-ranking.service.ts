import {
  type AdvertisingAiExcludedCandidate,
  type AdvertisingAiRankedCandidate,
  type AdvertisingAiRankingCandidateInput,
  type AdvertisingAiRankingRequest,
  type AdvertisingAiRankingResult,
} from "../../domains/advertising-ai/index.js";

import {
  createAdvertisingAiEligibilityService,
  type AdvertisingAiEligibilityService,
} from "./advertising-ai-eligibility.service.js";

import {
  createAdvertisingAiScoringService,
  type AdvertisingAiScoringService,
} from "./advertising-ai-scoring.service.js";

export interface AdvertisingAiRankingService {
  rank(
    request:
      AdvertisingAiRankingRequest
  ):
    AdvertisingAiRankingResult;
}

export interface AdvertisingAiRankingServiceDependencies {
  readonly eligibilityService?:
    AdvertisingAiEligibilityService;

  readonly scoringService?:
    AdvertisingAiScoringService;
}

function rankingLimit(
  value:
    number | undefined,

  candidateCount:
    number
): number {
  if (value === undefined) {
    return Math.min(
      candidateCount,
      50
    );
  }

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 1 ||
    value > 50
  ) {
    throw new Error(
      "Advertising AI ranking limit must be between 1 and 50."
    );
  }

  return value;
}

function candidateContextFailures(
  input:
    AdvertisingAiRankingCandidateInput,

  context:
    AdvertisingAiRankingRequest["context"]
): string[] {
  const failures:
    string[] =
    [];

  if (
    input.candidate
      .placement !==
    context.placement
  ) {
    failures.push(
      "candidate_placement_context_mismatch"
    );
  }

  if (
    input.candidate
      .frame !==
    context.frame
  ) {
    failures.push(
      "candidate_frame_context_mismatch"
    );
  }

  return failures;
}

function assertUniqueCandidates(
  candidates:
    readonly AdvertisingAiRankingCandidateInput[]
): void {
  const ids =
    new Set<string>();

  for (
    const entry of
    candidates
  ) {
    const id =
      entry.candidate
        .candidateId
        .trim();

    if (id.length === 0) {
      throw new Error(
        "Advertising AI candidate id is required."
      );
    }

    if (ids.has(id)) {
      throw new Error(
        `Duplicate Advertising AI candidate id: ${id}.`
      );
    }

    ids.add(id);
  }
}

function sortRanked(
  left:
    AdvertisingAiRankedCandidate,

  right:
    AdvertisingAiRankedCandidate
): number {
  if (
    right.score !==
    left.score
  ) {
    return (
      right.score -
      left.score
    );
  }

  if (
    right.components
      .contextualRelevance !==
    left.components
      .contextualRelevance
  ) {
    return (
      right.components
        .contextualRelevance -
      left.components
        .contextualRelevance
    );
  }

  /*
   * Stable deterministic final tie-break.
   * Never use arrival order or randomness.
   */
  return left
    .candidateId
    .localeCompare(
      right.candidateId
    );
}

export function createAdvertisingAiRankingService(
  dependencies:
    AdvertisingAiRankingServiceDependencies = {}
): AdvertisingAiRankingService {
  const eligibilityService =
    dependencies
      .eligibilityService ??
    createAdvertisingAiEligibilityService();

  const scoringService =
    dependencies
      .scoringService ??
    createAdvertisingAiScoringService();

  return {
    rank(
      request
    ) {
      assertUniqueCandidates(
        request.candidates
      );

      const limit =
        rankingLimit(
          request.limit,
          request.candidates
            .length
        );

      const eligible:
        AdvertisingAiRankedCandidate[] =
        [];

      const excluded:
        AdvertisingAiExcludedCandidate[] =
        [];

      for (
        const entry of
        request.candidates
      ) {
        const contextFailures =
          candidateContextFailures(
            entry,
            request.context
          );

        const eligibility =
          eligibilityService
            .evaluate({
              candidateId:
                entry.candidate
                  .candidateId,

              candidateType:
                entry.candidate
                  .candidateType,

              placement:
                entry.candidate
                  .placement,

              frame:
                entry.candidate
                  .frame,

              ...entry.policy,
            });

        const reasonCodes = [
          ...contextFailures,
          ...eligibility
            .reasonCodes,
        ];

        if (
          contextFailures.length >
            0 ||
          !eligibility.eligible
        ) {
          excluded.push({
            candidateId:
              entry.candidate
                .candidateId,

            reasonCodes: [
              ...new Set(
                reasonCodes
              ),
            ],
          });

          continue;
        }

        const score =
          scoringService.score({
            candidate:
              entry.candidate,

            context:
              request.context,

            eligibility:
              eligibility.facts,
          });

        /*
         * Defensive invariant: even if a custom scoring service
         * is supplied, the ranking layer will not admit a result
         * that claims an authoritative eligibility failure.
         */
        if (
          !score.eligible
        ) {
          excluded.push({
            candidateId:
              entry.candidate
                .candidateId,

            reasonCodes:
              score.reasonCodes,
          });

          continue;
        }

        eligible.push({
          rank:
            0,

          candidateId:
            entry.candidate
              .candidateId,

          campaignId:
            entry.candidate
              .campaignId,

          score:
            score.score,

          components:
            score.components,

          engine:
            score.engine,

          modelVersion:
            score.modelVersion,

          learningDomain:
            "advertising",
        });
      }

      eligible.sort(
        sortRanked
      );

      const ranked =
        eligible
          .slice(
            0,
            limit
          )
          .map(
            (
              item,
              index
            ) => ({
              ...item,

              rank:
                index + 1,
            })
          );

      return {
        requestedCandidateCount:
          request.candidates
            .length,

        eligibleCandidateCount:
          eligible.length,

        excludedCandidateCount:
          excluded.length,

        rankedCount:
          ranked.length,

        ranked,

        excluded,

        rankingDomain:
          "advertising",

        organicRankingSignalsUsed:
          false,
      };
    },
  };
}