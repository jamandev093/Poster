export const POSTER_BRAIN_EMBEDDING_DIMENSIONS =
  384;

export interface PosterBrainContentEmbeddingDatabase {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface UpsertPosterBrainContentEmbeddingInput {
  readonly contentId: string;
  readonly providerName: string;
  readonly modelName: string;
  readonly vector: readonly number[];
  readonly generatedAt: string;
}

export interface PosterBrainContentEmbeddingRecord {
  readonly embeddingId: string;
  readonly contentId: string;
  readonly providerName: string;
  readonly modelName: string;
  readonly dimensions: 384;
  readonly generatedAt: string;
  readonly embeddingReference: string;
}

export interface PosterBrainSemanticLookupInput {
  readonly providerName: string;
  readonly modelName: string;
  readonly vector: readonly number[];
  readonly limit?: number;
  readonly excludeContentId?: string | null;
}

export interface PosterBrainSemanticContentMatch {
  readonly contentId: string;
  readonly externalContentId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly originalUrl: string;
  readonly publisherName: string | null;
  readonly similarity: number;
}

export interface PosterBrainContentEmbeddingRepository {
  upsertEmbedding(
    input: UpsertPosterBrainContentEmbeddingInput
  ): Promise<PosterBrainContentEmbeddingRecord>;

  findSimilarContent(
    input: PosterBrainSemanticLookupInput
  ): Promise<
    readonly PosterBrainSemanticContentMatch[]
  >;
}

interface EmbeddingRow {
  readonly embeddingId: string;
  readonly contentId: string;
  readonly providerName: string;
  readonly modelName: string;
  readonly dimensions: string | number;
  readonly generatedAt: string | Date;
  readonly embeddingReference: string;
}

interface SemanticRow {
  readonly contentId: string;
  readonly externalContentId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly originalUrl: string;
  readonly publisherName: string | null;
  readonly similarity: string | number;
}

function cleanText(
  value: string,
  fieldName: string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new Error(
      `Poster Brain embedding ${fieldName} cannot be empty.`
    );
  }

  return cleaned;
}

function normalizeTimestamp(
  value: string | Date,
  fieldName: string
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Poster Brain embedding ${fieldName} is invalid.`
    );
  }

  return date.toISOString();
}

function validateVector(
  vector: readonly number[]
): readonly number[] {
  if (
    vector.length !==
    POSTER_BRAIN_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Poster Brain embedding must contain exactly ${POSTER_BRAIN_EMBEDDING_DIMENSIONS} values.`
    );
  }

  let squaredNorm = 0;

  for (const value of vector) {
    if (!Number.isFinite(value)) {
      throw new Error(
        "Poster Brain embedding contains a non-finite value."
      );
    }

    squaredNorm +=
      value * value;
  }

  const norm =
    Math.sqrt(
      squaredNorm
    );

  if (
    norm < 0.98 ||
    norm > 1.02
  ) {
    throw new Error(
      "Poster Brain embedding must be normalized."
    );
  }

  return [
    ...vector,
  ];
}

function normalizeLimit(
  value: number | undefined
): number {
  if (value === undefined) {
    return 20;
  }

  if (
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error(
      "Poster Brain semantic lookup limit must be a positive safe integer."
    );
  }

  return Math.min(
    value,
    100
  );
}

function parseSimilarity(
  value: string | number
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < -1.000001 ||
    parsed > 1.000001
  ) {
    throw new Error(
      "Poster Brain semantic similarity is invalid."
    );
  }

  return Math.max(
    -1,
    Math.min(
      1,
      parsed
    )
  );
}

