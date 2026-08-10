export type PosterBrainAiLifecycleEvaluationStatus =
  | "passed"
  | "failed";

export interface PosterBrainAiModelLifecycleDatabase {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface PosterBrainAiModelEvaluationInput {
  readonly modelId: string;
  readonly status: PosterBrainAiLifecycleEvaluationStatus;
  readonly reason: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly evaluatedAt: string;
}

export interface PosterBrainAiModelEvaluationResult {
  readonly modelId: string;
  readonly state:
    | "candidate"
    | "rejected";
  readonly evaluationStatus:
    PosterBrainAiLifecycleEvaluationStatus;
  readonly rowVersion: number;
}

export interface PosterBrainAiModelPromotionResult {
  readonly promoted: boolean;
  readonly modelId: string;
  readonly previousActiveModelId: string | null;
}

export interface PosterBrainAiModelRollbackResult {
  readonly rolledBack: boolean;
  readonly activeModelId: string | null;
  readonly replacedModelId: string | null;
}

export interface PosterBrainAiModelLifecycleRepository {
  recordEvaluation(
    input: PosterBrainAiModelEvaluationInput
  ): Promise<PosterBrainAiModelEvaluationResult>;

  promoteCandidate(
    modelId: string,
    activatedAt: string
  ): Promise<PosterBrainAiModelPromotionResult>;

  rollbackActiveModel(
    rolledBackAt: string
  ): Promise<PosterBrainAiModelRollbackResult>;
}

interface EvaluationRow {
  readonly modelId: string;
  readonly state: string;
  readonly evaluationStatus: string;
  readonly rowVersion: string | number;
}

interface PromotionRow {
  readonly modelId: string;
  readonly previousActiveModelId: string | null;
}

interface RollbackRow {
  readonly activeModelId: string;
  readonly replacedModelId: string;
}

function cleanText(
  value: string,
  field: string
): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(
      `Poster Brain AI model lifecycle ${field} cannot be empty.`
    );
  }

  return cleaned;
}

