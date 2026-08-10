export type PosterBrainAiModelVersionState =
  | "candidate"
  | "active"
  | "rollback"
  | "rejected";

export type PosterBrainAiModelEvaluationStatus =
  | "pending"
  | "passed"
  | "failed";

export interface PosterBrainAiModelMetrics {
  readonly validationEventCount:
    number;

  readonly validationPositiveCount:
    number;

  readonly validationNegativeCount:
    number;

  readonly accuracy:
    number;

  readonly logLoss:
    number;

  readonly rocAuc:
    number |
    null;
}

export interface CreatePosterBrainAiModelCandidateInput {
  readonly modelId:
    string;

  readonly modelType:
    string;

  readonly trainingEngineVersion:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    number;

  readonly datasetId:
    string;

  readonly datasetChecksum:
    string;

  readonly modelChecksum:
    string;

  readonly trainedAt:
    string;

  readonly materializedEventCount:
    number;

  readonly labeledEventCount:
    number;

  readonly trainingEventCount:
    number;

  readonly trainingPositiveCount:
    number;

  readonly trainingNegativeCount:
    number;

  readonly metrics:
    PosterBrainAiModelMetrics;

  readonly artifact:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface PosterBrainAiModelVersion {
  readonly modelId:
    string;

  readonly state:
    PosterBrainAiModelVersionState;

  readonly modelType:
    string;

  readonly trainingEngineVersion:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    number;

  readonly datasetId:
    string;

  readonly datasetChecksum:
    string;

  readonly modelChecksum:
    string;

  readonly trainedAt:
    string;

  readonly materializedEventCount:
    number;

  readonly labeledEventCount:
    number;

  readonly trainingEventCount:
    number;

  readonly trainingPositiveCount:
    number;

  readonly trainingNegativeCount:
    number;

  readonly metrics:
    PosterBrainAiModelMetrics;

  readonly artifact:
    Readonly<
      Record<
        string,
        unknown
      >
    >;

  readonly evaluationStatus:
    PosterBrainAiModelEvaluationStatus;

  readonly evaluationReason:
    string |
    null;

  readonly evaluationPayload:
    Readonly<
      Record<
        string,
        unknown
      >
    > |
    null;

  readonly evaluatedAt:
    string |
    null;

  readonly activatedAt:
    string |
    null;

  readonly rejectedAt:
    string |
    null;

  readonly previousActiveModelId:
    string |
    null;

  readonly createdAt:
    string;

  readonly updatedAt:
    string;

  readonly rowVersion:
    number;
}

export interface PosterBrainAiModelRegistryDatabase {
  query<Row>(
    text:
      string,

    values?:
      readonly unknown[]
  ): Promise<{
    rows:
      readonly Row[];
  }>;
}

export interface PosterBrainAiModelRegistryRepository {
  createCandidate(
    input:
      CreatePosterBrainAiModelCandidateInput
  ): Promise<
    PosterBrainAiModelVersion
  >;

  getModel(
    modelId:
      string
  ): Promise<
    PosterBrainAiModelVersion |
    null
  >;

  getActiveModel():
    Promise<
      PosterBrainAiModelVersion |
      null
    >;
}

interface PosterBrainAiModelVersionRow {
  readonly modelId:
    string;

  readonly state:
    string;

  readonly modelType:
    string;

  readonly trainingEngineVersion:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    string |
    number;

  readonly datasetId:
    string;

  readonly datasetChecksum:
    string;

  readonly modelChecksum:
    string;

  readonly trainedAt:
    string |
    Date;

  readonly materializedEventCount:
    string |
    number;

  readonly labeledEventCount:
    string |
    number;

  readonly trainingEventCount:
    string |
    number;

  readonly trainingPositiveCount:
    string |
    number;

  readonly trainingNegativeCount:
    string |
    number;

  readonly validationEventCount:
    string |
    number;

  readonly validationPositiveCount:
    string |
    number;

  readonly validationNegativeCount:
    string |
    number;

  readonly validationAccuracy:
    string |
    number;

  readonly validationLogLoss:
    string |
    number;

  readonly validationRocAuc:
    string |
    number |
    null;

  readonly artifact:
    unknown;

