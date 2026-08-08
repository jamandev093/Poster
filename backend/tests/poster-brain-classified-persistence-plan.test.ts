import { describe, expect, it } from "vitest";

import {
  createPosterBrainContentIngestionService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainNormalizedContentItem,
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

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

describe("Poster Brain classified persistence planning", () => {
  it("classifies normalized content before creating the persistence plan", () => {
    const service =
      createPosterBrainContentIngestionService();

    const plan =
      service.createClassifiedPersistencePlan({
        source,
        items: [item()],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    const content =
      plan.contentItems[0];

    expect(content).toBeDefined();

    if (!content) {
      throw new Error("Expected classified content item.");
    }

    expect(content.category).toBe("AI");
    expect(content.canonicalTopicIds).toContain("ai");
    expect(content.canonicalTopicIds).toContain("policy");
    expect(content.qualityScore).toBeGreaterThan(0.7);
    expect(content.aiClassification).toMatchObject({
      provider: "poster_rule_seed",
      status: "classified",
      safetyStatus: "safe",
    });
  });

  it("carries blocked safety classification into the persistence plan", () => {
    const service =
      createPosterBrainContentIngestionService();

    const plan =
      service.createClassifiedPersistencePlan({
        source,
        items: [
          item({
            title: "Casino gambling weapon promotion",
            excerpt: "Blocked promotional content.",
            tags: ["casino"],
            searchKeywords: ["gambling"],
          }),
        ],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    expect(plan.contentItems[0]?.qualityScore).toBe(0);
    expect(plan.contentItems[0]?.aiClassification).toMatchObject({
      safetyStatus: "blocked",
      qualityScore: 0,
    });
  });
});