import { describe, expect, it } from "vitest";

import {
  createPosterBrainFeedIngestionService,
  type PosterBrainContentPersistenceRepository,
  type PosterBrainContentPersistenceRepositoryResult,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainContentPersistencePlan,
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

class RecordingRepository
  implements PosterBrainContentPersistenceRepository {
  readonly plans: PosterBrainContentPersistencePlan[] =
    [];

  async persistPlan(
    plan: PosterBrainContentPersistencePlan
  ): Promise<PosterBrainContentPersistenceRepositoryResult> {
    this.plans.push(plan);

    return {
      sourceId:
        "source-1",
      publisherDomainIds:
        plan.publisherDomains.map(
          (_, index) => `domain-${index + 1}`
        ),
      contentItemIds:
        plan.contentItems.map(
          (_, index) => `content-${index + 1}`
        ),
      persistedContentCount:
        plan.contentItems.length,
    };
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

describe("Poster Brain feed ingestion orchestrator", () => {
  it("parses, normalizes, plans, and persists RSS XML", async () => {
    const repository =
      new RecordingRepository();

    const service =
      createPosterBrainFeedIngestionService({
        contentPersistenceRepository:
          repository,
      });

    const result =
      await service.ingestFeedXml({
        source,
        discoveredAt:
          "2026-08-08T12:00:00.000Z",
        xml: `
          <rss version="2.0">
            <channel>
              <item>
                <guid>story-1</guid>
                <title>Poster Brain Story</title>
                <link>https://example.com/story-1/?utm_source=test</link>
                <description><![CDATA[<p>Discovery-safe excerpt.</p>]]></description>
                <category>AI</category>
              </item>
            </channel>
          </rss>
        `,
      });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(result.persistence.persistedContentCount).toBe(1);
    expect(result.persistence.contentItemIds).toEqual([
      "content-1",
    ]);

    expect(repository.plans).toHaveLength(1);

    const plan =
      repository.plans[0];

    expect(plan).toBeDefined();

    if (!plan) {
      throw new Error("Expected persistence plan.");
    }

    expect(plan.source.sourceKey).toBe("example-news");
    expect(plan.contentItems[0]).toMatchObject({
      externalContentId: "example-news:guid:story-1",
      title: "Poster Brain Story",
      excerpt: "Discovery-safe excerpt.",
      originalUrl: "https://example.com/story-1",
      canonicalUrl: "https://example.com/story-1",
      category: "AI",
    });
  });

  it("persists valid items and reports rejected invalid RSS records", async () => {
    const repository =
      new RecordingRepository();

    const service =
      createPosterBrainFeedIngestionService({
        contentPersistenceRepository:
          repository,
      });

    const result =
      await service.ingestFeedXml({
        source,
        discoveredAt:
          "2026-08-08T12:00:00.000Z",
        xml: `
          <rss version="2.0">
            <channel>
              <item>
                <guid>valid-1</guid>
                <title>Valid Story</title>
                <link>https://example.com/valid-1</link>
                <description>Valid excerpt.</description>
              </item>
              <item>
                <guid>invalid-1</guid>
                <link>https://example.com/missing-title</link>
                <description>Missing title.</description>
              </item>
            </channel>
          </rss>
        `,
      });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(result.rejected[0]?.reason).toBe("missing_title");
    expect(result.persistence.persistedContentCount).toBe(1);

    const plan =
      repository.plans[0];

    expect(plan?.contentItems).toHaveLength(1);
    expect(plan?.contentItems[0]?.title).toBe("Valid Story");
  });

  it("still persists the source plan when a feed has no accepted content", async () => {
    const repository =
      new RecordingRepository();

    const service =
      createPosterBrainFeedIngestionService({
        contentPersistenceRepository:
          repository,
      });

    const result =
      await service.ingestFeedXml({
        source,
        discoveredAt:
          "2026-08-08T12:00:00.000Z",
        xml: `
          <rss version="2.0">
            <channel>
              <item>
                <guid>invalid-1</guid>
                <link>https://example.com/missing-title</link>
                <description>Missing title.</description>
              </item>
            </channel>
          </rss>
        `,
      });

    expect(result.acceptedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.persistence).toEqual({
      sourceId: "source-1",
      publisherDomainIds: [],
      contentItemIds: [],
      persistedContentCount: 0,
    });

    expect(repository.plans).toHaveLength(1);
    expect(repository.plans[0]?.contentItems).toHaveLength(0);
  });
});