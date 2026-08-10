import type {
  PosterBrainAiModelMetrics,
  PosterBrainAiModelRegistryRepository,
  PosterBrainAiModelVersion,
} from "./ai-model-registry.repository.js";

import type {
  PosterBrainAiModelLifecycleRepository,
} from "./ai-model-lifecycle.repository.js";

export const POSTER_BRAIN_AI_MODEL_EVALUATION_POLICY_VERSION =
  "poster-brain-model-promotion-v1";

const MINIMUM_VALIDATION_EVENTS = 20;
const MINIMUM_VALIDATION_CLASS_EVENTS = 10;

const MAX_ACCURACY_REGRESSION = 0.02;
const MAX_LOG_LOSS_REGRESSION = 0.005;
const MAX_ROC_AUC_REGRESSION = 0.02;

const MIN_ACCURACY_IMPROVEMENT = 0.005;
const MIN_LOG_LOSS_IMPROVEMENT = 0.0001;
const MIN_ROC_AUC_IMPROVEMENT = 0.005;

export interface PosterBrainAiEvaluationDecision {
  readonly passed: boolean;
  readonly reason: string;
  readonly payload:
    Readonly<Record<string, unknown>>;
}

export interface PosterBrainAiEvaluateAndPromoteResult {
  readonly modelId: string;
  readonly evaluationStatus:
    "passed" |
    "failed";
  readonly reason: string;
  readonly promoted: boolean;
  readonly previousActiveModelId:
    string |
    null;
}

export interface PosterBrainAiRollbackResult {
  readonly rolledBack: boolean;
  readonly activeModelId:
    string |
    null;
  readonly replacedModelId:
    string |
    null;
}

export interface PosterBrainAiModelLifecycleService {
  evaluateAndPromoteCandidate(
    modelId: string
  ): Promise<PosterBrainAiEvaluateAndPromoteResult>;

  rollbackActiveModel():
    Promise<PosterBrainAiRollbackResult>;
}

export interface PosterBrainAiModelLifecycleServiceDependencies {
  readonly modelRegistryRepository:
    PosterBrainAiModelRegistryRepository;

  readonly lifecycleRepository:
    PosterBrainAiModelLifecycleRepository;

  readonly now?:
    () => string;
}

function baselineMetrics(
  metrics: PosterBrainAiModelMetrics
): {
  readonly accuracy: number;
  readonly logLoss: number;
  readonly rocAuc: number;
} {
  const count =
    metrics.validationEventCount;

  const probability =
    metrics.validationPositiveCount /
    count;

  const bounded =
    Math.min(
      1 - 1e-12,
      Math.max(
        1e-12,
        probability
      )
    );

  const logLoss =
    -(
      probability *
        Math.log(bounded) +
      (
        1 -
        probability
      ) *
        Math.log(
          1 -
          bounded
        )
    );

  return {
    accuracy:
      Math.max(
        metrics.validationPositiveCount,
        metrics.validationNegativeCount
      ) /
      count,

    logLoss,

    rocAuc:
      0.5,
  };
}

function metricsPayload(
  metrics: PosterBrainAiModelMetrics
): Readonly<Record<string, unknown>> {
  return {
    validationEventCount:
      metrics.validationEventCount,

    validationPositiveCount:
      metrics.validationPositiveCount,

    validationNegativeCount:
      metrics.validationNegativeCount,

    accuracy:
      metrics.accuracy,

    logLoss:
      metrics.logLoss,

    rocAuc:
      metrics.rocAuc,
  };
}

function failed(
  reason: string,
  candidate: PosterBrainAiModelVersion,
  active:
    PosterBrainAiModelVersion |
    null,
  extra:
    Readonly<Record<string, unknown>> = {}
): PosterBrainAiEvaluationDecision {
  return {
    passed: false,
    reason,

    payload: {
      policyVersion:
        POSTER_BRAIN_AI_MODEL_EVALUATION_POLICY_VERSION,

      candidateModelId:
        candidate.modelId,

      activeModelId:
        active?.modelId ??
        null,

      candidateMetrics:
        metricsPayload(
          candidate.metrics
        ),

      activeMetrics:
        active === null
          ? null
          : metricsPayload(
              active.metrics
            ),

      ...extra,
    },
  };
}

