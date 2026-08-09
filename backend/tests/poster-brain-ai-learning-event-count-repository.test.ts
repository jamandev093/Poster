import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiLearningEventCountRepository,
} from "../src/application/poster-brain/ai-learning-event-count.repository.js";

import type {
  PosterBrainAiLearningEventCountDatabase,
} from "../src/application/poster-brain/ai-learning-event-count.repository.js";

describe(
  "Poster Brain AI learning event count repository",
  () => {
    it(
      "counts real organic learning signals and excludes ad telemetry",
      async () => {
        const database:
          PosterBrainAiLearningEventCountDatabase = {
            async query<Row>(
              text: string
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

              expect(text).not.toContain(
                "app.mobile_ad_interactions"
              );

              return {
                rows: [
                  {
                    organicContentEvents: "7000",
                    shareEvents: "500",
                    reportEvents: "100",
                    bookmarkEvents: "1000",
                    articleInteractions: "1200",
                    articleFeedback: "200",
                    observedEventCount: "10000",
                  } as Row,
                ],
              };
            },
          };

        const repository =
          createPostgreSqlPosterBrainAiLearningEventCountRepository(
            database
          );

        await expect(
          repository.getSnapshot()
        ).resolves.toEqual({
          organicContentEvents: 7000,
          shareEvents: 500,
          reportEvents: 100,
          bookmarkEvents: 1000,
          articleInteractions: 1200,
          articleFeedback: 200,
          observedEventCount: 10000,
        });
      }
    );
  }
);