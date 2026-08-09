import {
  POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningContentFeatures,
  PosterBrainAiLearningContentStatus,
  PosterBrainAiLearningDatasetEvent,
  PosterBrainAiLearningDatasetSchemaVersion,
  PosterBrainAiLearningReportStatus,
  PosterBrainAiLearningSignalSource,
  PosterBrainAiLearningSignalType,
  PosterBrainAiLearningSurface,
} from "./ai-learning-dataset.types.js";

const DEFAULT_SNAPSHOT_READ_PAGE_LIMIT =
  1000;

const MAX_SNAPSHOT_READ_PAGE_LIMIT =
  5000;

const SNAPSHOT_CURSOR_SEPARATOR =
  "|";

export interface PosterBrainAiLearningDatasetSnapshotReadDatabase {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface PosterBrainAiLearningDatasetReadySnapshot {
  readonly id:
    string;

  readonly schemaVersion:
    PosterBrainAiLearningDatasetSchemaVersion;

  readonly status:
    "ready";

  readonly sourceEventCount:
    number;

  readonly materializedEventCount:
    number;

  readonly materializedContentCount:
    number;

  readonly sourceCutoffAt:
    string;

  readonly firstEventAt:
    string;

  readonly lastEventAt:
    string;

  readonly datasetChecksum:
    string;

  readonly createdAt:
    string;

  readonly completedAt:
    string;
}

export interface PosterBrainAiLearningDatasetSnapshotReadQuery {
  readonly datasetId:
    string;

  readonly limit?:
    number;

  readonly cursor?:
    string |
    null;
}

export interface PosterBrainAiLearningDatasetSnapshotReadPage {
  readonly events:
    readonly PosterBrainAiLearningDatasetEvent[];

  readonly nextCursor:
    string |
    null;
}

export interface PosterBrainAiLearningDatasetSnapshotReadRepository {
  getReadySnapshot(
    datasetId: string
  ): Promise<
    PosterBrainAiLearningDatasetReadySnapshot |
    null
  >;

  listReadySnapshotPage(
    query:
      PosterBrainAiLearningDatasetSnapshotReadQuery
  ): Promise<
    PosterBrainAiLearningDatasetSnapshotReadPage
  >;
}

interface ReadySnapshotRow {
  readonly id:
    string;

  readonly schemaVersion:
    string |
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
    Date;

  readonly lastEventAt:
    string |
    Date;

  readonly datasetChecksum:
    string;

  readonly createdAt:
    string |
    Date;

  readonly completedAt:
    string |
    Date;
}

interface FrozenEventRow {
  readonly eventKey:
    string;

  readonly source:
    string;

  readonly sourceEventId:
    string;

  readonly signalType:
    string;

  readonly occurredAt:
    string |
    Date;

  readonly surface:
    string |
    null;

  readonly reasonId:
    string |
    null;

  readonly reportStatus:
    string |
    null;

  readonly bookmarkActive:
    boolean |
    null;

  readonly contentId:
    string;

  readonly sourceKey:
    string |
    null;

  readonly publisherName:
    string |
    null;

  readonly title:
    string;

  readonly excerpt:
    string;

  readonly mediaType:
    string;

  readonly languageCode:
    string;

  readonly regionCode:
    string |
    null;

  readonly category:
    string |
    null;

  readonly canonicalTopicIds:
    unknown;

  readonly evolvingTopicIds:
    unknown;

  readonly tags:
    unknown;

  readonly searchKeywords:
    unknown;

  readonly aiClassification:
    unknown;

  readonly qualityScore:
    string |
    number;

  readonly publishedAt:
    string |
    Date |
    null;

  readonly contentStatus:
    string;
}

interface DecodedSnapshotCursor {
  readonly occurredAt:
    string;

  readonly eventKey:
    string;
}

function cleanRequiredText(
  value: string,
  fieldName: string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new Error(
      `Poster Brain frozen dataset ${fieldName} cannot be empty.`
    );
  }

  return cleaned;
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
      `Invalid Poster Brain frozen dataset timestamp: ${fieldName}`
    );
  }

  return date.toISOString();
}

