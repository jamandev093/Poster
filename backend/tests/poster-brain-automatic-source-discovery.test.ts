import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceDiscoveryOrchestrator,
  createPosterBrainSourceDiscoveryPlanner,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainPersistentSourceCandidateRecord,
  PosterBrainSourceCandidateRepository,
  PosterBrainSourceDiscoveryProviderExecutor,
} from "../src/application/poster-brain/index.js";

const TOPICS = [
  {
    id:
      "physics-id",

    slug:
      "physics",

    name:
      "Physics",

    description:
      "Physical science",

    parentTopicId:
      null,

    sortOrder:
      10,
  },

  {
    id:
      "quantum-id",

    slug:
      "quantum-mechanics",

    name:
      "Quantum Mechanics",

    description:
      null,

    parentTopicId:
      "physics-id",

    sortOrder:
      10,
  },

  {
    id:
      "relativity-id",

    slug:
      "relativity",

    name:
      "Relativity",

    description:
      null,

    parentTopicId:
      "physics-id",

    sortOrder:
      20,
  },

  {
    id:
      "qft-id",

    slug:
      "quantum-field-theory",

    name:
      "Quantum Field Theory",

    description:
      null,

    parentTopicId:
      "quantum-id",

    sortOrder:
      10,
  },

  {
    id:
      "business-id",

    slug:
      "business",

    name:
      "Business",

    description:
      null,

    parentTopicId:
      null,

    sortOrder:
      20,
  },
] as const;

function persistentRecord(
  candidateKey:
    string,
  providerKey:
    string
): PosterBrainPersistentSourceCandidateRecord {
  const host =
    candidateKey.replace(
      /^host:/,
      ""
    );

  return {
    candidateKey,

    canonicalHost:
      host,

    canonicalOrigin:
      `https://${host}`,

    displayName:
      "Science Example",

    sourceType:
      "publisher",

    status:
      "discovered",

    sourceExternalIds:
      [],

    providerKeys: [
      providerKey,
    ],

    firstSeenAt:
      "2026-08-10T12:00:00.000Z",

    lastSeenAt:
      "2026-08-10T12:00:00.000Z",

    observationCount:
      1,
  };
}

