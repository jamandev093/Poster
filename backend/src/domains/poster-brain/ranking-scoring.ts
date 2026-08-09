import type {
  PosterBrainCandidateScore,
  PosterBrainEngagementSignals,
  PosterBrainRankingCandidate,
  PosterBrainRankingPolicy,
  PosterBrainRankingSurface,
  PosterBrainUserInterestProfile,
} from "./ranking-scoring.types.js";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function parseInstant(value: string): number {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Poster Brain ranking received invalid timestamp: ${value}.`);
  }

  return timestamp;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueNormalizedKeys(values: readonly string[]): Set<string> {
  const keys = new Set<string>();

  for (const value of values) {
    const key = normalizeKey(value);

    if (key) {
      keys.add(key);
    }
  }

  return keys;
}

export function calculatePosterBrainFreshnessScore(input: {
  readonly candidate: PosterBrainRankingCandidate;
  readonly policy: PosterBrainRankingPolicy;
}): number {
  const now = parseInstant(input.policy.now);
  const referenceTime = parseInstant(input.candidate.publishedAt ?? input.candidate.discoveredAt);
  const ageHours = Math.max(0, (now - referenceTime) / 3_600_000);
  const halfLifeHours = Math.max(1, input.policy.freshnessHalfLifeHours);

  return clamp01(1 / 2 ** (ageHours / halfLifeHours));
}

export function calculatePosterBrainEngagementScore(
  signals: PosterBrainEngagementSignals
): number {
  const positive = signals.clicks * 2 + signals.shares * 3 + signals.bookmarks * 2.5;
  const volumeBoost = Math.log1p(positive) / 10;

  if (signals.impressions <= 0) {
    return clamp01(volumeBoost);
  }

  const rateScore = positive / signals.impressions;

  return clamp01(rateScore + volumeBoost);
}

export function calculatePosterBrainInterestMatchScore(input: {
  readonly candidate: PosterBrainRankingCandidate;
  readonly userProfile: PosterBrainUserInterestProfile | null;
}): number {
  if (!input.userProfile) {
    return 0;
  }

  const profileKeys = uniqueNormalizedKeys([
    ...input.userProfile.topicIds,
    ...input.userProfile.topicNames,
    ...input.userProfile.searchKeywords,
  ]);

  if (profileKeys.size === 0) {
    return 0;
  }

  const candidateKeys = uniqueNormalizedKeys([
    ...input.candidate.canonicalTopicIds,
    ...input.candidate.evolvingTopicIds,
    ...input.candidate.tags,
    ...input.candidate.searchKeywords,
    input.candidate.title,
    input.candidate.publisherName,
  ]);

  let matches = 0;

  for (const key of candidateKeys) {
    if (profileKeys.has(key)) {
      matches += 1;
    }
  }

  return clamp01(matches / Math.min(5, profileKeys.size));
}

function calculatePenalty(input: {
  readonly candidate: PosterBrainRankingCandidate;
  readonly policy: PosterBrainRankingPolicy;
}): number {
  return clamp01(
    input.candidate.engagement.reports * input.policy.reportPenaltyWeight +
      input.candidate.engagement.hides * input.policy.hidePenaltyWeight
  );
}

function surfaceWeights(surface: PosterBrainRankingSurface): {
  readonly freshness: number;
  readonly engagement: number;
  readonly interest: number;
  readonly quality: number;
  readonly source: number;
} {
  switch (surface) {
    case "search":
      return { freshness: 0.15, engagement: 0.2, interest: 0.3, quality: 0.25, source: 0.1 };

    case "trending":
      return { freshness: 0.3, engagement: 0.4, interest: 0.1, quality: 0.15, source: 0.05 };

    case "home":
      return { freshness: 0.25, engagement: 0.2, interest: 0.25, quality: 0.2, source: 0.1 };
  }
}

export function scorePosterBrainRankingCandidate(input: {
  readonly candidate: PosterBrainRankingCandidate;
  readonly surface: PosterBrainRankingSurface;
  readonly policy: PosterBrainRankingPolicy;
  readonly userProfile: PosterBrainUserInterestProfile | null;
}): PosterBrainCandidateScore {
  const freshnessScore = calculatePosterBrainFreshnessScore({
    candidate: input.candidate,
    policy: input.policy,
  });

  const engagementScore = calculatePosterBrainEngagementScore(input.candidate.engagement);

  const interestMatchScore = calculatePosterBrainInterestMatchScore({
    candidate: input.candidate,
    userProfile: input.userProfile,
  });

  const qualityScore = clamp01(input.candidate.qualityScore);
  const sourcePriorityScore = clamp01(input.candidate.sourcePriorityScore);
  const weights = surfaceWeights(input.surface);

  const weightedScore =
    freshnessScore * weights.freshness +
    engagementScore * weights.engagement +
    interestMatchScore * weights.interest +
    qualityScore * weights.quality +
    sourcePriorityScore * weights.source;

  const penalty = calculatePenalty({
    candidate: input.candidate,
    policy: input.policy,
  });

  const rankingScore =
    qualityScore < input.policy.minimumQualityScore ? 0 : clamp01(weightedScore - penalty);

  const trendingScore =
    qualityScore < input.policy.minimumQualityScore
      ? 0
      : clamp01(freshnessScore * 0.35 + engagementScore * 0.55 + sourcePriorityScore * 0.1 - penalty);

  return {
    externalContentId: input.candidate.externalContentId,
    freshnessScore,
    engagementScore,
    interestMatchScore,
    qualityScore,
    sourcePriorityScore,
    rankingScore,
    trendingScore,
  };
}

export function rankPosterBrainCandidates(input: {
  readonly candidates: readonly PosterBrainRankingCandidate[];
  readonly surface: PosterBrainRankingSurface;
  readonly policy: PosterBrainRankingPolicy;
  readonly userProfile: PosterBrainUserInterestProfile | null;
  readonly limit: number;
}): readonly PosterBrainCandidateScore[] {
  const limit = Math.max(0, Math.floor(input.limit));

  return input.candidates
    .map(candidate =>
      scorePosterBrainRankingCandidate({
        candidate,
        surface: input.surface,
        policy: input.policy,
        userProfile: input.userProfile,
      })
    )
    .sort((left, right) => {
      if (right.rankingScore !== left.rankingScore) {
        return right.rankingScore - left.rankingScore;
      }

      if (right.trendingScore !== left.trendingScore) {
        return right.trendingScore - left.trendingScore;
      }

      return left.externalContentId.localeCompare(right.externalContentId);
    })
    .slice(0, limit);
}