  readonly evaluationStatus:
    string;

  readonly evaluationReason:
    string |
    null;

  readonly evaluationPayload:
    unknown;

  readonly evaluatedAt:
    string |
    Date |
    null;

  readonly activatedAt:
    string |
    Date |
    null;

  readonly rejectedAt:
    string |
    Date |
    null;

  readonly previousActiveModelId:
    string |
    null;

  readonly createdAt:
    string |
    Date;

  readonly updatedAt:
    string |
    Date;

  readonly rowVersion:
    string |
    number;
}

const MODEL_SELECT = `
  SELECT
    model_id
      AS "modelId",

    state
      AS "state",

    model_type
      AS "modelType",

    training_engine_version
      AS "trainingEngineVersion",

    feature_version
      AS "featureVersion",

    feature_dimension
      AS "featureDimension",

    dataset_id::text
      AS "datasetId",

    dataset_checksum
      AS "datasetChecksum",

    model_checksum
      AS "modelChecksum",

    trained_at
      AS "trainedAt",

    materialized_event_count
      AS "materializedEventCount",

    labeled_event_count
      AS "labeledEventCount",

    training_event_count
      AS "trainingEventCount",

    training_positive_count
      AS "trainingPositiveCount",

    training_negative_count
      AS "trainingNegativeCount",

    validation_event_count
      AS "validationEventCount",

    validation_positive_count
      AS "validationPositiveCount",

    validation_negative_count
      AS "validationNegativeCount",

    validation_accuracy
      AS "validationAccuracy",

    validation_log_loss
      AS "validationLogLoss",

    validation_roc_auc
      AS "validationRocAuc",

    artifact
      AS "artifact",

    evaluation_status
      AS "evaluationStatus",

    evaluation_reason
      AS "evaluationReason",

    evaluation_payload
      AS "evaluationPayload",

    evaluated_at
      AS "evaluatedAt",

    activated_at
      AS "activatedAt",

    rejected_at
      AS "rejectedAt",

    previous_active_model_id
      AS "previousActiveModelId",

    created_at
      AS "createdAt",

    updated_at
      AS "updatedAt",

    row_version
      AS "rowVersion"
`;

const CHECKSUM_PATTERN =
  /^sha256:[0-9a-f]{64}$/i;

const FORBIDDEN_ARTIFACT_KEYS =
  new Set([
    "userId",
    "user_id",
    "reportDetails",
    "report_details",
    "details",
    "metadata",
    "mobileAdInteractions",
    "mobile_ad_interactions",
    "adTelemetry",
    "ad_telemetry",
  ]);

function cleanRequiredText(
  value:
    string,
  fieldName:
    string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new Error(
      `Poster Brain AI model ${fieldName} cannot be empty.`
    );
  }

  return cleaned;
}

function parseSafeInteger(
  value:
    string |
    number,
  fieldName:
    string,
  minimum:
    number = 0
): number {
  const parsed =
    typeof value ===
    "number"
      ? value
      : Number(
          value
        );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed <
      minimum
  ) {
    throw new Error(
      `Invalid Poster Brain AI model integer: ${fieldName}`
    );
  }

  return parsed;
}

function parseFiniteNumber(
  value:
    string |
    number,
  fieldName:
    string
): number {
  const parsed =
    typeof value ===
    "number"
      ? value
      : Number(
          value
        );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    throw new Error(
      `Invalid Poster Brain AI model number: ${fieldName}`
    );
  }

  return parsed;
}

function parseProbability(
  value:
    string |
    number,
  fieldName:
    string
): number {
  const parsed =
    parseFiniteNumber(
      value,
      fieldName
    );

  if (
    parsed < 0 ||
    parsed > 1
  ) {
    throw new Error(
      `Invalid Poster Brain AI model probability: ${fieldName}`
    );
  }

  return parsed;
}

