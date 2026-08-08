import { describe, expect, it } from "vitest";

import {
  assemblePosterBrainRankedFeed,
  createPosterBrainRankedFeedAssemblyService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainDiscoveryContentRankingRow,
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

function row(
  overrides: Partial<PosterBrainDiscoveryContentRankingRow> = {}
): PosterBrainDiscoveryContentRankingRow {
  return {
    externalContentId: "story-1",
    title: "AI policy update",
    publisherName: "Example News",
    publishedAt: "2026-08-08T06:00:00.000Z",
    discoveredAt: "2026-08-08T07:00:00.000Z",
    sourcePriorityScore: "0.9",
    qualityScore: "0.8",
    tags: `["AI","Policy"]`,
    canonicalTopicIds: ["ai"],
    evolvingTopicIds: `["machine-learning"]`,
    searchKeywords: ["AI policy update", "machine learning"],
    impressions: "100",
    clicks: "12",
    shares: "4",
    bookmarks: "6",
    reports: "0",
    hides: "0",
    ...overrides,
  };
}

describe("Poster Brain ranked feed assembly service", () => {
  it("maps DB rows and returns ranked feed scores", () => {
    const ranked =
      assemblePosterBrainRankedFeed({
        rows: [
          row({
            externalContentId: "low",
            qualityScore: "0.4",
            clicks: "1",
            shares: "0",
            bookmarks: "0",
          }),
          row({
            externalContentId: "high",
            qualityScore: "0.95",
            clicks: "20",
            shares: "5",
            bookmarks: "8",
          }),
        ],
        surface: "home",
        policy,
        userProfile,
        limit: 2,
      });

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.externalContentId).toBe("high");
    expect(ranked[0]?.rankingScore).toBeGreaterThan(0);
  });

  it("applies feed limits after scoring", () => {
    const ranked =
      assemblePosterBrainRankedFeed({
        rows: [
          row({ externalContentId: "one" }),
          row({ externalContentId: "two" }),
          row({ externalContentId: "three" }),
        ],
        surface: "trending",
        policy,
        userProfile,
        limit: 1,
      });

    expect(ranked).toHaveLength(1);
  });

  it("exposes ranked feed assembly through the application service", () => {
    const service =
      createPosterBrainRankedFeedAssemblyService();

    const ranked =
      service.assembleRankedFeed({
        rows: [
          row({
            externalContentId: "service-story",
          }),
        ],
        surface: "search",
        policy,
        userProfile,
        limit: 10,
      });

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.externalContentId).toBe("service-story");
    expect(ranked[0]?.interestMatchScore).toBeGreaterThan(0);
  });
});