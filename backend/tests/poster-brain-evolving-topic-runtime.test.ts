import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainEvolvingTopicCanonicalPromotionService,
  createPosterBrainEvolvingTopicIngestionRunner,
  evaluatePosterBrainEvolvingTopicPromotionReadiness,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainClassifiedFeedIngestionRunner,
  PosterBrainEvolvingTopicCanonicalPromotionQueryExecutor,
  PosterBrainEvolvingTopicRecord,
} from "../src/application/poster-brain/index.js";

const PARENT_TOPIC_ID =
  "00000000-0000-4000-8000-000000000301";

const EVOLVING_TOPIC_ID =
  "00000000-0000-4000-8000-000000009901";

function readyTopic():
  PosterBrainEvolvingTopicRecord {
  return {
    id:
      EVOLVING_TOPIC_ID,

    slug:
      "large-language-models",

    displayName:
      "Large Language Models",

    canonicalParentTopicId:
      PARENT_TOPIC_ID,

    status:
      "discovered",

    observationCount:
      20,

    distinctContentCount:
      12,

    providerCount:
      2,

    averageConfidence:
      0.86,

    firstSeenAt:
      "2026-08-10T10:00:00.000Z",

    lastSeenAt:
      "2026-08-10T12:00:00.000Z",

    promotedTopicId:
      null,
  };
}

describe(
  "Poster Brain evolving topic runtime",
  () => {

    it(
      "marks sufficiently evidenced evolving topics ready for promotion",
      () => {
        expect(
          evaluatePosterBrainEvolvingTopicPromotionReadiness(
            readyTopic()
          )
        ).toEqual({
          promotable:
            true,

          reason:
            "ready",
        });
      }
    );

    it(
      "runs evolving-topic observation only after successful content ingestion",
      async () => {
        const order:
          string[] =
          [];

        const delegate = {
          async ingestClassifiedFeed() {
            order.push(
              "content"
            );

            return {
              persistedCount:
                1,

              persistencePlan: {
                contentItems: [
                  {
                    externalContentId:
                      "story-1",

                    sourceKey:
                      "publisher-one",

                    category:
                      "Artificial Intelligence",

                    canonicalTopicIds: [
                      "ai",
                    ],

                    evolvingTopicIds: [
                      "large-language-models",
                    ],

                    aiClassification: {
                      category:
                        "Artificial Intelligence",

                      topics: [
                        "Large Language Models",
                      ],

                      confidence:
                        0.91,

                      model:
                        "poster-model-v1",

                      classifiedAt:
                        "2026-08-10T12:00:00.000Z",
                    },

                    discoveredAt:
                      "2026-08-10T12:00:00.000Z",
                  },
                ],
              },
            } as never;
          },
        } as PosterBrainClassifiedFeedIngestionRunner;

        const runner =
          createPosterBrainEvolvingTopicIngestionRunner({
            delegate,

            lifecycleService: {
              evaluatePromotionReadiness() {
                return {
                  promotable:
                    false,

                  reason:
                    "insufficient_observations",
                };
              },

              async observeClassification() {
                order.push(
                  "evolving"
                );

                return {
                  preparedCount:
                    1,

                  insertedEvidenceCount:
                    1,

                  duplicateEvidenceCount:
                    0,

                  promotableCount:
                    0,
                };
              },
            },
          });

        const result =
          await runner.ingestClassifiedFeed({
            source:
              {} as never,

            feedXml:
              "<rss />",

            discoveredAt:
              "2026-08-10T12:00:00.000Z",
          });

        expect(
          result.persistedCount
        ).toBe(
          1
        );

        expect(
          order
        ).toEqual([
          "content",
          "evolving",
        ]);
      }
    );

    it(
      "keeps canonical promotion behind the explicit promotable transaction boundary",
      async () => {
        const calls:
          string[] =
          [];

        const executor:
          PosterBrainEvolvingTopicCanonicalPromotionQueryExecutor =
          {
            async query(
              sql
            ) {
              calls.push(
                sql
              );

              return {
                rows: [
                  {
                    evolving_topic_id:
                      EVOLVING_TOPIC_ID,

                    canonical_topic_id:
                      "00000000-0000-4000-8000-000000009999",

                    slug:
                      "large-language-models",

                    canonical_parent_topic_id:
                      PARENT_TOPIC_ID,

                    created_canonical_topic:
                      true,
                  },
                ],
              };
            },
          };

        const service =
          createPosterBrainEvolvingTopicCanonicalPromotionService(
            executor
          );

        const result =
          await service.promoteApproved({
            approved:
              true,

            evolvingTopicId:
              EVOLVING_TOPIC_ID,

            description:
              "Stable topic approved after sufficient accumulated evidence.",
          });

        expect(
          result.createdCanonicalTopic
        ).toBe(
          true
        );

        expect(
          calls[0]
        ).toContain(
          "evolving.status = 'promotable'"
        );

        expect(
          calls[0]
        ).toContain(
          "FOR UPDATE"
        );

        expect(
          calls[0]
        ).toContain(
          "INSERT INTO app.taxonomy_topics"
        );

        expect(
          calls[0]
        ).toContain(
          "status = 'promoted'"
        );
      }
    );
  }
);