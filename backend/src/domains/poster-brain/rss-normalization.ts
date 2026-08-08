import {
  createPosterBrainCanonicalIdentity,
  normalizePosterBrainUrl,
  normalizePosterBrainWhitespace,
  stripPosterBrainHtml,
} from "./content-canonicalization.js";

import type {
  PosterBrainNormalizedContentItem,
  PosterBrainRejectedRssItem,
  PosterBrainRssNormalizationResult,
  PosterBrainRssSource,
  PosterBrainRawRssItem,
} from "./rss-ingestion.types.js";

function normalizeTags(
  values: readonly string[] | undefined
): readonly string[] {
  const seen =
    new Set<string>();

  const normalized: string[] =
    [];

  for (const value of values ?? []) {
    const tag =
      normalizePosterBrainWhitespace(value);

    if (!tag) {
      continue;
    }

    const key =
      tag.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(tag);
  }

  return normalized.slice(0, 20);
}

function normalizeDate(
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildExcerpt(
  item: PosterBrainRawRssItem
): string {
  return stripPosterBrainHtml(
    item.summary ??
      item.description ??
      ""
  ).slice(0, 500);
}

function buildSearchKeywords(input: {
  readonly title: string;
  readonly publisherName: string;
  readonly tags: readonly string[];
}): readonly string[] {
  const values =
    [
      input.title,
      input.publisherName,
      ...input.tags,
    ];

  const seen =
    new Set<string>();

  const keywords: string[] =
    [];

  for (const value of values) {
    const keyword =
      normalizePosterBrainWhitespace(value)
        .toLowerCase();

    if (!keyword || seen.has(keyword)) {
      continue;
    }

    seen.add(keyword);
    keywords.push(keyword);
  }

  return keywords.slice(0, 30);
}

export function normalizePosterBrainRssItems(input: {
  readonly source: PosterBrainRssSource;
  readonly items: readonly PosterBrainRawRssItem[];
}): PosterBrainRssNormalizationResult {
  const accepted: PosterBrainNormalizedContentItem[] =
    [];
  const rejected: PosterBrainRejectedRssItem[] =
    [];

  const seenIdentities =
    new Set<string>();

  for (const item of input.items) {
    const title =
      normalizePosterBrainWhitespace(item.title ?? "");

    if (!title) {
      rejected.push({
        reason: "missing_title",
        item,
      });
      continue;
    }

    const rawUrl =
      item.canonicalUrl ??
      item.link ??
      "";

    if (!rawUrl) {
      rejected.push({
        reason: "missing_url",
        item,
      });
      continue;
    }

    const canonicalUrl =
      normalizePosterBrainUrl(rawUrl);

    if (!canonicalUrl) {
      rejected.push({
        reason: "invalid_url",
        item,
      });
      continue;
    }

    const originalUrl =
      normalizePosterBrainUrl(item.link ?? rawUrl);

    if (!originalUrl) {
      rejected.push({
        reason: "invalid_url",
        item,
      });
      continue;
    }

    const excerpt =
      buildExcerpt(item);

    if (!excerpt) {
      rejected.push({
        reason: "missing_excerpt",
        item,
      });
      continue;
    }

    const canonicalIdentity =
      createPosterBrainCanonicalIdentity({
        sourceKey: input.source.sourceKey,
        canonicalUrl,
        guid: item.guid,
        title,
      });

    if (seenIdentities.has(canonicalIdentity)) {
      continue;
    }

    seenIdentities.add(canonicalIdentity);

    const tags =
      normalizeTags(item.categories);

    accepted.push({
      externalContentId:
        canonicalIdentity,
      sourceKey:
        input.source.sourceKey,
      publisherName:
        input.source.publisherName,
      title,
      excerpt,
      originalUrl,
      canonicalUrl,
      publishedAt:
        normalizeDate(item.publishedAt),
      updatedAt:
        normalizeDate(item.updatedAt),
      language:
        input.source.defaultLanguage ?? "en",
      region:
        input.source.defaultRegion ?? null,
      author:
        item.author
          ? normalizePosterBrainWhitespace(item.author)
          : null,
      tags,
      imageUrl:
        item.imageUrl
          ? normalizePosterBrainUrl(item.imageUrl)
          : null,
      acquisitionMethod:
        input.source.acquisitionMethod,
      canonicalIdentity,
      searchKeywords:
        buildSearchKeywords({
          title,
          publisherName: input.source.publisherName,
          tags,
        }),
    });
  }

  return {
    accepted,
    rejected,
  };
}
