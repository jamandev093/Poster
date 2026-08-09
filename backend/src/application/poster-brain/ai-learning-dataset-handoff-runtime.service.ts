import {
  createPosterBrainAiLearningDatasetHandoffService,
  type PosterBrainAiLearningDatasetHandoffFetch,
  type PosterBrainAiLearningDatasetHandoffService,
} from "./ai-learning-dataset-handoff.service.js";

import {
  createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository,
  type PosterBrainAiLearningDatasetSnapshotReadDatabase,
} from "./ai-learning-dataset-snapshot-read.repository.js";

export const POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_TIMEOUT_MS =
  120000;

export const POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_PAGE_SIZE =
  5000;

export const POSTER_BRAIN_AI_MAXIMUM_TRAINING_HANDOFF_PAGE_SIZE =
  5000;

export interface PosterBrainAiLearningDatasetHandoffRuntimeConfiguration {
  readonly endpointUrl:
    string |
    null;

  readonly timeoutMs:
    number;

  readonly pageSize:
    number;
}

export interface PosterBrainAiLearningDatasetHandoffRuntimeDependencies {
  readonly database:
    PosterBrainAiLearningDatasetSnapshotReadDatabase;

  readonly environment?:
    Readonly<
      Record<
        string,
        string |
        undefined
      >
    >;

  readonly fetchImplementation?:
    PosterBrainAiLearningDatasetHandoffFetch;
}

function cleanOptionalString(
  value:
    string |
    undefined
): string |
  undefined {
  const cleaned =
    value?.trim();

  return cleaned ===
      undefined ||
    cleaned.length ===
      0
    ? undefined
    : cleaned;
}

function readEndpointUrl(
  value:
    string |
    undefined
): string |
  null {
  const cleaned =
    cleanOptionalString(
      value
    );

  if (
    cleaned ===
    undefined
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
      "POSTER_AI_TRAINING_HANDOFF_URL must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {
    throw new Error(
      "POSTER_AI_TRAINING_HANDOFF_URL must use HTTP or HTTPS."
    );
  }

  return parsed.toString();
}

function readPositiveInteger(
  value:
    string |
    undefined,

  fallback:
    number
): number {
  const cleaned =
    cleanOptionalString(
      value
    );

  if (
    cleaned ===
      undefined ||
    !/^\d+$/.test(
      cleaned
    )
  ) {
    return fallback;
  }

  const parsed =
    Number(
      cleaned
    );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed <=
      0
  ) {
    return fallback;
  }

  return parsed;
}

function readPageSize(
  value:
    string |
    undefined
): number {
  return Math.min(
    POSTER_BRAIN_AI_MAXIMUM_TRAINING_HANDOFF_PAGE_SIZE,

    readPositiveInteger(
      value,
      POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_PAGE_SIZE
    )
  );
}

export function createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration(
  environment:
    Readonly<
      Record<
        string,
        string |
        undefined
      >
    > =
      process.env
): PosterBrainAiLearningDatasetHandoffRuntimeConfiguration {
  return {
    endpointUrl:
      readEndpointUrl(
        environment
          .POSTER_AI_TRAINING_HANDOFF_URL
      ),

    timeoutMs:
      readPositiveInteger(
        environment
          .POSTER_AI_TRAINING_HANDOFF_TIMEOUT_MS,

        POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_TIMEOUT_MS
      ),

    pageSize:
      readPageSize(
        environment
          .POSTER_AI_TRAINING_HANDOFF_PAGE_SIZE
      ),
  };
}

export function createPosterBrainAiLearningDatasetHandoffServiceFromRuntimeEnv(
  dependencies:
    PosterBrainAiLearningDatasetHandoffRuntimeDependencies
): PosterBrainAiLearningDatasetHandoffService |
  null {
  const environment =
    dependencies.environment ??
    process.env;

  const configuration =
    createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration(
      environment
    );

  if (
    configuration.endpointUrl ===
    null
  ) {
    return null;
  }

  const repository =
    createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
      dependencies.database
    );

  return createPosterBrainAiLearningDatasetHandoffService({
    repository,

    endpointUrl:
      configuration.endpointUrl,

    timeoutMs:
      configuration.timeoutMs,

    pageSize:
      configuration.pageSize,

    ...(dependencies.fetchImplementation ===
    undefined
      ? {}
      : {
          fetchImplementation:
            dependencies.fetchImplementation,
        }),
  });
}