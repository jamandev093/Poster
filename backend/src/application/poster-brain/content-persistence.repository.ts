import type {
  PosterBrainContentPersistencePlan,
  PosterBrainDiscoveryContentPersistenceInput,
  PosterBrainDiscoverySourcePersistenceInput,
  PosterBrainPublisherDomainPersistenceInput,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainQueryRow {
  readonly [key: string]: unknown;
}

export interface PosterBrainDatabaseQueryResult<
  Row extends PosterBrainQueryRow = PosterBrainQueryRow,
> {
  readonly rows: readonly Row[];
}

export interface PosterBrainDatabaseExecutor {
  query<Row extends PosterBrainQueryRow = PosterBrainQueryRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<PosterBrainDatabaseQueryResult<Row>>;
}

interface PosterBrainIdRow extends PosterBrainQueryRow {
  readonly id: string;
}

export interface PosterBrainContentPersistenceRepositoryResult {
  readonly sourceId: string;
  readonly publisherDomainIds: readonly string[];
  readonly contentItemIds: readonly string[];
  readonly persistedContentCount: number;
}

export interface PosterBrainContentPersistenceRepository {
  persistPlan(
    plan: PosterBrainContentPersistencePlan
  ): Promise<PosterBrainContentPersistenceRepositoryResult>;
}

function jsonb(
  value: unknown
): string {
  return JSON.stringify(value);
}

function requireReturnedId(
  rows: readonly PosterBrainIdRow[],
  label: string
): string {
  const id =
    rows[0]?.id;

  if (!id) {
    throw new Error(
      `Poster Brain persistence did not return ${label} id.`
    );
  }

  return id;
}

async function upsertSource(input: {
  readonly executor: PosterBrainDatabaseExecutor;
  readonly source: PosterBrainDiscoverySourcePersistenceInput;
}): Promise<string> {
  const result =
    await input.executor.query<PosterBrainIdRow>(
      `
        INSERT INTO app.discovery_sources (
          source_key,
          display_name,
          homepage_url,
          primary_domain,
          acquisition_method,
          status,
          language_code,
          region_code,
          sync_policy,
          copyright_policy,
          metadata
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9::jsonb, $10::jsonb, $11::jsonb
        )
        ON CONFLICT (source_key)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          homepage_url = EXCLUDED.homepage_url,
          primary_domain = EXCLUDED.primary_domain,
          acquisition_method = EXCLUDED.acquisition_method,
          status = EXCLUDED.status,
          language_code = EXCLUDED.language_code,
          region_code = EXCLUDED.region_code,
          sync_policy = EXCLUDED.sync_policy,
          copyright_policy = EXCLUDED.copyright_policy,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `,
      [
        input.source.sourceKey,
        input.source.displayName,
        input.source.homepageUrl,
        input.source.primaryDomain,
        input.source.acquisitionMethod,
        input.source.status,
        input.source.languageCode,
        input.source.regionCode,
        jsonb(input.source.syncPolicy),
        jsonb(input.source.copyrightPolicy),
        jsonb(input.source.metadata),
      ]
    );

  return requireReturnedId(result.rows, "source");
}

async function upsertPublisherDomain(input: {
  readonly executor: PosterBrainDatabaseExecutor;
  readonly sourceId: string;
  readonly publisherDomain: PosterBrainPublisherDomainPersistenceInput;
}): Promise<string> {
  const result =
    await input.executor.query<PosterBrainIdRow>(
      `
        INSERT INTO app.discovery_publisher_domains (
          domain,
          publisher_name,
          source_id,
          status,
          copyright_policy,
          metadata
        )
        VALUES (
          $1, $2, $3, $4, $5::jsonb, $6::jsonb
        )
        ON CONFLICT (domain)
        DO UPDATE SET
          publisher_name = EXCLUDED.publisher_name,
          source_id = EXCLUDED.source_id,
          status = EXCLUDED.status,
          copyright_policy = EXCLUDED.copyright_policy,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `,
      [
        input.publisherDomain.domain,
        input.publisherDomain.publisherName,
        input.sourceId,
        input.publisherDomain.status,
        jsonb(input.publisherDomain.copyrightPolicy),
        jsonb(input.publisherDomain.metadata),
      ]
    );

  return requireReturnedId(result.rows, "publisher domain");
}

async function upsertContentItem(input: {
  readonly executor: PosterBrainDatabaseExecutor;
  readonly sourceId: string;
  readonly publisherDomainId: string;
  readonly contentItem: PosterBrainDiscoveryContentPersistenceInput;
}): Promise<string> {
  const result =
    await input.executor.query<PosterBrainIdRow>(
      `
        INSERT INTO app.discovery_content_items (
          source_id,
          publisher_domain_id,
          external_content_id,
          title,
          excerpt,
          original_url,
          canonical_url,
          image_url,
          media_type,
          language_code,
          region_code,
          category,
          canonical_topic_ids,
          evolving_topic_ids,
          tags,
          search_keywords,
          metadata,
          ai_classification,
          quality_score,
          freshness_score,
          popularity_score,
          personalization_score,
          trending_score,
          ranking_score,
          published_at,
          discovered_at,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb,
          $17::jsonb, $18::jsonb,
          $19, $20, $21, $22, $23, $24,
          $25, $26, $27
        )
        ON CONFLICT (external_content_id)
        DO UPDATE SET
          source_id = EXCLUDED.source_id,
          publisher_domain_id = EXCLUDED.publisher_domain_id,
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          original_url = EXCLUDED.original_url,
          canonical_url = EXCLUDED.canonical_url,
          image_url = EXCLUDED.image_url,
          media_type = EXCLUDED.media_type,
          language_code = EXCLUDED.language_code,
          region_code = EXCLUDED.region_code,
          category = EXCLUDED.category,
          canonical_topic_ids = EXCLUDED.canonical_topic_ids,
          evolving_topic_ids = EXCLUDED.evolving_topic_ids,
          tags = EXCLUDED.tags,
          search_keywords = EXCLUDED.search_keywords,
          metadata = EXCLUDED.metadata,
          ai_classification = EXCLUDED.ai_classification,
          quality_score = EXCLUDED.quality_score,
          freshness_score = EXCLUDED.freshness_score,
          popularity_score = EXCLUDED.popularity_score,
          personalization_score = EXCLUDED.personalization_score,
          trending_score = EXCLUDED.trending_score,
          ranking_score = EXCLUDED.ranking_score,
          published_at = EXCLUDED.published_at,
          discovered_at = EXCLUDED.discovered_at,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `,
      [
        input.sourceId,
        input.publisherDomainId,
        input.contentItem.externalContentId,
        input.contentItem.title,
        input.contentItem.excerpt,
        input.contentItem.originalUrl,
        input.contentItem.canonicalUrl,
        input.contentItem.imageUrl,
        input.contentItem.mediaType,
        input.contentItem.languageCode,
        input.contentItem.regionCode,
        input.contentItem.category,
        jsonb(input.contentItem.canonicalTopicIds),
        jsonb(input.contentItem.evolvingTopicIds),
        jsonb(input.contentItem.tags),
        jsonb(input.contentItem.searchKeywords),
        jsonb({
          ...input.contentItem.metadata,
          sourcePriorityScore:
            input.contentItem.sourcePriorityScore,
        }),
        jsonb(input.contentItem.aiClassification),
        input.contentItem.sourcePriorityScore,
        0,
        0,
        0,
        input.contentItem.trendingScore,
        input.contentItem.rankingScore,
        input.contentItem.publishedAt,
        input.contentItem.discoveredAt,
        input.contentItem.status,
      ]
    );

  return requireReturnedId(result.rows, "content item");
}

export async function persistPosterBrainContentPlan(input: {
  readonly executor: PosterBrainDatabaseExecutor;
  readonly plan: PosterBrainContentPersistencePlan;
}): Promise<PosterBrainContentPersistenceRepositoryResult> {
  const sourceId =
    await upsertSource({
      executor:
        input.executor,
      source:
        input.plan.source,
    });

  const publisherDomainIdsByDomain =
    new Map<string, string>();

  for (const publisherDomain of input.plan.publisherDomains) {
    const publisherDomainId =
      await upsertPublisherDomain({
        executor:
          input.executor,
        sourceId,
        publisherDomain,
      });

    publisherDomainIdsByDomain.set(
      publisherDomain.domain,
      publisherDomainId
    );
  }

  const contentItemIds: string[] =
    [];

  for (const contentItem of input.plan.contentItems) {
    const publisherDomainId =
      publisherDomainIdsByDomain.get(
        contentItem.publisherDomain
      );

    if (!publisherDomainId) {
      throw new Error(
        `Poster Brain persistence missing publisher domain id for ${contentItem.publisherDomain}.`
      );
    }

    const contentItemId =
      await upsertContentItem({
        executor:
          input.executor,
        sourceId,
        publisherDomainId,
        contentItem,
      });

    contentItemIds.push(contentItemId);
  }

  return {
    sourceId,
    publisherDomainIds:
      Array.from(publisherDomainIdsByDomain.values()),
    contentItemIds,
    persistedContentCount:
      contentItemIds.length,
  };
}

export function createPosterBrainContentPersistenceRepository(
  executor: PosterBrainDatabaseExecutor
): PosterBrainContentPersistenceRepository {
  return {
    persistPlan(plan) {
      return persistPosterBrainContentPlan({
        executor,
        plan,
      });
    },
  };
}