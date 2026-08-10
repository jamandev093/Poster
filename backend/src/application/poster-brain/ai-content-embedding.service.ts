import {
  POSTER_BRAIN_EMBEDDING_DIMENSIONS,
  type PosterBrainContentEmbeddingRecord,
  type PosterBrainContentEmbeddingRepository,
} from "./content-embedding.repository.js";

const MAX_EMBEDDING_TEXT_LENGTH =
  20000;

const NORMALIZED_VECTOR_MIN_NORM =
  0.98;

const NORMALIZED_VECTOR_MAX_NORM =
  1.02;

export type PosterBrainAiContentEmbeddingErrorCode =
  | "invalid_input"
  | "transport_failed"
  | "transport_timeout"
  | "remote_rejected"
  | "response_invalid"
  | "persistence_failed";

export class PosterBrainAiContentEmbeddingError
  extends Error
{
  readonly code:
    PosterBrainAiContentEmbeddingErrorCode;

  readonly status:
    number |
    null;

  constructor(input: {
    readonly code:
      PosterBrainAiContentEmbeddingErrorCode;

    readonly message:
      string;

    readonly status?:
      number;
  }) {
    super(input.message);

    this.name =
      "PosterBrainAiContentEmbeddingError";

    this.code =
      input.code;

    this.status =
      input.status ??
      null;
  }
}

export interface PosterBrainAiEmbeddingHttpFetchRequest {
  readonly method:
    "POST";

  readonly headers:
    Readonly<
      Record<
        string,
        string
      >
    >;

  readonly body:
    string;

  readonly signal:
    AbortSignal;
}

export interface PosterBrainAiEmbeddingHttpFetchResponse {
  readonly ok:
    boolean;

  readonly status:
    number;

  json():
    Promise<unknown>;

  text():
    Promise<string>;
}

export type PosterBrainAiEmbeddingHttpFetch =
  (
    url: string,
    request: PosterBrainAiEmbeddingHttpFetchRequest
  ) =>
    Promise<PosterBrainAiEmbeddingHttpFetchResponse>;

export interface PosterBrainAiContentEmbeddingInput {
  readonly contentId:
    string;

  readonly text:
    string;
}

export interface PosterBrainAiContentEmbeddingResult {
  readonly contentId:
    string;

  readonly embedded:
    boolean;

  readonly persisted:
    boolean;

  readonly provider:
    string;

  readonly model:
    string;

  readonly dimensions:
    number;

  readonly generatedAt:
    string;

  readonly reason:
    string |
    null;

  readonly embeddingReference:
    string |
    null;
}

export interface PosterBrainAiContentEmbeddingService {
  embedContent(
    input:
      PosterBrainAiContentEmbeddingInput
  ): Promise<
    PosterBrainAiContentEmbeddingResult
  >;
}

export interface PosterBrainAiContentEmbeddingServiceDependencies {
  readonly repository:
    PosterBrainContentEmbeddingRepository;

  readonly endpointUrl:
    string;

  readonly timeoutMs:
    number;

  readonly fetchImplementation?:
    PosterBrainAiEmbeddingHttpFetch;
}

interface EmbeddingResponseRecord {
  readonly available?:
    unknown;

  readonly dimensions?:
    unknown;

  readonly vector?:
    unknown;

  readonly provider?:
    unknown;

  readonly model?:
    unknown;

  readonly generatedAt?:
    unknown;

  readonly reason?:
    unknown;
}

function fail(
  code:
    PosterBrainAiContentEmbeddingErrorCode,
  message:
    string
): never {
  throw new PosterBrainAiContentEmbeddingError({
    code,
    message,
  });
}

function cleanText(
  value:
    string,
  field:
    string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return fail(
      "invalid_input",
      `Poster Brain embedding ${field} cannot be empty.`
    );
  }

  return cleaned;
}

