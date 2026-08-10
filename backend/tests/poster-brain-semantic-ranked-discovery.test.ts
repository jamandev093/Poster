import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiSemanticQueryService,
  createPosterBrainRankedDiscoveryQueryRepository,
  createPosterBrainSemanticRankedDiscoveryService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainAiEmbeddingHttpFetch,
} from "../src/application/poster-brain/ai-content-embedding.service.js";

import type {
  PosterBrainContentEmbeddingRepository,
} from "../src/application/poster-brain/content-embedding.repository.js";

import type {
  PosterBrainRankedFeedAssemblyService,
} from "../src/application/poster-brain/ranked-feed-assembly.service.js";

import type {
  PosterBrainRankingPolicy,
} from "../src/domains/poster-brain/index.js";

const queryVector =
  Array.from(
    {
      length:
        384,
    },
    (
      _,
      index
    ) =>
      index === 0
        ? 1
        : 0
  );

const policy:
  PosterBrainRankingPolicy = {
    now:
      "2026-08-10T09:00:00.000Z",

    freshnessHalfLifeHours:
      24,

    minimumQualityScore:
      0.3,

    reportPenaltyWeight:
      0.08,

    hidePenaltyWeight:
      0.05,
  };

describe(
  "Poster Brain semantic ranked discovery",
  () => {

    it(
      "embeds a semantic query without persistence",
      async () => {

        const fetchImplementation:
          PosterBrainAiEmbeddingHttpFetch =
          async (
            _url,
            request
          ) => {

            expect(
              JSON.parse(
                request.body
              )
            ).toEqual({
              text:
                "NASA exoplanet discovery",
            });

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return {
                  available:
                    true,

                  dimensions:
                    384,

                  vector:
                    queryVector,

                  provider:
                    "poster-python-ai",

                  model:
                    "sentence-transformers/all-MiniLM-L6-v2",

                  generatedAt:
                    "2026-08-10T09:00:00.000Z",

                  reason:
                    null,
                };
              },

              async text() {
                return "";
              },
            };
          };

        const service =
          createPosterBrainAiSemanticQueryService({
            endpointUrl:
              "http://127.0.0.1:8080/v1/embed",

            timeoutMs:
              30000,

            fetchImplementation,
          });

        const result =
          await service.embedQuery(
            " NASA   exoplanet discovery "
          );

        expect(
          result.available
        ).toBe(
          true
        );

        expect(
          result.vector
        ).toHaveLength(
          384
        );
      }
    );

    it(
      "feeds semantic candidate ids into existing organic ranking",
      async () => {

        const embeddingRepository:
          PosterBrainContentEmbeddingRepository = {
            async upsertEmbedding() {
              throw new Error(
                "not used"
              );
            },

            async findSimilarContent() {
              return [
                {
                  contentId:
                    "11111111-1111-4111-8111-111111111111",

                  externalContentId:
                    "semantic-story",

                  title:
                    "NASA exoplanet discovery",

                  excerpt:
                    "Astronomers find a new world.",

                  originalUrl:
                    "https://example.com/story",

                  publisherName:
                    "Example Science",

                  similarity:
                    0.94,
                },
              ];
            },
          };

        let requestedIds:
          readonly string[] |
          null |
          undefined;

        const assembly:
          PosterBrainRankedFeedAssemblyService = {
            assembleRankedFeed() {
              return [];
            },
          };

        const service =
          createPosterBrainSemanticRankedDiscoveryService({
            semanticQueryService: {
              async embedQuery() {
                return {
                  available:
                    true,

                  provider:
                    "poster-python-ai",

                  model:
                    "sentence-transformers/all-MiniLM-L6-v2",

                  dimensions:
                    384,

                  vector:
                    queryVector,

                  generatedAt:
                    "2026-08-10T09:00:00.000Z",

                  reason:
                    null,
                };
              },
            },

            embeddingRepository,

            rankedDiscoveryQueryRepository: {
              async listRankingRows(
                input
              ) {
                requestedIds =
                  input.externalContentIds;

                return [];
              },
            },

            rankedFeedAssemblyService:
              assembly,
          });

        const result =
          await service.search({
            query:
              "NASA new planet",

            surface:
              "search",

            policy,

            userProfile:
              null,

            limit:
              20,
          });

        expect(
          requestedIds
        ).toEqual([
          "semantic-story",
        ]);

        expect(
          result.semanticCandidateCount
        ).toBe(
          1
        );

        expect(
          result.semanticAvailable
        ).toBe(
          true
        );
      }
    );

    it(
      "binds semantic external ids before limit and offset",
      async () => {

        let sql =
          "";

        let values:
          readonly unknown[] |
          undefined;

        const repository =
          createPosterBrainRankedDiscoveryQueryRepository({
            async query<Row>(
              text:
                string,

              queryValues?:
                readonly unknown[]
            ) {
              sql =
                text;

              values =
                queryValues;

              return {
                rows:
                  [] as readonly Row[],
              };
            },
          });

        await repository.listRankingRows({
          surface:
            "search",

          limit:
            20,

          externalContentIds: [
            "semantic-story",
          ],
        });

        expect(
          sql
        ).toContain(
          "ANY($5::text[])"
        );

        expect(
          sql
        ).toContain(
          "LIMIT $6"
        );

        expect(
          sql
        ).toContain(
          "OFFSET $7"
        );

        expect(
          values
        ).toEqual([
          null,
          null,
          null,
          null,
          [
            "semantic-story",
          ],
          20,
          0,
        ]);
      }
    );

    it(
      "returns safely when query embeddings are unavailable",
      async () => {

        let similarityCalled =
          false;

        const service =
          createPosterBrainSemanticRankedDiscoveryService({
            semanticQueryService: {
              async embedQuery() {
                return {
                  available:
                    false,

                  provider:
                    "poster-python-ai",

                  model:
                    "unconfigured",

                  dimensions:
                    0,

                  vector:
                    [],

                  generatedAt:
                    "2026-08-10T09:00:00.000Z",

                  reason:
                    "embedding_model_not_configured",
                };
              },
            },

            embeddingRepository: {
              async upsertEmbedding() {
                throw new Error(
                  "not used"
                );
              },

              async findSimilarContent() {
                similarityCalled =
                  true;

                return [];
              },
            },

            rankedDiscoveryQueryRepository: {
              async listRankingRows() {
                throw new Error(
                  "must not run"
                );
              },
            },
          });

        const result =
          await service.search({
            query:
              "space telescope",

            surface:
              "search",

            policy,

            userProfile:
              null,

            limit:
              20,
          });

        expect(
          result.semanticAvailable
        ).toBe(
          false
        );

        expect(
          similarityCalled
        ).toBe(
          false
        );

        expect(
          result.scores
        ).toEqual([]);
      }
    );
  }
);