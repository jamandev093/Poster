import {
  createPosterBrainAiTrainingCandidateService,
  type PosterBrainAiTrainingCandidateService,
} from "./ai-training-candidate.service.js";

import type {
  PosterBrainAiLearningDatasetHandoffFetch,
} from "./ai-learning-dataset-handoff.service.js";

import {
  createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository,
  type PosterBrainAiLearningDatasetSnapshotReadDatabase,
} from "./ai-learning-dataset-snapshot-read.repository.js";

import {
  createPostgreSqlPosterBrainAiModelRegistryRepository,
  type PosterBrainAiModelRegistryDatabase,
} from "./ai-model-registry.repository.js";

export const POSTER_BRAIN_AI_DEFAULT_TRAINING_TIMEOUT_MS =
  120000;

export const POSTER_BRAIN_AI_DEFAULT_TRAINING_PAGE_SIZE =
  5000;

export const POSTER_BRAIN_AI_MAXIMUM_TRAINING_PAGE_SIZE =
  5000;

export interface PosterBrainAiTrainingCandidateRuntimeConfiguration {
  readonly endpointUrl:
    string |
    null;

  readonly timeoutMs:
    number;

  readonly pageSize:
    number;
}

export type PosterBrainAiTrainingCandidateRuntimeDatabase =
  PosterBrainAiLearningDatasetSnapshotReadDatabase &
  PosterBrainAiModelRegistryDatabase;

export interface PosterBrainAiTrainingCandidateRuntimeDependencies {
  readonly database:
    PosterBrainAiTrainingCandidateRuntimeDatabase;

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

  if (
    cleaned ===
      undefined ||
    cleaned.length ===
      0
  ) {
    return undefined;
  }

  return cleaned;
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
      "POSTER_AI_TRAINING_URL must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {
    throw new Error(
      "POSTER_AI_TRAINING_URL must use HTTP or HTTPS."
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
    undefined
  ) {
    return fallback;
  }

  if (
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
    POSTER_BRAIN_AI_MAXIMUM_TRAINING_PAGE_SIZE,

    readPositiveInteger(
      value,
      POSTER_BRAIN_AI_DEFAULT_TRAINING_PAGE_SIZE
    )
  );
}

export function createPosterBrainAiTrainingCandidateRuntimeConfiguration(
  environment:
    Readonly<
      Record<
        string,
        string |
        undefined
      >
    > =
      process.env
): PosterBrainAiTrainingCandidateRuntimeConfiguration {
  return {
    endpointUrl:
      readEndpointUrl(
        environment
          .POSTER_AI_TRAINING_URL
      ),

    timeoutMs:
      readPositiveInteger(
        environment
          .POSTER_AI_TRAINING_TIMEOUT_MS,

        POSTER_BRAIN_AI_DEFAULT_TRAINING_TIMEOUT_MS
      ),

    pageSize:
      readPageSize(
        environment
          .POSTER_AI_TRAINING_PAGE_SIZE
      ),
  };
}

export function createPosterBrainAiTrainingCandidateServiceFromRuntimeEnv(
  dependencies:
    PosterBrainAiTrainingCandidateRuntimeDependencies
): PosterBrainAiTrainingCandidateService |
  null {
  const environment =
    dependencies.environment ??
    process.env;

  const configuration =
    createPosterBrainAiTrainingCandidateRuntimeConfiguration(
      environment
    );

  if (
    configuration.endpointUrl ===
    null
  ) {
    return null;
  }

  const snapshotRepository =
    createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
      dependencies.database
    );

  const modelRegistryRepository =
    createPostgreSqlPosterBrainAiModelRegistryRepository(
      dependencies.database
    );

  const serviceInput = {
    snapshotRepository,
    modelRegistryRepository,

    endpointUrl:
      configuration.endpointUrl,

    timeoutMs:
      configuration.timeoutMs,

    pageSize:
      configuration.pageSize,
  };

  if (
    dependencies.fetchImplementation ===
    undefined
  ) {
    return createPosterBrainAiTrainingCandidateService(
      serviceInput
    );
  }

  return createPosterBrainAiTrainingCandidateService({
    ...serviceInput,

    fetchImplementation:
      dependencies.fetchImplementation,
  });
}