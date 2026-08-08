export type PosterBrainAcquisitionMethod =
  | "authorized_rss"
  | "publisher_agreement"
  | "official_api"
  | "manual_seed"
  | "link_only";

export interface PosterBrainRssSource {
  readonly sourceKey: string;
  readonly sourceName: string;
  readonly homepageUrl: string;
  readonly feedUrl: string;
  readonly publisherName: string;
  readonly defaultLanguage?: string;
  readonly defaultRegion?: string;
  readonly acquisitionMethod: PosterBrainAcquisitionMethod;
}

export interface PosterBrainRawRssItem {
  readonly guid?: string;
  readonly title?: string;
  readonly link?: string;
  readonly canonicalUrl?: string;
  readonly description?: string;
  readonly summary?: string;
  readonly publishedAt?: string;
  readonly updatedAt?: string;
  readonly author?: string;
  readonly categories?: readonly string[];
  readonly imageUrl?: string;
}

export interface PosterBrainNormalizedContentItem {
  readonly externalContentId: string;
  readonly sourceKey: string;
  readonly publisherName: string;
  readonly title: string;
  readonly excerpt: string;
  readonly originalUrl: string;
  readonly canonicalUrl: string;
  readonly publishedAt: string | null;
  readonly updatedAt: string | null;
  readonly language: string;
  readonly region: string | null;
  readonly author: string | null;
  readonly tags: readonly string[];
  readonly imageUrl: string | null;
  readonly acquisitionMethod: PosterBrainAcquisitionMethod;
  readonly canonicalIdentity: string;
  readonly searchKeywords: readonly string[];
}

export interface PosterBrainRejectedRssItem {
  readonly reason:
    | "missing_title"
    | "missing_url"
    | "invalid_url"
    | "missing_excerpt";
  readonly item: PosterBrainRawRssItem;
}

export interface PosterBrainRssNormalizationResult {
  readonly accepted: readonly PosterBrainNormalizedContentItem[];
  readonly rejected: readonly PosterBrainRejectedRssItem[];
}