function parseNonNegativeCount(
  value:
    string |
    number,
  fieldName:
    string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(
          value
        );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed < 0
  ) {
    throw new Error(
      `Invalid Poster Brain frozen dataset count: ${fieldName}`
    );
  }

  return parsed;
}

function parseSchemaVersion(
  value:
    string |
    number
): PosterBrainAiLearningDatasetSchemaVersion {
  const parsed =
    typeof value === "number"
      ? value
      : Number(
          value
        );

  if (
    parsed !==
    POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported Poster Brain frozen dataset schema version: ${String(value)}`
    );
  }

  return POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION;
}

function parseStringArray(
  value: unknown
): readonly string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    );
  }

  if (
    typeof value !==
    "string"
  ) {
    return [];
  }

  try {
    return parseStringArray(
      JSON.parse(
        value
      )
    );
  }
  catch {
    return [];
  }
}

function parseJsonRecord(
  value: unknown
): Readonly<
  Record<string, unknown>
> {
  if (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as Readonly<
      Record<string, unknown>
    >;
  }

  if (
    typeof value !==
    "string"
  ) {
    return {};
  }

  try {
    return parseJsonRecord(
      JSON.parse(
        value
      )
    );
  }
  catch {
    return {};
  }
}

function parseQualityScore(
  value:
    string |
    number
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
      "Invalid Poster Brain frozen dataset qualityScore."
    );
  }

  return parsed;
}

function parseSignalSource(
  value:
    string
): PosterBrainAiLearningSignalSource {
  switch (value) {
    case "organic_content_event":
    case "share":
    case "report":
    case "bookmark":
    case "article_interaction":
    case "article_feedback":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain frozen dataset signal source: ${value}`
      );
  }
}

function parseSignalType(
  value:
    string
): PosterBrainAiLearningSignalType {
  switch (value) {
    case "impression":
    case "open_original_click":
    case "share":
    case "report":
    case "bookmark":
    case "worth_reading":
    case "helpful":
    case "article_feedback":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain frozen dataset signal type: ${value}`
      );
  }
}

function parseSurface(
  value:
    string |
    null
): PosterBrainAiLearningSurface |
  null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case "home":
    case "search":
    case "trending":
    case "bookmarks":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain frozen dataset surface: ${value}`
      );
  }
}

function parseReportStatus(
  value:
    string |
    null
): PosterBrainAiLearningReportStatus |
  null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case "pending":
    case "triaged":
    case "resolved":
    case "dismissed":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain frozen dataset report status: ${value}`
      );
  }
}

function parseContentStatus(
  value:
    string
): PosterBrainAiLearningContentStatus {
  switch (value) {
    case "active":
    case "hidden":
    case "removed":
    case "copyright_blocked":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain frozen dataset content status: ${value}`
      );
  }
}

function normalizePageLimit(
  value:
    number |
    undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return DEFAULT_SNAPSHOT_READ_PAGE_LIMIT;
  }

  return Math.max(
    1,
    Math.min(
      MAX_SNAPSHOT_READ_PAGE_LIMIT,
      Math.trunc(
        value
      )
    )
  );
}

function decodeCursor(
  value:
    string |
    null |
    undefined
): DecodedSnapshotCursor |
  null {
  if (!value) {
    return null;
  }

  const separatorIndex =
    value.indexOf(
      SNAPSHOT_CURSOR_SEPARATOR
    );

  if (
    separatorIndex <= 0 ||
    separatorIndex >=
      value.length - 1
  ) {
    throw new Error(
      "Invalid Poster Brain frozen dataset cursor."
    );
  }

  const occurredAt =
    normalizeTimestamp(
      value.slice(
        0,
        separatorIndex
      ),
      "cursor.occurredAt"
    );

  const eventKey =
    cleanRequiredText(
      value.slice(
        separatorIndex + 1
      ),
      "cursor.eventKey"
    );

  return {
    occurredAt,
    eventKey,
  };
}

function encodeCursor(
  event:
    PosterBrainAiLearningDatasetEvent
): string {
  return (
    event.occurredAt +
    SNAPSHOT_CURSOR_SEPARATOR +
    event.eventKey
  );
}

