export type PosterBrainRankingSurface =
  | "home"
  | "search"
  | "trending";

export interface PosterBrainEngagementSignals {
  readonly impressions: number;
  readonly clicks: number;
  readonly shares: number;
  readonly bookmarks: number;
  readonly reports: number;
  readonly hides: number;
}

export interface PosterBrainUserInterestProfile {
  readonly topicIds: readonly string[];
  readonly topicNames: readonly string[];
  readonly searchKeywords: readonly string[];
}

export interface PosterBrainRankingCandidate {
  readonly externalContentId: string;
  readonly title: string;
  readonly publisherName: string;
  readonly publishedAt: string | null;
  readonly discoveredAt: string;
  readonly sourcePriorityScore: number;
  readonly qualityScore: number;
  readonly tags: readonly string[];
  readonly canonicalTopicIds: readonly string[];
  readonly evolvingTopicIds: readonly string[];
  readonly searchKeywords: readonly string[];
  readonly engagement: PosterBrainEngagementSignals;
}

export interface PosterBrainRankingPolicy {
  readonly now: string;
  readonly freshnessHalfLifeHours: number;
  readonly minimumQualityScore: number;
  readonly reportPenaltyWeight: number;
  readonly hidePenaltyWeight: number;
}

export interface PosterBrainCandidateScore {
  readonly externalContentId: string;
  readonly freshnessScore: number;
  readonly engagementScore: number;
  readonly interestMatchScore: number;
  readonly qualityScore: number;
  readonly sourcePriorityScore: number;
  readonly rankingScore: number;
  readonly trendingScore: number;
}