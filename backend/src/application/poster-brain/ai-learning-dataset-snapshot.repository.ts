import type {
  PosterBrainAiLearningDatasetEvent,
  PosterBrainAiLearningDatasetSchemaVersion,
} from "./ai-learning-dataset.types.js";

export type PosterBrainAiLearningDatasetSnapshotStatus =
  | "building"
  | "ready"
  | "failed"
  | "consumed";

export interface PosterBrainAiLearningDatasetSnapshot {
  readonly id:
    string;

  readonly schemaVersion:
    PosterBrainAiLearningDatasetSchemaVersion;

  readonly status:
    PosterBrainAiLearningDatasetSnapshotStatus;

  readonly sourceEventCount:
    number;

  readonly materializedEventCount:
    number;

  readonly materializedContentCount:
    number;

  readonly sourceCutoffAt:
    string;

  readonly firstEventAt:
    string |
    null;

  readonly lastEventAt:
    string |
    null;

  readonly datasetChecksum:
    string |
    null;

  readonly failureReason:
    string |
    null;

  readonly createdAt:
    string;

  readonly completedAt:
    string |
    null;
}

export interface PosterBrainAiLearningDatasetSnapshotDatabase {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface CreatePosterBrainAiLearningDatasetSnapshotInput {
  readonly schemaVersion:
    PosterBrainAiLearningDatasetSchemaVersion;

  readonly sourceEventCount:
    number;

  readonly sourceCutoffAt:
    string;
}

export interface AppendPosterBrainAiLearningDatasetSnapshotPageInput {
  readonly datasetId:
    string;

  readonly events:
    readonly PosterBrainAiLearningDatasetEvent[];
}

export interface AppendPosterBrainAiLearningDatasetSnapshotPageResult {
  readonly insertedContentCount:
    number;

  readonly insertedEventCount:
    number;
}

export interface CompletePosterBrainAiLearningDatasetSnapshotInput {
  readonly datasetId:
    string;

  readonly materializedEventCount:
    number;

  readonly materializedContentCount:
    number;

  readonly firstEventAt:
    string |
    null;

  readonly lastEventAt:
    string |
    null;

  readonly datasetChecksum:
    string;

  readonly completedAt:
    string;
}

export interface FailPosterBrainAiLearningDatasetSnapshotInput {
  readonly datasetId:
    string;

  readonly failureReason:
    string;

  readonly completedAt:
    string;
}

export interface PosterBrainAiLearningDatasetSnapshotRepository {
  createBuildingSnapshot(
    input:
      CreatePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot>;

  appendPage(
    input:
      AppendPosterBrainAiLearningDatasetSnapshotPageInput
  ): Promise<AppendPosterBrainAiLearningDatasetSnapshotPageResult>;

  completeSnapshot(
    input:
      CompletePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot>;

  failSnapshot(
    input:
      FailPosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot>;
}

interface SnapshotRow {
  readonly id:
    string;

  readonly schemaVersion:
    number;

  readonly status:
    string;

  readonly sourceEventCount:
    string |
    number;

  readonly materializedEventCount:
    string |
    number;

  readonly materializedContentCount:
    string |
    number;

  readonly sourceCutoffAt:
    string |
    Date;

  readonly firstEventAt:
    string |
    Date |
    null;

  readonly lastEventAt:
    string |
    Date |
    null;

  readonly datasetChecksum:
    string |
    null;

  readonly failureReason:
    string |
    null;

  readonly createdAt:
    string |
    Date;

  readonly completedAt:
    string |
    Date |
    null;
}

interface InsertCountRow {
  readonly insertedCount:
    string |
    number;
}

function parseCount(
  value:
    string |
    number,
  fieldName:
    string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `Invalid Poster Brain dataset snapshot count: ${fieldName}`
    );
  }

  return Math.trunc(
    parsed
  );
}

function parseSchemaVersion(
  value:
    number
): PosterBrainAiLearningDatasetSchemaVersion {
  if (value !== 1) {
    throw new Error(
      `Unsupported Poster Brain learning dataset schema version: ${value}`
    );
  }

  return value;
}

function parseStatus(
  value:
    string
): PosterBrainAiLearningDatasetSnapshotStatus {
  switch (value) {
    case "building":
    case "ready":
    case "failed":
    case "consumed":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain learning dataset snapshot status: ${value}`
      );
  }
}

function normalizeTimestamp(
  value:
    string |
    Date,
  fieldName:
    string
): string {
  const parsed =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid Poster Brain dataset snapshot timestamp: ${fieldName}`
    );
  }

