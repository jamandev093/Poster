import { describe, expect, it } from "vitest";

import {
  calculatePosterBrainEngagementScore,
  calculatePosterBrainFreshnessScore,
  calculatePosterBrainInterestMatchScore,
  rankPosterBrainCandidates,
  scorePosterBrainRankingCandidate,
  type PosterBrainRankingCandidate,
  type PosterBrainRankingPolicy,
  type PosterBrainUserInterestProfile,
} from "../src/domains/poster-brain/index.js";

const policy: PosterBrainRankingPolicy = {
  now: "2026-08-08T12:00:00.000Z",
  freshnessHalfLifeHours: 24,
  minimumQualityScore: 0.3,
  reportPenaltyWeight: 0.08,
  hidePenaltyWeight: 0.05,
};

const userProfile: PosterBrainUserInterestProfile = {
  topicIds: ["ai"],
  topicNames: ["Policy"],
  searchKeywords: ["machine learning"],
};

function candidate(
  overrides: Partial<PosterBrainRankingCandidate> = {}
): PosterBrainRankingCandidate {
  return {
    externalContentId: "story-1",
    title: "AI policy update",
    publisherName: "Example News",
    publishedAt: "2026-08-08T06:00:00.000Z",
    discoveredAt: "2026-08-08T07:00:00.000Z",
    sourcePriorityScore: 0.9,
    qualityScore: 0.8,
    tags: ["AI", "Policy"],
    canonicalTopicIds: ["ai"],
    evolvingTopicIds: [],
    searchKeywords: ["ai policy update", "machine learning"],
    engagement: {
      impressions: 100,
      clicks: 12,
      shares: 4,
      bookmarks: 6,
      reports: 0,
      hides: 0,
    },
    ...overrides,
  };
}

describe("Poster Brain ranking scoring domain", () => {
  it("calculates freshness decay from published time", () => {
    const fresh = calculatePosterBrainFreshnessScore({
      candidate: candidate({ publishedAt: "2026-08-08T11:00:00.000Z" }),
      policy,
    });

    const older = calculatePosterBrainFreshnessScore({
      candidate: candidate({ publishedAt: "2026-08-06T12:00:00.000Z" }),
      policy,
    });

    expect(fresh).toBeGreaterThan(older);
    expect(fresh).toBeLessThanOrEqual(1);
  });

  it("calculates engagement from positive user signals", () => {
    const low = calculatePosterBrainEngagementScore({
      impressions: 100,
      clicks: 1,
      shares: 0,
      bookmarks: 0,
      reports: 0,
      hides: 0,
    });

    const high = calculatePosterBrainEngagementScore({
      impressions: 100,
      clicks: 15,
      shares: 5,
      bookmarks: 8,
      reports: 0,
      hides: 0,
    });

    expect(high).toBeGreaterThan(low);
  });

  it("matches user interests against topics, tags, and keywords", () => {
    const score = calculatePosterBrainInterestMatchScore({
      candidate: candidate(),
      userProfile,
    });

    expect(score).toBeGreaterThan(0.5);

    const noMatch = calculatePosterBrainInterestMatchScore({
      candidate: candidate({
        tags: ["Sports"],
        canonicalTopicIds: ["sports"],
        evolvingTopicIds: [],
        searchKeywords: ["football"],
      }),
      userProfile,
    });

    expect(noMatch).toBe(0);
  });

  it("scores ranking and trending with report and hide penalties", () => {
    const clean = scorePosterBrainRankingCandidate({
      candidate: candidate(),
      surface: "home",
      policy,
      userProfile,
    });

    const penalized = scorePosterBrainRankingCandidate({
      candidate: candidate({
        engagement: {
          impressions: 100,
          clicks: 12,
          shares: 4,
          bookmarks: 6,
          reports: 4,
          hides: 2,
        },
      }),
      surface: "home",
      policy,
      userProfile,
    });

    expect(clean.rankingScore).toBeGreaterThan(penalized.rankingScore);
    expect(clean.trendingScore).toBeGreaterThan(penalized.trendingScore);
  });

  it("zeroes low-quality content below policy threshold", () => {
    const score = scorePosterBrainRankingCandidate({
      candidate: candidate({ qualityScore: 0.1 }),
      surface: "home",
      policy,
      userProfile,
    });

    expect(score.rankingScore).toBe(0);
    expect(score.trendingScore).toBe(0);
  });

  it("ranks candidates by score and limit", () => {
    const ranked = rankPosterBrainCandidates({
      candidates: [
        candidate({
          externalContentId: "low",
          qualityScore: 0.4,
          engagement: {
            impressions: 100,
            clicks: 1,
            shares: 0,
            bookmarks: 0,
            reports: 0,
            hides: 0,
          },
        }),
        candidate({ externalContentId: "high", qualityScore: 0.9 }),
        candidate({ externalContentId: "middle", qualityScore: 0.7 }),
      ],
      surface: "home",
      policy,
      userProfile,
      limit: 2,
    });

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.externalContentId).toBe("high");
  });
});