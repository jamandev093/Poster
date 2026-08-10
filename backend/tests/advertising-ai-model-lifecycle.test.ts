import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdvertisingAiModelLifecycleService,
  type AdvertisingAiCandidateEvaluationResult,
  type AdvertisingAiModelRegistryRepository,
  type AdvertisingAiStoredModel,
} from "../src/application/advertising-ai/index.js";

function stored(
  status:
    "candidate" |
    "promoted" |
    "rejected" |
    "retired",

  modelId:
    string
):
  AdvertisingAiStoredModel {
  return {
    id:
      modelId,

    modelId,

    modelType:
      "hashed_logistic_ad_response_v1",

    trainingEngineVersion:
      "hashed-logistic-ad-response-v1",

    featureVersion:
      "advertising-campaign-placement-v1",

    featureDimension:
      256,

    datasetId:
      "00000000-0000-4000-8000-000000000301",

    datasetChecksum:
      `sha256:${"a".repeat(64)}`,

    modelChecksum:
      `sha256:${"b".repeat(64)}`,

    status,

    trainedAt:
      "2026-08-10T17:00:00.000Z",

    materializedEventCount:
      10000,

    labeledEventCount:
      10000,

    trainingEventCount:
      8000,

    trainingPositiveCount:
      1600,

    trainingNegativeCount:
      6400,

    intercept:
      -1,

    weights:
      Array(
        256
      ).fill(
        0
      ),

    validationEventCount:
      2000,

    validationPositiveCount:
      400,

    validationNegativeCount:
      1600,

    validationAccuracy:
      0.8,

    validationLogLoss:
      0.4,

    validationRocAuc:
      0.7,

    rejectionReason:
      status ===
        "rejected"
        ? "failed"
        : null,

    createdAt:
      "2026-08-10T17:00:00.000Z",

    promotedAt:
      status ===
        "promoted"
        ? "2026-08-10T18:00:00.000Z"
        : null,

    rejectedAt:
      status ===
        "rejected"
        ? "2026-08-10T18:00:00.000Z"
        : null,

    retiredAt:
      status ===
        "retired"
        ? "2026-08-10T18:00:00.000Z"
        : null,
  };
}

const PASS:
  AdvertisingAiCandidateEvaluationResult =
{
  decision:
    "pass",

  reason:
    "independent_candidate_beats_incumbent",

  baselineLogLoss:
    0.6,

  candidateLogLoss:
    0.4,

  candidateRocAuc:
    0.7,

  candidateAccuracy:
    0.8,

  validationEventCount:
    2000,

  validationPositiveCount:
    400,

  validationNegativeCount:
    1600,
};

function repository(
  candidate:
    AdvertisingAiStoredModel,

  incumbent:
    AdvertisingAiStoredModel |
    null
):
  AdvertisingAiModelRegistryRepository {
  return {
    registerCandidate:
      vi.fn(),

    findByModelId:
      vi.fn(
        async (
          modelId:
            string
        ) => {
          if (
            modelId ===
            candidate.modelId
          ) {
            return candidate;
          }

          if (
            incumbent !==
              null &&
            modelId ===
            incumbent.modelId
          ) {
            return incumbent;
          }

          return null;
        }
      ),

    getPromotedModel:
      vi.fn(
        async () =>
          incumbent
      ),

    recordEvaluation:
      vi.fn(),

    rejectCandidate:
      vi.fn(),

    applyEvaluationDecision:
      vi.fn(
        async input =>
          ({
            ...input.candidate,
            status:
              input.evaluation
                .decision ===
                "pass"
                ? "promoted"
                : "rejected",
          })
      ),

    rollbackToModel:
      vi.fn(
        async input =>
          ({
            ...input.target,
            status:
              "promoted",
            retiredAt:
              null,
          })
      ),
  };
}

describe(
  "Advertising AI model lifecycle",
  () => {

    it(
      "promotes only after preflight and independent evaluation pass",
      async () => {
        const candidate =
          stored(
            "candidate",
            "candidate"
          );

        const incumbent =
          stored(
            "promoted",
            "incumbent"
          );

        const repo =
          repository(
            candidate,
            incumbent
          );

        const service =
          createAdvertisingAiModelLifecycleService({
            repository:
              repo,

            preflightEvaluation: {
              evaluateCandidate:
                () => PASS,
            },

            independentEvaluation: {
              evaluate:
                async () =>
                  PASS,
            },

            now:
              () =>
                new Date(
                  "2026-08-10T20:00:00.000Z"
                ),
          });

        const result =
          await service
            .evaluateAndApplyCandidate(
              "candidate"
            );

        expect(
          result.model.status
        ).toBe(
          "promoted"
        );

        expect(
          repo.applyEvaluationDecision
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "does not run challenger evaluation when the preflight gate fails",
      async () => {
        const candidate =
          stored(
            "candidate",
            "candidate"
          );

        const independent =
          vi.fn();

        const repo =
          repository(
            candidate,
            null
          );

        const service =
          createAdvertisingAiModelLifecycleService({
            repository:
              repo,

            preflightEvaluation: {
              evaluateCandidate:
                () => ({
                  ...PASS,
                  decision:
                    "fail",
                  reason:
                    "candidate_worse_than_prevalence_baseline",
                }),
            },

            independentEvaluation: {
              evaluate:
                independent,
            },
          });

        const result =
          await service
            .evaluateAndApplyCandidate(
              "candidate"
            );

        expect(
          result.model.status
        ).toBe(
          "rejected"
        );

        expect(
          independent
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rolls back only to a retired historical model",
      async () => {
        const target =
          stored(
            "retired",
            "old-model"
          );

        const repo =
          repository(
            target,
            stored(
              "promoted",
              "current"
            )
          );

        const service =
          createAdvertisingAiModelLifecycleService({
            repository:
              repo,

            preflightEvaluation: {
              evaluateCandidate:
                () => PASS,
            },

            independentEvaluation: {
              evaluate:
                async () =>
                  PASS,
            },
          });

        const result =
          await service
            .rollback({
              targetModelId:
                "old-model",

              reason:
                "operator rollback after regression",
            });

        expect(
          result.status
        ).toBe(
          "promoted"
        );

        expect(
          repo.rollbackToModel
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);