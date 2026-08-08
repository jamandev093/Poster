import { describe, expect, it } from "vitest";

import {
  mapPosterBrainDiscoveryContentRowsToRankingCandidates,
  mapPosterBrainDiscoveryContentRowToRankingCandidate,
  scorePosterBrainRankingCandidate,
  type PosterBrainDiscoveryContentRankingRow,
  type PosterBrainRankingPolicy,
} from "../src/domains/poster-brain/index.js";

const policy: PosterBrainRankingPolicy = {
  now: "2026-08-08T12:00:00.000Z",
  freshnessHalfLifeHours: 24,
  minimumQualityScore: 0.3,
  reportPenaltyWeight: 0.08,
  hidePenaltyWeight: 0.05,
};

function row(
  overrides: Partial<PosterBrainDiscoveryContentRankingRow> = {}
): PosterBrainDiscoveryContentRankingRow {
  return {
    externalContentId: "story-1",
    title: "  AI policy update  ",
    publisherName: " Example News ",
    publishedAt: "2026-08-08T06:00:00.000Z",
    discoveredAt: "2026-08-08T07:00:00.000Z",
    sourcePriorityScore: "0.9",
    qualityScore: "0.8",
    tags: `["AI","Policy","ai"]`,
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

describe("Poster Brain ranking candidate mapper", () => {
  it("maps discovery content rows into ranking candidates", () => {
    const candidate =
      mapPosterBrainDiscoveryContentRowToRankingCandidate(
        row()
      );

    expect(candidate).toMatchObject({
      externalContentId: "story-1",
      title: "AI policy update",
      publisherName: "Example News",
      publishedAt: "2026-08-08T06:00:00.000Z",
      discoveredAt: "2026-08-08T07:00:00.000Z",
      sourcePriorityScore: 0.9,
      qualityScore: 0.8,
    });

    expect(candidate.tags).toEqual([
      "AI",
      "Policy",
    ]);
    expect(candidate.canonicalTopicIds).toEqual([
      "ai",
    ]);
    expect(candidate.evolvingTopicIds).toEqual([
      "machine-learning",
    ]);
    expect(candidate.engagement).toEqual({
      impressions: 100,
      clicks: 12,
      shares: 4,
      bookmarks: 6,
      reports: 0,
      hides: 0,
    });
  });

  it("defaults invalid optional score and engagement values safely", () => {
    const candidate =
      mapPosterBrainDiscoveryContentRowToRankingCandidate(
        row({
          sourcePriorityScore: null,
          qualityScore: "bad",
          tags: null,
          canonicalTopicIds: "not-json",
          evolvingTopicIds: {},
          searchKeywords: "",
          impressions: null,
          clicks: "bad",
          shares: -2,
          bookmarks: null,
          reports: null,
          hides: null,
        })
      );

    expect(candidate.sourcePriorityScore).toBe(0.5);
    expect(candidate.qualityScore).toBe(0.5);
    expect(candidate.tags).toEqual([]);
    expect(candidate.canonicalTopicIds).toEqual([]);
    expect(candidate.evolvingTopicIds).toEqual([]);
    expect(candidate.searchKeywords).toEqual([]);
    expect(candidate.engagement).toEqual({
      impressions: 0,
      clicks: 0,
      shares: 0,
      bookmarks: 0,
      reports: 0,
      hides: 0,
    });
  });

  it("maps multiple rows and keeps them score-ready", () => {
    const candidates =
      mapPosterBrainDiscoveryContentRowsToRankingCandidates([
        row({
          externalContentId: "story-1",
        }),
        row({
          externalContentId: "story-2",
          title: "Second story",
          qualityScore: 0.7,
        }),
      ]);

    expect(candidates).toHaveLength(2);

    const score =
      scorePosterBrainRankingCandidate({
        candidate: candidates[0]!,
        surface: "home",
        policy,
        userProfile: {
          topicIds: ["ai"],
          topicNames: ["Policy"],
          searchKeywords: ["machine learning"],
        },
      });

    expect(score.rankingScore).toBeGreaterThan(0);
  });

  it("rejects rows without required ranking identity fields", () => {
    expect(() =>
      mapPosterBrainDiscoveryContentRowToRankingCandidate(
        row({
          externalContentId: " ",
        })
      )
    ).toThrow(/externalContentId/);

    expect(() =>
      mapPosterBrainDiscoveryContentRowToRankingCandidate(
        row({
          discoveredAt: "not-a-date",
        })
      )
    ).toThrow(/discoveredAt/);
  });
});