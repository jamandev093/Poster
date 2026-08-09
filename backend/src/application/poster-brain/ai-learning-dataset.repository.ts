import {
  POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningContentFeatures,
  PosterBrainAiLearningContentStatus,
  PosterBrainAiLearningDatasetEvent,
  PosterBrainAiLearningDatasetPage,
  PosterBrainAiLearningReportStatus,
  PosterBrainAiLearningSignalSource,
  PosterBrainAiLearningSignalType,
  PosterBrainAiLearningSurface,
} from "./ai-learning-dataset.types.js";

const DEFAULT_DATASET_PAGE_LIMIT =
  1000;

const MAX_DATASET_PAGE_LIMIT =
  5000;

const CURSOR_SEPARATOR =
  "|";

interface PosterBrainAiLearningDatasetRow {
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

export interface PosterBrainAiLearningDatasetQueryExecutor {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface PosterBrainAiLearningDatasetQuery {
  readonly limit?:
    number;

  readonly cursor?:
    string |
    null;
}

export interface PosterBrainAiLearningDatasetRepository {
  listPage(
    query?: PosterBrainAiLearningDatasetQuery
  ): Promise<PosterBrainAiLearningDatasetPage>;
}

interface DecodedCursor {
  readonly occurredAt:
    string;

  readonly eventKey:
    string;
}

function normalizeLimit(
  value: number |
    undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_DATASET_PAGE_LIMIT;
  }

