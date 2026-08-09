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

describe(
  "Poster Brain AI learning dataset repository",
  () => {
    it(
      "reads only real organic signal sources and maps normalized content features",
      async () => {
        const database:
          PosterBrainAiLearningDatasetQueryExecutor = {
            async query<Row>(
              text: string,
              values?: readonly unknown[]
            ): Promise<{
              rows: readonly Row[];
            }> {
              expect(text).toContain(
                "app.mobile_user_content_events"
              );

              expect(text).toContain(
                "app.mobile_user_share_events"
              );

              expect(text).toContain(
                "app.mobile_user_report_events"
              );

              expect(text).toContain(
                "app.mobile_user_bookmarks"
              );

              expect(text).toContain(
                "app.mobile_user_article_interactions"
              );

              expect(text).toContain(
                "app.mobile_user_article_feedback"
              );

              expect(text).toContain(
                "app.discovery_content_items"
              );

              expect(text).toContain(
                "app.discovery_sources"
              );

              expect(text).toContain(
                "app.discovery_publisher_domains"
              );

              expect(text).not.toContain(
                "app.mobile_ad_interactions"
              );

              expect(text).not.toMatch(
                /\buser_id\b/
              );

              expect(values).toEqual([
                null,
                null,
                2,
              ]);

              const rows = [
                {
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

                  surface:
                    "home",

                  reasonId:
                    null,

                  reportStatus:
                    null,

                  bookmarkActive:
                    null,

                  contentId:
                    "content-1",

                  sourceKey:
                    "publisher-feed",

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

                  canonicalTopicIds: [
                    "ai",
                    "technology",
                  ],

                  evolvingTopicIds: [
                    "agents",
                  ],

                  tags: [
                    "ai",
                  ],

                  searchKeywords: [
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
                    "2026-08-09T09:00:00.000Z",

                  contentStatus:
                    "active",
                },

                {
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

                  surface:
                    null,

                  reasonId:
                    null,

                  reportStatus:
                    null,

                  bookmarkActive:
                    false,

                  contentId:
                    "content-2",

                  sourceKey:
                    null,

                  publisherName:
                    "Second Publisher",

                  title:
                    "Second title",

                  excerpt:
                    "Second excerpt",

                  mediaType:
                    "article",

                  languageCode:
                    "en",

                  regionCode:
                    null,

                  category:
                    null,

                  canonicalTopicIds:
                    "[]",

                  evolvingTopicIds:
                    "[]",

                  tags:
                    "[]",

                  searchKeywords:
                    "[]",

                  aiClassification:
                    "{}",

                  qualityScore:
                    0.5,

                  publishedAt:
                    null,

                  contentStatus:
                    "active",
                },
              ];

              return {
                rows:
                  rows as unknown as readonly Row[],
              };
            },
          };

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetRepository(
            database
          );

        const page =
          await repository.listPage({
            limit: 1,
          });

        expect(page.events).toHaveLength(
          1
        );

        expect(page.events[0]).toEqual({
          schemaVersion: 1,

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

          surface:
            "home",

          reasonId:
            null,

          reportStatus:
            null,

          bookmarkActive:
            null,

          content: {
            contentId:
              "content-1",

            sourceKey:
              "publisher-feed",

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

            canonicalTopicIds: [
              "ai",
              "technology",
            ],

            evolvingTopicIds: [
              "agents",
            ],

            tags: [
              "ai",
            ],

            searchKeywords: [
              "artificial intelligence",
            ],

            aiClassification: {
              category:
                "technology",
              confidence:
                0.91,
            },

            qualityScore:
              0.875,

            publishedAt:
              "2026-08-09T09:00:00.000Z",

            contentStatus:
              "active",
          },
        });

        expect(page.nextCursor).toBe(
          "2026-08-09T10:00:00.000Z|organic_content_event:event-1"
        );
      }
    );

    it(
      "preserves inactive bookmark state in the normalized dataset",
      async () => {
        const database:
          PosterBrainAiLearningDatasetQueryExecutor = {
            async query<Row>():
              Promise<{
                rows: readonly Row[];
              }> {
              const row = {
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

                surface:
                  null,

                reasonId:
                  null,

                reportStatus:
                  null,

                bookmarkActive:
                  false,

                contentId:
                  "content-2",

                sourceKey:
                  null,

                publisherName:
                  "Second Publisher",

                title:
                  "Second title",

                excerpt:
                  "Second excerpt",

                mediaType:
                  "article",

                languageCode:
                  "en",

                regionCode:
                  null,

                category:
                  null,

                canonicalTopicIds:
                  [],

                evolvingTopicIds:
                  [],

                tags:
                  [],

                searchKeywords:
                  [],

                aiClassification:
                  {},

                qualityScore:
                  0.5,

                publishedAt:
                  null,

                contentStatus:
                  "active",
              };

              return {
                rows: [
                  row as unknown as Row,
                ],
              };
            },
          };

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetRepository(
            database
          );

        const page =
          await repository.listPage();

        expect(
          page.events[0]?.source
        ).toBe(
          "bookmark"
        );

        expect(
          page.events[0]?.bookmarkActive
        ).toBe(
          false
        );

        expect(
          page.nextCursor
        ).toBeNull();
      }
    );
  }
);