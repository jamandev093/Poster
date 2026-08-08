import type {
  PosterBrainContentPersistencePlan,
  PosterBrainDiscoveryContentPersistenceInput,
  PosterBrainDiscoverySourcePersistenceInput,
  PosterBrainPublisherDomainPersistenceInput,
} from "./content-persistence.types.js";

import type {
  PosterBrainNormalizedContentItem,
  PosterBrainRssSource,
} from "./rss-ingestion.types.js";

function extractPosterBrainDomain(
  urlValue: string
): string {
  const url =
    new URL(urlValue);

  const hostname =
    url.hostname
      .toLowerCase()
      .replace(/^www\./, "");

  if (!hostname) {
    throw new Error("Poster Brain URL is missing a hostname.");
  }

  return hostname;
}

function createSourcePriorityScore(
  source: PosterBrainRssSource
): number {
  switch (source.acquisitionMethod) {
    case "official_api":
      return 1;

    case "publisher_agreement":
      return 0.95;

    case "authorized_rss":
      return 0.9;

    case "manual_seed":
      return 0.7;

    case "link_only":
      return 0.5;
  }
}

function createDiscoverySourceInput(
  source: PosterBrainRssSource
): PosterBrainDiscoverySourcePersistenceInput {
  return {
    sourceKey:
      source.sourceKey,
    displayName:
      source.sourceName,
    homepageUrl:
      source.homepageUrl,
    primaryDomain:
      extractPosterBrainDomain(source.homepageUrl),
    acquisitionMethod:
      source.acquisitionMethod,
    status:
      "active",
    languageCode:
      source.defaultLanguage ?? "en",
    regionCode:
      source.defaultRegion ?? null,
    syncPolicy:
      {
        feedUrl:
          source.feedUrl,
      },
    copyrightPolicy:
      {
        originalPublisherUrlRequired:
          true,
        fullArticleBodyStorageAllowed:
          false,
      },
    metadata:
      {
        publisherName:
          source.publisherName,
        feedUrl:
          source.feedUrl,
      },
  };
}

function createPublisherDomainInput(input: {
  readonly source: PosterBrainRssSource;
  readonly item: PosterBrainNormalizedContentItem;
}): PosterBrainPublisherDomainPersistenceInput {
  const domain =
    extractPosterBrainDomain(input.item.originalUrl);

  return {
    domain,
    publisherName:
      input.item.publisherName,
    sourceKey:
      input.source.sourceKey,
    status:
      "active",
    copyrightPolicy:
      {
        originalPublisherUrlRequired:
          true,
        fullArticleBodyStorageAllowed:
          false,
      },
    metadata:
      {
        sourceKey:
          input.source.sourceKey,
        homepageUrl:
          input.source.homepageUrl,
      },
  };
}

function createContentInput(input: {
  readonly source: PosterBrainRssSource;
  readonly item: PosterBrainNormalizedContentItem;
  readonly discoveredAt: string;
}): PosterBrainDiscoveryContentPersistenceInput {
  const publisherDomain =
    extractPosterBrainDomain(input.item.originalUrl);

  const category =
    input.item.tags[0] ?? null;

  const sourcePriorityScore =
    createSourcePriorityScore(input.source);

  return {
    externalContentId:
      input.item.externalContentId,
    sourceKey:
      input.source.sourceKey,
    publisherDomain,
    publisherName:
      input.item.publisherName,
    title:
      input.item.title,
    excerpt:
      input.item.excerpt,
    originalUrl:
      input.item.originalUrl,
    canonicalUrl:
      input.item.canonicalUrl,
    imageUrl:
      input.item.imageUrl,
    mediaType:
      "article",
    status:
      "active",
    category,
    canonicalTopicIds:
      [],
    evolvingTopicIds:
      [],
    tags:
      input.item.tags,
    searchKeywords:
      input.item.searchKeywords,
    languageCode:
      input.item.language,
    regionCode:
      input.item.region,
    publishedAt:
      input.item.publishedAt,
    discoveredAt:
      input.discoveredAt,
    rankingScore:
      0,
    trendingScore:
      0,
    sourcePriorityScore,
    metadata:
      {
        acquisitionMethod:
          input.item.acquisitionMethod,
        canonicalIdentity:
          input.item.canonicalIdentity,
        rssAuthor:
          input.item.author,
        sourceKey:
          input.source.sourceKey,
      },
    aiClassification:
      {
        status:
          "pending",
      },
  };
}

export function createPosterBrainContentPersistencePlan(input: {
  readonly source: PosterBrainRssSource;
  readonly items: readonly PosterBrainNormalizedContentItem[];
  readonly discoveredAt: string;
}): PosterBrainContentPersistencePlan {
  const publisherDomainsByDomain =
    new Map<string, PosterBrainPublisherDomainPersistenceInput>();

  const contentItems: PosterBrainDiscoveryContentPersistenceInput[] =
    [];

  for (const item of input.items) {
    const publisherDomain =
      createPublisherDomainInput({
        source: input.source,
        item,
      });

    if (!publisherDomainsByDomain.has(publisherDomain.domain)) {
      publisherDomainsByDomain.set(
        publisherDomain.domain,
        publisherDomain
      );
    }

    contentItems.push(
      createContentInput({
        source: input.source,
        item,
        discoveredAt: input.discoveredAt,
      })
    );
  }

  return {
    source:
      createDiscoverySourceInput(input.source),
    publisherDomains:
      Array.from(publisherDomainsByDomain.values()),
    contentItems,
  };
}