function mapReadySnapshot(
  row:
    ReadySnapshotRow
): PosterBrainAiLearningDatasetReadySnapshot {
  if (
    row.status !==
    "ready"
  ) {
    throw new Error(
      "Poster Brain frozen dataset read returned a non-ready snapshot."
    );
  }

  const datasetChecksum =
    cleanRequiredText(
      row.datasetChecksum,
      "datasetChecksum"
    );

  if (
    !/^sha256:[0-9a-f]{64}$/i.test(
      datasetChecksum
    )
  ) {
    throw new Error(
      "Invalid Poster Brain frozen dataset checksum."
    );
  }

  return {
    id:
      cleanRequiredText(
        row.id,
        "id"
      ),

    schemaVersion:
      parseSchemaVersion(
        row.schemaVersion
      ),

    status:
      "ready",

    sourceEventCount:
      parseNonNegativeCount(
        row.sourceEventCount,
        "sourceEventCount"
      ),

    materializedEventCount:
      parseNonNegativeCount(
        row.materializedEventCount,
        "materializedEventCount"
      ),

    materializedContentCount:
      parseNonNegativeCount(
        row.materializedContentCount,
        "materializedContentCount"
      ),

    sourceCutoffAt:
      normalizeTimestamp(
        row.sourceCutoffAt,
        "sourceCutoffAt"
      ),

    firstEventAt:
      normalizeTimestamp(
        row.firstEventAt,
        "firstEventAt"
      ),

    lastEventAt:
      normalizeTimestamp(
        row.lastEventAt,
        "lastEventAt"
      ),

    datasetChecksum,

    createdAt:
      normalizeTimestamp(
        row.createdAt,
        "createdAt"
      ),

    completedAt:
      normalizeTimestamp(
        row.completedAt,
        "completedAt"
      ),
  };
}

function mapContent(
  row:
    FrozenEventRow
): PosterBrainAiLearningContentFeatures {
  return {
    contentId:
      cleanRequiredText(
        row.contentId,
        "contentId"
      ),

    sourceKey:
      row.sourceKey,

    publisherName:
      row.publisherName,

    title:
      row.title,

    excerpt:
      row.excerpt,

    mediaType:
      row.mediaType,

    languageCode:
      row.languageCode,

    regionCode:
      row.regionCode,

    category:
      row.category,

    canonicalTopicIds:
      parseStringArray(
        row.canonicalTopicIds
      ),

    evolvingTopicIds:
      parseStringArray(
        row.evolvingTopicIds
      ),

    tags:
      parseStringArray(
        row.tags
      ),

    searchKeywords:
      parseStringArray(
        row.searchKeywords
      ),

    aiClassification:
      parseJsonRecord(
        row.aiClassification
      ),

    qualityScore:
      parseQualityScore(
        row.qualityScore
      ),

    publishedAt:
      row.publishedAt ===
      null
        ? null
        : normalizeTimestamp(
            row.publishedAt,
            "publishedAt"
          ),

    contentStatus:
      parseContentStatus(
        row.contentStatus
      ),
  };
}

function mapFrozenEvent(
  row:
    FrozenEventRow
): PosterBrainAiLearningDatasetEvent {
  return {
    schemaVersion:
      POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,

    eventKey:
      cleanRequiredText(
        row.eventKey,
        "eventKey"
      ),

    source:
      parseSignalSource(
        row.source
      ),

    sourceEventId:
      cleanRequiredText(
        row.sourceEventId,
        "sourceEventId"
      ),

    signalType:
      parseSignalType(
        row.signalType
      ),

    occurredAt:
      normalizeTimestamp(
        row.occurredAt,
        "occurredAt"
      ),

    surface:
      parseSurface(
        row.surface
      ),

    reasonId:
      row.reasonId,

    reportStatus:
      parseReportStatus(
        row.reportStatus
      ),

    bookmarkActive:
      row.bookmarkActive,

    content:
      mapContent(
        row
      ),
  };
}

