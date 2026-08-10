import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainEvolvingTopicNormalizationService,
  createPosterBrainEvolvingTopicRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainEvolvingTopicQueryExecutor,
} from "../src/application/poster-brain/index.js";

const COMPUTER_SCIENCE_ID =
  "00000000-0000-4000-8000-000000000301";

const AI_ID =
  "00000000-0000-4000-8000-000000000302";

const PHYSICS_ID =
  "00000000-0000-4000-8000-000000000201";

const TAXONOMY = [
  {
    id:
      COMPUTER_SCIENCE_ID,

    slug:
      "computer-science",

    name:
      "Computer Science",

    parentTopicId:
      null,
  },

  {
    id:
      AI_ID,

    slug:
      "ai",

    name:
      "Artificial Intelligence",

    parentTopicId:
      COMPUTER_SCIENCE_ID,
  },

  {
    id:
      PHYSICS_ID,

    slug:
      "physics",

    name:
      "Physics",

    parentTopicId:
      null,
  },
] as const;

describe(
  "Poster Brain evolving topic foundation",
  () => {

    it(
      "normalizes AI-discovered specialized topics and assigns their canonical root",
      async () => {
        const service =
          createPosterBrainEvolvingTopicNormalizationService({
            listActiveTopics:
              async () =>
                TAXONOMY,
          });

        const observations =
          await service.prepareObservations({
            externalContentId:
              "article-1",

            providerKey:
              "poster_ai_http",

            modelKey:
              "classifier-v1",

            primaryCategory:
              "Artificial Intelligence",

            canonicalTopicIds: [
              "ai",
            ],

            evolvingTopicIds: [
              "Large Language Models",
              "ai",
              "large-language-models",
              "Agentic AI",
            ],

            topics: [
              "Large Language Models",
              "Agentic AI",
            ],

            confidence:
              0.91,

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          observations
        ).toHaveLength(
          2
        );

        expect(
          observations[0]
        ).toMatchObject({
          slug:
            "large-language-models",

          displayName:
            "Large Language Models",

          canonicalParentTopicId:
            COMPUTER_SCIENCE_ID,

          canonicalParentSlug:
            "computer-science",

          providerKey:
            "poster_ai_http",

          modelKey:
            "classifier-v1",

          confidence:
            0.91,
        });

        expect(
          observations.map(
            item =>
              item.slug
          )
        ).not.toContain(
          "ai"
        );
      }
    );

    it(
      "does not invent a canonical parent when classification evidence is weak",
      async () => {
        const service =
          createPosterBrainEvolvingTopicNormalizationService({
            listActiveTopics:
              async () =>
                TAXONOMY,
          });

        const observations =
          await service.prepareObservations({
            externalContentId:
              "article-2",

            providerKey:
              "poster_ai_http",

            primaryCategory:
              "General",

            canonicalTopicIds:
              [],

            evolvingTopicIds: [
              "new-specialized-subject",
            ],

            topics: [
              "New Specialized Subject",
            ],

            confidence:
              0.7,

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          observations[0]
        ).toMatchObject({
          slug:
            "new-specialized-subject",

          canonicalParentTopicId:
            null,

          canonicalParentSlug:
            null,
        });
      }
    );

    it(
      "uses conservative lexical matching when a canonical ID is unavailable",
      async () => {
        const service =
          createPosterBrainEvolvingTopicNormalizationService({
            listActiveTopics:
              async () =>
                TAXONOMY,
          });

        const observations =
          await service.prepareObservations({
            externalContentId:
              "article-3",

            providerKey:
              "poster_ai_http",

            primaryCategory:
              "Physics",

            canonicalTopicIds:
              [],

            evolvingTopicIds: [
              "quantum-materials",
            ],

            topics: [
              "Physics",
              "Quantum Materials",
            ],

            confidence:
              0.83,

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          observations[0]
            ?.canonicalParentTopicId
        ).toBe(
          PHYSICS_ID
        );
      }
    );

    it(
      "persists topic evidence idempotently and recomputes evidence counts",
      async () => {
        const calls:
          Array<{
            readonly sql:
              string;

            readonly values:
              readonly unknown[];
          }> =
          [];

        const executor:
          PosterBrainEvolvingTopicQueryExecutor =
          {
            async query(
              sql,
              values = []
            ) {
              calls.push({
                sql,
                values,
              });

              return {
                rows: [
                  {
                    id:
                      "00000000-0000-4000-8000-000000009999",

                    slug:
                      "large-language-models",

                    display_name:
                      "Large Language Models",

                    canonical_parent_topic_id:
                      COMPUTER_SCIENCE_ID,

                    status:
                      "discovered",

                    observation_count:
                      "5",

                    distinct_content_count:
                      "5",

                    provider_count:
                      "2",

                    average_confidence:
                      "0.860000",

                    first_seen_at:
                      "2026-08-10T10:00:00Z",

                    last_seen_at:
                      "2026-08-10T12:00:00Z",

                    promoted_topic_id:
                      null,

                    inserted_evidence:
                      true,
                  },
                ],
              };
            },
          };

        const repository =
          createPosterBrainEvolvingTopicRepository(
            executor
          );

        const result =
          await repository.observe({
            slug:
              "large-language-models",

            displayName:
              "Large Language Models",

            canonicalParentTopicId:
              COMPUTER_SCIENCE_ID,

            providerKey:
              "Poster_AI_HTTP",

            modelKey:
              "classifier-v1",

            externalContentId:
              "article-10",

            confidence:
              0.9,

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          result
        ).toMatchObject({
          insertedEvidence:
            true,

          topic: {
            slug:
              "large-language-models",

            canonicalParentTopicId:
              COMPUTER_SCIENCE_ID,

            status:
              "discovered",

            observationCount:
              5,

            distinctContentCount:
              5,

            providerCount:
              2,

            averageConfidence:
              0.86,
          },
        });

        expect(
          calls
        ).toHaveLength(
          1
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "poster_brain_evolving_topic_evidence"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "ON CONFLICT"
        );

        expect(
          calls[0]?.values[4]
        ).toBe(
          "poster_ai_http"
        );
      }
    );

    it(
      "blocks direct promoted status because promotion must use the controlled promotion path",
      async () => {
        const executor:
          PosterBrainEvolvingTopicQueryExecutor =
          {
            async query() {
              throw new Error(
                "database must not be called"
              );
            },
          };

        const repository =
          createPosterBrainEvolvingTopicRepository(
            executor
          );

        await expect(
          repository.setStatus(
            "00000000-0000-4000-8000-000000009999",
            "promoted"
          )
        ).rejects.toThrow(
          "controlled canonical promotion"
        );
      }
    );
  }
);