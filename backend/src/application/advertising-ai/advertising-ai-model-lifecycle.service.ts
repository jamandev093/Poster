import type {
  AdvertisingAiCandidateEvaluationResult,
  AdvertisingAiStoredModel,
} from "./advertising-ai-model-lifecycle.types.js";

import type {
  AdvertisingAiModelRegistryRepository,
} from "./advertising-ai-model-registry.repository.js";

import type {
  AdvertisingAiModelEvaluationService,
} from "./advertising-ai-model-evaluation.service.js";

import type {
  AdvertisingAiIndependentChallengerEvaluationService,
} from "./advertising-ai-challenger-evaluation.service.js";

export interface AdvertisingAiModelLifecycleService {
  evaluateAndApplyCandidate(
    modelId:
      string
  ):
    Promise<{
      readonly evaluation:
        AdvertisingAiCandidateEvaluationResult;

      readonly model:
        AdvertisingAiStoredModel;
    }>;

  rollback(
    input: {
      readonly targetModelId:
        string;

      readonly reason:
        string;
    }
  ):
    Promise<
      AdvertisingAiStoredModel
    >;
}

export interface AdvertisingAiModelLifecycleDependencies {
  readonly repository:
    AdvertisingAiModelRegistryRepository;

  readonly preflightEvaluation:
    AdvertisingAiModelEvaluationService;

  readonly independentEvaluation:
    AdvertisingAiIndependentChallengerEvaluationService;

  readonly now?:
    () =>
      Date;
}

function nowIso(
  now:
    () =>
      Date
): string {
  const value =
    now();

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    throw new Error(
      "Advertising AI lifecycle clock is invalid."
    );
  }

  return value.toISOString();
}

export function createAdvertisingAiModelLifecycleService(
  dependencies:
    AdvertisingAiModelLifecycleDependencies
):
  AdvertisingAiModelLifecycleService {
  const now =
    dependencies.now ??
    (() => new Date());

  return {
    async evaluateAndApplyCandidate(
      modelId
    ) {
      const candidate =
        await dependencies
          .repository
          .findByModelId(
            modelId
          );

      if (
        candidate ===
        null
      ) {
        throw new Error(
          "Advertising AI candidate model was not found."
        );
      }

      if (
        candidate.status !==
        "candidate"
      ) {
        throw new Error(
          "Advertising AI model is not in candidate state."
        );
      }

      const incumbent =
        await dependencies
          .repository
          .getPromotedModel();

      const preflight =
        dependencies
          .preflightEvaluation
          .evaluateCandidate(
            candidate
          );

      let evaluation:
        AdvertisingAiCandidateEvaluationResult;

      if (
        preflight.decision ===
        "fail"
      ) {
        evaluation =
          preflight;
      }
      else {
        evaluation =
          await dependencies
            .independentEvaluation
            .evaluate({
              candidate,
              incumbent,
            });
      }

      const updated =
        await dependencies
          .repository
          .applyEvaluationDecision({
            candidate,
            incumbent,
            evaluation,
            decidedAt:
              nowIso(
                now
              ),
          });

      if (
        evaluation.decision ===
          "pass" &&
        updated.status !==
          "promoted"
      ) {
        throw new Error(
          "Advertising AI passing candidate was not promoted."
        );
      }

      if (
        evaluation.decision ===
          "fail" &&
        updated.status !==
          "rejected"
      ) {
        throw new Error(
          "Advertising AI failing candidate was not rejected."
        );
      }

      return {
        evaluation,
        model:
          updated,
      };
    },

    async rollback(
      input
    ) {
      const reason =
        input.reason.trim();

      if (!reason) {
        throw new Error(
          "Advertising AI rollback reason is required."
        );
      }

      const target =
        await dependencies
          .repository
          .findByModelId(
            input.targetModelId
          );

      if (
        target ===
        null
      ) {
        throw new Error(
          "Advertising AI rollback target was not found."
        );
      }

      if (
        target.status !==
        "retired"
      ) {
        throw new Error(
          "Advertising AI rollback target must be retired."
        );
      }

      const updated =
        await dependencies
          .repository
          .rollbackToModel({
            target,
            reason,
            rolledBackAt:
              nowIso(
                now
              ),
          });

      if (
        updated.status !==
        "promoted"
      ) {
        throw new Error(
          "Advertising AI rollback did not activate target model."
        );
      }

      return updated;
    },
  };
}