export class PostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository
  implements PosterBrainAiLearningDatasetSnapshotReadRepository
{
  constructor(
    private readonly database:
      PosterBrainAiLearningDatasetSnapshotReadDatabase
  ) {}

  async getReadySnapshot(
    datasetId:
      string
  ): Promise<
    PosterBrainAiLearningDatasetReadySnapshot |
    null
  > {
    const normalizedDatasetId =
      cleanRequiredText(
        datasetId,
        "datasetId"
      );

    const result =
      await this.database.query<
        ReadySnapshotRow
      >(
        `
          SELECT
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

            created_at
              AS "createdAt",

            completed_at
              AS "completedAt"

          FROM app.poster_brain_ai_learning_datasets

          WHERE
            id = $1::uuid
            AND status = 'ready'
            AND dataset_checksum IS NOT NULL
            AND first_event_at IS NOT NULL
            AND last_event_at IS NOT NULL
            AND completed_at IS NOT NULL

          LIMIT 1
        `,
        [
          normalizedDatasetId,
        ]
      );

    const row =
      result.rows[0];

    return row ===
      undefined
        ? null
        : mapReadySnapshot(
            row
          );
  }

  async listReadySnapshotPage(
    query:
      PosterBrainAiLearningDatasetSnapshotReadQuery
  ): Promise<
    PosterBrainAiLearningDatasetSnapshotReadPage
  > {
    const datasetId =
      cleanRequiredText(
        query.datasetId,
        "datasetId"
      );

    const limit =
      normalizePageLimit(
        query.limit
      );

    const cursor =
      decodeCursor(
        query.cursor
      );

    const result =
      await this.database.query<
        FrozenEventRow
      >(
        `
          SELECT
            e.event_key
              AS "eventKey",

            e.source
              AS "source",

            e.source_event_id
              AS "sourceEventId",

            e.signal_type
              AS "signalType",

            e.occurred_at
              AS "occurredAt",

            e.surface
              AS "surface",

            e.reason_id
              AS "reasonId",

            e.report_status
              AS "reportStatus",

            e.bookmark_active
              AS "bookmarkActive",

            c.content_id::text
              AS "contentId",

            c.source_key
              AS "sourceKey",

            c.publisher_name
              AS "publisherName",

            c.title
              AS "title",

            c.excerpt
              AS "excerpt",

            c.media_type
              AS "mediaType",

            c.language_code
              AS "languageCode",

            c.region_code
              AS "regionCode",

            c.category
              AS "category",

            c.canonical_topic_ids
              AS "canonicalTopicIds",

            c.evolving_topic_ids
              AS "evolvingTopicIds",

            c.tags
              AS "tags",

            c.search_keywords
              AS "searchKeywords",

            c.ai_classification
              AS "aiClassification",

            c.quality_score
              AS "qualityScore",

            c.published_at
              AS "publishedAt",

            c.content_status
              AS "contentStatus"

          FROM app.poster_brain_ai_learning_dataset_events e

          INNER JOIN app.poster_brain_ai_learning_dataset_contents c
            ON c.dataset_id = e.dataset_id
            AND c.content_id = e.content_id

          INNER JOIN app.poster_brain_ai_learning_datasets d
            ON d.id = e.dataset_id

          WHERE
            e.dataset_id = $1::uuid
            AND d.status = 'ready'
            AND (
              $2::timestamptz IS NULL
              OR (
                e.occurred_at,
                e.event_key
              ) < (
                $2::timestamptz,
                $3::text
              )
            )

          ORDER BY
            e.occurred_at DESC,
            e.event_key DESC

          LIMIT $4
        `,
        [
          datasetId,

          cursor?.occurredAt ??
            null,

          cursor?.eventKey ??
            null,

          limit + 1,
        ]
      );

    const mappedRows =
      result.rows.map(
        mapFrozenEvent
      );

    const hasMore =
      mappedRows.length >
      limit;

    const events =
      hasMore
        ? mappedRows.slice(
            0,
            limit
          )
        : mappedRows;

    return {
      events,

      nextCursor:
        hasMore &&
        events.length >
          0
          ? encodeCursor(
              events[
                events.length -
                1
              ]!
            )
          : null,
    };
  }
}

export function createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
  database:
    PosterBrainAiLearningDatasetSnapshotReadDatabase
): PosterBrainAiLearningDatasetSnapshotReadRepository {
  return new PostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
    database
  );
}