  return Math.max(
    1,
    Math.min(
      MAX_DATASET_PAGE_LIMIT,
      Math.trunc(value)
    )
  );
}

function normalizeTimestamp(
  value: string |
    Date,
  fieldName: string
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Invalid Poster Brain learning dataset timestamp: ${fieldName}`
    );
  }

  return date.toISOString();
}

function normalizeNullableTimestamp(
  value: string |
    Date |
    null,
  fieldName: string
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

function parseStringArray(
  value: unknown
): readonly string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (
        item
      ): item is string =>
        typeof item === "string"
    );
  }

  if (
    typeof value !== "string"
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    return parseStringArray(
      parsed
    );
  }
  catch {
    return [];
  }
}

function parseJsonRecord(
  value: unknown
): Readonly<Record<string, unknown>> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Readonly<
      Record<string, unknown>
    >;
  }

  if (
    typeof value !== "string"
  ) {
    return {};
  }

  try {
    return parseJsonRecord(
      JSON.parse(value)
    );
  }
  catch {
    return {};
  }
}

function parseQualityScore(
  value: string |
    number
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    throw new Error(
      "Invalid Poster Brain learning dataset qualityScore."
    );
  }

  return parsed;
}

function parseSignalSource(
  value: string
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
        `Invalid Poster Brain learning signal source: ${value}`
      );
  }
}

function parseSignalType(
  value: string
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
        `Invalid Poster Brain learning signal type: ${value}`
      );
  }
}

function parseSurface(
  value: string |
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
        `Invalid Poster Brain learning surface: ${value}`
      );
  }
}

function parseReportStatus(
  value: string |
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
        `Invalid Poster Brain learning report status: ${value}`
      );
  }
}

function parseContentStatus(
  value: string
): PosterBrainAiLearningContentStatus {
  switch (value) {
    case "active":
    case "hidden":
    case "removed":
    case "copyright_blocked":
      return value;

    default:
      throw new Error(
        `Invalid Poster Brain learning content status: ${value}`
      );
  }
}

function decodeCursor(
  value: string |
    null |
    undefined
): DecodedCursor |
  null {
  if (!value) {
    return null;
  }

  const separatorIndex =
    value.indexOf(
      CURSOR_SEPARATOR
    );

  if (
    separatorIndex <= 0 ||
    separatorIndex >=
      value.length - 1
  ) {
    throw new Error(
      "Invalid Poster Brain learning dataset cursor."
    );
  }

  const occurredAt =
    value.slice(
      0,
      separatorIndex
    );

  const eventKey =
    value.slice(
      separatorIndex + 1
    );

  normalizeTimestamp(
    occurredAt,
    "cursor.occurredAt"
  );

  if (!eventKey.trim()) {
    throw new Error(
      "Invalid Poster Brain learning dataset cursor event key."
    );
  }

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
    CURSOR_SEPARATOR +
    event.eventKey
  );
}

function mapContentFeatures(
  row:
    PosterBrainAiLearningDatasetRow
): PosterBrainAiLearningContentFeatures {
  return {
    contentId:
      row.contentId,

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
      normalizeNullableTimestamp(
        row.publishedAt,
        "publishedAt"
      ),

    contentStatus:
      parseContentStatus(
        row.contentStatus
      ),
  };
}

function mapDatasetRow(
  row:
    PosterBrainAiLearningDatasetRow
): PosterBrainAiLearningDatasetEvent {
  return {
    schemaVersion:
      POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,

    eventKey:
      row.eventKey,

    source:
      parseSignalSource(
        row.source
      ),

    sourceEventId:
      row.sourceEventId,

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
      mapContentFeatures(
        row
      ),
  };
}

export class PostgreSqlPosterBrainAiLearningDatasetRepository
  implements PosterBrainAiLearningDatasetRepository
{
  constructor(
    private readonly database:
      PosterBrainAiLearningDatasetQueryExecutor
  ) {}

  async listPage(
    query:
      PosterBrainAiLearningDatasetQuery =
        {}
  ): Promise<PosterBrainAiLearningDatasetPage> {
    const limit =
      normalizeLimit(
        query.limit
      );

    const cursor =
      decodeCursor(
        query.cursor
      );

    const result =
      await this.database.query<
        PosterBrainAiLearningDatasetRow
      >(
        `
          WITH organic_signals AS (

            SELECT
              'organic_content_event:' || e.id::text
                AS event_key,
              'organic_content_event'::text
                AS source,
              e.id::text
                AS source_event_id,
              e.event_type::text
                AS signal_type,
              e.occurred_at
                AS occurred_at,
              e.surface::text
                AS surface,
              NULL::text
                AS reason_id,
              NULL::text
                AS report_status,
              NULL::boolean
                AS bookmark_active,
              e.content_id
                AS content_id
            FROM app.mobile_user_content_events e

            UNION ALL

            SELECT
              'share:' || s.id::text,
              'share'::text,
              s.id::text,
              'share'::text,
              s.created_at,
              NULL::text,
              NULL::text,
              NULL::text,
              NULL::boolean,
              s.content_id
            FROM app.mobile_user_share_events s

            UNION ALL

            SELECT
              'report:' || r.id::text,
              'report'::text,
              r.id::text,
              'report'::text,
              r.created_at,
              NULL::text,
              r.reason_id,
              r.status::text,
              NULL::boolean,
              r.content_id
            FROM app.mobile_user_report_events r

            UNION ALL

            SELECT
              'bookmark:' || b.id::text,
              'bookmark'::text,
              b.id::text,
              'bookmark'::text,
              b.created_at,
              NULL::text,
              NULL::text,
              NULL::text,
              (b.deleted_at IS NULL),
              b.content_id
            FROM app.mobile_user_bookmarks b

            UNION ALL

            SELECT
              'article_interaction:' || i.id::text,
              'article_interaction'::text,
              i.id::text,
              i.interaction_type::text,
              i.created_at,
              NULL::text,
              NULL::text,
              NULL::text,
              NULL::boolean,
              i.content_id
            FROM app.mobile_user_article_interactions i

            UNION ALL

            SELECT
              'article_feedback:' || f.id::text,
              'article_feedback'::text,
              f.id::text,
              'article_feedback'::text,
              f.submitted_at,
              NULL::text,
              f.reason_id,
              NULL::text,
              NULL::boolean,
              f.content_id
            FROM app.mobile_user_article_feedback f
          )

          SELECT
            os.event_key
              AS "eventKey",

            os.source
              AS "source",

            os.source_event_id
              AS "sourceEventId",

            os.signal_type
              AS "signalType",

            os.occurred_at
              AS "occurredAt",

            os.surface
              AS "surface",

            os.reason_id
              AS "reasonId",

            os.report_status
              AS "reportStatus",

            os.bookmark_active
              AS "bookmarkActive",

            c.id::text
              AS "contentId",

            s.source_key
              AS "sourceKey",

            COALESCE(
              pd.publisher_name,
              s.display_name
            )
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

            c.status
              AS "contentStatus"

          FROM organic_signals os

          INNER JOIN app.discovery_content_items c
            ON c.id = os.content_id

          LEFT JOIN app.discovery_sources s
            ON s.id = c.source_id

          LEFT JOIN app.discovery_publisher_domains pd
            ON pd.id = c.publisher_domain_id

          WHERE
            $1::timestamptz IS NULL
            OR (
              os.occurred_at,
              os.event_key
            ) < (
              $1::timestamptz,
              $2::text
            )

          ORDER BY
            os.occurred_at DESC,
            os.event_key DESC

          LIMIT $3
        `,
        [
          cursor?.occurredAt ??
            null,

          cursor?.eventKey ??
            null,

          limit + 1,
        ]
      );

    const hasMore =
      result.rows.length >
      limit;

    const events =
      result.rows
        .slice(
          0,
          limit
        )
        .map(
          mapDatasetRow
        );

    const lastEvent =
      events[
        events.length - 1
      ];

    return {
      events,

      nextCursor:
        hasMore &&
        lastEvent
          ? encodeCursor(
              lastEvent
            )
          : null,
    };
  }
}

export function createPostgreSqlPosterBrainAiLearningDatasetRepository(
  database:
    PosterBrainAiLearningDatasetQueryExecutor
): PosterBrainAiLearningDatasetRepository {
  return new PostgreSqlPosterBrainAiLearningDatasetRepository(
    database
  );
}