function normalizeEmbeddingText(
  value:
    string
): string {
  const cleaned =
    cleanText(
      value,
      "text"
    );

  if (
    cleaned.length >
    MAX_EMBEDDING_TEXT_LENGTH
  ) {
    return fail(
      "invalid_input",
      `Poster Brain embedding text cannot exceed ${MAX_EMBEDDING_TEXT_LENGTH} characters.`
    );
  }

  return cleaned;
}

function normalizeEndpointUrl(
  value:
    string
): string {
  const cleaned =
    cleanText(
      value,
      "endpointUrl"
    );

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        cleaned
      );
  }
  catch {
    return fail(
      "invalid_input",
      "Poster Brain embedding endpoint must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    return fail(
      "invalid_input",
      "Poster Brain embedding endpoint must use HTTP or HTTPS."
    );
  }

  return parsed.toString();
}

function normalizeTimeout(
  value:
    number
): number {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return fail(
      "invalid_input",
      "Poster Brain embedding timeout must be a positive safe integer."
    );
  }

  return value;
}

function readRecord(
  value:
    unknown
): EmbeddingResponseRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI embedding response must be an object."
    );
  }

  return value as
    EmbeddingResponseRecord;
}

function readString(
  value:
    unknown,
  field:
    string
): string {
  if (
    typeof value !== "string"
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI embedding response has invalid ${field}.`
    );
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return fail(
      "response_invalid",
      `Poster Brain AI embedding response has empty ${field}.`
    );
  }

  return cleaned;
}

function readTimestamp(
  value:
    unknown
): string {
  const text =
    readString(
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
    return fail(
      "response_invalid",
      "Poster Brain AI embedding generatedAt is invalid."
    );
  }

  return parsed.toISOString();
}

function readVector(
  value:
    unknown
): readonly number[] {
  if (
    !Array.isArray(value) ||
    value.length !==
      POSTER_BRAIN_EMBEDDING_DIMENSIONS
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI embedding vector must contain exactly ${POSTER_BRAIN_EMBEDDING_DIMENSIONS} values.`
    );
  }

  let squaredNorm =
    0;

  const vector =
    value.map(
      (
        item,
        index
      ) => {
        if (
          typeof item !== "number" ||
          !Number.isFinite(item)
        ) {
          return fail(
            "response_invalid",
            `Poster Brain AI embedding vector[${index}] is invalid.`
          );
        }

        squaredNorm +=
          item * item;

        return item;
      }
    );

  const norm =
    Math.sqrt(
      squaredNorm
    );

  if (
    norm <
      NORMALIZED_VECTOR_MIN_NORM ||
    norm >
      NORMALIZED_VECTOR_MAX_NORM
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI embedding vector is not normalized."
    );
  }

  return vector;
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
        () =>
          response.json(),

      text:
        () =>
          response.text(),
    };
  };

