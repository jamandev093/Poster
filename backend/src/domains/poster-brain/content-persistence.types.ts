import type {
  PosterBrainAcquisitionMethod,
} from "./rss-ingestion.types.js";

export type PosterBrainJsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type PosterBrainJsonValue =
  | PosterBrainJsonPrimitive
  | readonly PosterBrainJsonValue[]
  | PosterBrainJsonObject;

export interface PosterBrainJsonObject {
  readonly [key: string]: PosterBrainJsonValue;
}

export type PosterBrainDiscoveryRecordStatus =
  | "active";

export type PosterBrainDiscoveryMediaType =
  | "article";

export interface PosterBrainDiscoverySourcePersistenceInput {
  readonly sourceKey: string;
  readonly displayName: string;
  readonly homepageUrl: string;
  readonly primaryDomain: string;
  readonly acquisitionMethod: PosterBrainAcquisitionMethod;
  readonly status: PosterBrainDiscoveryRecordStatus;
  readonly languageCode: string;
  readonly regionCode: string | null;
  readonly syncPolicy: PosterBrainJsonObject;
  readonly copyrightPolicy: PosterBrainJsonObject;
  readonly metadata: PosterBrainJsonObject;
}

export interface PosterBrainPublisherDomainPersistenceInput {
  readonly domain: string;
  readonly publisherName: string;
  readonly sourceKey: string;
  readonly status: PosterBrainDiscoveryRecordStatus;
  readonly copyrightPolicy: PosterBrainJsonObject;
  readonly metadata: PosterBrainJsonObject;
}

export interface PosterBrainContentPersistenceClassificationInput {
  readonly externalContentId: string;
  readonly category: string | null;
  readonly canonicalTopicIds: readonly string[];
  readonly evolvingTopicIds: readonly string[];
  readonly qualityScore: number;
  readonly aiClassification: PosterBrainJsonObject;
}

export interface PosterBrainDiscoveryContentPersistenceInput {
  readonly externalContentId: string;
  readonly sourceKey: string;
  readonly publisherDomain: string;
  readonly publisherName: string;
  readonly title: string;
  readonly excerpt: string;
  readonly originalUrl: string;
  readonly canonicalUrl: string | null;
  readonly imageUrl: string | null;
  readonly mediaType: PosterBrainDiscoveryMediaType;
  readonly status: PosterBrainDiscoveryRecordStatus;
  readonly category: string | null;
  readonly canonicalTopicIds: readonly string[];
  readonly evolvingTopicIds: readonly string[];
  readonly tags: readonly string[];
  readonly searchKeywords: readonly string[];
  readonly languageCode: string;
  readonly regionCode: string | null;
  readonly publishedAt: string | null;
  readonly discoveredAt: string;
  readonly qualityScore: number;
  readonly rankingScore: number;
  readonly trendingScore: number;
  readonly sourcePriorityScore: number;
  readonly metadata: PosterBrainJsonObject;
  readonly aiClassification: PosterBrainJsonObject;
}

export interface PosterBrainContentPersistencePlan {
  readonly source: PosterBrainDiscoverySourcePersistenceInput;
  readonly publisherDomains: readonly PosterBrainPublisherDomainPersistenceInput[];
  readonly contentItems: readonly PosterBrainDiscoveryContentPersistenceInput[];
}