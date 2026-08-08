import { describe, expect, it } from "vitest";

import {
  createPosterBrainRssIngestionService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const source: PosterBrainRssSource = {
  sourceKey: "example-news",
  sourceName: "Example News",
  homepageUrl: "https://example.com",
  feedUrl: "https://example.com/rss.xml",
  publisherName: "Example News",
  defaultLanguage: "en",
  defaultRegion: "IN",
  acquisitionMethod: "authorized_rss",
};

describe("Poster Brain RSS ingestion core logic", () => {
  it("normalizes RSS items into discovery-safe metadata", () => {
    const service =
      createPosterBrainRssIngestionService();

    const result =
      service.normalizeFeed({
        source,
        items: [
          {
            guid: "ARTICLE-1",
            title: "  AI policy update   ",
            link: "https://example.com/news/ai-policy/?utm_source=x#section",
            description: "<p>Important policy update for AI systems.</p>",
            publishedAt: "2026-08-08T10:00:00+05:30",
            author: " Reporter ",
            categories: ["AI", "Policy", "ai"],
            imageUrl: "https://example.com/image.jpg?utm_campaign=test",
          },
        ],
      });

    expect(result.rejected).toHaveLength(0);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      externalContentId: "example-news:guid:article-1",
      sourceKey: "example-news",
      publisherName: "Example News",
      title: "AI policy update",
      excerpt: "Important policy update for AI systems.",
      originalUrl: "https://example.com/news/ai-policy",
      canonicalUrl: "https://example.com/news/ai-policy",
      language: "en",
      region: "IN",
      author: "Reporter",
      acquisitionMethod: "authorized_rss",
      canonicalIdentity: "example-news:guid:article-1",
    });
    expect(result.accepted[0]?.tags).toEqual([
      "AI",
      "Policy",
    ]);
  });

  it("rejects items that cannot become discovery records", () => {
    const service =
      createPosterBrainRssIngestionService();

    const result =
      service.normalizeFeed({
        source,
        items: [
          {
            link: "https://example.com/no-title",
            description: "Missing title",
          },
          {
            title: "Missing URL",
            description: "No link",
          },
          {
            title: "Bad URL",
            link: "not-a-url",
            description: "Invalid URL",
          },
          {
            title: "Missing excerpt",
            link: "https://example.com/no-excerpt",
          },
        ],
      });

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected.map(item => item.reason)).toEqual([
      "missing_title",
      "missing_url",
      "invalid_url",
      "missing_excerpt",
    ]);
  });

  it("deduplicates feed items by canonical identity", () => {
    const service =
      createPosterBrainRssIngestionService();

    const result =
      service.normalizeFeed({
        source,
        items: [
          {
            guid: "same",
            title: "First",
            link: "https://example.com/first",
            description: "First item",
          },
          {
            guid: "same",
            title: "Second",
            link: "https://example.com/second",
            description: "Second item",
          },
        ],
      });

    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]?.title).toBe("First");
  });
});
