import { describe, expect, it } from "vitest";

import {
  createPosterBrainContentClassificationService,
} from "../src/application/poster-brain/index.js";

import {
  classifyPosterBrainContentItem,
  type PosterBrainNormalizedContentItem,
} from "../src/domains/poster-brain/index.js";

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

describe("Poster Brain content classification", () => {
  it("classifies AI and policy content with discovery-safe metadata", () => {
    const result =
      classifyPosterBrainContentItem({
        item: item(),
      });

    expect(result.category).toBe("AI");
    expect(result.canonicalTopicIds).toContain("ai");
    expect(result.canonicalTopicIds).toContain("policy");
    expect(result.safetyStatus).toBe("safe");
    expect(result.qualityScore).toBeGreaterThan(0.7);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.aiClassification).toMatchObject({
      provider: "poster_rule_seed",
      version: "s02m",
      status: "classified",
      category: "AI",
      safetyStatus: "safe",
    });
  });

  it("flags unsafe blocked content and zeroes quality", () => {
    const result =
      classifyPosterBrainContentItem({
        item:
          item({
            title: "Casino gambling weapon promotion",
            excerpt: "Blocked promotional content.",
            tags: ["casino"],
            searchKeywords: ["gambling"],
          }),
      });

    expect(result.safetyStatus).toBe("blocked");
    expect(result.qualityScore).toBe(0);
    expect(result.aiClassification).toMatchObject({
      safetyStatus: "blocked",
      qualityScore: 0,
    });
  });

  it("keeps unknown safe content low-confidence but valid", () => {
    const result =
      classifyPosterBrainContentItem({
        item:
          item({
            title: "Local community garden opens",
            excerpt: "Residents opened a new community garden.",
            tags: [],
            searchKeywords: [],
          }),
      });

    expect(result.category).toBeNull();
    expect(result.canonicalTopicIds).toEqual([]);
    expect(result.safetyStatus).toBe("safe");
    expect(result.reasons).toContain("no_category_match");
  });

  it("exposes classification through the application service", () => {
    const service =
      createPosterBrainContentClassificationService();

    const result =
      service.classifyItem({
        item: item(),
      });

    expect(result.category).toBe("AI");
    expect(result.aiClassification.provider).toBe("poster_rule_seed");
  });
});