function normalizeTimestamp(
  value:
    string |
    Date,
  fieldName:
    string
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Invalid Poster Brain AI model timestamp: ${fieldName}`
    );
  }

  return date.toISOString();
}

function normalizeOptionalTimestamp(
  value:
    string |
    Date |
    null,
  fieldName:
    string
): string |
  null {
  return value ===
    null
    ? null
    : normalizeTimestamp(
        value,
        fieldName
      );
}

function normalizeChecksum(
  value:
    string,
  fieldName:
    string
): string {
  const cleaned =
    cleanRequiredText(
      value,
      fieldName
    ).toLowerCase();

  if (
    !CHECKSUM_PATTERN.test(
      cleaned
    )
  ) {
    throw new Error(
      `Invalid Poster Brain AI model checksum: ${fieldName}`
    );
  }

  return cleaned;
}

function assertJsonValue(
  value:
    unknown,
  path:
    string
): void {
  if (
    value ===
      null ||
    typeof value ===
      "string" ||
    typeof value ===
      "boolean"
  ) {
    return;
  }

  if (
    typeof value ===
    "number"
  ) {
    if (
      !Number.isFinite(
        value
      )
    ) {
      throw new Error(
        `Poster Brain AI model JSON contains a non-finite number at ${path}.`
      );
    }

    return;
  }

  if (
    Array.isArray(
      value
    )
  ) {
    value.forEach(
      (
        item,
        index
      ) => {
        assertJsonValue(
          item,
          `${path}[${index}]`
        );
      }
    );

    return;
  }

  if (
    typeof value ===
      "object"
  ) {
    for (
      const [
        key,
        child,
      ] of Object.entries(
        value
      )
    ) {
      if (
        FORBIDDEN_ARTIFACT_KEYS.has(
          key
        )
      ) {
        throw new Error(
          `Poster Brain AI model artifact contains forbidden field: ${key}`
        );
      }

      assertJsonValue(
        child,
        `${path}.${key}`
      );
    }

    return;
  }

  throw new Error(
    `Poster Brain AI model artifact contains a non-JSON value at ${path}.`
  );
}

function normalizeJsonRecord(
  value:
    unknown,
  fieldName:
    string
): Readonly<
  Record<
    string,
    unknown
  >
> {
  let parsed =
    value;

  if (
    typeof parsed ===
    "string"
  ) {
    try {
      parsed =
        JSON.parse(
          parsed
        );
    }
    catch {
      throw new Error(
        `Invalid Poster Brain AI model JSON object: ${fieldName}`
      );
    }
  }

  if (
    parsed ===
      null ||
    typeof parsed !==
      "object" ||
    Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      `Invalid Poster Brain AI model JSON object: ${fieldName}`
    );
  }

  assertJsonValue(
    parsed,
    fieldName
  );

  return parsed as Readonly<
    Record<
      string,
      unknown
    >
  >;
}

function normalizeOptionalJsonRecord(
  value:
    unknown,
  fieldName:
    string
): Readonly<
  Record<
    string,
    unknown
  >
> |
  null {
  return value ===
      null ||
    value ===
      undefined
    ? null
    : normalizeJsonRecord(
        value,
        fieldName
      );
}

function parseState(
  value:
    string
): PosterBrainAiModelVersionState {
  switch (value) {
    case "candidate":
    case "active":
    case "rollback":
    case "rejected":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain AI model state: ${value}`
      );
  }
}

