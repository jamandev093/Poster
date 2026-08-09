import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiLearningDatasetRepository,
} from "../src/application/poster-brain/ai-learning-dataset.repository.js";

import type {
  PosterBrainAiLearningDatasetQueryExecutor,
} from "../src/application/poster-brain/ai-learning-dataset.repository.js";

interface RecordedQuery {
  readonly text:
    string;

  readonly values:
    readonly unknown[] |
    undefined;
}

class RecordingDatabase
  implements PosterBrainAiLearningDatasetQueryExecutor
{
  readonly calls:
    RecordedQuery[] =
    [];

  private readonly results:
    readonly (readonly unknown[])[];

  constructor(
    results:
      readonly (readonly unknown[])[]
  ) {
    this.results =
      results;
  }

  async query<Row>(
    text:
      string,
    values?:
      readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }> {
    const resultIndex =
      this.calls.length;

    this.calls.push({
      text,
      values,
    });

    return {
      rows:
        (
          this.results[
            resultIndex
          ] ??
          []
        ) as readonly Row[],
    };
  }
}

function createRawRow(input: {
  readonly eventKey:
    string;

  readonly source:
    string;

  readonly sourceEventId:
    string;

  readonly signalType:
    string;

  readonly occurredAt:
    string;

  readonly bookmarkActive?:
    boolean |
    null;

  readonly contentId?:
    string;
}) {
  return {
    eventKey:
      input.eventKey,

    source:
      input.source,

    sourceEventId:
      input.sourceEventId,

    signalType:
      input.signalType,

    occurredAt:
      input.occurredAt,

    surface:
      input.signalType ===
      "open_original_click"
        ? "home"
        : null,

    reasonId:
      null,

    reportStatus:
      null,

    bookmarkActive:
      input.bookmarkActive ??
      null,

    contentId:
      input.contentId ??
      "22222222-2222-4222-8222-222222222222",

    sourceKey:
      "example-feed",

    publisherName:
      "Example Publisher",

    title:
      "Example title",

    excerpt:
      "Example excerpt",

    mediaType:
      "article",

    languageCode:
      "en",

    regionCode:
      "IN",

    category:
      "technology",

    canonicalTopicIds:
      [
        "ai",
      ],

    evolvingTopicIds:
      [
        "agents",
      ],

    tags:
      [
        "AI",
      ],

    searchKeywords:
      [
        "artificial intelligence",
      ],

    aiClassification: {
      category:
        "technology",

      confidence:
        0.91,
    },

    qualityScore:
      "0.875000",

    publishedAt:
      "2026-08-09T08:00:00.000Z",

    contentStatus:
      "active",
  };
}

describe(
  "Poster Brain AI learning dataset repository",
  () => {
    it(
      "freezes all six organic sources at one cutoff and preserves it across cursor pages",
      async () => {
        const firstRow =
          createRawRow({
            eventKey:
              "organic_content_event:event-1",

            source:
              "organic_content_event",

            sourceEventId:
              "event-1",

            signalType:
              "open_original_click",

            occurredAt:
              "2026-08-09T10:00:00.000Z",
          });

        const secondRow =
          createRawRow({
            eventKey:
              "bookmark:bookmark-1",

            source:
              "bookmark",

            sourceEventId:
              "bookmark-1",

            signalType:
              "bookmark",

            occurredAt:
              "2026-08-09T09:30:00.000Z",

            bookmarkActive:
              false,
          });

        const database =
          new RecordingDatabase([
            [
              firstRow,
              secondRow,
            ],

            [
              secondRow,
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetRepository(
            database
          );

        const cutoff =
          "2026-08-09T11:00:00Z";

        const firstPage =
          await repository.listPage({
            limit:
              1,

            sourceCutoffAt:
              cutoff,
          });

        expect(
          firstPage.events
        ).toHaveLength(
          1
        );

        expect(
          firstPage.events[0]
            ?.signalType
        ).toBe(
          "open_original_click"
        );

        expect(
          firstPage.events[0]
            ?.content.qualityScore
        ).toBe(
          0.875
        );

        expect(
          firstPage.nextCursor
        ).toBe(
          "2026-08-09T10:00:00.000Z|organic_content_event:event-1"
        );

        const firstCall =
          database.calls[0];

        expect(
          firstCall
        ).toBeDefined();

        const sql =
          firstCall?.text ??
          "";

        expect(sql).toContain(
          "app.mobile_user_content_events"
        );

        expect(sql).toContain(
          "app.mobile_user_share_events"
        );

        expect(sql).toContain(
          "app.mobile_user_report_events"
        );

        expect(sql).toContain(
          "app.mobile_user_bookmarks"
        );

        expect(sql).toContain(
          "app.mobile_user_article_interactions"
        );

        expect(sql).toContain(
          "app.mobile_user_article_feedback"
        );

        expect(sql).toContain(
          "e.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "s.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "r.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "b.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "i.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "f.created_at <= $3::timestamptz"
        );

        expect(sql).toContain(
          "LIMIT $4"
        );

        expect(sql).not.toContain(
          "app.mobile_ad_interactions"
        );

        expect(sql).not.toMatch(
          /\buser_id\b/
        );

        expect(
          firstCall?.values
        ).toEqual([
          null,
          null,
          "2026-08-09T11:00:00.000Z",
          2,
        ]);

        const secondPage =
          await repository.listPage({
            limit:
              1,

            cursor:
              firstPage.nextCursor,

            sourceCutoffAt:
              cutoff,
          });

        expect(
          secondPage.events
        ).toHaveLength(
          1
        );

        expect(
          secondPage.events[0]
            ?.source
        ).toBe(
          "bookmark"
        );

        expect(
          secondPage.events[0]
            ?.bookmarkActive
        ).toBe(
          false
        );

        expect(
          secondPage.nextCursor
        ).toBeNull();

        expect(
          database.calls[1]
            ?.values
        ).toEqual([
          "2026-08-09T10:00:00.000Z",
          "organic_content_event:event-1",
          "2026-08-09T11:00:00.000Z",
          2,
        ]);
      }
    );

    it(
      "keeps live dataset reads compatible when no snapshot cutoff is supplied",
      async () => {
        const database =
          new RecordingDatabase([
            [],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetRepository(
            database
          );

        const page =
          await repository.listPage();

        expect(
          page.events
        ).toEqual(
          []
        );

        expect(
          page.nextCursor
        ).toBeNull();

        expect(
          database.calls[0]
            ?.values
        ).toEqual([
          null,
          null,
          null,
          1001,
        ]);
      }
    );
  }
);