export function evaluatePosterBrainAiModelCandidate(
  candidate: PosterBrainAiModelVersion,
  active:
    PosterBrainAiModelVersion |
    null
): PosterBrainAiEvaluationDecision {
  const metrics =
    candidate.metrics;

  if (
    metrics.validationEventCount <
      MINIMUM_VALIDATION_EVENTS ||
    metrics.validationPositiveCount <
      MINIMUM_VALIDATION_CLASS_EVENTS ||
    metrics.validationNegativeCount <
      MINIMUM_VALIDATION_CLASS_EVENTS
  ) {
    return failed(
      "insufficient_validation_evidence",
      candidate,
      active
    );
  }

  const baseline =
    baselineMetrics(metrics);

  if (
    metrics.logLoss >=
    baseline.logLoss
  ) {
    return failed(
      "candidate_fails_baseline_log_loss",
      candidate,
      active,
      {
        baseline,
      }
    );
  }

  if (
    metrics.accuracy +
      MAX_ACCURACY_REGRESSION <
    baseline.accuracy
  ) {
    return failed(
      "candidate_fails_baseline_accuracy",
      candidate,
      active,
      {
        baseline,
      }
    );
  }

  if (
    metrics.rocAuc === null ||
    metrics.rocAuc <
      baseline.rocAuc
  ) {
    return failed(
      "candidate_fails_baseline_roc_auc",
      candidate,
      active,
      {
        baseline,
      }
    );
  }

  if (active === null) {
    return {
      passed: true,
      reason:
        "candidate_beats_baseline",

      payload: {
        policyVersion:
          POSTER_BRAIN_AI_MODEL_EVALUATION_POLICY_VERSION,

        candidateModelId:
          candidate.modelId,

        activeModelId:
          null,

        candidateMetrics:
          metricsPayload(metrics),

        baseline,
      },
    };
  }

  if (
    active.modelType !==
      candidate.modelType ||
    active.trainingEngineVersion !==
      candidate.trainingEngineVersion ||
    active.featureVersion !==
      candidate.featureVersion ||
    active.featureDimension !==
      candidate.featureDimension
  ) {
    return failed(
      "active_model_contract_incompatible",
      candidate,
      active
    );
  }

  if (
    metrics.logLoss >
    active.metrics.logLoss +
      MAX_LOG_LOSS_REGRESSION
  ) {
    return failed(
      "candidate_regresses_active_log_loss",
      candidate,
      active
    );
  }

  if (
    metrics.accuracy +
      MAX_ACCURACY_REGRESSION <
    active.metrics.accuracy
  ) {
    return failed(
      "candidate_regresses_active_accuracy",
      candidate,
      active
    );
  }

  if (
    metrics.rocAuc !== null &&
    active.metrics.rocAuc !== null &&
    metrics.rocAuc +
      MAX_ROC_AUC_REGRESSION <
    active.metrics.rocAuc
  ) {
    return failed(
      "candidate_regresses_active_roc_auc",
      candidate,
      active
    );
  }

  const improved =
    metrics.logLoss <=
      active.metrics.logLoss -
        MIN_LOG_LOSS_IMPROVEMENT ||
    metrics.accuracy >=
      active.metrics.accuracy +
        MIN_ACCURACY_IMPROVEMENT ||
    (
      metrics.rocAuc !== null &&
      active.metrics.rocAuc !== null &&
      metrics.rocAuc >=
        active.metrics.rocAuc +
          MIN_ROC_AUC_IMPROVEMENT
    );

  if (!improved) {
    return failed(
      "candidate_has_no_measurable_improvement",
      candidate,
      active
    );
  }

  return {
    passed: true,

    reason:
      "candidate_improves_active",

    payload: {
      policyVersion:
        POSTER_BRAIN_AI_MODEL_EVALUATION_POLICY_VERSION,

      candidateModelId:
        candidate.modelId,

      activeModelId:
        active.modelId,

      candidateMetrics:
        metricsPayload(metrics),

      activeMetrics:
        metricsPayload(
          active.metrics
        ),

      baseline,
    },
  };
}

export class DefaultPosterBrainAiModelLifecycleService
  implements PosterBrainAiModelLifecycleService
{
  private readonly now:
    () => string;

  constructor(
    private readonly dependencies:
      PosterBrainAiModelLifecycleServiceDependencies
  ) {
    this.now =
      dependencies.now ??
      (
        () =>
          new Date().toISOString()
      );
  }

  async evaluateAndPromoteCandidate(
    modelId: string
  ): Promise<PosterBrainAiEvaluateAndPromoteResult> {
    const candidate =
      await this.dependencies
        .modelRegistryRepository
        .getModel(modelId);

    if (
      candidate === null ||
      candidate.state !==
        "candidate" ||
      candidate.evaluationStatus !==
        "pending"
    ) {
      throw new Error(
        "Poster Brain AI model is not a pending candidate."
      );
    }

    const active =
      await this.dependencies
        .modelRegistryRepository
        .getActiveModel();

    const decision =
      evaluatePosterBrainAiModelCandidate(
        candidate,
        active
      );

    const evaluatedAt =
      this.now();

    await this.dependencies
      .lifecycleRepository
      .recordEvaluation({
        modelId:
          candidate.modelId,

        status:
          decision.passed
            ? "passed"
            : "failed",

        reason:
          decision.reason,

        payload:
          decision.payload,

        evaluatedAt,
      });

    if (!decision.passed) {
      return {
        modelId:
          candidate.modelId,

        evaluationStatus:
          "failed",

        reason:
          decision.reason,

        promoted:
          false,

        previousActiveModelId:
          null,
      };
    }

    const promotion =
      await this.dependencies
        .lifecycleRepository
        .promoteCandidate(
          candidate.modelId,
          evaluatedAt
        );

    if (!promotion.promoted) {
      throw new Error(
        "Poster Brain AI candidate passed evaluation but was not promoted."
      );
    }

    return {
      modelId:
        candidate.modelId,

      evaluationStatus:
        "passed",

      reason:
        decision.reason,

      promoted:
        true,

      previousActiveModelId:
        promotion.previousActiveModelId,
    };
  }

  async rollbackActiveModel():
    Promise<PosterBrainAiRollbackResult> {
    return this.dependencies
      .lifecycleRepository
      .rollbackActiveModel(
        this.now()
      );
  }
}

export function createPosterBrainAiModelLifecycleService(
  dependencies:
    PosterBrainAiModelLifecycleServiceDependencies
): PosterBrainAiModelLifecycleService {
  return new DefaultPosterBrainAiModelLifecycleService(
    dependencies
  );
}