export class PostgreSqlPosterBrainContentEmbeddingRepository
  implements PosterBrainContentEmbeddingRepository
{
  constructor(
    private readonly database:
      PosterBrainContentEmbeddingDatabase
  ) {}

  async upsertEmbedding(
    input: UpsertPosterBrainContentEmbeddingInput
  ): Promise<PosterBrainContentEmbeddingRecord> {
    const contentId =
      cleanText(
        input.contentId,
        "contentId"
      );

    const providerName =
      cleanText(
        input.providerName,
        "providerName"
      );

    const modelName =
      cleanText(
        input.modelName,
        "modelName"
      );

    const generatedAt =
      normalizeTimestamp(
        input.generatedAt,
        "generatedAt"
      );

    const vector =
      validateVector(
        input.vector
      );

    const result =
      await this.database.query<EmbeddingRow>(
        `
          WITH upserted AS (
            INSERT INTO
              app.discovery_content_embeddings (
                content_id,
                provider_name,
                model_name,
                dimensions,
                embedding,
                generated_at
              )
            VALUES (
              $1::uuid,
              $2,
              $3,
              384,
              $4::double precision[],
              $5::timestamptz
            )

            ON CONFLICT (
              content_id,
              provider_name,
              model_name
            )
            DO UPDATE
            SET
              dimensions =
                EXCLUDED.dimensions,

              embedding =
                EXCLUDED.embedding,

              generated_at =
                EXCLUDED.generated_at

            RETURNING
              id,
              content_id,
              provider_name,
              model_name,
              dimensions,
              generated_at
          ),

          linked AS (
            UPDATE
              app.discovery_content_items
            SET
              embedding_reference =
                (
                  SELECT
                    id::text
                  FROM upserted
                )
            WHERE
              id = $1::uuid
            RETURNING
              id
          )

          SELECT
            upserted.id::text
              AS "embeddingId",

            upserted.content_id::text
              AS "contentId",

            upserted.provider_name
              AS "providerName",

            upserted.model_name
              AS "modelName",

            upserted.dimensions
              AS "dimensions",

            upserted.generated_at
              AS "generatedAt",

            upserted.id::text
              AS "embeddingReference"

          FROM
            upserted,
            linked;
        `,
        [
          contentId,
          providerName,
          modelName,
          vector,
          generatedAt,
        ]
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new Error(
        "Poster Brain embedding could not be persisted or linked to content."
      );
    }

    const dimensions =
      Number(
        row.dimensions
      );

    if (
      dimensions !==
      POSTER_BRAIN_EMBEDDING_DIMENSIONS
    ) {
      throw new Error(
        "Poster Brain persisted embedding dimensions are invalid."
      );
    }

    return {
      embeddingId:
        row.embeddingId,

      contentId:
        row.contentId,

      providerName:
        row.providerName,

      modelName:
        row.modelName,

      dimensions:
        POSTER_BRAIN_EMBEDDING_DIMENSIONS,

      generatedAt:
        normalizeTimestamp(
          row.generatedAt,
          "generatedAt"
        ),

      embeddingReference:
        row.embeddingReference,
    };
  }

  async findSimilarContent(
    input: PosterBrainSemanticLookupInput
  ): Promise<
    readonly PosterBrainSemanticContentMatch[]
  > {
    const providerName =
      cleanText(
        input.providerName,
        "providerName"
      );

    const modelName =
      cleanText(
        input.modelName,
        "modelName"
      );

    const vector =
      validateVector(
        input.vector
      );

    const limit =
      normalizeLimit(
        input.limit
      );

    const excludeContentId =
      input.excludeContentId === null ||
      input.excludeContentId === undefined
        ? null
        : cleanText(
            input.excludeContentId,
            "excludeContentId"
          );

    const result =
      await this.database.query<SemanticRow>(
        `
          SELECT
            content.id::text
              AS "contentId",

            content.external_content_id
              AS "externalContentId",

            content.title
              AS "title",

            content.excerpt
              AS "excerpt",

            content.original_url
              AS "originalUrl",

            publisher.publisher_name
              AS "publisherName",

            score.similarity
              AS "similarity"

          FROM
            app.discovery_content_embeddings
              AS embedding

          INNER JOIN
            app.discovery_content_items
              AS content
          ON
            content.id =
              embedding.content_id

          LEFT JOIN
            app.discovery_publisher_domains
              AS publisher
          ON
            publisher.id =
              content.publisher_domain_id

          CROSS JOIN LATERAL (
            SELECT
              (
                SUM(
                  stored.value *
                  requested.value
                )
                /
                NULLIF(
                  SQRT(
                    SUM(
                      stored.value *
                      stored.value
                    )
                  )
                  *
                  SQRT(
                    SUM(
                      requested.value *
                      requested.value
                    )
                  ),
                  0
                )
              )::double precision
                AS similarity

            FROM
              unnest(
                embedding.embedding
              )
              WITH ORDINALITY
                AS stored(
                  value,
                  position
                )

            INNER JOIN
              unnest(
                $3::double precision[]
              )
              WITH ORDINALITY
                AS requested(
                  value,
                  position
                )
            USING (
              position
            )
          ) AS score

          WHERE
            embedding.provider_name = $1
            AND embedding.model_name = $2
            AND embedding.dimensions = 384

            AND content.status = 'active'

            AND (
              $4::uuid IS NULL
              OR content.id <> $4::uuid
            )

            AND score.similarity
              IS NOT NULL

          ORDER BY
            score.similarity DESC,
            content.id

          LIMIT $5;
        `,
        [
          providerName,
          modelName,
          vector,
          excludeContentId,
          limit,
        ]
      );

    return result.rows.map(
      row => ({
        contentId:
          row.contentId,

        externalContentId:
          row.externalContentId,

        title:
          row.title,

        excerpt:
          row.excerpt,

        originalUrl:
          row.originalUrl,

        publisherName:
          row.publisherName,

        similarity:
          parseSimilarity(
            row.similarity
          ),
      })
    );
  }
}

export function createPostgreSqlPosterBrainContentEmbeddingRepository(
  database: PosterBrainContentEmbeddingDatabase
): PosterBrainContentEmbeddingRepository {
  return new PostgreSqlPosterBrainContentEmbeddingRepository(
    database
  );
}