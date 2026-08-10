import {
  createPosterBrainAiContentEmbeddingService,
  type PosterBrainAiEmbeddingHttpFetch,
  type PosterBrainAiContentEmbeddingService,
} from "./ai-content-embedding.service.js";

import {
  createPostgreSqlPosterBrainContentEmbeddingRepository,
  type PosterBrainContentEmbeddingDatabase,
} from "./content-embedding.repository.js";

export const POSTER_BRAIN_AI_DEFAULT_EMBEDDING_TIMEOUT_MS =
  30000;

export interface PosterBrainAiContentEmbeddingRuntimeConfiguration {
  readonly endpointUrl:
    string |
    null;

  readonly timeoutMs:
    number;
}

export interface PosterBrainAiContentEmbeddingRuntimeDependencies {
  readonly database:
    PosterBrainContentEmbeddingDatabase;

  readonly environment?:
    Readonly<
      Record<
        string,
        string |
        undefined
      >
    >;

  readonly fetchImplementation?:
    PosterBrainAiEmbeddingHttpFetch;
}

function cleanOptional(
  value:
    string |
    undefined
): string |
  undefined {
  const cleaned =
    value?.trim();

  if (
    cleaned === undefined ||
    cleaned.length === 0
  ) {
    return undefined;
  }

  return cleaned;
}

function readUrl(
  value:
    string |
    undefined
): string |
  null {
  const cleaned =
    cleanOptional(
      value
    );

  if (
    cleaned === undefined
  ) {
    return null;
  }

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        cleaned
      );
  }
  catch {
    throw new Error(
      "POSTER_AI_EMBEDDING_URL must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "POSTER_AI_EMBEDDING_URL must use HTTP or HTTPS."
    );
  }

  return parsed.toString();
}

function readTimeout(
  value:
    string |
    undefined
): number {
  const cleaned =
    cleanOptional(
      value
    );

  if (
    cleaned === undefined ||
    !/^\d+$/.test(cleaned)
  ) {
    return POSTER_BRAIN_AI_DEFAULT_EMBEDDING_TIMEOUT_MS;
  }

  const parsed =
    Number(cleaned);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return POSTER_BRAIN_AI_DEFAULT_EMBEDDING_TIMEOUT_MS;
  }

  return parsed;
}

export function createPosterBrainAiContentEmbeddingRuntimeConfiguration(
  environment:
    Readonly<
      Record<
        string,
        string |
        undefined
      >
    > =
      process.env
): PosterBrainAiContentEmbeddingRuntimeConfiguration {
  return {
    endpointUrl:
      readUrl(
        environment
          .POSTER_AI_EMBEDDING_URL
      ),

    timeoutMs:
      readTimeout(
        environment
          .POSTER_AI_EMBEDDING_TIMEOUT_MS
      ),
  };
}

export function createPosterBrainAiContentEmbeddingServiceFromRuntimeEnv(
  dependencies:
    PosterBrainAiContentEmbeddingRuntimeDependencies
): PosterBrainAiContentEmbeddingService |
  null {
  const configuration =
    createPosterBrainAiContentEmbeddingRuntimeConfiguration(
      dependencies.environment ??
      process.env
    );

  if (
    configuration.endpointUrl ===
    null
  ) {
    return null;
  }

  const repository =
    createPostgreSqlPosterBrainContentEmbeddingRepository(
      dependencies.database
    );

  if (
    dependencies.fetchImplementation ===
    undefined
  ) {
    return createPosterBrainAiContentEmbeddingService({
      repository,
      endpointUrl:
        configuration.endpointUrl,
      timeoutMs:
        configuration.timeoutMs,
    });
  }

  return createPosterBrainAiContentEmbeddingService({
    repository,
    endpointUrl:
      configuration.endpointUrl,
    timeoutMs:
      configuration.timeoutMs,
    fetchImplementation:
      dependencies.fetchImplementation,
  });
}