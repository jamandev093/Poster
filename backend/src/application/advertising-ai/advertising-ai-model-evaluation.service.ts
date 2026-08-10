import type {
  AdvertisingAiCandidateEvaluationResult,
  AdvertisingAiStoredModel,
} from "./advertising-ai-model-lifecycle.types.js";

export interface AdvertisingAiModelEvaluationService {
  evaluateCandidate(
    candidate:
      AdvertisingAiStoredModel
  ):
    AdvertisingAiCandidateEvaluationResult;
}

function binaryEntropy(
  positiveCount:
    number,

  negativeCount:
    number
): number {
  const total =
    positiveCount +
    negativeCount;

  if (total <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  const probability =
    positiveCount /
    total;

  if (
    probability <= 0 ||
    probability >= 1
  ) {
    return 0;
  }

  return -(
    probability *
      Math.log(
        probability
      ) +
    (
      1 -
      probability
    ) *
      Math.log(
        1 -
        probability
      )
  );
}

function fail(
  candidate:
    AdvertisingAiStoredModel,

  reason:
    string,

  baselineLogLoss:
    number
): AdvertisingAiCandidateEvaluationResult {
  return {
    decision:
      "fail",

    reason,

    baselineLogLoss,

    candidateLogLoss:
      candidate.validationLogLoss,

    candidateRocAuc:
      candidate.validationRocAuc,

    candidateAccuracy:
      candidate.validationAccuracy,

    validationEventCount:
      candidate.validationEventCount,

    validationPositiveCount:
      candidate.validationPositiveCount,

    validationNegativeCount:
      candidate.validationNegativeCount,
  };
}

export function createAdvertisingAiModelEvaluationService():
  AdvertisingAiModelEvaluationService {
  return {
    evaluateCandidate(
      candidate
    ) {
      if (
        candidate.status !==
        "candidate"
      ) {
        return fail(
          candidate,
          "candidate_status_invalid",
          Number.POSITIVE_INFINITY
        );
      }

      if (
        candidate.featureDimension !==
        256 ||
        candidate.weights.length !==
        256
      ) {
        return fail(
          candidate,
          "candidate_feature_contract_invalid",
          Number.POSITIVE_INFINITY
        );
      }

      if (
        candidate.validationEventCount <
          20 ||
        candidate.validationPositiveCount <
          1 ||
        candidate.validationNegativeCount <
          1
      ) {
        return fail(
          candidate,
          "validation_sample_insufficient",
          Number.POSITIVE_INFINITY
        );
      }

      const baselineLogLoss =
        binaryEntropy(
          candidate.validationPositiveCount,
          candidate.validationNegativeCount
        );

      if (
        !Number.isFinite(
          candidate.validationLogLoss
        ) ||
        candidate.validationLogLoss <
          0
      ) {
        return fail(
          candidate,
          "candidate_log_loss_invalid",
          baselineLogLoss
        );
      }

      if (
        candidate.validationLogLoss >
        baselineLogLoss
      ) {
        return fail(
          candidate,
          "candidate_worse_than_prevalence_baseline",
          baselineLogLoss
        );
      }

      if (
        !Number.isFinite(
          candidate.validationAccuracy
        ) ||
        candidate.validationAccuracy <
          0 ||
        candidate.validationAccuracy >
          1
      ) {
        return fail(
          candidate,
          "candidate_accuracy_invalid",
          baselineLogLoss
        );
      }

      if (
        candidate.validationRocAuc !==
          null &&
        (
          !Number.isFinite(
            candidate.validationRocAuc
          ) ||
          candidate.validationRocAuc <
            0.5 ||
          candidate.validationRocAuc >
            1
        )
      ) {
        return fail(
          candidate,
          "candidate_auc_below_random",
          baselineLogLoss
        );
      }

      return {
        decision:
          "pass",

        reason:
          "candidate_quality_gate_passed",

        baselineLogLoss,

        candidateLogLoss:
          candidate.validationLogLoss,

        candidateRocAuc:
          candidate.validationRocAuc,

        candidateAccuracy:
          candidate.validationAccuracy,

        validationEventCount:
          candidate.validationEventCount,

        validationPositiveCount:
          candidate.validationPositiveCount,

        validationNegativeCount:
          candidate.validationNegativeCount,
      };
    },
  };
}