import type {
  AdvertisingAiCandidateRegistrationInput,
  AdvertisingAiCandidateEvaluationResult,
  AdvertisingAiStoredEvaluation,
  AdvertisingAiStoredModel,
} from "./advertising-ai-model-lifecycle.types.js";

interface QueryResult<Row> {
  readonly rows:
    readonly Row[];
}

export interface AdvertisingAiModelRegistryDatabase {
  query<Row>(
    text:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      QueryResult<Row>
    >;
}

interface ModelRow {
  readonly id:
    string;

  readonly model_id:
    string;

  readonly model_type:
    "hashed_logistic_ad_response_v1";

  readonly training_engine_version:
    string;

  readonly feature_version:
    string;

  readonly feature_dimension:
    number;

  readonly dataset_id:
    string;

  readonly dataset_checksum:
    string;

  readonly model_checksum:
    string;

  readonly status:
    "candidate" |
    "promoted" |
    "rejected" |
    "retired";

  readonly trained_at:
    string |
    Date;

  readonly materialized_event_count:
    string |
    number;

  readonly labeled_event_count:
    string |
    number;

  readonly training_event_count:
    string |
    number;

  readonly training_positive_count:
    string |
    number;

  readonly training_negative_count:
    string |
    number;

  readonly intercept:
    number;

  readonly weights:
    readonly number[] |
    string;

  readonly validation_event_count:
    string |
    number;

  readonly validation_positive_count:
    string |
    number;

  readonly validation_negative_count:
    string |
    number;

  readonly validation_accuracy:
    number;

  readonly validation_log_loss:
    number;

  readonly validation_roc_auc:
    number |
    null;

  readonly rejection_reason:
    string |
    null;

  readonly created_at:
    string |
    Date;

  readonly promoted_at:
    string |
    Date |
    null;

  readonly rejected_at:
    string |
    Date |
    null;

  readonly retired_at:
    string |
    Date |
    null;
}

interface EvaluationRow {
  readonly id:
    string;

  readonly candidate_model_id:
    string;

  readonly incumbent_model_id:
    string |
    null;

  readonly decision:
    "pass" |
    "fail";

  readonly reason:
    string;

  readonly baseline_log_loss:
    number;

  readonly candidate_log_loss:
    number;

  readonly candidate_roc_auc:
    number |
    null;

  readonly candidate_accuracy:
    number;

  readonly validation_event_count:
    string |
    number;

  readonly validation_positive_count:
    string |
    number;

  readonly validation_negative_count:
    string |
    number;

  readonly evaluated_at:
    string |
    Date;
}

export interface AdvertisingAiModelRegistryRepository {
  registerCandidate(
    input:
      AdvertisingAiCandidateRegistrationInput
  ):
    Promise<
      AdvertisingAiStoredModel
    >;

  findByModelId(
    modelId:
      string
  ):
    Promise<
      AdvertisingAiStoredModel |
      null
    >;

  getPromotedModel():
    Promise<
      AdvertisingAiStoredModel |
      null
    >;

  recordEvaluation(
    input: {
      readonly candidateModelId:
        string;

      readonly incumbentModelId:
        string |
        null;

      readonly evaluation:
        AdvertisingAiCandidateEvaluationResult;
    }
  ):
    Promise<
      AdvertisingAiStoredEvaluation
    >;

  rejectCandidate(
    input: {
      readonly modelId:
        string;

      readonly reason:
        string;

      readonly rejectedAt:
        string;
    }
  ):
    Promise<
      AdvertisingAiStoredModel
    >;
}

const MODEL_COLUMNS = `
  id,
  model_id,
  model_type,
  training_engine_version,
  feature_version,
  feature_dimension,
  dataset_id,
  dataset_checksum,
  model_checksum,
  status,
  trained_at,
  materialized_event_count,
  labeled_event_count,
  training_event_count,
  training_positive_count,
  training_negative_count,
  intercept,
  weights,
  validation_event_count,
  validation_positive_count,
  validation_negative_count,
  validation_accuracy,
  validation_log_loss,
  validation_roc_auc,
  rejection_reason,
  created_at,
  promoted_at,
  rejected_at,
  retired_at
`;

function timestamp(
  value:
    string |
    Date
): string {
  const parsed =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      "Advertising AI registry timestamp is invalid."
    );
  }

  return parsed.toISOString();
}

function nullableTimestamp(
  value:
    string |
    Date |
    null
): string | null {
  return value === null
    ? null
    : timestamp(
        value
      );
}