  return parsed.toISOString();
}

function normalizeNullableTimestamp(
  value:
    string |
    Date |
    null,
  fieldName:
    string
): string |
  null {
  if (value === null) {
    return null;
  }

  return normalizeTimestamp(
    value,
    fieldName
  );
}

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
      `Poster Brain dataset snapshot ${fieldName} cannot be empty.`
    );
  }

  return cleaned;
}

function mapSnapshotRow(
  row:
    SnapshotRow
): PosterBrainAiLearningDatasetSnapshot {
  return {
    id:
      row.id,

    schemaVersion:
      parseSchemaVersion(
        row.schemaVersion
      ),

    status:
      parseStatus(
        row.status
      ),

    sourceEventCount:
      parseCount(
        row.sourceEventCount,
        "sourceEventCount"
      ),

    materializedEventCount:
      parseCount(
        row.materializedEventCount,
        "materializedEventCount"
      ),

    materializedContentCount:
      parseCount(
        row.materializedContentCount,
        "materializedContentCount"
      ),

    sourceCutoffAt:
      normalizeTimestamp(
        row.sourceCutoffAt,
        "sourceCutoffAt"
      ),

    firstEventAt:
      normalizeNullableTimestamp(
        row.firstEventAt,
        "firstEventAt"
      ),

    lastEventAt:
      normalizeNullableTimestamp(
        row.lastEventAt,
        "lastEventAt"
      ),

    datasetChecksum:
      row.datasetChecksum,

    failureReason:
      row.failureReason,

    createdAt:
      normalizeTimestamp(
        row.createdAt,
        "createdAt"
      ),

    completedAt:
      normalizeNullableTimestamp(
        row.completedAt,
        "completedAt"
      ),
  };
}

function snapshotReturningSql(): string {
  return `
    id::text
      AS "id",

    schema_version
      AS "schemaVersion",

    status
      AS "status",

    source_event_count
      AS "sourceEventCount",

    materialized_event_count
      AS "materializedEventCount",

    materialized_content_count
      AS "materializedContentCount",

    source_cutoff_at
      AS "sourceCutoffAt",

    first_event_at
      AS "firstEventAt",

    last_event_at
      AS "lastEventAt",

    dataset_checksum
      AS "datasetChecksum",

    failure_reason
      AS "failureReason",

    created_at
      AS "createdAt",

    completed_at
      AS "completedAt"
  `;
}

function requireSnapshotRow(
  rows:
    readonly SnapshotRow[],
  action:
    string
): PosterBrainAiLearningDatasetSnapshot {
  const row =
    rows[0];

  if (!row) {
    throw new Error(
      `Poster Brain learning dataset snapshot ${action} returned no row.`
    );
  }

  return mapSnapshotRow(
    row
  );
}

function createContentPayload(
  events:
    readonly PosterBrainAiLearningDatasetEvent[]
): readonly Record<string, unknown>[] {
  const unique =
    new Map<
      string,
      Record<string, unknown>
    >();

  for (const event of events) {
    const content =
      event.content;

    if (
      unique.has(
        content.contentId
      )
    ) {
      continue;
    }

    unique.set(
      content.contentId,
      {
        contentId:
          content.contentId,

        sourceKey:
          content.sourceKey,

        publisherName:
          content.publisherName,

        title:
          content.title,

        excerpt:
          content.excerpt,

        mediaType:
          content.mediaType,

        languageCode:
          content.languageCode,

        regionCode:
          content.regionCode,

        category:
          content.category,

        canonicalTopicIds:
          content.canonicalTopicIds,

        evolvingTopicIds:
          content.evolvingTopicIds,

        tags:
          content.tags,

        searchKeywords:
          content.searchKeywords,

        aiClassification:
          content.aiClassification,

        qualityScore:
          content.qualityScore,

        publishedAt:
          content.publishedAt,

        contentStatus:
          content.contentStatus,
      }
    );
  }

  return [
    ...unique.values(),
  ];
}

function createEventPayload(
  events:
    readonly PosterBrainAiLearningDatasetEvent[]
): readonly Record<string, unknown>[] {
  return events.map(
    (
      event
    ) => ({
      eventKey:
        event.eventKey,

      source:
        event.source,

      sourceEventId:
        event.sourceEventId,

      signalType:
        event.signalType,

      occurredAt:
        event.occurredAt,

      surface:
        event.surface,

      reasonId:
        event.reasonId,

      reportStatus:
        event.reportStatus,

      bookmarkActive:
        event.bookmarkActive,

      contentId:
        event.content.contentId,
    })
  );
}

