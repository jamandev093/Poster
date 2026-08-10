import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_EMBEDDING_DIMENSIONS,
  createPostgreSqlPosterBrainContentEmbeddingRepository,
} from "../src/application/poster-brain/content-embedding.repository.js";

import type {
  PosterBrainContentEmbeddingDatabase,
} from "../src/application/poster-brain/content-embedding.repository.js";

interface QueryCall {
  readonly text: string;
  readonly values:
    readonly unknown[] |
    undefined;
}

class RecordingDatabase
  implements PosterBrainContentEmbeddingDatabase
{
  readonly calls:
    QueryCall[] = [];

  private index = 0;

  constructor(
    private readonly results:
      readonly (
        readonly unknown[]
      )[]
  ) {}

  async query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }> {
    this.calls.push({
      text,
      values,
    });

    const rows =
      this.results[
        this.index
      ] ?? [];

    this.index += 1;

    return {
      rows:
        rows as readonly Row[],
    };
  }
}

function unitVector(
  position: number = 0
): readonly number[] {
  return Array.from(
    {
      length:
        POSTER_BRAIN_EMBEDDING_DIMENSIONS,
    },
    (
      _,
      index
    ) =>
      index === position
        ? 1
        : 0
  );
}

describe(
  "Poster Brain content embedding repository",
  () => {

    it(
      "persists a normalized 384-dimensional embedding and links content",
      async () => {
        const database =
          new RecordingDatabase([
            [
              {
                embeddingId:
                  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",

                contentId:
                  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",

                providerName:
                  "poster-python-ai",

                modelName:
                  "sentence-transformers/all-MiniLM-L6-v2",

                dimensions:
                  384,

                generatedAt:
                  "2026-08-10T08:00:00.000Z",

                embeddingReference:
                  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              },
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainContentEmbeddingRepository(
            database
          );

        const result =
          await repository.upsertEmbedding({
            contentId:
              "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",

            providerName:
              "poster-python-ai",

            modelName:
              "sentence-transformers/all-MiniLM-L6-v2",

            vector:
              unitVector(),

            generatedAt:
              "2026-08-10T08:00:00.000Z",
          });

        expect(
          result.dimensions
        ).toBe(
          384
        );

        expect(
          result.embeddingReference
        ).toBe(
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        );

        expect(
          database.calls
        ).toHaveLength(
          1
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "app.discovery_content_embeddings"
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "embedding_reference"
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "ON CONFLICT"
        );

        expect(
          (
            database.calls[0]
              ?.values?.[3] as
                readonly number[]
          )
        ).toHaveLength(
          384
        );
      }
    );

    it(
      "performs exact cosine semantic lookup over active organic content",
      async () => {
        const database =
          new RecordingDatabase([
            [
              {
                contentId:
                  "cccccccc-cccc-4ccc-8ccc-cccccccccccc",

                title:
                  "NASA finds a new exoplanet",

                excerpt:
                  "Astronomers report a new world.",

                originalUrl:
                  "https://example.com/exoplanet",

                publisherName:
                  "Example Science",

                similarity:
                  0.91,
              },
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainContentEmbeddingRepository(
            database
          );

        const result =
          await repository.findSimilarContent({
            providerName:
              "poster-python-ai",

            modelName:
              "sentence-transformers/all-MiniLM-L6-v2",

            vector:
              unitVector(),

            limit:
              10,

            excludeContentId:
              "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          });

        expect(
          result
        ).toEqual([
          {
            contentId:
              "cccccccc-cccc-4ccc-8ccc-cccccccccccc",

            title:
              "NASA finds a new exoplanet",

            excerpt:
              "Astronomers report a new world.",

            originalUrl:
              "https://example.com/exoplanet",

            publisherName:
              "Example Science",

            similarity:
              0.91,
          },
        ]);

        const sql =
          database.calls[0]?.text ??
          "";

        expect(
          sql
        ).toContain(
          "unnest"
        );

        expect(
          sql
        ).toContain(
          "SUM("
        );

        expect(
          sql
        ).toContain(
          "content.status = 'active'"
        );

        expect(
          sql
        ).toContain(
          "score.similarity DESC"
        );
      }
    );

    it(
      "rejects vectors that are not exactly 384 dimensions",
      async () => {
        const repository =
          createPostgreSqlPosterBrainContentEmbeddingRepository(
            new RecordingDatabase([])
          );

        await expect(
          repository.upsertEmbedding({
            contentId:
              "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",

            providerName:
              "poster-python-ai",

            modelName:
              "sentence-transformers/all-MiniLM-L6-v2",

            vector:
              [1, 0, 0],

            generatedAt:
              "2026-08-10T08:00:00.000Z",
          })
        ).rejects.toThrow(
          "exactly 384"
        );
      }
    );

    it(
      "rejects non-normalized embeddings",
      async () => {
        const repository =
          createPostgreSqlPosterBrainContentEmbeddingRepository(
            new RecordingDatabase([])
          );

        await expect(
          repository.findSimilarContent({
            providerName:
              "poster-python-ai",

            modelName:
              "sentence-transformers/all-MiniLM-L6-v2",

            vector:
              Array(
                384
              ).fill(
                1
              ),
          })
        ).rejects.toThrow(
          "normalized"
        );
      }
    );

    it(
      "caps semantic lookup results at 100",
      async () => {
        const database =
          new RecordingDatabase([
            [],
          ]);

        const repository =
          createPostgreSqlPosterBrainContentEmbeddingRepository(
            database
          );

        await repository.findSimilarContent({
          providerName:
            "poster-python-ai",

          modelName:
            "sentence-transformers/all-MiniLM-L6-v2",

          vector:
            unitVector(),

          limit:
            500,
        });

        expect(
          database.calls[0]
            ?.values?.[4]
        ).toBe(
          100
        );
      }
    );
  }
);