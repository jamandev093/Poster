import {
  evaluateAdvertisingAiHardEligibility,
  type AdvertisingAiScoreRequest,
  type AdvertisingAiScoreResult,
} from "../../domains/advertising-ai/index.js";

function boundedScore(
  value:
    number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function normalizeToken(
  value:
    string
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizedSet(
  values:
    readonly string[]
): Set<string> {
  return new Set(
    values
      .map(
        normalizeToken
      )
      .filter(
        value =>
          value.length > 0
      )
  );
}

function overlapScore(
  left:
    readonly string[],

  right:
    readonly string[]
): number {
  const leftSet =
    normalizedSet(
      left
    );

  const rightSet =
    normalizedSet(
      right
    );

  if (
    leftSet.size === 0 ||
    rightSet.size === 0
  ) {
    return 0;
  }

  let matches =
    0;

  for (
    const value of
    leftSet
  ) {
    if (
      rightSet.has(
        value
      )
    ) {
      matches +=
        1;
    }
  }

  return boundedScore(
    matches /
    Math.max(
      leftSet.size,
      rightSet.size
    )
  );
}

function contextualRelevance(
  request:
    AdvertisingAiScoreRequest
): number {
  const candidateTopics = [
    ...request.candidate
      .canonicalTopicIds,

    ...request.candidate
      .evolvingTopicIds,
  ];

  const contextTopics = [
    ...request.context
      .canonicalTopicIds,

    ...request.context
      .evolvingTopicIds,
  ];

  const topicScore =
    overlapScore(
      candidateTopics,
      contextTopics
    );

  const tagScore =
    overlapScore(
      request.candidate.tags,
      request.context.tags
    );

  const queryTokens =
    request.context.query ===
    null
      ? []
      : request.context.query
          .split(
            /[^A-Za-z0-9]+/
          );

  const queryScore =
    overlapScore(
      request.candidate.tags,
      queryTokens
    );

  return boundedScore(
    (
      topicScore *
      0.6
    ) +
    (
      tagScore *
      0.25
    ) +
    (
      queryScore *
      0.15
    )
  );
}

function personalizationScore(
  request:
    AdvertisingAiScoreRequest
): number {
  if (
    !request.context
      .personalizedAdsEnabled
  ) {
    return 0;
  }

  return overlapScore(
    [
      ...request.candidate
        .canonicalTopicIds,

      ...request.candidate
        .evolvingTopicIds,
    ],

    request.context
      .selectedInterestTopicIds
  );
}

export interface AdvertisingAiScoringService {
  score(
    request:
      AdvertisingAiScoreRequest
  ): AdvertisingAiScoreResult;
}

export function createAdvertisingAiScoringService():
  AdvertisingAiScoringService {
  return {
    score(
      request
    ) {
      const eligibility =
        evaluateAdvertisingAiHardEligibility(
          request.eligibility
        );

      const components = {
        contextualRelevance:
          contextualRelevance(
            request
          ),

        personalization:
          personalizationScore(
            request
          ),

        quality:
          boundedScore(
            request.candidate
              .qualityScore
          ),

        advertisingPerformance:
          boundedScore(
            request.candidate
              .advertisingPerformanceScore
          ),

        value:
          boundedScore(
            request.candidate
              .valueScore
          ),

        basePriority:
          boundedScore(
            request.candidate
              .basePriority
          ),
      };

      if (
        !eligibility.eligible
      ) {
        return {
          candidateId:
            request.candidate
              .candidateId,

          eligible:
            false,

          score:
            0,

          components,

          reasonCodes:
            eligibility
              .reasonCodes,

          engine:
            "deterministic_fallback_v1",

          modelVersion:
            null,

          learningDomain:
            "advertising",
        };
      }

      const score =
        boundedScore(
          (
            components
              .contextualRelevance *
            0.4
          ) +
          (
            components
              .personalization *
            0.15
          ) +
          (
            components
              .quality *
            0.15
          ) +
          (
            components
              .advertisingPerformance *
            0.15
          ) +
          (
            components
              .value *
            0.1
          ) +
          (
            components
              .basePriority *
            0.05
          )
        );

      return {
        candidateId:
          request.candidate
            .candidateId,

        eligible:
          true,

        score,

        components,

        reasonCodes: [
          "eligible",
        ],

        engine:
          "deterministic_fallback_v1",

        modelVersion:
          null,

        learningDomain:
          "advertising",
      };
    },
  };
}