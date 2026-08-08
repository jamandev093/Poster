import { describe, expect, it } from "vitest";

import {
  createPosterBrainRankedFeedReadService,
  type PosterBrainRankedDiscoveryQueryInput,
  type PosterBrainRankedDiscoveryQueryRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainDiscoveryContentRankingRow,
  PosterBrainRankingPolicy,
  PosterBrainUserInterestProfile,
} from "../src/domains/poster-brain/index.js";

class RecordingQueryRepository
  implements PosterBrainRankedDiscoveryQueryRepository {
  readonly queries: PosterBrainRankedDiscoveryQueryInput[] =
    [];

  constructor(
    private readonly rows: readonly PosterBrainDiscoveryContentRankingRow[]
  ) {}

  async listRankingRows(
    query: PosterBrainRankedDiscoveryQueryInput
  ): Promise<readonly PosterBrainDiscoveryContentRankingRow[]> {
    this.queries.push(query);

    return this.rows;
  }
}

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
    tags: ["AI", "Policy"],
    canonicalTopicIds: ["ai"],
    evolvingTopicIds: ["machine-learning"],
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

describe("Poster Brain ranked feed read service", () => {
  it("queries discovery rows and returns ranked feed scores", async () => {
    const repository =
      new RecordingQueryRepository([
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
      ]);

    const service =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    const result =
      await service.readRankedFeed({
        surface: "home",
        policy,
        userProfile,
        limit: 2,
      });

    expect(result.surface).toBe("home");
    expect(result.totalCandidateRows).toBe(2);
    expect(result.rankedCount).toBe(2);
    expect(result.scores[0]?.externalContentId).toBe("high");
  });

  it("requests a larger candidate pool than final feed limit", async () => {
    const repository =
      new RecordingQueryRepository([
        row({
          externalContentId: "one",
        }),
      ]);

    const service =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    await service.readRankedFeed({
      surface: "trending",
      policy,
      userProfile,
      limit: 10,
      offset: 5,
      searchQuery: " AI ",
      languageCode: "en",
      regionCode: "IN",
      category: "AI",
    });

    expect(repository.queries[0]).toEqual({
      surface: "trending",
      limit: 30,
      offset: 5,
      searchQuery: " AI ",
      languageCode: "en",
      regionCode: "IN",
      category: "AI",
    });
  });

  it("honors explicit candidate pool limit while keeping final result limit", async () => {
    const repository =
      new RecordingQueryRepository([
        row({ externalContentId: "one" }),
        row({ externalContentId: "two" }),
        row({ externalContentId: "three" }),
      ]);

    const service =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    const result =
      await service.readRankedFeed({
        surface: "search",
        policy,
        userProfile,
        limit: 1,
        candidatePoolLimit: 50,
      });

    expect(repository.queries[0]?.limit).toBe(50);
    expect(result.scores).toHaveLength(1);
  });

  it("clamps invalid final limits safely", async () => {
    const repository =
      new RecordingQueryRepository([
        row({
          externalContentId: "one",
        }),
      ]);

    const service =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    const result =
      await service.readRankedFeed({
        surface: "home",
        policy,
        userProfile: null,
        limit: 0,
      });

    expect(repository.queries[0]?.limit).toBe(3);
    expect(result.scores).toHaveLength(1);
  });
});