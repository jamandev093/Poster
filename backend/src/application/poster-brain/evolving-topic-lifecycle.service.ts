import {
  createPosterBrainEvolvingTopicNormalizationService,
  type PosterBrainEvolvingTopicNormalizationService,
} from "./evolving-topic-normalization.service.js";

import type {
  PosterBrainEvolvingTopicRepository,
} from "./evolving-topic.repository.js";

import type {
  PosterBrainEvolvingTopicClassificationInput,
  PosterBrainEvolvingTopicRecord,
} from "./evolving-topic.types.js";

export const POSTER_BRAIN_EVOLVING_TOPIC_MIN_OBSERVATIONS =
  20;

export const POSTER_BRAIN_EVOLVING_TOPIC_MIN_DISTINCT_CONTENT =
  12;

export const POSTER_BRAIN_EVOLVING_TOPIC_MIN_PROVIDERS =
  2;

export const POSTER_BRAIN_EVOLVING_TOPIC_MIN_CONFIDENCE =
  0.8;

export interface PosterBrainEvolvingTopicPromotionReadiness {
  readonly promotable:
    boolean;

  readonly reason:
    | "ready"
    | "missing_canonical_parent"
    | "insufficient_observations"
    | "insufficient_content"
    | "insufficient_provider_diversity"
    | "insufficient_confidence"
    | "lifecycle_locked";
}

export interface PosterBrainEvolvingTopicObservationRunResult {
  readonly preparedCount:
    number;

  readonly insertedEvidenceCount:
    number;

  readonly duplicateEvidenceCount:
    number;

  readonly promotableCount:
    number;
}

export interface PosterBrainEvolvingTopicLifecycleService {
  evaluatePromotionReadiness(
    topic:
      PosterBrainEvolvingTopicRecord
  ):
    PosterBrainEvolvingTopicPromotionReadiness;

  observeClassification(
    input:
      PosterBrainEvolvingTopicClassificationInput
  ):
    Promise<
      PosterBrainEvolvingTopicObservationRunResult
    >;
}

export interface PosterBrainEvolvingTopicLifecycleDependencies {
  readonly repository:
    PosterBrainEvolvingTopicRepository;

  readonly normalizationService?:
    PosterBrainEvolvingTopicNormalizationService;
}

export function evaluatePosterBrainEvolvingTopicPromotionReadiness(
  topic:
    PosterBrainEvolvingTopicRecord
): PosterBrainEvolvingTopicPromotionReadiness {
  if (
    topic.status === "promoted" ||
    topic.status === "rejected"
  ) {
    return {
      promotable:
        false,

      reason:
        "lifecycle_locked",
    };
  }

  if (
    topic.canonicalParentTopicId ===
    null
  ) {
    return {
      promotable:
        false,

      reason:
        "missing_canonical_parent",
    };
  }

  if (
    topic.observationCount <
    POSTER_BRAIN_EVOLVING_TOPIC_MIN_OBSERVATIONS
  ) {
    return {
      promotable:
        false,

      reason:
        "insufficient_observations",
    };
  }

  if (
    topic.distinctContentCount <
    POSTER_BRAIN_EVOLVING_TOPIC_MIN_DISTINCT_CONTENT
  ) {
    return {
      promotable:
        false,

      reason:
        "insufficient_content",
    };
  }

  if (
    topic.providerCount <
    POSTER_BRAIN_EVOLVING_TOPIC_MIN_PROVIDERS
  ) {
    return {
      promotable:
        false,

      reason:
        "insufficient_provider_diversity",
    };
  }

  if (
    topic.averageConfidence <
    POSTER_BRAIN_EVOLVING_TOPIC_MIN_CONFIDENCE
  ) {
    return {
      promotable:
        false,

      reason:
        "insufficient_confidence",
    };
  }

  return {
    promotable:
      true,

    reason:
      "ready",
  };
}

export function createPosterBrainEvolvingTopicLifecycleService(
  dependencies:
    PosterBrainEvolvingTopicLifecycleDependencies
): PosterBrainEvolvingTopicLifecycleService {
  const normalizationService =
    dependencies.normalizationService ??
    createPosterBrainEvolvingTopicNormalizationService();

  return {
    evaluatePromotionReadiness(
      topic
    ) {
      return evaluatePosterBrainEvolvingTopicPromotionReadiness(
        topic
      );
    },

    async observeClassification(
      input
    ) {
      const observations =
        await normalizationService
          .prepareObservations(
            input
          );

      let insertedEvidenceCount =
        0;

      let duplicateEvidenceCount =
        0;

      let promotableCount =
        0;

      for (
        const observation
        of observations
      ) {
        const persisted =
          await dependencies
            .repository
            .observe(
              observation
            );

        if (
          persisted.insertedEvidence
        ) {
          insertedEvidenceCount +=
            1;
        }
        else {
          duplicateEvidenceCount +=
            1;
        }

        const readiness =
          evaluatePosterBrainEvolvingTopicPromotionReadiness(
            persisted.topic
          );

        if (
          readiness.promotable &&
          persisted.topic.status ===
            "discovered"
        ) {
          await dependencies
            .repository
            .setStatus(
              persisted.topic.id,
              "promotable"
            );

          promotableCount +=
            1;
        }
      }

      return {
        preparedCount:
          observations.length,

        insertedEvidenceCount,
        duplicateEvidenceCount,
        promotableCount,
      };
    },
  };
}