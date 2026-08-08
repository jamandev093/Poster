import { describe, expect, it } from "vitest";

import {
  createPosterBrainContentIngestionService,
  createPosterBrainRankedFeedReadService,
  type PosterBrainRankedDiscoveryQueryInput,
  type PosterBrainRankedDiscoveryQueryRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainDiscoveryContentPersistenceInput,
  PosterBrainDiscoveryContentRankingRow,
  PosterBrainNormalizedContentItem,
  PosterBrainRankingPolicy,
  PosterBrainRssSource,
  PosterBrainUserInterestProfile,
} from "../src/domains/poster-brain/index.js";

class StaticRankingRepository
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

const source: PosterBrainRssSource = {
  sourceKey: "example-news",
  sourceName: "Example News",
  homepageUrl: "https://www.example.com",
  feedUrl: "https://www.example.com/rss.xml",
  publisherName: "Example News",
  defaultLanguage: "en",
  defaultRegion: "IN",
  acquisitionMethod: "authorized_rss",
};

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

function item(
  overrides: Partial<PosterBrainNormalizedContentItem> = {}
): PosterBrainNormalizedContentItem {
  return {
    externalContentId: "example-news:guid:story-1",
    sourceKey: "example-news",
    publisherName: "Example News",
    title: "AI policy update for language model regulation",
    excerpt: "Government policy teams published a detailed artificial intelligence regulation update.",
    originalUrl: "https://example.com/ai-policy",
    canonicalUrl: "https://example.com/ai-policy",
    publishedAt: "2026-08-08T10:00:00.000Z",
    updatedAt: null,
    language: "en",
    region: "IN",
    author: "Reporter",
    tags: ["AI", "Policy"],
    imageUrl: "https://example.com/image.jpg",
    acquisitionMethod: "authorized_rss",
    canonicalIdentity: "example-news:guid:story-1",
    searchKeywords: ["machine learning", "policy"],
    ...overrides,
  };
}

function createClassifiedContent(
  contentItem: PosterBrainNormalizedContentItem
): PosterBrainDiscoveryContentPersistenceInput {
  const ingestionService =
    createPosterBrainContentIngestionService();

  const plan =
    ingestionService.createClassifiedPersistencePlan({
      source,
      items: [contentItem],
      discoveredAt: "2026-08-08T12:00:00.000Z",
    });

  const content =
    plan.contentItems[0];

  if (!content) {
    throw new Error("Expected classified content persistence item.");
  }

  return content;
}

function toRankingRow(
  content: PosterBrainDiscoveryContentPersistenceInput
): PosterBrainDiscoveryContentRankingRow {
  return {
    externalContentId:
      content.externalContentId,
    title:
      content.title,
    publisherName:
      content.publisherName,
    publishedAt:
      content.publishedAt,
    discoveredAt:
      content.discoveredAt,
    sourcePriorityScore:
      content.sourcePriorityScore,
    qualityScore:
      content.qualityScore,
    tags:
      content.tags,
    canonicalTopicIds:
      content.canonicalTopicIds,
    evolvingTopicIds:
      content.evolvingTopicIds,
    searchKeywords:
      content.searchKeywords,
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
}

describe("Poster Brain classification-to-ranking loop", () => {
  it("uses classified topics and quality in ranked feed scoring", async () => {
    const classifiedContent =
      createClassifiedContent(item());

    expect(classifiedContent.category).toBe("AI");
    expect(classifiedContent.canonicalTopicIds).toContain("ai");
    expect(classifiedContent.qualityScore).toBeGreaterThan(0.7);

    const repository =
      new StaticRankingRepository([
        toRankingRow(classifiedContent),
      ]);

    const readService =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    const result =
      await readService.readRankedFeed({
        surface: "home",
        policy,
        userProfile,
        limit: 1,
      });

    expect(result.scores).toHaveLength(1);
    expect(result.scores[0]?.externalContentId).toBe(
      classifiedContent.externalContentId
    );
    expect(result.scores[0]?.interestMatchScore).toBeGreaterThan(0);
    expect(result.scores[0]?.rankingScore).toBeGreaterThan(0);
  });

  it("keeps blocked classified content at zero ranking score", async () => {
    const classifiedContent =
      createClassifiedContent(
        item({
          title: "Casino gambling weapon promotion",
          excerpt: "Blocked promotional content.",
          tags: ["casino"],
          searchKeywords: ["gambling"],
        })
      );

    expect(classifiedContent.qualityScore).toBe(0);
    expect(classifiedContent.aiClassification).toMatchObject({
      safetyStatus: "blocked",
      qualityScore: 0,
    });

    const repository =
      new StaticRankingRepository([
        toRankingRow(classifiedContent),
      ]);

    const readService =
      createPosterBrainRankedFeedReadService({
        rankedDiscoveryQueryRepository:
          repository,
      });

    const result =
      await readService.readRankedFeed({
        surface: "home",
        policy,
        userProfile,
        limit: 1,
      });

    expect(result.scores).toHaveLength(1);
    expect(result.scores[0]?.rankingScore).toBe(0);
    expect(result.scores[0]?.trendingScore).toBe(0);
  });
});