function parseEvaluationStatus(
  value:
    string
): PosterBrainAiModelEvaluationStatus {
  switch (value) {
    case "pending":
    case "passed":
    case "failed":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain AI model evaluation status: ${value}`
      );
  }
}

function validateCandidateInput(
  input:
    CreatePosterBrainAiModelCandidateInput
): CreatePosterBrainAiModelCandidateInput {
  const materializedEventCount =
    parseSafeInteger(
      input.materializedEventCount,
      "materializedEventCount",
      10000
    );

  const labeledEventCount =
    parseSafeInteger(
      input.labeledEventCount,
      "labeledEventCount"
    );

  const trainingEventCount =
    parseSafeInteger(
      input.trainingEventCount,
      "trainingEventCount"
    );

  const trainingPositiveCount =
    parseSafeInteger(
      input.trainingPositiveCount,
      "trainingPositiveCount"
    );

  const trainingNegativeCount =
    parseSafeInteger(
      input.trainingNegativeCount,
      "trainingNegativeCount"
    );

  const validationEventCount =
    parseSafeInteger(
      input.metrics.validationEventCount,
      "validationEventCount"
    );

  const validationPositiveCount =
    parseSafeInteger(
      input.metrics.validationPositiveCount,
      "validationPositiveCount"
    );

  const validationNegativeCount =
    parseSafeInteger(
      input.metrics.validationNegativeCount,
      "validationNegativeCount"
    );

  if (
    labeledEventCount >
      materializedEventCount ||
    trainingEventCount >
      labeledEventCount
  ) {
    throw new Error(
      "Poster Brain AI model event counts are inconsistent."
    );
  }

  if (
    trainingPositiveCount +
      trainingNegativeCount !==
    trainingEventCount
  ) {
    throw new Error(
      "Poster Brain AI model training class counts do not reconcile."
    );
  }

  if (
    validationPositiveCount +
      validationNegativeCount !==
    validationEventCount
  ) {
    throw new Error(
      "Poster Brain AI model validation class counts do not reconcile."
    );
  }

  const rocAuc =
    input.metrics.rocAuc ===
      null
      ? null
      : parseProbability(
          input.metrics.rocAuc,
          "rocAuc"
        );

  return {
    modelId:
      cleanRequiredText(
        input.modelId,
        "modelId"
      ),

    modelType:
      cleanRequiredText(
        input.modelType,
        "modelType"
      ),

    trainingEngineVersion:
      cleanRequiredText(
        input.trainingEngineVersion,
        "trainingEngineVersion"
      ),

    featureVersion:
      cleanRequiredText(
        input.featureVersion,
        "featureVersion"
      ),

    featureDimension:
      parseSafeInteger(
        input.featureDimension,
        "featureDimension",
        1
      ),

    datasetId:
      cleanRequiredText(
        input.datasetId,
        "datasetId"
      ),

    datasetChecksum:
      normalizeChecksum(
        input.datasetChecksum,
        "datasetChecksum"
      ),

    modelChecksum:
      normalizeChecksum(
        input.modelChecksum,
        "modelChecksum"
      ),

    trainedAt:
      normalizeTimestamp(
        input.trainedAt,
        "trainedAt"
      ),

    materializedEventCount,

    labeledEventCount,

    trainingEventCount,

    trainingPositiveCount,

    trainingNegativeCount,

    metrics: {
      validationEventCount,

      validationPositiveCount,

      validationNegativeCount,

      accuracy:
        parseProbability(
          input.metrics.accuracy,
          "accuracy"
        ),

      logLoss:
        (() => {
          const value =
            parseFiniteNumber(
              input.metrics.logLoss,
              "logLoss"
            );

          if (value < 0) {
            throw new Error(
              "Poster Brain AI model logLoss cannot be negative."
            );
          }

          return value;
        })(),

      rocAuc,
    },

    artifact:
      normalizeJsonRecord(
        input.artifact,
        "artifact"
      ),
  };
}

function mapModelVersion(
  row:
    PosterBrainAiModelVersionRow
): PosterBrainAiModelVersion {
  return {
    modelId:
      cleanRequiredText(
        row.modelId,
        "modelId"
      ),

    state:
      parseState(
        row.state
      ),

    modelType:
      cleanRequiredText(
        row.modelType,
        "modelType"
      ),

    trainingEngineVersion:
      cleanRequiredText(
        row.trainingEngineVersion,
        "trainingEngineVersion"
      ),

    featureVersion:
      cleanRequiredText(
        row.featureVersion,
        "featureVersion"
      ),

    featureDimension:
      parseSafeInteger(
        row.featureDimension,
        "featureDimension",
        1
      ),

    datasetId:
      cleanRequiredText(
        row.datasetId,
        "datasetId"
      ),

    datasetChecksum:
      normalizeChecksum(
        row.datasetChecksum,
        "datasetChecksum"
      ),

    modelChecksum:
      normalizeChecksum(
        row.modelChecksum,
        "modelChecksum"
      ),

    trainedAt:
      normalizeTimestamp(
        row.trainedAt,
        "trainedAt"
      ),

    materializedEventCount:
      parseSafeInteger(
        row.materializedEventCount,
        "materializedEventCount",
        10000
      ),

    labeledEventCount:
      parseSafeInteger(
        row.labeledEventCount,
        "labeledEventCount"
      ),

    trainingEventCount:
      parseSafeInteger(
        row.trainingEventCount,
        "trainingEventCount"
      ),

    trainingPositiveCount:
      parseSafeInteger(
        row.trainingPositiveCount,
        "trainingPositiveCount"
      ),

    trainingNegativeCount:
      parseSafeInteger(
        row.trainingNegativeCount,
        "trainingNegativeCount"
      ),

    metrics: {
      validationEventCount:
        parseSafeInteger(
          row.validationEventCount,
          "validationEventCount"
        ),

      validationPositiveCount:
        parseSafeInteger(
          row.validationPositiveCount,
          "validationPositiveCount"
        ),

      validationNegativeCount:
        parseSafeInteger(
          row.validationNegativeCount,
          "validationNegativeCount"
        ),

      accuracy:
        parseProbability(
          row.validationAccuracy,
          "validationAccuracy"
        ),

      logLoss:
        (() => {
          const value =
            parseFiniteNumber(
              row.validationLogLoss,
              "validationLogLoss"
            );

          if (value < 0) {
            throw new Error(
              "Poster Brain AI model validationLogLoss cannot be negative."
            );
          }

          return value;
        })(),

      rocAuc:
        row.validationRocAuc ===
          null
          ? null
          : parseProbability(
              row.validationRocAuc,
              "validationRocAuc"
            ),
    },

    artifact:
      normalizeJsonRecord(
        row.artifact,
        "artifact"
      ),

    evaluationStatus:
      parseEvaluationStatus(
        row.evaluationStatus
      ),

    evaluationReason:
      row.evaluationReason,

    evaluationPayload:
      normalizeOptionalJsonRecord(
        row.evaluationPayload,
        "evaluationPayload"
      ),

    evaluatedAt:
      normalizeOptionalTimestamp(
        row.evaluatedAt,
        "evaluatedAt"
      ),

    activatedAt:
      normalizeOptionalTimestamp(
        row.activatedAt,
        "activatedAt"
      ),

    rejectedAt:
      normalizeOptionalTimestamp(
        row.rejectedAt,
        "rejectedAt"
      ),

    previousActiveModelId:
      row.previousActiveModelId,

    createdAt:
      normalizeTimestamp(
        row.createdAt,
        "createdAt"
      ),

    updatedAt:
      normalizeTimestamp(
        row.updatedAt,
        "updatedAt"
      ),

    rowVersion:
      parseSafeInteger(
        row.rowVersion,
        "rowVersion",
        1
      ),
  };
}

export class PostgreSqlPosterBrainAiModelRegistryRepository
  implements PosterBrainAiModelRegistryRepository
{
  constructor(
    private readonly database:
      PosterBrainAiModelRegistryDatabase
  ) {}

  async createCandidate(
    rawInput:
      CreatePosterBrainAiModelCandidateInput
  ): Promise<
    PosterBrainAiModelVersion
  > {
    const input =
      validateCandidateInput(
        rawInput
      );

    const result =
      await this.database.query<
        PosterBrainAiModelVersionRow
      >(
        `
          INSERT INTO app.poster_brain_ai_model_versions (
            model_id,
            state,
            model_type,
            training_engine_version,
            feature_version,
            feature_dimension,
            dataset_id,
            dataset_checksum,
            model_checksum,
            trained_at,
            materialized_event_count,
            labeled_event_count,
            training_event_count,
            training_positive_count,
            training_negative_count,
            validation_event_count,
            validation_positive_count,
            validation_negative_count,
            validation_accuracy,
            validation_log_loss,
            validation_roc_auc,
            artifact,
            evaluation_status
          )
          VALUES (
            $1,
            'candidate',
            $2,
            $3,
            $4,
            $5,
            $6::uuid,
            $7,
            $8,
            $9::timestamptz,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20,
            $21::jsonb,
            'pending'
          )
          ON CONFLICT (
            model_id
          )
          DO NOTHING

          RETURNING
            model_id
              AS "modelId",

            state
              AS "state",

            model_type
              AS "modelType",

            training_engine_version
              AS "trainingEngineVersion",

            feature_version
              AS "featureVersion",

            feature_dimension
              AS "featureDimension",

            dataset_id::text
              AS "datasetId",

            dataset_checksum
              AS "datasetChecksum",

            model_checksum
              AS "modelChecksum",

            trained_at
              AS "trainedAt",

            materialized_event_count
              AS "materializedEventCount",

            labeled_event_count
              AS "labeledEventCount",

            training_event_count
              AS "trainingEventCount",

            training_positive_count
              AS "trainingPositiveCount",

            training_negative_count
              AS "trainingNegativeCount",

            validation_event_count
              AS "validationEventCount",

            validation_positive_count
              AS "validationPositiveCount",

            validation_negative_count
              AS "validationNegativeCount",

            validation_accuracy
              AS "validationAccuracy",

            validation_log_loss
              AS "validationLogLoss",

            validation_roc_auc
              AS "validationRocAuc",

            artifact
              AS "artifact",

            evaluation_status
              AS "evaluationStatus",

            evaluation_reason
              AS "evaluationReason",

            evaluation_payload
              AS "evaluationPayload",

            evaluated_at
              AS "evaluatedAt",

            activated_at
              AS "activatedAt",

            rejected_at
              AS "rejectedAt",

            previous_active_model_id
              AS "previousActiveModelId",

            created_at
              AS "createdAt",

            updated_at
              AS "updatedAt",

            row_version
              AS "rowVersion";
        `,
        [
          input.modelId,
          input.modelType,
          input.trainingEngineVersion,
          input.featureVersion,
          input.featureDimension,
          input.datasetId,
          input.datasetChecksum,
          input.modelChecksum,
          input.trainedAt,
          input.materializedEventCount,
          input.labeledEventCount,
          input.trainingEventCount,
          input.trainingPositiveCount,
          input.trainingNegativeCount,
          input.metrics.validationEventCount,
          input.metrics.validationPositiveCount,
          input.metrics.validationNegativeCount,
          input.metrics.accuracy,
          input.metrics.logLoss,
          input.metrics.rocAuc,
          JSON.stringify(
            input.artifact
          ),
        ]
      );

    const inserted =
      result.rows[0];

    if (
      inserted !==
      undefined
    ) {
      return mapModelVersion(
        inserted
      );
    }

    const existing =
      await this.getModel(
        input.modelId
      );

    if (
      existing ===
      null
    ) {
      throw new Error(
        "Poster Brain AI candidate insert did not return or persist a model."
      );
    }

    if (
      existing.modelChecksum !==
        input.modelChecksum ||
      existing.datasetChecksum !==
        input.datasetChecksum
    ) {
      throw new Error(
        `Poster Brain AI model id conflict: ${input.modelId}`
      );
    }

    return existing;
  }

  async getModel(
    modelId:
      string
  ): Promise<
    PosterBrainAiModelVersion |
    null
  > {
    const cleanedModelId =
      cleanRequiredText(
        modelId,
        "modelId"
      );

    const result =
      await this.database.query<
        PosterBrainAiModelVersionRow
      >(
        `
          ${MODEL_SELECT}

          FROM app.poster_brain_ai_model_versions

          WHERE
            model_id = $1

          LIMIT 1;
        `,
        [
          cleanedModelId,
        ]
      );

    const row =
      result.rows[0];

    return row ===
      undefined
        ? null
        : mapModelVersion(
            row
          );
  }

  async getActiveModel():
    Promise<
      PosterBrainAiModelVersion |
      null
    > {
    const result =
      await this.database.query<
        PosterBrainAiModelVersionRow
      >(
        `
          ${MODEL_SELECT}

          FROM app.poster_brain_ai_model_versions

          WHERE
            state = 'active'

          ORDER BY
            activated_at DESC,
            model_id

          LIMIT 1;
        `
      );

    const row =
      result.rows[0];

    return row ===
      undefined
        ? null
        : mapModelVersion(
            row
          );
  }
}

export function createPostgreSqlPosterBrainAiModelRegistryRepository(
  database:
    PosterBrainAiModelRegistryDatabase
): PosterBrainAiModelRegistryRepository {
  return new PostgreSqlPosterBrainAiModelRegistryRepository(
    database
  );
}