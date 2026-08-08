import { describe, expect, it } from "vitest";

import {
  createPosterBrainRankedFeedRouteAdapterService,
  type PosterBrainRankedDiscoveryQueryInput,
  type PosterBrainRankedDiscoveryQueryRepository,
  type PosterBrainRankedFeedUserInterestProfileResolver,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainDiscoveryContentRankingRow,
  PosterBrainUserInterestProfile,
} from "../src/domains/poster-brain/index.js";

function row(input: {
  readonly externalContentId: string;
  readonly title: string;
  readonly originalUrl?: string | null;
  readonly qualityScore: number;
  readonly tags?: readonly string[];
  readonly publishedAt?: string | null;
}): PosterBrainDiscoveryContentRankingRow {
  const base = {
    externalContentId:
      input.externalContentId,
    title:
      input.title,
    publisherName:
      "Publisher Example",
    publishedAt:
      input.publishedAt ?? "2026-08-08T11:00:00.000Z",
    discoveredAt:
      "2026-08-08T11:30:00.000Z",
    sourcePriorityScore:
      0.9,
    qualityScore:
      input.qualityScore,
    tags:
      input.tags ?? [],
    canonicalTopicIds:
      input.tags ?? [],
    evolvingTopicIds:
      [],
    searchKeywords:
      input.tags ?? [],
    impressions:
      0,
    clicks:
      0,
    shares:
      0,
    bookmarks:
      0,
    reports:
      0,
    hides:
      0,
  };

  if (input.originalUrl === undefined) {
    return base;
  }

  return {
    ...base,
    originalUrl:
      input.originalUrl,
  };
}

class RecordingRepository implements PosterBrainRankedDiscoveryQueryRepository {
  readonly calls:
    PosterBrainRankedDiscoveryQueryInput[] =
    [];

  constructor(
    private readonly rows: readonly PosterBrainDiscoveryContentRankingRow[]
  ) {}

  async listRankingRows(
    input: PosterBrainRankedDiscoveryQueryInput
  ): Promise<readonly PosterBrainDiscoveryContentRankingRow[]> {
    this.calls.push(
      input
    );

    return this.rows;
  }
}

class StaticProfileResolver
  implements PosterBrainRankedFeedUserInterestProfileResolver {
  readonly calls:
    Array<{
      readonly actorUserId: string;
    }> =
    [];

  constructor(
    private readonly profile: PosterBrainUserInterestProfile | null
  ) {}

  async resolveUserInterestProfile(input: {
    readonly actorUserId: string;
  }): Promise<PosterBrainUserInterestProfile | null> {
    this.calls.push(
      input
    );

    return this.profile;
  }
}

describe("Poster Brain ranked feed route adapter", () => {
  it("projects ranked rows into route-safe feed items", async () => {
    const repository =
      new RecordingRepository([
        row({
          externalContentId:
            "low-news",
          title:
            "Low priority story",
          originalUrl:
            "https://publisher.example.com/low",
          qualityScore:
            0.3,
          tags: [
            "sports",
          ],
        }),
        row({
          externalContentId:
            "ai-news",
          title:
            "AI policy update",
          originalUrl:
            "https://publisher.example.com/ai-policy",
          qualityScore:
            0.95,
          tags: [
            "ai",
            "policy",
          ],
        }),
      ]);

    const profileResolver =
      new StaticProfileResolver({
        topicIds: [
          "ai",
        ],
        topicNames: [
          "AI",
        ],
        searchKeywords: [
          "policy",
        ],
      });

    const service =
      createPosterBrainRankedFeedRouteAdapterService({
        rankedDiscoveryQueryRepository:
          repository,
        userInterestProfileResolver:
          profileResolver,
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await service.readRankedFeed({
        actorUserId:
          "user-0001",
        surface:
          "home",
        limit:
          2,
        candidatePoolLimit:
          25,
        searchQuery:
          "AI policy",
        languageCode:
          "en",
        regionCode:
          "IN",
        category:
          "technology",
      });

    expect(repository.calls).toEqual([
      {
        surface:
          "home",
        limit:
          25,
        searchQuery:
          "AI policy",
        languageCode:
          "en",
        regionCode:
          "IN",
        category:
          "technology",
      },
    ]);

    expect(profileResolver.calls).toEqual([
      {
        actorUserId:
          "user-0001",
      },
    ]);

    expect(result.generatedAt).toBe(
      "2026-08-08T12:00:00.000Z"
    );
    expect(result.totalItems).toBe(2);
    expect(result.items[0]).toMatchObject({
      id:
        "ai-news",
      title:
        "AI policy update",
      originalUrl:
        "https://publisher.example.com/ai-policy",
      publisherName:
        "Publisher Example",
      publishedAt:
        "2026-08-08T11:00:00.000Z",
    });
    expect(result.items[0]?.score).toBeGreaterThan(0);
    expect(result.items[0]?.metadata).toMatchObject({
      rankingScore:
        result.items[0]?.score,
    });
  });

  it("uses trending score for trending surface responses", async () => {
    const service =
      createPosterBrainRankedFeedRouteAdapterService({
        rankedDiscoveryQueryRepository:
          new RecordingRepository([
            row({
              externalContentId:
                "trend-news",
              title:
                "Trending story",
              originalUrl:
                "https://publisher.example.com/trending",
              qualityScore:
                0.9,
              tags: [
                "trend",
              ],
            }),
          ]),
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await service.readRankedFeed({
        actorUserId:
          "user-0001",
        surface:
          "trending",
        limit:
          1,
      });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.metadata.trendingScore).toBe(
      result.items[0]?.score
    );
  });

  it("does not expose ranked items without original publisher URLs", async () => {
    const service =
      createPosterBrainRankedFeedRouteAdapterService({
        rankedDiscoveryQueryRepository:
          new RecordingRepository([
            row({
              externalContentId:
                "missing-url",
              title:
                "Missing URL",
              qualityScore:
                0.95,
              tags: [
                "ai",
              ],
            }),
          ]),
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await service.readRankedFeed({
        actorUserId:
          "user-0001",
        surface:
          "home",
        limit:
          10,
      });

    expect(result).toEqual({
      generatedAt:
        "2026-08-08T12:00:00.000Z",
      totalItems:
        0,
      items:
        [],
    });
  });
});