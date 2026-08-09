import type {
  PosterBrainDiscoveryContentRankingRow,
  PosterBrainRankingSurface,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRankedDiscoveryQueryResult<Row = Record<string, unknown>> {
  readonly rows: readonly Row[];
}

export interface PosterBrainRankedDiscoveryQueryExecutor {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<PosterBrainRankedDiscoveryQueryResult<Row>>;
}

export interface PosterBrainRankedDiscoveryQueryInput {
  readonly surface: PosterBrainRankingSurface;
  readonly limit: number;
  readonly offset?: number;
  readonly searchQuery?: string | null;
  readonly languageCode?: string | null;
  readonly regionCode?: string | null;
  readonly category?: string | null;
}

export interface PosterBrainRankedDiscoveryQueryRepository {
  listRankingRows(
    input: PosterBrainRankedDiscoveryQueryInput
  ): Promise<readonly PosterBrainDiscoveryContentRankingRow[]>;
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.floor(value)));
}

function normalizeOffset(value: number | undefined): number {
  if (!Number.isFinite(value ?? 0)) {
    return 0;
  }

  return Math.max(0, Math.floor(value ?? 0));
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function createOrderClause(surface: PosterBrainRankingSurface): string {
  if (surface === "trending") {
    return `
      c.trending_score DESC,
      c.ranking_score DESC,
      c.discovered_at DESC,
      c.external_content_id ASC
    `;
  }

  return `
    c.ranking_score DESC,
    c.trending_score DESC,
    c.discovered_at DESC,
    c.external_content_id ASC
  `;
}

export async function listPosterBrainRankedDiscoveryRows(input: {
  readonly executor: PosterBrainRankedDiscoveryQueryExecutor;
  readonly query: PosterBrainRankedDiscoveryQueryInput;
}): Promise<readonly PosterBrainDiscoveryContentRankingRow[]> {
  const limit = normalizeLimit(input.query.limit);
  const offset = normalizeOffset(input.query.offset);
  const searchQuery = normalizeOptionalText(input.query.searchQuery);
  const languageCode = normalizeOptionalText(input.query.languageCode);
  const regionCode = normalizeOptionalText(input.query.regionCode);
  const category = normalizeOptionalText(input.query.category);

  const result =
    await input.executor.query<PosterBrainDiscoveryContentRankingRow>(
      `
        SELECT
          c.external_content_id AS "externalContentId",
          c.title AS "title",
          c.original_url AS "originalUrl",
          COALESCE(pd.publisher_name, s.display_name) AS "publisherName",
          c.published_at AS "publishedAt",
          c.discovered_at AS "discoveredAt",
          COALESCE((c.metadata->>'sourcePriorityScore')::numeric, 0.5) AS "sourcePriorityScore",
          COALESCE(c.quality_score, 0.5) AS "qualityScore",
          COALESCE(c.tags, '[]'::jsonb) AS "tags",
          COALESCE(c.canonical_topic_ids, '[]'::jsonb) AS "canonicalTopicIds",
          COALESCE(c.evolving_topic_ids, '[]'::jsonb) AS "evolvingTopicIds",
          COALESCE(c.search_keywords, '[]'::jsonb) AS "searchKeywords",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_content_events content_events
            WHERE content_events.content_id = c.id
              AND content_events.event_type = 'impression'
          ) AS "impressions",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_content_events content_events
            WHERE content_events.content_id = c.id
              AND content_events.event_type = 'open_original_click'
          ) AS "clicks",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_share_events share_events
            WHERE share_events.content_id = c.id
          ) AS "shares",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_bookmarks bookmarks
            WHERE bookmarks.content_id = c.id
              AND bookmarks.deleted_at IS NULL
          ) AS "bookmarks",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_report_events reports
            WHERE reports.content_id = c.id
              AND reports.status IN ('pending', 'triaged')
          ) AS "reports",
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_article_feedback feedback
            WHERE feedback.content_id = c.id
              AND feedback.reason_id = 'not_interested'
          ) AS "hides"
        FROM app.discovery_content_items c
        INNER JOIN app.discovery_sources s
          ON s.id = c.source_id
        LEFT JOIN app.discovery_publisher_domains pd
          ON pd.id = c.publisher_domain_id
        WHERE c.status = 'active'
          AND s.status = 'active'
          AND ($1::text IS NULL OR c.language_code = $1)
          AND ($2::text IS NULL OR c.region_code = $2)
          AND ($3::text IS NULL OR c.category = $3)
          AND (
            $4::text IS NULL
            OR c.title ILIKE '%' || $4 || '%'
            OR c.search_keywords::text ILIKE '%' || $4 || '%'
            OR c.tags::text ILIKE '%' || $4 || '%'
          )
        ORDER BY ${createOrderClause(input.query.surface)}
        LIMIT $5
        OFFSET $6
      `,
      [
        languageCode,
        regionCode,
        category,
        searchQuery,
        limit,
        offset,
      ]
    );

  return result.rows;
}

export function createPosterBrainRankedDiscoveryQueryRepository(
  executor: PosterBrainRankedDiscoveryQueryExecutor
): PosterBrainRankedDiscoveryQueryRepository {
  return {
    listRankingRows(query) {
      return listPosterBrainRankedDiscoveryRows({
        executor,
        query,
      });
    },
  };
}