import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiClassifiedFeedIngestionRunner,
  type PosterBrainAiClassificationProvider,
  type PosterBrainAiClassificationRequest,
  type PosterBrainContentClassificationService,
  type PosterBrainContentIngestionService,
  type PosterBrainContentPersistenceRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainContentClassificationResult,
  PosterBrainContentPersistenceClassificationInput,
  PosterBrainContentPersistencePlan,
  PosterBrainNormalizedContentItem,
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

describe(
  "Poster Brain AI classified feed ingestion runner",
  () => {
    it(
      "uses runtime AI classification while preserving baseline safety quality and canonical topics",
      async () => {
        const source =
          {
            sourceKey:
              "example-news",
          } as PosterBrainRssSource;

        const item =
          {
            externalContentId:
              "example-news:story-1",

            sourceKey:
              "example-news",

            title:
              "AI cloud infrastructure expands",

            excerpt:
              "Cloud providers are expanding AI infrastructure.",

            originalUrl:
              "https://example.com/ai-cloud",

            publishedAt:
              "2026-08-09T12:00:00.000Z",

            tags: [
              "AI",
              "Infrastructure",
            ],
          } as PosterBrainNormalizedContentItem;

        const baseline:
          PosterBrainContentClassificationResult =
          {
            category:
              "AI",

            canonicalTopicIds: [
              "ai",
            ],

            evolvingTopicIds: [
              "seed-topic",
            ],

            qualityScore:
              0.77,

            safetyStatus:
              "safe",

            confidence:
              0.81,

            reasons: [
              "topic:ai",
            ],

            aiClassification: {
              provider:
                "poster_rule_seed",

              version:
                "s02m",

              status:
                "classified",

              category:
                "AI",

              canonicalTopicIds: [
                "ai",
              ],

              evolvingTopicIds: [
                "seed-topic",
              ],

              qualityScore:
                0.77,

              safetyStatus:
                "safe",

              confidence:
                0.81,

              reasons: [
                "topic:ai",
              ],
            },
          };

        const persistencePlan =
          {
            source:
              {},

            publisherDomains: [],

            contentItems: [],
          } as unknown as PosterBrainContentPersistencePlan;

        const requests:
          PosterBrainAiClassificationRequest[] =
          [];

        const aiClassificationProvider:
          PosterBrainAiClassificationProvider =
          {
            async classifyContent(request) {
              requests.push(
                request
              );

              return {
                primaryCategory:
                  "Technology",

                topics: [
                  "AI",
                  "Cloud",
                ],

                confidence:
                  0.91,

                provider:
                  "poster-python-ai",

                model:
                  "poster-ai-v2",

                classifiedAt:
                  "2026-08-09T12:00:01.000Z",
              };
            },
          };

        const contentClassificationService:
          PosterBrainContentClassificationService =
          {
            classifyItem() {
              return baseline;
            },
          };

        let receivedClassifications:
          readonly PosterBrainContentPersistenceClassificationInput[] =
          [];

        const contentIngestionService:
          PosterBrainContentIngestionService =
          {
            createPersistencePlan(input) {
              receivedClassifications =
                input.classifications ??
                [];

              return persistencePlan;
            },

            createClassifiedPersistencePlan() {
              throw new Error(
                "AI runner must use the explicit classifications persistence path."
              );
            },
          };

        const persistedPlans:
          PosterBrainContentPersistencePlan[] =
          [];

        const contentPersistenceRepository:
          PosterBrainContentPersistenceRepository =
          {
            async persistPlan(plan) {
              persistedPlans.push(
                plan
              );

              return {
                sourceId:
                  "source-1",

                publisherDomainIds:
                  [],

                contentItemIds: [
                  "content-1",
                ],

                persistedContentCount:
                  1,
              };
            },
          };

        const runner =
          createPosterBrainAiClassifiedFeedIngestionRunner({
            aiClassificationProvider,

            contentClassificationService,

            contentIngestionService,

            contentPersistenceRepository,

            rssIngestionService: {
              parseFeedXml() {
                return {
                  accepted: [
                    item,
                  ],

                  rejected: [
                    {
                      reason:
                        "invalid-item",
                    },
                  ],
                };
              },
            },
          });

        const result =
          await runner.ingestClassifiedFeed({
            source,

            feedXml:
              "<rss />",

            discoveredAt:
              "2026-08-09T12:00:00.000Z",
          });

        expect(
          requests
        ).toEqual([
          {
            sourceKey:
              "example-news",

            url:
              "https://example.com/ai-cloud",

            title:
              "AI cloud infrastructure expands",

            excerpt:
              "Cloud providers are expanding AI infrastructure.",

            categories: [
              "AI",
              "Infrastructure",
            ],

            publishedAt:
              "2026-08-09T12:00:00.000Z",
          },
        ]);

        expect(
          receivedClassifications
        ).toHaveLength(
          1
        );

        expect(
          receivedClassifications[0]
        ).toMatchObject({
          externalContentId:
            "example-news:story-1",

          category:
            "Technology",

          canonicalTopicIds: [
            "ai",
          ],

          evolvingTopicIds: [
            "seed-topic",
            "technology",
            "ai",
            "cloud",
          ],

          qualityScore:
            0.77,

          aiClassification: {
            provider:
              "poster-python-ai",

            model:
              "poster-ai-v2",

            version:
              "poster-ai-v2",

            category:
              "Technology",

            canonicalTopicIds: [
              "ai",
            ],

            evolvingTopicIds: [
              "seed-topic",
              "technology",
              "ai",
              "cloud",
            ],

            topics: [
              "Technology",
              "AI",
              "Cloud",
            ],

            qualityScore:
              0.77,

            safetyStatus:
              "safe",

            confidence:
              0.91,

            classifiedAt:
              "2026-08-09T12:00:01.000Z",
          },
        });

        expect(
          receivedClassifications[0]
            ?.aiClassification
            .provider
        ).not.toBe(
          "poster_rule_seed"
        );

        expect(
          receivedClassifications[0]
            ?.aiClassification
            .version
        ).not.toBe(
          "s02m"
        );

        expect(
          persistedPlans
        ).toEqual([
          persistencePlan,
        ]);

        expect(
          result
        ).toEqual({
          acceptedCount:
            1,

          rejectedCount:
            1,

          persistedCount:
            1,

          persistencePlan,
        });
      }
    );

    it(
      "omits empty optional request fields and supports unversioned AI classifications",
      async () => {
        const source =
          {
            sourceKey:
              "example-news",
          } as PosterBrainRssSource;

        const item =
          {
            externalContentId:
              "example-news:story-2",

            sourceKey:
              "example-news",

            title:
              "General local update",

            excerpt:
              "   ",

            originalUrl:
              "https://example.com/general",

            publishedAt:
              null,

            tags:
              [],
          } as PosterBrainNormalizedContentItem;

        const baseline:
          PosterBrainContentClassificationResult =
          {
            category:
              null,

            canonicalTopicIds:
              [],

            evolvingTopicIds:
              [],

            qualityScore:
              0.5,

            safetyStatus:
              "safe",

            confidence:
              0.4,

            reasons:
              [],

            aiClassification: {
              provider:
                "poster_rule_seed",

              version:
                "s02m",

              status:
                "classified",

              qualityScore:
                0.5,

              safetyStatus:
                "safe",
            },
          };

        const persistencePlan =
          {
            source:
              {},

            publisherDomains:
              [],

            contentItems:
              [],
          } as unknown as PosterBrainContentPersistencePlan;

        const requests:
          PosterBrainAiClassificationRequest[] =
          [];

        let receivedClassifications:
          readonly PosterBrainContentPersistenceClassificationInput[] =
          [];

        const runner =
          createPosterBrainAiClassifiedFeedIngestionRunner({
            aiClassificationProvider: {
              async classifyContent(request) {
                requests.push(
                  request
                );

                return {
                  primaryCategory:
                    "General",

                  topics:
                    [],

                  confidence:
                    0.35,

                  provider:
                    "poster-python-ai",

                  classifiedAt:
                    "2026-08-09T12:10:01.000Z",
                };
              },
            },

            contentClassificationService: {
              classifyItem() {
                return baseline;
              },
            },

            contentIngestionService: {
              createPersistencePlan(input) {
                receivedClassifications =
                  input.classifications ??
                  [];

                return persistencePlan;
              },

              createClassifiedPersistencePlan() {
                throw new Error(
                  "AI runner must use explicit classifications."
                );
              },
            },

            contentPersistenceRepository: {
              async persistPlan() {
                return {
                  sourceId:
                    "source-1",

                  publisherDomainIds:
                    [],

                  contentItemIds: [
                    "content-2",
                  ],

                  persistedContentCount:
                    1,
                };
              },
            },

            rssIngestionService: {
              parseFeedXml() {
                return {
                  accepted: [
                    item,
                  ],

                  rejected:
                    [],
                };
              },
            },
          });

        await runner.ingestClassifiedFeed({
          source,

          feedXml:
            "<rss />",

          discoveredAt:
            "2026-08-09T12:10:00.000Z",
        });

        expect(
          requests
        ).toEqual([
          {
            sourceKey:
              "example-news",

            url:
              "https://example.com/general",

            title:
              "General local update",

            publishedAt:
              null,
          },
        ]);

        expect(
          receivedClassifications[0]
            ?.aiClassification
            .provider
        ).toBe(
          "poster-python-ai"
        );

        expect(
          receivedClassifications[0]
            ?.aiClassification
            .version
        ).toBeUndefined();

        expect(
          receivedClassifications[0]
            ?.aiClassification
            .model
        ).toBeUndefined();
      }
    );
  }
);