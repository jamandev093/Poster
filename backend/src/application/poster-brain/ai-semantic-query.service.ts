import {
  POSTER_BRAIN_EMBEDDING_DIMENSIONS,
} from "./content-embedding.repository.js";

import type {
  PosterBrainAiEmbeddingHttpFetch,
} from "./ai-content-embedding.service.js";

export interface PosterBrainAiSemanticQueryResult {
  readonly available: boolean;
  readonly provider: string;
  readonly model: string;
  readonly dimensions: number;
  readonly vector: readonly number[];
  readonly generatedAt: string;
  readonly reason: string | null;
}

export interface PosterBrainAiSemanticQueryService {
  embedQuery(
    text: string
  ): Promise<PosterBrainAiSemanticQueryResult>;
}

export interface PosterBrainAiSemanticQueryServiceDependencies {
  readonly endpointUrl: string;
  readonly timeoutMs: number;
  readonly fetchImplementation?:
    PosterBrainAiEmbeddingHttpFetch;
}

function requiredText(
  value: unknown,
  field: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Poster Brain semantic query returned invalid ${field}.`
    );
  }

  return value.trim();
}

function timestamp(
  value: unknown
): string {
  const text =
    requiredText(
      value,
      "generatedAt"
    );

  const parsed =
    new Date(text);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      "Poster Brain semantic query generatedAt is invalid."
    );
  }

  return parsed.toISOString();
}

function vector(
  value: unknown
): readonly number[] {
  if (
    !Array.isArray(value) ||
    value.length !==
      POSTER_BRAIN_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      "Poster Brain semantic query embedding must contain exactly 384 values."
    );
  }

  let normSquared = 0;

  const result =
    value.map(
      (
        item,
        index
      ) => {
        if (
          typeof item !== "number" ||
          !Number.isFinite(item)
        ) {
          throw new Error(
            `Poster Brain semantic query vector[${index}] is invalid.`
          );
        }

        normSquared +=
          item * item;

        return item;
      }
    );

  const norm =
    Math.sqrt(
      normSquared
    );

  if (
    norm < 0.98 ||
    norm > 1.02
  ) {
    throw new Error(
      "Poster Brain semantic query embedding is not normalized."
    );
  }

  return result;
}

const runtimeFetch:
  PosterBrainAiEmbeddingHttpFetch =
  async (
    url,
    request
  ) => {
    const response =
      await fetch(
        url,
        {
          method:
            request.method,
          headers:
            request.headers,
          body:
            request.body,
          signal:
            request.signal,
        }
      );

    return {
      ok:
        response.ok,
      status:
        response.status,
      json:
        () => response.json(),
      text:
        () => response.text(),
    };
  };

export function createPosterBrainAiSemanticQueryService(
  dependencies:
    PosterBrainAiSemanticQueryServiceDependencies
): PosterBrainAiSemanticQueryService {
  const endpointUrl =
    new URL(
      dependencies.endpointUrl
    );

  if (
    endpointUrl.protocol !== "http:" &&
    endpointUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Poster Brain semantic query endpoint must use HTTP or HTTPS."
    );
  }

  if (
    !Number.isSafeInteger(
      dependencies.timeoutMs
    ) ||
    dependencies.timeoutMs <= 0
  ) {
    throw new Error(
      "Poster Brain semantic query timeout is invalid."
    );
  }

  const fetchImplementation =
    dependencies.fetchImplementation ??
    runtimeFetch;

  return {
    async embedQuery(
      rawText
    ) {
      const text =
        rawText
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (!text) {
        throw new Error(
          "Poster Brain semantic query cannot be empty."
        );
      }

      const controller =
        new AbortController();

      const timer =
        setTimeout(
          () => controller.abort(),
          dependencies.timeoutMs
        );

      try {
        const response =
          await fetchImplementation(
            endpointUrl.toString(),
            {
              method:
                "POST",
              headers: {
                accept:
                  "application/json",
                "content-type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  text,
                }),
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            `Poster Brain semantic query endpoint returned HTTP ${response.status}.`
          );
        }

        const raw =
          await response.json();

        if (
          raw === null ||
          typeof raw !== "object" ||
          Array.isArray(raw)
        ) {
          throw new Error(
            "Poster Brain semantic query returned invalid JSON."
          );
        }

        const record =
          raw as Record<
            string,
            unknown
          >;

        const provider =
          requiredText(
            record.provider,
            "provider"
          );

        const model =
          requiredText(
            record.model,
            "model"
          );

        const generatedAt =
          timestamp(
            record.generatedAt
          );

        if (
          record.available === false
        ) {
          return {
            available:
              false,
            provider,
            model,
            dimensions:
              0,
            vector:
              [],
            generatedAt,
            reason:
              requiredText(
                record.reason,
                "reason"
              ),
          };
        }

        if (
          record.available !== true ||
          record.dimensions !==
            POSTER_BRAIN_EMBEDDING_DIMENSIONS
        ) {
          throw new Error(
            "Poster Brain semantic query returned invalid embedding dimensions."
          );
        }

        return {
          available:
            true,
          provider,
          model,
          dimensions:
            POSTER_BRAIN_EMBEDDING_DIMENSIONS,
          vector:
            vector(
              record.vector
            ),
          generatedAt,
          reason:
            null,
        };
      }
      finally {
        clearTimeout(
          timer
        );
      }
    },
  };
}