function integer(
  value:
    string |
    number,

  field:
    string
): number {
  const result =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      result
    ) ||
    result < 0
  ) {
    throw new Error(
      `Advertising AI registry ${field} is invalid.`
    );
  }

  return result;
}

function weights(
  value:
    readonly number[] |
    string
): readonly number[] {
  const result =
    typeof value ===
      "string"
      ? JSON.parse(
          value
        ) as
          unknown
      : value;

  if (
    !Array.isArray(
      result
    ) ||
    result.length !==
      256 ||
    result.some(
      item =>
        typeof item !==
          "number" ||
        !Number.isFinite(
          item
        )
    )
  ) {
    throw new Error(
      "Advertising AI registry weights are invalid."
    );
  }

  return result;
}

function model(
  row:
    ModelRow
): AdvertisingAiStoredModel {
  if (
    row.feature_dimension !==
    256
  ) {
    throw new Error(
      "Advertising AI registry feature dimension is invalid."
    );
  }

  return {
    id:
      row.id,

    modelId:
      row.model_id,

    modelType:
      row.model_type,

    trainingEngineVersion:
      row.training_engine_version,

    featureVersion:
      row.feature_version,

    featureDimension:
      256,

    datasetId:
      row.dataset_id,

    datasetChecksum:
      row.dataset_checksum,

    modelChecksum:
      row.model_checksum,

    status:
      row.status,

    trainedAt:
      timestamp(
        row.trained_at
      ),

    materializedEventCount:
      integer(
        row.materialized_event_count,
        "materialized event count"
      ),

    labeledEventCount:
      integer(
        row.labeled_event_count,
        "labeled event count"
      ),

    trainingEventCount:
      integer(
        row.training_event_count,
        "training event count"
      ),

    trainingPositiveCount:
      integer(
        row.training_positive_count,
        "training positive count"
      ),

    trainingNegativeCount:
      integer(
        row.training_negative_count,
        "training negative count"
      ),

    intercept:
      row.intercept,

    weights:
      weights(
        row.weights
      ),

    validationEventCount:
      integer(
        row.validation_event_count,
        "validation event count"
      ),

    validationPositiveCount:
      integer(
        row.validation_positive_count,
        "validation positive count"
      ),

    validationNegativeCount:
      integer(
        row.validation_negative_count,
        "validation negative count"
      ),

    validationAccuracy:
      row.validation_accuracy,

    validationLogLoss:
      row.validation_log_loss,

    validationRocAuc:
      row.validation_roc_auc,

    rejectionReason:
      row.rejection_reason,

    createdAt:
      timestamp(
        row.created_at
      ),

    promotedAt:
      nullableTimestamp(
        row.promoted_at
      ),

    rejectedAt:
      nullableTimestamp(
        row.rejected_at
      ),

    retiredAt:
      nullableTimestamp(
        row.retired_at
      ),
  };
}

function evaluation(
  row:
    EvaluationRow
): AdvertisingAiStoredEvaluation {
  return {
    id:
      row.id,

    candidateModelId:
      row.candidate_model_id,

    incumbentModelId:
      row.incumbent_model_id,

    decision:
      row.decision,

    reason:
      row.reason,

    baselineLogLoss:
      row.baseline_log_loss,

    candidateLogLoss:
      row.candidate_log_loss,

    candidateRocAuc:
      row.candidate_roc_auc,

    candidateAccuracy:
      row.candidate_accuracy,

    validationEventCount:
      integer(
        row.validation_event_count,
        "evaluation validation event count"
      ),

    validationPositiveCount:
      integer(
        row.validation_positive_count,
        "evaluation validation positive count"
      ),

    validationNegativeCount:
      integer(
        row.validation_negative_count,
        "evaluation validation negative count"
      ),

    evaluatedAt:
      timestamp(
        row.evaluated_at
      ),
  };
}

function requireModel(
  rows:
    readonly ModelRow[],

  operation:
    string
): AdvertisingAiStoredModel {
  const row =
    rows[0];

  if (row === undefined) {
    throw new Error(
      `Advertising AI registry ${operation} returned no row.`
    );
  }

  return model(
    row
  );
}

