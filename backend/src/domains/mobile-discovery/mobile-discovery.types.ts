export type DiscoverySurface =
  | "home"
  | "search"
  | "trending";

export type DiscoverySourceStatus =
  | "active"
  | "paused"
  | "blocked";

export type DiscoveryPublisherDomainStatus =
  | "active"
  | "paused"
  | "blocked"
  | "opted_out";

export type DiscoveryContentStatus =
  | "active"
  | "hidden"
  | "removed"
  | "copyright_blocked";

export type DiscoveryMediaType =
  | "article"
  | "video"
  | "audio"
  | "research"
  | "guide";

export type DiscoveryAcquisitionMethod =
  | "official_api"
  | "authorized_rss"
  | "official_embed"
  | "publisher_agreement"
  | "link_only"
  | "manual_seed";

export type DiscoveryCommercialType =
  | "poster_promotion"
  | "affiliate_promotion"
  | "direct_sponsorship"
  | "programmatic";

export interface DiscoveryFeedCursor {
  surface: DiscoverySurface;

  score: string;

  discoveredAt: string;

  id: string;
}

export interface DiscoverySourceRecord {
  id: string;

  sourceKey: string;

  displayName: string;

  homepageUrl: string;

  primaryDomain: string;

  acquisitionMethod: DiscoveryAcquisitionMethod;

  status: DiscoverySourceStatus;

  languageCode: string;

  regionCode:
    | string
    | null;
}

export interface DiscoveryPublisherDomainRecord {
  id: string;

  domain: string;

  publisherName: string;

  status: DiscoveryPublisherDomainStatus;

  category:
    | string
    | null;

  languageCode: string;

  regionCode:
    | string
    | null;
}

export interface DiscoveryRankingSignals {
  qualityScore: string;

  freshnessScore: string;

  popularityScore: string;

  personalizationScore: string;

  trendingScore: string;

  rankingScore: string;
}

export interface DiscoveryContentItem {
  id: string;

  externalContentId: string;

  title: string;

  excerpt: string;

  originalUrl: string;

  canonicalUrl:
    | string
    | null;

  imageUrl:
    | string
    | null;

  mediaType: DiscoveryMediaType;

  languageCode: string;

  regionCode:
    | string
    | null;

  category:
    | string
    | null;

  canonicalTopicIds: string[];

  evolvingTopicIds: string[];

  tags: string[];

  searchKeywords: string[];

  embeddingReference:
    | string
    | null;

  rankingSignals: DiscoveryRankingSignals;

  publishedAt:
    | Date
    | null;

  discoveredAt: Date;

  status: DiscoveryContentStatus;

  source:
    | DiscoverySourceRecord
    | null;

  publisher:
    | DiscoveryPublisherDomainRecord
    | null;

  rowVersion: string;
}

export interface DiscoveryAdSlot {
  id: string;

  placementKey: string;

  surface: DiscoverySurface;

  afterOrganicIndex: number;

  commercialType: DiscoveryCommercialType;

  status:
    | "active"
    | "paused"
    | "blocked";
}

export interface ListDiscoveryContentItemsInput {
  surface: DiscoverySurface;

  query:
    | string
    | null;

  category:
    | string
    | null;

  languageCode:
    | string
    | null;

  regionCode:
    | string
    | null;

  limit: number;

  cursor:
    | DiscoveryFeedCursor
    | null;
}
