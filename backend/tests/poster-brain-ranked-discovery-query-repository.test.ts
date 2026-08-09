import { describe, expect, it } from "vitest";

import {
  createPosterBrainRankedDiscoveryQueryRepository,
  listPosterBrainRankedDiscoveryRows,
  type PosterBrainRankedDiscoveryQueryExecutor,
  type PosterBrainRankedDiscoveryQueryResult,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainDiscoveryContentRankingRow,
} from "../src/domains/poster-brain/index.js";

interface RecordedQuery {
  readonly text: string;
  readonly values: readonly unknown[];
}

class RecordingExecutor implements PosterBrainRankedDiscoveryQueryExecutor {
  readonly calls: RecordedQuery[] = [];

  constructor(
    private readonly rows: readonly PosterBrainDiscoveryContentRankingRow[] = []
  ) {}

  async query<Row = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<PosterBrainRankedDiscoveryQueryResult<Row>> {
    this.calls.push({
      text,
      values,
    });

    return {
      rows: this.rows as unknown as readonly Row[],
    };
  }
}

const rankingRow: PosterBrainDiscoveryContentRankingRow = {
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
  impressions: 0,
  clicks: 0,
  shares: 0,
  bookmarks: 0,
  reports: 0,
  hides: 0,
};

describe("Poster Brain ranked discovery query repository", () => {
  it("queries active discovery content rows for ranking", async () => {
    const executor =
      new RecordingExecutor([rankingRow]);

    const rows =
      await listPosterBrainRankedDiscoveryRows({
        executor,
        query: {
          surface: "home",
          limit: 20,
        },
      });

    expect(rows).toEqual([rankingRow]);
    expect(executor.calls).toHaveLength(1);
    expect(executor.calls[0]?.text).toContain(
      "FROM app.discovery_content_items c"
    );
    expect(executor.calls[0]?.text).toContain(
      "INNER JOIN app.discovery_sources s"
    );
    expect(executor.calls[0]?.text).toContain(
      "WHERE c.status = 'active'"
    );

    const sql =
      executor.calls[0]?.text ??
      "";

    expect(sql).toContain(
      "FROM app.mobile_user_share_events"
    );

    expect(sql).toContain(
      "FROM app.mobile_user_bookmarks"
    );

    expect(sql).toContain(
      "bookmarks.deleted_at IS NULL"
    );

    expect(sql).toContain(
      "FROM app.mobile_user_report_events"
    );

    expect(sql).toContain(
      "reports.status IN ('pending', 'triaged')"
    );

    expect(sql).toContain(
      "FROM app.mobile_user_article_feedback"
    );

    expect(sql).toContain(
      "feedback.reason_id = 'not_interested'"
    );

    expect(sql).toContain(
      "FROM app.mobile_user_content_events"
    );

    expect(sql).toContain(
      "content_events.event_type = 'impression'"
    );

    expect(sql).toContain(
      "content_events.event_type = 'open_original_click'"
    );
  });

  it("binds optional filters, limit, and offset safely", async () => {
    const executor =
      new RecordingExecutor();

    await listPosterBrainRankedDiscoveryRows({
      executor,
      query: {
        surface: "search",
        limit: 500,
        offset: -10,
        searchQuery: " ai policy ",
        languageCode: " en ",
        regionCode: " IN ",
        category: " AI ",
      },
    });

    expect(executor.calls[0]?.values).toEqual([
      "en",
      "IN",
      "AI",
      "ai policy",
      100,
      0,
    ]);
  });

  it("uses trending-first ordering for trending surface", async () => {
    const executor =
      new RecordingExecutor();

    await listPosterBrainRankedDiscoveryRows({
      executor,
      query: {
        surface: "trending",
        limit: 10,
      },
    });

    const sql =
      executor.calls[0]?.text ?? "";

    expect(sql.indexOf("c.trending_score DESC")).toBeLessThan(
      sql.indexOf("c.ranking_score DESC")
    );
  });

  it("uses ranking-first ordering for home and search surfaces", async () => {
    const executor =
      new RecordingExecutor();

    await listPosterBrainRankedDiscoveryRows({
      executor,
      query: {
        surface: "home",
        limit: 10,
      },
    });

    const sql =
      executor.calls[0]?.text ?? "";

    expect(sql.indexOf("c.ranking_score DESC")).toBeLessThan(
      sql.indexOf("c.trending_score DESC")
    );
  });

  it("exposes the repository through a factory", async () => {
    const executor =
      new RecordingExecutor([rankingRow]);

    const repository =
      createPosterBrainRankedDiscoveryQueryRepository(
        executor
      );

    const rows =
      await repository.listRankingRows({
        surface: "home",
        limit: 10,
      });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.externalContentId).toBe("story-1");
  });
});