export class PostgreSqlPosterBrainAiLearningDatasetSnapshotRepository
  implements PosterBrainAiLearningDatasetSnapshotRepository
{
  constructor(
    private readonly database:
      PosterBrainAiLearningDatasetSnapshotDatabase
  ) {}

  async createBuildingSnapshot(
    input:
      CreatePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    if (
      !Number.isSafeInteger(
        input.sourceEventCount
      ) ||
      input.sourceEventCount < 0
    ) {
      throw new Error(
        "Poster Brain dataset snapshot sourceEventCount must be a non-negative safe integer."
      );
    }

    const sourceCutoffAt =
      normalizeTimestamp(
        input.sourceCutoffAt,
        "sourceCutoffAt"
      );

    const result =
      await this.database.query<
        SnapshotRow
      >(
        `
          INSERT INTO app.poster_brain_ai_learning_datasets (
            schema_version,
            status,
            source_event_count,
            source_cutoff_at
          )
          VALUES (
            $1,
            'building',
            $2,
            $3::timestamptz
          )
          RETURNING
            ${snapshotReturningSql()}
        `,
        [
          input.schemaVersion,
          input.sourceEventCount,
          sourceCutoffAt,
        ]
      );

    return requireSnapshotRow(
      result.rows,
      "creation"
    );
  }

  async appendPage(
    input:
      AppendPosterBrainAiLearningDatasetSnapshotPageInput
  ): Promise<AppendPosterBrainAiLearningDatasetSnapshotPageResult> {
    const datasetId =
      cleanRequiredText(
        input.datasetId,
        "datasetId"
      );

    if (
      input.events.length === 0
    ) {
      return {
        insertedContentCount:
          0,

        insertedEventCount:
          0,
      };
    }

    const contentPayload =
      createContentPayload(
        input.events
      );

    const eventPayload =
      createEventPayload(
        input.events
      );

    const contents =
      await this.database.query<
        InsertCountRow
      >(
        `
          WITH input_rows AS (
            SELECT
              *
            FROM jsonb_to_recordset(
              $2::jsonb
            ) AS row_data (
              "contentId" text,
              "sourceKey" text,
              "publisherName" text,
              "title" text,
              "excerpt" text,
              "mediaType" text,
              "languageCode" text,
              "regionCode" text,
              "category" text,
              "canonicalTopicIds" jsonb,
              "evolvingTopicIds" jsonb,
              "tags" jsonb,
              "searchKeywords" jsonb,
              "aiClassification" jsonb,
              "qualityScore" numeric,
              "publishedAt" timestamptz,
              "contentStatus" text
            )
          ),

          inserted AS (
            INSERT INTO app.poster_brain_ai_learning_dataset_contents (
              dataset_id,
              content_id,
              source_key,
              publisher_name,
              title,
              excerpt,
              media_type,
              language_code,
              region_code,
              category,
              canonical_topic_ids,
              evolving_topic_ids,
              tags,
              search_keywords,
              ai_classification,
              quality_score,
              published_at,
              content_status
            )
            SELECT
              $1::uuid,
              "contentId"::uuid,
              "sourceKey",
              "publisherName",
              "title",
              "excerpt",
              "mediaType",
              "languageCode",
              "regionCode",
              "category",
              "canonicalTopicIds",
              "evolvingTopicIds",
              "tags",
              "searchKeywords",
              "aiClassification",
              "qualityScore",
              "publishedAt",
              "contentStatus"
            FROM input_rows
            ON CONFLICT (
              dataset_id,
              content_id
            )
            DO NOTHING
            RETURNING 1
          )

          SELECT
            COUNT(*)::bigint
              AS "insertedCount"
          FROM inserted
        `,
        [
          datasetId,
          JSON.stringify(
            contentPayload
          ),
        ]
      );

    const events =
      await this.database.query<
        InsertCountRow
      >(
        `
          WITH input_rows AS (
            SELECT
              *
            FROM jsonb_to_recordset(
              $2::jsonb
            ) AS row_data (
              "eventKey" text,
              "source" text,
              "sourceEventId" text,
              "signalType" text,
              "occurredAt" timestamptz,
              "surface" text,
              "reasonId" text,
              "reportStatus" text,
              "bookmarkActive" boolean,
              "contentId" text
            )
          ),

          inserted AS (
            INSERT INTO app.poster_brain_ai_learning_dataset_events (
              dataset_id,
              event_key,
              source,
              source_event_id,
              signal_type,
              occurred_at,
              surface,
              reason_id,
              report_status,
              bookmark_active,
              content_id
            )
            SELECT
              $1::uuid,
              "eventKey",
              "source",
              "sourceEventId",
              "signalType",
              "occurredAt",
              "surface",
              "reasonId",
              "reportStatus",
              "bookmarkActive",
              "contentId"::uuid
            FROM input_rows
            ON CONFLICT (
              dataset_id,
              event_key
            )
            DO NOTHING
            RETURNING 1
          )

          SELECT
            COUNT(*)::bigint
              AS "insertedCount"
          FROM inserted
        `,
        [
          datasetId,
          JSON.stringify(
            eventPayload
          ),
        ]
      );

    return {
      insertedContentCount:
        parseCount(
          contents.rows[0]
            ?.insertedCount ??
            0,
          "insertedContentCount"
        ),

      insertedEventCount:
        parseCount(
          events.rows[0]
            ?.insertedCount ??
            0,
          "insertedEventCount"
        ),
    };
  }

  async completeSnapshot(
    input:
      CompletePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    const datasetId =
      cleanRequiredText(
        input.datasetId,
        "datasetId"
      );

    const checksum =
      cleanRequiredText(
        input.datasetChecksum,
        "datasetChecksum"
      );

    if (
      !Number.isSafeInteger(
        input.materializedEventCount
      ) ||
      input.materializedEventCount < 0
    ) {
      throw new Error(
        "Poster Brain dataset snapshot materializedEventCount must be a non-negative safe integer."
      );
    }

    if (
      !Number.isSafeInteger(
        input.materializedContentCount
      ) ||
      input.materializedContentCount < 0
    ) {
      throw new Error(
        "Poster Brain dataset snapshot materializedContentCount must be a non-negative safe integer."
      );
    }

    const firstEventAt =
      input.firstEventAt === null
        ? null
        : normalizeTimestamp(
            input.firstEventAt,
            "firstEventAt"
          );

    const lastEventAt =
      input.lastEventAt === null
        ? null
        : normalizeTimestamp(
            input.lastEventAt,
            "lastEventAt"
          );

    const completedAt =
      normalizeTimestamp(
        input.completedAt,
        "completedAt"
      );

    const result =
      await this.database.query<
        SnapshotRow
      >(
        `
          UPDATE app.poster_brain_ai_learning_datasets
          SET
            status =
              'ready',

            materialized_event_count =
              $2,

            materialized_content_count =
              $3,

            first_event_at =
              $4::timestamptz,

            last_event_at =
              $5::timestamptz,

            dataset_checksum =
              $6,

            failure_reason =
              NULL,

            completed_at =
              $7::timestamptz

          WHERE
            id =
              $1::uuid
            AND status =
              'building'

          RETURNING
            ${snapshotReturningSql()}
        `,
        [
          datasetId,
          input.materializedEventCount,
          input.materializedContentCount,
          firstEventAt,
          lastEventAt,
          checksum,
          completedAt,
        ]
      );

    return requireSnapshotRow(
      result.rows,
      "completion"
    );
  }

  async failSnapshot(
    input:
      FailPosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    const datasetId =
      cleanRequiredText(
        input.datasetId,
        "datasetId"
      );

    const failureReason =
      cleanRequiredText(
        input.failureReason,
        "failureReason"
      );

    const completedAt =
      normalizeTimestamp(
        input.completedAt,
        "completedAt"
      );

    const result =
      await this.database.query<
        SnapshotRow
      >(
        `
          UPDATE app.poster_brain_ai_learning_datasets
          SET
            status =
              'failed',

            failure_reason =
              $2,

            completed_at =
              $3::timestamptz

          WHERE
            id =
              $1::uuid
            AND status =
              'building'

          RETURNING
            ${snapshotReturningSql()}
        `,
        [
          datasetId,
          failureReason,
          completedAt,
        ]
      );

    return requireSnapshotRow(
      result.rows,
      "failure update"
    );
  }
}

export function createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
  database:
    PosterBrainAiLearningDatasetSnapshotDatabase
): PosterBrainAiLearningDatasetSnapshotRepository {
  return new PostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
    database
  );
}