export function createAdvertisingAiModelRegistryRepository(
  database:
    AdvertisingAiModelRegistryDatabase
): AdvertisingAiModelRegistryRepository {
  return {
    async registerCandidate(
      input
    ) {
      const candidate =
        input.candidate;

      const result =
        await database
          .query<ModelRow>(
            `
              INSERT INTO app.advertising_ai_models (
                model_id,
                model_type,
                training_engine_version,
                feature_version,
                feature_dimension,
                dataset_id,
                dataset_checksum,
                model_checksum,
                status,
                trained_at,
                materialized_event_count,
                labeled_event_count,
                training_event_count,
                training_positive_count,
                training_negative_count,
                intercept,
                weights,
                validation_event_count,
                validation_positive_count,
                validation_negative_count,
                validation_accuracy,
                validation_log_loss,
                validation_roc_auc
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6::uuid,
                $7,
                $8,
                'candidate',
                $9::timestamptz,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16::jsonb,
                $17,
                $18,
                $19,
                $20,
                $21,
                $22
              )
              ON CONFLICT (
                model_checksum
              )
              DO UPDATE SET
                model_checksum =
                  EXCLUDED.model_checksum
              RETURNING
                ${MODEL_COLUMNS}
            `,
            [
              candidate.modelId,
              candidate.modelType,
              candidate.trainingEngineVersion,
              candidate.featureVersion,
              candidate.featureDimension,
              candidate.datasetId,
              candidate.datasetChecksum,
              candidate.modelChecksum,
              candidate.trainedAt,
              candidate.materializedEventCount,
              candidate.labeledEventCount,
              candidate.trainingEventCount,
              candidate.trainingPositiveCount,
              candidate.trainingNegativeCount,
              candidate.intercept,
              JSON.stringify(
                candidate.weights
              ),
              candidate.metrics
                .validationEventCount,
              candidate.metrics
                .validationPositiveCount,
              candidate.metrics
                .validationNegativeCount,
              candidate.metrics
                .accuracy,
              candidate.metrics
                .logLoss,
              candidate.metrics
                .rocAuc,
            ]
          );

      return requireModel(
        result.rows,
        "candidate registration"
      );
    },

    async findByModelId(
      modelId
    ) {
      const result =
        await database
          .query<ModelRow>(
            `
              SELECT
                ${MODEL_COLUMNS}

              FROM app.advertising_ai_models

              WHERE
                model_id =
                  $1

              LIMIT 1
            `,
            [
              modelId,
            ]
          );

      const row =
        result.rows[0];

      return row === undefined
        ? null
        : model(
            row
          );
    },

    async getPromotedModel() {
      const result =
        await database
          .query<ModelRow>(
            `
              SELECT
                ${MODEL_COLUMNS}

              FROM app.advertising_ai_models

              WHERE
                status =
                  'promoted'

              ORDER BY
                promoted_at DESC

              LIMIT 1
            `
          );

      const row =
        result.rows[0];

      return row === undefined
        ? null
        : model(
            row
          );
    },

    async recordEvaluation(
      input
    ) {
      const result =
        await database
          .query<EvaluationRow>(
            `
              INSERT INTO app.advertising_ai_model_evaluations (
                candidate_model_id,
                incumbent_model_id,
                decision,
                reason,
                baseline_log_loss,
                candidate_log_loss,
                candidate_roc_auc,
                candidate_accuracy,
                validation_event_count,
                validation_positive_count,
                validation_negative_count
              )
              VALUES (
                $1::uuid,
                $2::uuid,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11
              )
              RETURNING
                id,
                candidate_model_id,
                incumbent_model_id,
                decision,
                reason,
                baseline_log_loss,
                candidate_log_loss,
                candidate_roc_auc,
                candidate_accuracy,
                validation_event_count,
                validation_positive_count,
                validation_negative_count,
                evaluated_at
            `,
            [
              input.candidateModelId,
              input.incumbentModelId,
              input.evaluation.decision,
              input.evaluation.reason,
              input.evaluation.baselineLogLoss,
              input.evaluation.candidateLogLoss,
              input.evaluation.candidateRocAuc,
              input.evaluation.candidateAccuracy,
              input.evaluation.validationEventCount,
              input.evaluation.validationPositiveCount,
              input.evaluation.validationNegativeCount,
            ]
          );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Advertising AI evaluation persistence returned no row."
        );
      }

      return evaluation(
        row
      );
    },

    async rejectCandidate(
      input
    ) {
      const result =
        await database
          .query<ModelRow>(
            `
              UPDATE app.advertising_ai_models
              SET
                status =
                  'rejected',

                rejection_reason =
                  $2,

                rejected_at =
                  $3::timestamptz

              WHERE
                model_id =
                  $1

                AND status =
                  'candidate'

              RETURNING
                ${MODEL_COLUMNS}
            `,
            [
              input.modelId,
              input.reason,
              input.rejectedAt,
            ]
          );

      return requireModel(
        result.rows,
        "candidate rejection"
      );
    },
  };
}