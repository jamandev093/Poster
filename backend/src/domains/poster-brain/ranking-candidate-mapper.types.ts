export interface PosterBrainDiscoveryContentRankingRow {
  readonly externalContentId: string;
  readonly title: string;
  readonly originalUrl?: string | null;
  readonly publisherName: string;
  readonly publishedAt: string | Date | null;
  readonly discoveredAt: string | Date;
  readonly sourcePriorityScore: string | number | null;
  readonly qualityScore: string | number | null;
  readonly tags: unknown;
  readonly canonicalTopicIds: unknown;
  readonly evolvingTopicIds: unknown;
  readonly searchKeywords: unknown;
  readonly impressions: string | number | null;
  readonly clicks: string | number | null;
  readonly shares: string | number | null;
  readonly bookmarks: string | number | null;
  readonly reports: string | number | null;
  readonly hides: string | number | null;
}