import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiModelLifecycleRepository,
} from "../src/application/poster-brain/ai-model-lifecycle.repository.js";

import {
  createPosterBrainAiModelLifecycleService,
  evaluatePosterBrainAiModelCandidate,
} from "../src/application/poster-brain/ai-model-lifecycle.service.js";

import type {
  PosterBrainAiModelLifecycleRepository,
} from "../src/application/poster-brain/ai-model-lifecycle.repository.js";

import type {
  PosterBrainAiModelRegistryRepository,
  PosterBrainAiModelVersion,
} from "../src/application/poster-brain/ai-model-registry.repository.js";

function model(input: {
  readonly modelId: string;
  readonly state:
    | "candidate"
    | "active"
    | "rollback"
    | "rejected";
  readonly evaluationStatus:
    | "pending"
    | "passed"
    | "failed";
  readonly accuracy: number;
  readonly logLoss: number;
  readonly rocAuc: number | null;
}): PosterBrainAiModelVersion {
  return {
    modelId:
      input.modelId,

    state:
      input.state,

    modelType:
      "hashed_logistic_engagement_v1",

    trainingEngineVersion:
      "hashed-logistic-engagement-v1",

    featureVersion:
      "poster-content-features-v1",

    featureDimension:
      512,

    datasetId:
      "11111111-1111-4111-8111-111111111111",

    datasetChecksum:
      "sha256:" + "a".repeat(64),

    modelChecksum:
      "sha256:" +
      (
        input.modelId === "candidate"
          ? "b"
          : "c"
      ).repeat(64),

    trainedAt:
      "2026-08-10T06:00:00.000Z",

    materializedEventCount:
      10000,

    labeledEventCount:
      500,

    trainingEventCount:
      400,

    trainingPositiveCount:
      240,

    trainingNegativeCount:
      160,

    metrics: {
      validationEventCount:
        100,

      validationPositiveCount:
        60,

      validationNegativeCount:
        40,

      accuracy:
        input.accuracy,

      logLoss:
        input.logLoss,

      rocAuc:
        input.rocAuc,
    },

    artifact: {
      weights:
        Array(512).fill(0),
    },

    evaluationStatus:
      input.evaluationStatus,

    evaluationReason:
      null,

    evaluationPayload:
      null,

    evaluatedAt:
      null,

    activatedAt:
      input.state === "active"
        ? "2026-08-10T06:30:00.000Z"
        : null,

    rejectedAt:
      null,

    previousActiveModelId:
      null,

    createdAt:
      "2026-08-10T06:00:00.000Z",

    updatedAt:
      "2026-08-10T06:00:00.000Z",

    rowVersion:
      1,
  };
}

