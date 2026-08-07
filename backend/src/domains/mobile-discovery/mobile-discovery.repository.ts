import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/index.js";

import type {
  DiscoveryAcquisitionMethod,
  DiscoveryContentItem,
  DiscoveryContentStatus,
  DiscoveryMediaType,
  DiscoveryPublisherDomainStatus,
  DiscoverySourceStatus,
  ListDiscoveryContentItemsInput,
} from "./mobile-discovery.types.js";

interface DiscoveryContentDatabaseRow {
  id: string;

  external_content_id: string;

  title: string;

  excerpt: string;

  original_url: string;

  canonical_url:
    | string
    | null;

  image_url:
    | string
    | null;

  media_type: DiscoveryMediaType;

  language_code: string;

  region_code:
    | string
    | null;

  category:
    | string
    | null;

  canonical_topic_ids: unknown;

  evolving_topic_ids: unknown;

  tags: unknown;

  search_keywords: unknown;

  embedding_reference:
    | string
    | null;

  quality_score: string;

  freshness_score: string;

  popularity_score: string;

  personalization_score: string;

  trending_score: string;

  ranking_score: string;

  published_at:
    | Date
    | null;

  discovered_at: Date;

  status: DiscoveryContentStatus;

  row_version: string;

  source_id:
    | string
    | null;

  source_key:
    | string
    | null;

  source_display_name:
    | string
    | null;

  source_homepage_url:
    | string
    | null;

  source_primary_domain:
    | string
    | null;

  source_acquisition_method:
    | DiscoveryAcquisitionMethod
    | null;

  source_status:
    | DiscoverySourceStatus
    | null;

  source_language_code:
    | string
    | null;

  source_region_code:
    | string
    | null;

  publisher_domain_id:
    | string
    | null;

  publisher_domain:
    | string
    | null;

  publisher_name:
    | string
    | null;

  publisher_status:
    | DiscoveryPublisherDomainStatus
    | null;

  publisher_category:
    | string
    | null;

  publisher_language_code:
    | string
    | null;

  publisher_region_code:
    | string
    | null;
}

const DISCOVERY_CONTENT_COLUMNS = `
  c.id,
  c.external_content_id,
  c.title,
  c.excerpt,
  c.original_url,
  c.canonical_url,
  c.image_url,
  c.media_type,
  c.language_code,
  c.region_code,
  c.category,
  c.canonical_topic_ids,
  c.evolving_topic_ids,
  c.tags,
  c.search_keywords,
  c.embedding_reference,
  c.quality_score::text,
  c.freshness_score::text,
  c.popularity_score::text,
  c.personalization_score::text,
  c.trending_score::text,
  c.ranking_score::text,
  c.published_at,
  c.discovered_at,
  c.status,
  c.row_version::text,
  s.id AS source_id,
  s.source_key,
  s.display_name AS source_display_name,
  s.homepage_url AS source_homepage_url,
  s.primary_domain AS source_primary_domain,
  s.acquisition_method AS source_acquisition_method,
  s.status AS source_status,
  s.language_code AS source_language_code,
  s.region_code AS source_region_code,
  p.id AS publisher_domain_id,
  p.domain AS publisher_domain,
  p.publisher_name,
  p.status AS publisher_status,
  p.category AS publisher_category,
  p.language_code AS publisher_language_code,
  p.region_code AS publisher_region_code
`;

function parseStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function mapDiscoveryContentRow(
  row: DiscoveryContentDatabaseRow
): DiscoveryContentItem {
  return {
    id:
      row.id,

    externalContentId:
      row.external_content_id,

    title:
      row.title,

    excerpt:
      row.excerpt,

    originalUrl:
      row.original_url,

    canonicalUrl:
      row.canonical_url,

    imageUrl:
      row.image_url,

    mediaType:
      row.media_type,

    languageCode:
      row.language_code,

    regionCode:
      row.region_code,

    category:
      row.category,

    canonicalTopicIds:
      parseStringArray(
        row.canonical_topic_ids
      ),

    evolvingTopicIds:
      parseStringArray(
        row.evolving_topic_ids
      ),

    tags:
      parseStringArray(
        row.tags
      ),

    searchKeywords:
      parseStringArray(
        row.search_keywords
      ),

    embeddingReference:
      row.embedding_reference,

    rankingSignals: {
      qualityScore:
        row.quality_score,

      freshnessScore:
        row.freshness_score,

      popularityScore:
        row.popularity_score,

      personalizationScore:
        row.personalization_score,

      trendingScore:
        row.trending_score,

      rankingScore:
        row.ranking_score,
    },

    publishedAt:
      row.published_at,

    discoveredAt:
      row.discovered_at,

    status:
      row.status,

    source:
      row.source_id &&
      row.source_key &&
      row.source_display_name &&
      row.source_homepage_url &&
      row.source_primary_domain &&
      row.source_acquisition_method &&
      row.source_status &&
      row.source_language_code
        ? {
            id:
              row.source_id,

            sourceKey:
              row.source_key,

            displayName:
              row.source_display_name,

            homepageUrl:
              row.source_homepage_url,

            primaryDomain:
              row.source_primary_domain,

            acquisitionMethod:
              row.source_acquisition_method,

            status:
              row.source_status,

            languageCode:
              row.source_language_code,

            regionCode:
              row.source_region_code,
          }
        : null,

    publisher:
      row.publisher_domain_id &&
      row.publisher_domain &&
      row.publisher_name &&
      row.publisher_status &&
      row.publisher_language_code
        ? {
            id:
              row.publisher_domain_id,

            domain:
              row.publisher_domain,

            publisherName:
              row.publisher_name,

            status:
              row.publisher_status,

            category:
              row.publisher_category,

            languageCode:
              row.publisher_language_code,

            regionCode:
              row.publisher_region_code,
          }
        : null,

    rowVersion:
      row.row_version,
  };
}

export async function listDiscoveryContentItems(
  input: ListDiscoveryContentItemsInput,
  executor?: DatabaseQueryExecutor
): Promise<DiscoveryContentItem[]> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        SELECT
          ${DISCOVERY_CONTENT_COLUMNS}
        FROM app.discovery_content_items c
        LEFT JOIN app.discovery_sources s
          ON s.id = c.source_id
        LEFT JOIN app.discovery_publisher_domains p
          ON p.id = c.publisher_domain_id
        WHERE
          c.status = 'active'
          AND (
            s.status IS NULL
            OR s.status = 'active'
          )
          AND (
            p.status IS NULL
            OR p.status = 'active'
          )
          AND (
            $2::text IS NULL
            OR c.title ILIKE '%' || $2::text || '%'
            OR c.excerpt ILIKE '%' || $2::text || '%'
            OR c.category ILIKE '%' || $2::text || '%'
            OR p.publisher_name ILIKE '%' || $2::text || '%'
            OR p.domain ILIKE '%' || $2::text || '%'
          )
          AND (
            $3::text IS NULL
            OR c.category = $3::text
          )
          AND (
            $4::text IS NULL
            OR c.language_code = $4::text
          )
          AND (
            $5::text IS NULL
            OR c.region_code = $5::text
            OR c.region_code IS NULL
          )
          AND (
            $7::numeric IS NULL
            OR (
              CASE
                WHEN $1::text = 'trending'
                  THEN c.trending_score
                ELSE c.ranking_score
              END,
              c.discovered_at,
              c.id
            ) < (
              $7::numeric,
              $8::timestamp with time zone,
              $9::uuid
            )
          )
        ORDER BY
          CASE
            WHEN $1::text = 'trending'
              THEN c.trending_score
            ELSE c.ranking_score
          END DESC,
          c.discovered_at DESC,
          c.id DESC
        LIMIT $6
      `,
      [
        input.surface,
        input.query,
        input.category,
        input.languageCode,
        input.regionCode,
        input.limit,
        input.cursor?.score ??
          null,
        input.cursor?.discoveredAt ??
          null,
        input.cursor?.id ??
          null,
      ],
      executor
    );

  return result.rows.map(
    mapDiscoveryContentRow
  );
}
