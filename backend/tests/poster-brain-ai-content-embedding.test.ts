import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiContentEmbeddingService,
} from "../src/application/poster-brain/ai-content-embedding.service.js";

import {
  createPosterBrainAiContentEmbeddingRuntimeConfiguration,
  createPosterBrainAiContentEmbeddingServiceFromRuntimeEnv,
} from "../src/application/poster-brain/ai-content-embedding-runtime.service.js";

import type {
  PosterBrainAiEmbeddingHttpFetch,
} from "../src/application/poster-brain/ai-content-embedding.service.js";

import type {
  PosterBrainContentEmbeddingRepository,
  UpsertPosterBrainContentEmbeddingInput,
} from "../src/application/poster-brain/content-embedding.repository.js";

const CONTENT_ID =
  "11111111-1111-4111-8111-111111111111";

const PROVIDER =
  "poster-python-ai";

const MODEL =
  "sentence-transformers/all-MiniLM-L6-v2";

const GENERATED_AT =
  "2026-08-10T08:00:00.000Z";

function unitVector():
  readonly number[] {
  return Array.from(
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
}

function createRepository() {
  const inputs:
    UpsertPosterBrainContentEmbeddingInput[] =
      [];

  const repository:
    PosterBrainContentEmbeddingRepository = {
      async upsertEmbedding(
        input
      ) {
        inputs.push(
          input
        );

        return {
          embeddingId:
            "22222222-2222-4222-8222-222222222222",

          contentId:
            input.contentId,

          providerName:
            input.providerName,

          modelName:
            input.modelName,

          dimensions:
            384,

          generatedAt:
            input.generatedAt,

          embeddingReference:
            "22222222-2222-4222-8222-222222222222",
        };
      },

      async findSimilarContent() {
        return [];
      },
    };

  return {
    repository,
    inputs,
  };
}

describe(
  "Poster Brain AI content embedding pipeline",
  () => {

    it(
      "posts text to Python AI and persists its normalized 384-dimensional embedding",
      async () => {
        const storage =
          createRepository();

        const requests:
          {
            readonly url:
              string;

            readonly body:
              unknown;
          }[] =
          [];

        const fetchImplementation:
          PosterBrainAiEmbeddingHttpFetch =
          async (
            url,
            request
          ) => {
            requests.push({
              url,

              body:
                JSON.parse(
                  request.body
                ),
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
                    unitVector(),

                  provider:
                    PROVIDER,

                  model:
                    MODEL,

                  generatedAt:
                    GENERATED_AT,

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
          createPosterBrainAiContentEmbeddingService({
            repository:
              storage.repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/embed",

            timeoutMs:
              30000,

            fetchImplementation,
          });

        const result =
          await service.embedContent({
            contentId:
              CONTENT_ID,

            text:
              "NASA scientists discover a new exoplanet.",
          });

        expect(
          requests
        ).toEqual([
          {
            url:
              "http://127.0.0.1:8080/v1/embed",

            body: {
              text:
                "NASA scientists discover a new exoplanet.",
            },
          },
        ]);

        expect(
          storage.inputs
        ).toHaveLength(
          1
        );

        expect(
          storage.inputs[0]?.vector
        ).toHaveLength(
          384
        );

        expect(
          storage.inputs[0]?.modelName
        ).toBe(
          MODEL
        );

        expect(
          result
        ).toMatchObject({
          contentId:
            CONTENT_ID,

          embedded:
            true,

          persisted:
            true,

          dimensions:
            384,

          provider:
            PROVIDER,

          model:
            MODEL,

          reason:
            null,

          embeddingReference:
            "22222222-2222-4222-8222-222222222222",
        });
      }
    );

    it(
      "does not persist when Python reports embedding unavailable",
      async () => {
        const storage =
          createRepository();

        const fetchImplementation:
          PosterBrainAiEmbeddingHttpFetch =
          async () => ({
            ok:
              true,

            status:
              200,

            async json() {
              return {
                available:
                  false,

                dimensions:
                  0,

                vector:
                  [],

                provider:
                  PROVIDER,

                model:
                  "unconfigured",

                generatedAt:
                  GENERATED_AT,

                reason:
                  "embedding_model_not_configured",
              };
            },

            async text() {
              return "";
            },
          });

        const service =
          createPosterBrainAiContentEmbeddingService({
            repository:
              storage.repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/embed",

            timeoutMs:
              30000,

            fetchImplementation,
          });

        const result =
          await service.embedContent({
            contentId:
              CONTENT_ID,

            text:
              "Poster knowledge discovery",
          });

        expect(
          storage.inputs
        ).toHaveLength(
          0
        );

        expect(
          result.embedded
        ).toBe(
          false
        );

        expect(
          result.persisted
        ).toBe(
          false
        );

        expect(
          result.reason
        ).toBe(
          "embedding_model_not_configured"
        );
      }
    );

    it(
      "rejects malformed embedding dimensions before persistence",
      async () => {
        const storage =
          createRepository();

        const fetchImplementation:
          PosterBrainAiEmbeddingHttpFetch =
          async () => ({
            ok:
              true,

            status:
              200,

            async json() {
              return {
                available:
                  true,

                dimensions:
                  3,

                vector:
                  [
                    1,
                    0,
                    0,
                  ],

                provider:
                  PROVIDER,

                model:
                  MODEL,

                generatedAt:
                  GENERATED_AT,

                reason:
                  null,
              };
            },

            async text() {
              return "";
            },
          });

        const service =
          createPosterBrainAiContentEmbeddingService({
            repository:
              storage.repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/embed",

            timeoutMs:
              30000,

            fetchImplementation,
          });

        await expect(
          service.embedContent({
            contentId:
              CONTENT_ID,

            text:
              "Physics",
          })
        ).rejects.toMatchObject({
          code:
            "response_invalid",
        });

        expect(
          storage.inputs
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "surfaces remote HTTP rejection without persistence",
      async () => {
        const storage =
          createRepository();

        const fetchImplementation:
          PosterBrainAiEmbeddingHttpFetch =
          async () => ({
            ok:
              false,

            status:
              503,

            async json() {
              return {};
            },

            async text() {
              return "unavailable";
            },
          });

        const service =
          createPosterBrainAiContentEmbeddingService({
            repository:
              storage.repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/embed",

            timeoutMs:
              30000,

            fetchImplementation,
          });

        await expect(
          service.embedContent({
            contentId:
              CONTENT_ID,

            text:
              "Computer science",
          })
        ).rejects.toMatchObject({
          code:
            "remote_rejected",

          status:
            503,
        });

        expect(
          storage.inputs
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "keeps runtime disabled-safe without an embedding URL",
      () => {
        const configuration =
          createPosterBrainAiContentEmbeddingRuntimeConfiguration(
            {}
          );

        expect(
          configuration
        ).toEqual({
          endpointUrl:
            null,

          timeoutMs:
            30000,
        });

        const database = {
          async query<Row>() {
            return {
              rows:
                [] as readonly Row[],
            };
          },
        };

        expect(
          createPosterBrainAiContentEmbeddingServiceFromRuntimeEnv({
            database,
            environment:
              {},
          })
        ).toBeNull();
      }
    );

    it(
      "reads configured embedding runtime values",
      () => {
        const configuration =
          createPosterBrainAiContentEmbeddingRuntimeConfiguration({
            POSTER_AI_EMBEDDING_URL:
              "http://127.0.0.1:8080/v1/embed",

            POSTER_AI_EMBEDDING_TIMEOUT_MS:
              "45000",
          });

        expect(
          configuration.endpointUrl
        ).toBe(
          "http://127.0.0.1:8080/v1/embed"
        );

        expect(
          configuration.timeoutMs
        ).toBe(
          45000
        );
      }
    );
  }
);