describe(
  "Poster Brain AI model lifecycle",
  () => {

    it(
      "passes a strong first candidate against baseline",
      () => {
        const candidate =
          model({
            modelId:
              "candidate",

            state:
              "candidate",

            evaluationStatus:
              "pending",

            accuracy:
              0.84,

            logLoss:
              0.42,

            rocAuc:
              0.88,
          });

        const decision =
          evaluatePosterBrainAiModelCandidate(
            candidate,
            null
          );

        expect(
          decision.passed
        ).toBe(true);

        expect(
          decision.reason
        ).toBe(
          "candidate_beats_baseline"
        );
      }
    );

    it(
      "blocks a candidate with no measurable improvement",
      () => {
        const candidate =
          model({
            modelId:
              "candidate",

            state:
              "candidate",

            evaluationStatus:
              "pending",

            accuracy:
              0.84,

            logLoss:
              0.42,

            rocAuc:
              0.88,
          });

        const active =
          model({
            modelId:
              "active",

            state:
              "active",

            evaluationStatus:
              "passed",

            accuracy:
              0.84,

            logLoss:
              0.42,

            rocAuc:
              0.88,
          });

        const decision =
          evaluatePosterBrainAiModelCandidate(
            candidate,
            active
          );

        expect(
          decision.passed
        ).toBe(false);

        expect(
          decision.reason
        ).toBe(
          "candidate_has_no_measurable_improvement"
        );
      }
    );

    it(
      "persists passed evaluation then promotes",
      async () => {
        const candidate =
          model({
            modelId:
              "candidate",

            state:
              "candidate",

            evaluationStatus:
              "pending",

            accuracy:
              0.88,

            logLoss:
              0.36,

            rocAuc:
              0.92,
          });

        const active =
          model({
            modelId:
              "active",

            state:
              "active",

            evaluationStatus:
              "passed",

            accuracy:
              0.80,

            logLoss:
              0.50,

            rocAuc:
              0.80,
          });

        const evaluations:
          string[] =
          [];

        const lifecycle:
          PosterBrainAiModelLifecycleRepository = {
            async recordEvaluation(
              input
            ) {
              evaluations.push(
                input.status
              );

              return {
                modelId:
                  input.modelId,

                state:
                  "candidate",

                evaluationStatus:
                  input.status,

                rowVersion:
                  2,
              };
            },

            async promoteCandidate(
              modelId
            ) {
              return {
                promoted:
                  true,

                modelId,

                previousActiveModelId:
                  "active",
              };
            },

            async rollbackActiveModel() {
              return {
                rolledBack:
                  false,

                activeModelId:
                  null,

                replacedModelId:
                  null,
              };
            },
          };

        const registry:
          PosterBrainAiModelRegistryRepository = {
            async createCandidate() {
              return candidate;
            },

            async getModel() {
              return candidate;
            },

            async getActiveModel() {
              return active;
            },
          };

        const service =
          createPosterBrainAiModelLifecycleService({
            modelRegistryRepository:
              registry,

            lifecycleRepository:
              lifecycle,

            now:
              () =>
                "2026-08-10T07:00:00.000Z",
          });

        const result =
          await service
            .evaluateAndPromoteCandidate(
              "candidate"
            );

        expect(
          evaluations
        ).toEqual([
          "passed",
        ]);

        expect(
          result.promoted
        ).toBe(true);

        expect(
          result.previousActiveModelId
        ).toBe(
          "active"
        );
      }
    );

    it(
      "rejects failed evaluation without promotion",
      async () => {
        const candidate =
          model({
            modelId:
              "candidate",

            state:
              "candidate",

            evaluationStatus:
              "pending",

            accuracy:
              0.40,

            logLoss:
              0.90,

            rocAuc:
              0.40,
          });

        let promotionCalled =
          false;

        const lifecycle:
          PosterBrainAiModelLifecycleRepository = {
            async recordEvaluation(
              input
            ) {
              return {
                modelId:
                  input.modelId,

                state:
                  "rejected",

                evaluationStatus:
                  "failed",

                rowVersion:
                  2,
              };
            },

            async promoteCandidate(
              modelId
            ) {
              promotionCalled =
                true;

              return {
                promoted:
                  false,

                modelId,

                previousActiveModelId:
                  null,
              };
            },

            async rollbackActiveModel() {
              return {
                rolledBack:
                  false,

                activeModelId:
                  null,

                replacedModelId:
                  null,
              };
            },
          };

        const registry:
          PosterBrainAiModelRegistryRepository = {
            async createCandidate() {
              return candidate;
            },

            async getModel() {
              return candidate;
            },

            async getActiveModel() {
              return null;
            },
          };

        const service =
          createPosterBrainAiModelLifecycleService({
            modelRegistryRepository:
              registry,

            lifecycleRepository:
              lifecycle,
          });

        const result =
          await service
            .evaluateAndPromoteCandidate(
              "candidate"
            );

        expect(
          result.evaluationStatus
        ).toBe(
          "failed"
        );

        expect(
          result.promoted
        ).toBe(false);

        expect(
          promotionCalled
        ).toBe(false);
      }
    );

    it(
      "uses serialized atomic promotion SQL",
      async () => {
        const calls:
          string[] =
          [];

        const repository =
          createPostgreSqlPosterBrainAiModelLifecycleRepository({
            async query<Row>(
              text: string
            ) {
              calls.push(text);

              return {
                rows: [
                  {
                    modelId:
                      "candidate",

                    previousActiveModelId:
                      "active",
                  } as Row,
                ],
              };
            },
          });

        const result =
          await repository
            .promoteCandidate(
              "candidate",
              "2026-08-10T07:00:00.000Z"
            );

        expect(
          result.promoted
        ).toBe(true);

        expect(
          calls[0]
        ).toContain(
          "pg_advisory_xact_lock"
        );

        expect(
          calls[0]
        ).toContain(
          "state = 'rollback'"
        );

        expect(
          calls[0]
        ).toContain(
          "state = 'active'"
        );

        expect(
          calls[0]
        ).toContain(
          "evaluation_status = 'passed'"
        );
      }
    );

    it(
      "uses previous active model as rollback target",
      async () => {
        const calls:
          string[] =
          [];

        const repository =
          createPostgreSqlPosterBrainAiModelLifecycleRepository({
            async query<Row>(
              text: string
            ) {
              calls.push(text);

              return {
                rows: [
                  {
                    activeModelId:
                      "previous",

                    replacedModelId:
                      "current",
                  } as Row,
                ],
              };
            },
          });

        const result =
          await repository
            .rollbackActiveModel(
              "2026-08-10T07:10:00.000Z"
            );

        expect(
          result
        ).toEqual({
          rolledBack:
            true,

          activeModelId:
            "previous",

          replacedModelId:
            "current",
        });

        expect(
          calls[0]
        ).toContain(
          "previous_active_model_id"
        );

        expect(
          calls[0]
        ).toContain(
          "previous.state = 'rollback'"
        );

        expect(
          calls[0]
        ).toContain(
          "previous.evaluation_status = 'passed'"
        );
      }
    );
  }
);