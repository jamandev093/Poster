import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiModelRegistryRepository,
  type AdvertisingAiModelRegistryDatabase,
  type AdvertisingAiTrainingCandidateModel,
} from "../src/application/advertising-ai/index.js";

class Database
  implements AdvertisingAiModelRegistryDatabase {
  readonly calls:
    {
      readonly text:
        string;

      readonly values:
        readonly unknown[] |
        undefined;
    }[] =
    [];

  constructor(
    private readonly responses:
      readonly (
        readonly Record<
          string,
          unknown
        >[]
      )[]
  ) {}

  async query<Row>(
    text:
      string,

    values?:
      readonly unknown[]
  ) {
    this.calls.push({
      text,
      values,
    });

    return {
      rows:
        (
          this.responses[
            this.calls.length -
            1
          ] ??
          []
        ) as
          readonly Row[],
    };
  }
}

const MODEL_ROW = {
  id:
    "00000000-0000-4000-8000-000000000901",

  model_id:
    "poster-ad-response-v1-test",

  model_type:
    "hashed_logistic_ad_response_v1",

  training_engine_version:
    "hashed-logistic-ad-response-v1",

  feature_version:
    "advertising-campaign-placement-v1",

  feature_dimension:
    256,

  dataset_id:
    "00000000-0000-4000-8000-000000000301",

  dataset_checksum:
    `sha256:${"a".repeat(64)}`,

  model_checksum:
    `sha256:${"b".repeat(64)}`,

  status:
    "candidate",

  trained_at:
    new Date(
      "2026-08-10T17:00:00.000Z"
    ),

  materialized_event_count:
    "10000",

  labeled_event_count:
    "10000",

  training_event_count:
    "8000",

  training_positive_count:
    "1600",

  training_negative_count:
    "6400",

  intercept:
    -1.2,

  weights:
    Array(
      256
    ).fill(
      0
    ),

  validation_event_count:
    "2000",

  validation_positive_count:
    "400",

  validation_negative_count:
    "1600",

  validation_accuracy:
    0.84,

  validation_log_loss:
    0.4,

  validation_roc_auc:
    0.72,

  rejection_reason:
    null,

  created_at:
    new Date(
      "2026-08-10T17:01:00.000Z"
    ),

  promoted_at:
    null,

  rejected_at:
    null,

  retired_at:
    null,
};

const CANDIDATE:
  AdvertisingAiTrainingCandidateModel =
{
  modelId:
    MODEL_ROW.model_id,

  modelType:
    "hashed_logistic_ad_response_v1",

  trainingEngineVersion:
    MODEL_ROW.training_engine_version,

  featureVersion:
    MODEL_ROW.feature_version,

  featureDimension:
    256,

  datasetId:
    MODEL_ROW.dataset_id,

  datasetChecksum:
    MODEL_ROW.dataset_checksum,

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
    -1.2,

  weights:
    Array(
      256
    ).fill(
      0
    ),

  metrics: {
    validationEventCount:
      2000,

    validationPositiveCount:
      400,

    validationNegativeCount:
      1600,

    accuracy:
      0.84,

    logLoss:
      0.4,

    rocAuc:
      0.72,
  },

  modelChecksum:
    MODEL_ROW.model_checksum,
};

describe(
  "Advertising AI persistent model registry",
  () => {

    it(
      "stores the complete immutable candidate artifact",
      async () => {
        const database =
          new Database([
            [
              MODEL_ROW,
            ],
          ]);

        const repository =
          createAdvertisingAiModelRegistryRepository(
            database
          );

        const result =
          await repository
            .registerCandidate({
              candidate:
                CANDIDATE,
            });

        expect(
          result.status
        ).toBe(
          "candidate"
        );

        expect(
          result.weights
        ).toHaveLength(
          256
        );

        expect(
          database.calls[0]
            ?.text
        ).toContain(
          "app.advertising_ai_models"
        );

        expect(
          database.calls[0]
            ?.values
        ).toContain(
          CANDIDATE.modelChecksum
        );
      }
    );

    it(
      "reads only the single promoted model",
      async () => {
        const database =
          new Database([
            [
              {
                ...MODEL_ROW,
                status:
                  "promoted",
                promoted_at:
                  new Date(
                    "2026-08-10T18:00:00.000Z"
                  ),
              },
            ],
          ]);

        const repository =
          createAdvertisingAiModelRegistryRepository(
            database
          );

        const result =
          await repository
            .getPromotedModel();

        expect(
          result?.status
        ).toBe(
          "promoted"
        );

        expect(
          database.calls[0]
            ?.text
        ).toContain(
          "'promoted'"
        );
      }
    );

    it(
      "persists independent evaluation decisions",
      async () => {
        const database =
          new Database([
            [
              {
                id:
                  "00000000-0000-4000-8000-000000000999",

                candidate_model_id:
                  MODEL_ROW.id,

                incumbent_model_id:
                  null,

                decision:
                  "pass",

                reason:
                  "candidate_quality_gate_passed",

                baseline_log_loss:
                  0.5004,

                candidate_log_loss:
                  0.4,

                candidate_roc_auc:
                  0.72,

                candidate_accuracy:
                  0.84,

                validation_event_count:
                  "2000",

                validation_positive_count:
                  "400",

                validation_negative_count:
                  "1600",

                evaluated_at:
                  new Date(
                    "2026-08-10T18:00:00.000Z"
                  ),
              },
            ],
          ]);

        const repository =
          createAdvertisingAiModelRegistryRepository(
            database
          );

        const result =
          await repository
            .recordEvaluation({
              candidateModelId:
                MODEL_ROW.id,

              incumbentModelId:
                null,

              evaluation: {
                decision:
                  "pass",

                reason:
                  "candidate_quality_gate_passed",

                baselineLogLoss:
                  0.5004,

                candidateLogLoss:
                  0.4,

                candidateRocAuc:
                  0.72,

                candidateAccuracy:
                  0.84,

                validationEventCount:
                  2000,

                validationPositiveCount:
                  400,

                validationNegativeCount:
                  1600,
              },
            });

        expect(
          result.decision
        ).toBe(
          "pass"
        );
      }
    );
  }
);