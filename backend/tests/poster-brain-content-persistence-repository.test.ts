import { describe, expect, it } from "vitest";

import {
  createPosterBrainContentPersistenceRepository,
  persistPosterBrainContentPlan,
  type PosterBrainDatabaseExecutor,
  type PosterBrainDatabaseQueryResult,
  type PosterBrainQueryRow,
} from "../src/application/poster-brain/index.js";

import {
  createPosterBrainContentPersistencePlan,
  type PosterBrainNormalizedContentItem,
  type PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

interface RecordedQuery {
  readonly text: string;
  readonly values: readonly unknown[];
}

class RecordingExecutor implements PosterBrainDatabaseExecutor {
  readonly calls: RecordedQuery[] =
    [];

  async query<Row extends PosterBrainQueryRow = PosterBrainQueryRow>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<PosterBrainDatabaseQueryResult<Row>> {
    this.calls.push({
      text,
      values,
    });

    return {
      rows: [
        {
          id:
            `row-${this.calls.length}`,
        } as unknown as Row,
      ],
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

function createPlan() {
  return createPosterBrainContentPersistencePlan({
    source,
    items: [item],
    discoveredAt: "2026-08-08T12:00:00.000Z",
  });
}

describe("Poster Brain content persistence repository", () => {
  it("persists source, publisher domain, and content item in order", async () => {
    const executor =
      new RecordingExecutor();

    const result =
      await persistPosterBrainContentPlan({
        executor,
        plan:
          createPlan(),
      });

    expect(result).toEqual({
      sourceId: "row-1",
      publisherDomainIds: ["row-2"],
      contentItemIds: ["row-3"],
      persistedContentCount: 1,
    });

    expect(executor.calls).toHaveLength(3);
    expect(executor.calls[0]?.text).toContain(
      "INSERT INTO app.discovery_sources"
    );
    expect(executor.calls[1]?.text).toContain(
      "INSERT INTO app.discovery_publisher_domains"
    );
    expect(executor.calls[2]?.text).toContain(
      "INSERT INTO app.discovery_content_items"
    );
  });

  it("uses conflict-safe upserts for existing discovery records", async () => {
    const executor =
      new RecordingExecutor();

    await persistPosterBrainContentPlan({
      executor,
      plan:
        createPlan(),
    });

    expect(executor.calls[0]?.text).toContain(
      "ON CONFLICT (source_key)"
    );
    expect(executor.calls[1]?.text).toContain(
      "ON CONFLICT (domain)"
    );
    expect(executor.calls[2]?.text).toContain(
      "ON CONFLICT (external_content_id)"
    );
  });

  it("binds discovery-safe source and content JSON values", async () => {
    const executor =
      new RecordingExecutor();

    await persistPosterBrainContentPlan({
      executor,
      plan:
        createPlan(),
    });

    const sourceValues =
      executor.calls[0]?.values;

    expect(sourceValues?.[0]).toBe("example-news");
    expect(sourceValues?.[8]).toBe(
      JSON.stringify({
        feedUrl:
          "https://www.example.com/rss.xml",
      })
    );

    const contentValues =
      executor.calls[2]?.values;

    expect(contentValues?.[2]).toBe(
      "example-news:guid:story-1"
    );
    expect(contentValues?.[14]).toBe(
      JSON.stringify(["AI", "Policy"])
    );
    expect(contentValues?.[17]).toBe(
      JSON.stringify({
        status:
          "pending",
      })
    );
    expect(contentValues?.[18]).toBe(0.5);
  });

  it("exposes the repository through a factory", async () => {
    const executor =
      new RecordingExecutor();

    const repository =
      createPosterBrainContentPersistenceRepository(
        executor
      );

    const result =
      await repository.persistPlan(
        createPlan()
      );

    expect(result.persistedContentCount).toBe(1);
    expect(executor.calls).toHaveLength(3);
  });

  it("persists an empty source plan without content rows", async () => {
    const executor =
      new RecordingExecutor();

    const result =
      await persistPosterBrainContentPlan({
        executor,
        plan:
          createPosterBrainContentPersistencePlan({
            source,
            items: [],
            discoveredAt: "2026-08-08T12:00:00.000Z",
          }),
      });

    expect(result).toEqual({
      sourceId: "row-1",
      publisherDomainIds: [],
      contentItemIds: [],
      persistedContentCount: 0,
    });
    expect(executor.calls).toHaveLength(1);
  });
});