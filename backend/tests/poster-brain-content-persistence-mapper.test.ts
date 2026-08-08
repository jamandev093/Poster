import { describe, expect, it } from "vitest";

import {
  createPosterBrainContentIngestionService,
} from "../src/application/poster-brain/index.js";

import {
  createPosterBrainContentPersistencePlan,
  type PosterBrainNormalizedContentItem,
  type PosterBrainRssSource,
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

const item: PosterBrainNormalizedContentItem = {
  externalContentId: "example-news:guid:story-1",
  sourceKey: "example-news",
  publisherName: "Example News",
  title: "RSS Story",
  excerpt: "RSS story excerpt.",
  originalUrl: "https://example.com/news/story-1",
  canonicalUrl: "https://example.com/news/story-1",
  publishedAt: "2026-08-08T10:00:00.000Z",
  updatedAt: null,
  language: "en",
  region: "IN",
  author: "Reporter",
  tags: ["AI", "Policy"],
  imageUrl: "https://example.com/image.jpg",
  acquisitionMethod: "authorized_rss",
  canonicalIdentity: "example-news:guid:story-1",
  searchKeywords: ["rss story", "example news", "ai", "policy"],
};

describe("Poster Brain content persistence mapper", () => {
  it("maps a source into discovery source persistence input", () => {
    const plan =
      createPosterBrainContentPersistencePlan({
        source,
        items: [item],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    expect(plan.source).toMatchObject({
      sourceKey: "example-news",
      displayName: "Example News",
      homepageUrl: "https://www.example.com",
      primaryDomain: "example.com",
      acquisitionMethod: "authorized_rss",
      status: "active",
      languageCode: "en",
      regionCode: "IN",
    });

    expect(plan.source.syncPolicy).toMatchObject({
      feedUrl: "https://www.example.com/rss.xml",
    });

    expect(plan.source.copyrightPolicy).toMatchObject({
      originalPublisherUrlRequired: true,
      fullArticleBodyStorageAllowed: false,
    });
  });

  it("deduplicates publisher domains for persistence", () => {
    const secondItem: PosterBrainNormalizedContentItem = {
      ...item,
      externalContentId: "example-news:guid:story-2",
      title: "Second Story",
      canonicalIdentity: "example-news:guid:story-2",
      originalUrl: "https://www.example.com/news/story-2",
      canonicalUrl: "https://www.example.com/news/story-2",
    };

    const plan =
      createPosterBrainContentPersistencePlan({
        source,
        items: [item, secondItem],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    expect(plan.publisherDomains).toHaveLength(1);

    const domain =
      plan.publisherDomains[0];

    expect(domain).toBeDefined();

    if (!domain) {
      throw new Error("Expected publisher domain.");
    }

    expect(domain).toMatchObject({
      domain: "example.com",
      publisherName: "Example News",
      sourceKey: "example-news",
      status: "active",
    });
  });

  it("maps normalized content into discovery content persistence input", () => {
    const plan =
      createPosterBrainContentPersistencePlan({
        source,
        items: [item],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    expect(plan.contentItems).toHaveLength(1);

    const content =
      plan.contentItems[0];

    expect(content).toBeDefined();

    if (!content) {
      throw new Error("Expected content persistence input.");
    }

    expect(content).toMatchObject({
      externalContentId: "example-news:guid:story-1",
      sourceKey: "example-news",
      publisherDomain: "example.com",
      publisherName: "Example News",
      title: "RSS Story",
      excerpt: "RSS story excerpt.",
      originalUrl: "https://example.com/news/story-1",
      canonicalUrl: "https://example.com/news/story-1",
      imageUrl: "https://example.com/image.jpg",
      mediaType: "article",
      status: "active",
      category: "AI",
      languageCode: "en",
      regionCode: "IN",
      publishedAt: "2026-08-08T10:00:00.000Z",
      discoveredAt: "2026-08-08T12:00:00.000Z",
      qualityScore: 0.5,
      rankingScore: 0,
      trendingScore: 0,
      sourcePriorityScore: 0.9,
    });

    expect(content.tags).toEqual(["AI", "Policy"]);
    expect(content.searchKeywords).toEqual([
      "rss story",
      "example news",
      "ai",
      "policy",
    ]);
    expect(content.canonicalTopicIds).toEqual([]);
    expect(content.evolvingTopicIds).toEqual([]);
    expect(content.metadata).toMatchObject({
      acquisitionMethod: "authorized_rss",
      canonicalIdentity: "example-news:guid:story-1",
      rssAuthor: "Reporter",
      sourceKey: "example-news",
    });
    expect(content.aiClassification).toMatchObject({
      status: "pending",
    });
  });

  it("applies classification values to content persistence input", () => {
    const plan =
      createPosterBrainContentPersistencePlan({
        source,
        items: [item],
        discoveredAt: "2026-08-08T12:00:00.000Z",
        classifications: [
          {
            externalContentId: "example-news:guid:story-1",
            category: "AI",
            canonicalTopicIds: ["ai", "policy"],
            evolvingTopicIds: ["machine-learning"],
            qualityScore: 0.86,
            aiClassification: {
              status: "classified",
              provider: "poster_rule_seed",
            },
          },
        ],
      });

    const content = plan.contentItems[0];

    expect(content).toBeDefined();

    if (!content) {
      throw new Error("Expected content persistence input.");
    }

    expect(content).toMatchObject({
      category: "AI",
      qualityScore: 0.86,
    });
    expect(content.canonicalTopicIds).toEqual(["ai", "policy"]);
    expect(content.evolvingTopicIds).toEqual(["machine-learning"]);
    expect(content.aiClassification).toMatchObject({
      status: "classified",
      provider: "poster_rule_seed",
    });
  });

  it("exposes the mapper through the application service", () => {
    const service =
      createPosterBrainContentIngestionService();

    const plan =
      service.createPersistencePlan({
        source,
        items: [item],
        discoveredAt: "2026-08-08T12:00:00.000Z",
      });

    expect(plan.contentItems).toHaveLength(1);
    expect(plan.source.sourceKey).toBe("example-news");
  });
});