describe(
  "Poster Brain automatic domain source discovery",
  () => {

    it(
      "expands a parent taxonomy domain through canonical descendants without unrelated topics",
      async () => {
        const planner =
          createPosterBrainSourceDiscoveryPlanner({
            listActiveTopics:
              async () =>
                TOPICS,
          });

        const plan =
          await planner.plan({
            parentTopicSlug:
              "physics",

            maxDepth:
              2,

            maxTopics:
              10,
          });

        expect(
          plan.topics.map(
            topic =>
              topic.slug
          )
        ).toEqual([
          "physics",
          "quantum-mechanics",
          "relativity",
          "quantum-field-theory",
        ]);

        expect(
          plan.queries.map(
            query =>
              query.query
          )
        ).toEqual([
          "Physics",
          "Physics Quantum Mechanics",
          "Physics Relativity",
          "Physics Quantum Mechanics Quantum Field Theory",
        ]);

        expect(
          plan.topics.some(
            topic =>
              topic.slug ===
              "business"
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "enforces bounded depth and topic expansion",
      async () => {
        const planner =
          createPosterBrainSourceDiscoveryPlanner({
            listActiveTopics:
              async () =>
                TOPICS,
          });

        const plan =
          await planner.plan({
            parentTopicSlug:
              "physics",

            maxDepth:
              1,

            maxTopics:
              2,
          });

        expect(
          plan.topics
        ).toHaveLength(
          2
        );

        expect(
          plan.topics.map(
            topic =>
              topic.slug
          )
        ).toEqual([
          "physics",
          "quantum-mechanics",
        ]);
      }
    );

    it(
      "queries providers from taxonomy plans and persists discovered source candidates",
      async () => {
        const planner =
          createPosterBrainSourceDiscoveryPlanner({
            listActiveTopics:
              async () =>
                TOPICS.slice(
                  0,
                  2
                ),
          });

        const providerExecutor:
          PosterBrainSourceDiscoveryProviderExecutor =
          {
            providerKeys: [
              "gdelt",
              "newsapi",
            ],

            async execute(
              input
            ) {
              if (
                input.providerKey ===
                "newsapi"
              ) {
                return {
                  status:
                    "disabled",

                  items:
                    [],

                  nextCursor:
                    null,
                };
              }

              /*
               * Return the same content for both overlapping
               * Physics and Quantum Mechanics queries.
               */
              return {
                status:
                  "succeeded",

                items: [
                  {
                    externalContentId:
                      "gdelt-physics-1",

                    originalUrl:
                      "https://science.example/articles/physics",

                    publisherName:
                      "Science Example",

                    sourceExternalId:
                      "science.example",

                    sourceName:
                      "Science Example",
                  },
                ],

                nextCursor:
                  null,
              };
            },
          };

        const persisted:
          string[] =
          [];

        const repository:
          PosterBrainSourceCandidateRepository =
          {
            async observe(
              candidate
            ) {
              persisted.push(
                candidate.candidateKey
              );

              return persistentRecord(
                candidate.candidateKey,
                candidate.providerKeys[0] ??
                  "unknown"
              );
            },

            async get() {
              return null;
            },

            async list() {
              return [];
            },

            async setStatus() {
              throw new Error(
                "not used"
              );
            },
          };

        const orchestrator =
          createPosterBrainSourceDiscoveryOrchestrator({
            planner,
            providerExecutor,

            sourceCandidateRepository:
              repository,

            now:
              () =>
                "2026-08-10T12:00:00Z",
          });

        const result =
          await orchestrator.run({
            parentTopicSlug:
              "physics",

            maxDepth:
              1,

            maxTopics:
              10,

            pageSize:
              25,

            maxPagesPerQuery:
              1,
          });

        expect(
          result
        ).toMatchObject({
          parentTopicSlug:
            "physics",

          plannedTopicCount:
            2,

          plannedQueryCount:
            2,

          providerCount:
            2,

          providerRequestCount:
            4,

          succeededRequestCount:
            2,

          disabledRequestCount:
            2,

          failedRequestCount:
            0,

          discoveredItemCount:
            2,

          rejectedItemCount:
            0,

          /*
           * Same provider/content/source returned by overlapping
           * queries is persisted only once in this discovery run.
           */
          persistedObservationCount:
            1,

          uniqueCandidateCount:
            1,
        });

        expect(
          persisted
        ).toEqual([
          "host:science.example",
        ]);

        /*
         * But topic relevance observations remain associated with
         * both taxonomy topics for the S05B affinity layer.
         */
        expect(
          result.observations.map(
            item =>
              item.topicSlug
          )
        ).toEqual([
          "physics",
          "quantum-mechanics",
        ]);
      }
    );

    it(
      "isolates a failed provider without aborting discovery through healthy providers",
      async () => {
        const planner =
          createPosterBrainSourceDiscoveryPlanner({
            listActiveTopics:
              async () =>
                [
                  TOPICS[0],
                ],
          });

        const providerExecutor:
          PosterBrainSourceDiscoveryProviderExecutor =
          {
            providerKeys: [
              "broken",
              "gdelt",
            ],

            async execute(
              input
            ) {
              if (
                input.providerKey ===
                "broken"
              ) {
                throw new Error(
                  "provider unavailable"
                );
              }

              return {
                status:
                  "succeeded",

                items: [
                  {
                    externalContentId:
                      "healthy-1",

                    originalUrl:
                      "https://physics.example/article",

                    publisherName:
                      "Physics Example",

                    sourceExternalId:
                      "physics.example",

                    sourceName:
                      "Physics Example",
                  },
                ],

                nextCursor:
                  null,
              };
            },
          };

        const repository:
          PosterBrainSourceCandidateRepository =
          {
            async observe(
              candidate
            ) {
              return persistentRecord(
                candidate.candidateKey,
                "gdelt"
              );
            },

            async get() {
              return null;
            },

            async list() {
              return [];
            },

            async setStatus() {
              throw new Error(
                "not used"
              );
            },
          };

        const orchestrator =
          createPosterBrainSourceDiscoveryOrchestrator({
            planner,
            providerExecutor,

            sourceCandidateRepository:
              repository,

            now:
              () =>
                "2026-08-10T12:00:00Z",
          });

        const result =
          await orchestrator.run({
            parentTopicSlug:
              "physics",

            maxPagesPerQuery:
              1,
          });

        expect(
          result.failedRequestCount
        ).toBe(
          1
        );

        expect(
          result.succeededRequestCount
        ).toBe(
          1
        );

        expect(
          result.uniqueCandidateCount
        ).toBe(
          1
        );
      }
    );

    it(
      "rejects unknown parent domains rather than inventing taxonomy topics",
      async () => {
        const planner =
          createPosterBrainSourceDiscoveryPlanner({
            listActiveTopics:
              async () =>
                TOPICS,
          });

        await expect(
          planner.plan({
            parentTopicSlug:
              "invented-domain",
          })
        ).rejects.toThrow(
          "Active taxonomy parent topic not found"
        );
      }
    );
  }
);