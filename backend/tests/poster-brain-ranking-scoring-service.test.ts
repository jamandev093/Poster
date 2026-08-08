import { describe, expect, it } from "vitest";

import {
  createPosterBrainRankingScoringService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRankingCandidate,
  PosterBrainRankingPolicy,
  PosterBrainUserInterestProfile,
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

describe("Poster Brain ranking scoring service", () => {
  it("scores a single candidate through the application service", () => {
    const service =
      createPosterBrainRankingScoringService();

    const score =
      service.scoreCandidate({
        candidate: candidate(),
        surface: "home",
        policy,
        userProfile,
      });

    expect(score.externalContentId).toBe("story-1");
    expect(score.rankingScore).toBeGreaterThan(0);
    expect(score.trendingScore).toBeGreaterThan(0);
  });

  it("ranks candidates through the application service", () => {
    const service =
      createPosterBrainRankingScoringService();

    const ranked =
      service.rankCandidates({
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
          candidate({
            externalContentId: "high",
            qualityScore: 0.9,
          }),
        ],
        surface: "home",
        policy,
        userProfile,
        limit: 1,
      });

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.externalContentId).toBe("high");
  });
});