function normalizeTimestamp(
  value: string,
  field: string
): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Poster Brain AI model lifecycle ${field} is invalid.`
    );
  }

  return parsed.toISOString();
}

function parseRowVersion(
  value: string | number
): number {
  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    throw new Error(
      "Poster Brain AI model lifecycle rowVersion is invalid."
    );
  }

  return parsed;
}

export class PostgreSqlPosterBrainAiModelLifecycleRepository
  implements PosterBrainAiModelLifecycleRepository
{
  constructor(
    private readonly database:
      PosterBrainAiModelLifecycleDatabase
  ) {}

  async recordEvaluation(
    input: PosterBrainAiModelEvaluationInput
  ): Promise<PosterBrainAiModelEvaluationResult> {
    const modelId =
      cleanText(input.modelId, "modelId");

    const reason =
      cleanText(input.reason, "evaluation reason");

    const evaluatedAt =
      normalizeTimestamp(
        input.evaluatedAt,
        "evaluatedAt"
      );

    const result =
      await this.database.query<EvaluationRow>(
        `
          UPDATE app.poster_brain_ai_model_versions
          SET
            evaluation_status = $2,
            evaluation_reason = $3,
            evaluation_payload = $4::jsonb,
            evaluated_at = $5::timestamptz,
            state = CASE
              WHEN $2 = 'failed'
                THEN 'rejected'
              ELSE state
            END,
            rejected_at = CASE
              WHEN $2 = 'failed'
                THEN $5::timestamptz
              ELSE rejected_at
            END,
            updated_at = $5::timestamptz,
            row_version = row_version + 1
          WHERE
            model_id = $1
            AND state = 'candidate'
            AND evaluation_status = 'pending'
          RETURNING
            model_id AS "modelId",
            state AS "state",
            evaluation_status AS "evaluationStatus",
            row_version AS "rowVersion";
        `,
        [
          modelId,
          input.status,
          reason,
          JSON.stringify(input.payload),
          evaluatedAt,
        ]
      );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "Poster Brain AI model is not a pending candidate."
      );
    }

    if (
      row.state !== "candidate" &&
      row.state !== "rejected"
    ) {
      throw new Error(
        "Poster Brain AI evaluation returned invalid model state."
      );
    }

    if (
      row.evaluationStatus !== "passed" &&
      row.evaluationStatus !== "failed"
    ) {
      throw new Error(
        "Poster Brain AI evaluation returned invalid status."
      );
    }

    return {
      modelId: row.modelId,
      state: row.state,
      evaluationStatus:
        row.evaluationStatus,
      rowVersion:
        parseRowVersion(row.rowVersion),
    };
  }

  async promoteCandidate(
    rawModelId: string,
    rawActivatedAt: string
  ): Promise<PosterBrainAiModelPromotionResult> {
    const modelId =
      cleanText(rawModelId, "modelId");

    const activatedAt =
      normalizeTimestamp(
        rawActivatedAt,
        "activatedAt"
      );

    const result =
      await this.database.query<PromotionRow>(
        `
          WITH
          guard AS (
            SELECT
              pg_advisory_xact_lock(
                710082026
              )
          ),

          candidate AS (
            SELECT
              model_id
            FROM
              app.poster_brain_ai_model_versions,
              guard
            WHERE
              model_id = $1
              AND state = 'candidate'
              AND evaluation_status = 'passed'
          ),

          demoted AS (
            UPDATE
              app.poster_brain_ai_model_versions
            SET
              state = 'rollback',
              updated_at = $2::timestamptz,
              row_version = row_version + 1
            WHERE
              state = 'active'
              AND EXISTS (
                SELECT 1
                FROM candidate
              )
            RETURNING
              model_id
          ),

          previous AS (
            SELECT
              model_id
            FROM demoted

            UNION ALL

            SELECT
              NULL::text
            WHERE NOT EXISTS (
              SELECT 1
              FROM demoted
            )
          ),

          promoted AS (
            UPDATE
              app.poster_brain_ai_model_versions AS model
            SET
              state = 'active',
              activated_at = $2::timestamptz,
              previous_active_model_id =
                previous.model_id,
              updated_at = $2::timestamptz,
              row_version = model.row_version + 1
            FROM
              candidate,
              previous
            WHERE
              model.model_id =
                candidate.model_id
            RETURNING
              model.model_id AS "modelId",
              model.previous_active_model_id
                AS "previousActiveModelId"
          )

          SELECT
            "modelId",
            "previousActiveModelId"
          FROM promoted;
        `,
        [
          modelId,
          activatedAt,
        ]
      );

    const row = result.rows[0];

    if (!row) {
      return {
        promoted: false,
        modelId,
        previousActiveModelId: null,
      };
    }

    return {
      promoted: true,
      modelId: row.modelId,
      previousActiveModelId:
        row.previousActiveModelId,
    };
  }

  async rollbackActiveModel(
    rawRolledBackAt: string
  ): Promise<PosterBrainAiModelRollbackResult> {
    const rolledBackAt =
      normalizeTimestamp(
        rawRolledBackAt,
        "rolledBackAt"
      );

    const result =
      await this.database.query<RollbackRow>(
        `
          WITH
          guard AS (
            SELECT
              pg_advisory_xact_lock(
                710082026
              )
          ),

          current_active AS (
            SELECT
              model_id,
              previous_active_model_id
            FROM
              app.poster_brain_ai_model_versions,
              guard
            WHERE
              state = 'active'
            LIMIT 1
          ),

          target AS (
            SELECT
              previous.model_id
            FROM
              app.poster_brain_ai_model_versions
                AS previous,
              current_active
            WHERE
              previous.model_id =
                current_active.previous_active_model_id
              AND previous.state = 'rollback'
              AND previous.evaluation_status = 'passed'
          ),

          demoted AS (
            UPDATE
              app.poster_brain_ai_model_versions
                AS current
            SET
              state = 'rollback',
              updated_at = $1::timestamptz,
              row_version =
                current.row_version + 1
            FROM
              current_active,
              target
            WHERE
              current.model_id =
                current_active.model_id
            RETURNING
              current.model_id
          ),

          promoted AS (
            UPDATE
              app.poster_brain_ai_model_versions
                AS previous
            SET
              state = 'active',
              activated_at = $1::timestamptz,
              updated_at = $1::timestamptz,
              row_version =
                previous.row_version + 1
            FROM
              target,
              demoted
            WHERE
              previous.model_id =
                target.model_id
            RETURNING
              previous.model_id
                AS "activeModelId",
              demoted.model_id
                AS "replacedModelId"
          )

          SELECT
            "activeModelId",
            "replacedModelId"
          FROM promoted;
        `,
        [
          rolledBackAt,
        ]
      );

    const row = result.rows[0];

    if (!row) {
      return {
        rolledBack: false,
        activeModelId: null,
        replacedModelId: null,
      };
    }

    return {
      rolledBack: true,
      activeModelId: row.activeModelId,
      replacedModelId:
        row.replacedModelId,
    };
  }
}

export function createPostgreSqlPosterBrainAiModelLifecycleRepository(
  database: PosterBrainAiModelLifecycleDatabase
): PosterBrainAiModelLifecycleRepository {
  return new PostgreSqlPosterBrainAiModelLifecycleRepository(
    database
  );
}