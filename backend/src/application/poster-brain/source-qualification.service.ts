import type {
  PosterBrainPersistentSourceCandidateRecord,
} from "./source-candidate.repository.js";

import type {
  PosterBrainSourceQualificationEvidenceSummary,
} from "./source-topic-affinity.repository.js";

export type PosterBrainSourceQualificationReason =
  | "qualified"
  | "existing_status_preserved"
  | "unknown_source_type"
  | "insufficient_provider_diversity"
  | "insufficient_content_evidence"
  | "insufficient_observations"
  | "insufficient_topic_affinity"
  | "score_below_threshold";

export interface PosterBrainSourceQualificationDecision {
  readonly candidateKey:
    string;

  readonly score:
    number;

  readonly shouldQualify:
    boolean;

  readonly reason:
    PosterBrainSourceQualificationReason;

  readonly providerCount:
    number;

  readonly distinctContentCount:
    number;

  readonly topicCount:
    number;

  readonly observationCount:
    number;
}

export interface PosterBrainSourceQualificationService {
  evaluate(
    candidate:
      PosterBrainPersistentSourceCandidateRecord,
    evidence:
      PosterBrainSourceQualificationEvidenceSummary
  ): PosterBrainSourceQualificationDecision;
}

function providerScore(
  count:
    number
): number {
  if (count >= 3) {
    return 35;
  }

  if (count === 2) {
    return 30;
  }

  if (count === 1) {
    return 15;
  }

  return 0;
}

function contentScore(
  count:
    number
): number {
  if (count >= 5) {
    return 30;
  }

  if (count >= 3) {
    return 25;
  }

  if (count === 2) {
    return 15;
  }

  if (count === 1) {
    return 8;
  }

  return 0;
}

function topicScore(
  count:
    number
): number {
  if (count >= 3) {
    return 20;
  }

  if (count === 2) {
    return 17;
  }

  if (count === 1) {
    return 12;
  }

  return 0;
}

function observationScore(
  count:
    number
): number {
  if (count >= 5) {
    return 10;
  }

  if (count >= 3) {
    return 8;
  }

  if (count >= 1) {
    return 4;
  }

  return 0;
}

export function createPosterBrainSourceQualificationService():
  PosterBrainSourceQualificationService {
  return {
    evaluate(
      candidate,
      evidence
    ) {
      const score =
        providerScore(
          evidence.providerCount
        ) +
        contentScore(
          evidence.distinctContentCount
        ) +
        topicScore(
          evidence.topicCount
        ) +
        observationScore(
          candidate.observationCount
        ) +
        (
          candidate.sourceType ===
          "unknown"
            ? 0
            : 5
        );

      const base = {
        candidateKey:
          candidate.candidateKey,

        score,

        providerCount:
          evidence.providerCount,

        distinctContentCount:
          evidence.distinctContentCount,

        topicCount:
          evidence.topicCount,

        observationCount:
          candidate.observationCount,
      };

      /*
       * Automatic discovery can promote confidence, but never
       * automatically undo an explicit qualified/rejected state.
       */
      if (
        candidate.status !==
        "discovered"
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "existing_status_preserved",
        };
      }

      if (
        candidate.sourceType ===
        "unknown"
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "unknown_source_type",
        };
      }

      if (
        evidence.providerCount <
        2
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "insufficient_provider_diversity",
        };
      }

      if (
        evidence.distinctContentCount <
        3
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "insufficient_content_evidence",
        };
      }

      if (
        candidate.observationCount <
        3
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "insufficient_observations",
        };
      }

      if (
        evidence.topicCount <
        1
      ) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "insufficient_topic_affinity",
        };
      }

      if (score < 80) {
        return {
          ...base,
          shouldQualify:
            false,

          reason:
            "score_below_threshold",
        };
      }

      return {
        ...base,

        shouldQualify:
          true,

        reason:
          "qualified",
      };
    },
  };
}