export class DefaultPosterBrainAiContentEmbeddingService
  implements PosterBrainAiContentEmbeddingService
{
  private readonly endpointUrl:
    string;

  private readonly timeoutMs:
    number;

  private readonly fetchImplementation:
    PosterBrainAiEmbeddingHttpFetch;

  constructor(
    private readonly dependencies:
      PosterBrainAiContentEmbeddingServiceDependencies
  ) {
    this.endpointUrl =
      normalizeEndpointUrl(
        dependencies.endpointUrl
      );

    this.timeoutMs =
      normalizeTimeout(
        dependencies.timeoutMs
      );

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      runtimeFetch;
  }

  async embedContent(
    input:
      PosterBrainAiContentEmbeddingInput
  ): Promise<
    PosterBrainAiContentEmbeddingResult
  > {
    const contentId =
      cleanText(
        input.contentId,
        "contentId"
      );

    const text =
      normalizeEmbeddingText(
        input.text
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        this.timeoutMs
      );

    try {
      const response =
        await this.fetchImplementation(
          this.endpointUrl,
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
        throw new PosterBrainAiContentEmbeddingError({
          code:
            "remote_rejected",

          status:
            response.status,

          message:
            `Poster Brain AI embedding endpoint returned HTTP ${response.status}.`,
        });
      }

      let raw:
        unknown;

      try {
        raw =
          await response.json();
      }
      catch {
        return fail(
          "response_invalid",
          "Poster Brain AI embedding endpoint returned invalid JSON."
        );
      }

      const record =
        readRecord(
          raw
        );

      if (
        typeof record.available !==
        "boolean"
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI embedding response has invalid available state."
        );
      }

      const provider =
        readString(
          record.provider,
          "provider"
        );

      const model =
        readString(
          record.model,
          "model"
        );

      const generatedAt =
        readTimestamp(
          record.generatedAt
        );

      if (!record.available) {
        if (
          record.dimensions !== 0 ||
          !Array.isArray(
            record.vector
          ) ||
          record.vector.length !== 0
        ) {
          return fail(
            "response_invalid",
            "Unavailable Poster Brain AI embedding response must contain zero dimensions and an empty vector."
          );
        }

        const reason =
          readString(
            record.reason,
            "reason"
          );

        return {
          contentId,
          embedded:
            false,
          persisted:
            false,
          provider,
          model,
          dimensions:
            0,
          generatedAt,
          reason,
          embeddingReference:
            null,
        };
      }

      if (
        record.dimensions !==
        POSTER_BRAIN_EMBEDDING_DIMENSIONS
      ) {
        return fail(
          "response_invalid",
          `Poster Brain AI embedding dimensions must equal ${POSTER_BRAIN_EMBEDDING_DIMENSIONS}.`
        );
      }

      if (
        record.reason !== null &&
        record.reason !== undefined
      ) {
        return fail(
          "response_invalid",
          "Available Poster Brain AI embedding response cannot contain an unavailable reason."
        );
      }

      const vector =
        readVector(
          record.vector
        );

      let persisted:
        PosterBrainContentEmbeddingRecord;

      try {
        persisted =
          await this.dependencies
            .repository
            .upsertEmbedding({
              contentId,
              providerName:
                provider,
              modelName:
                model,
              vector,
              generatedAt,
            });
      }
      catch {
        throw new PosterBrainAiContentEmbeddingError({
          code:
            "persistence_failed",

          message:
            "Poster Brain AI embedding could not be persisted.",
        });
      }

      if (
        persisted.contentId !==
          contentId ||
        persisted.providerName !==
          provider ||
        persisted.modelName !==
          model ||
        persisted.dimensions !==
          POSTER_BRAIN_EMBEDDING_DIMENSIONS
      ) {
        throw new PosterBrainAiContentEmbeddingError({
          code:
            "persistence_failed",

          message:
            "Persisted Poster Brain embedding does not match the AI response."
        });
      }

      return {
        contentId,
        embedded:
          true,
        persisted:
          true,
        provider,
        model,
        dimensions:
          POSTER_BRAIN_EMBEDDING_DIMENSIONS,
        generatedAt,
        reason:
          null,
        embeddingReference:
          persisted.embeddingReference,
      };
    }
    catch (error) {
      if (
        error instanceof
        PosterBrainAiContentEmbeddingError
      ) {
        throw error;
      }

      if (
        controller.signal.aborted
      ) {
        throw new PosterBrainAiContentEmbeddingError({
          code:
            "transport_timeout",

          message:
            `Poster Brain AI embedding timed out after ${this.timeoutMs}ms.`,
        });
      }

      throw new PosterBrainAiContentEmbeddingError({
        code:
          "transport_failed",

        message:
          "Poster Brain AI embedding transport failed.",
      });
    }
    finally {
      clearTimeout(
        timeout
      );
    }
  }
}

export function createPosterBrainAiContentEmbeddingService(
  dependencies:
    PosterBrainAiContentEmbeddingServiceDependencies
): PosterBrainAiContentEmbeddingService {
  return new DefaultPosterBrainAiContentEmbeddingService(
    dependencies
  );
}