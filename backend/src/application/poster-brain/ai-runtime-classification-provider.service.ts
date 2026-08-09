import {
  createPosterBrainAiClassificationProviderGateway,
  type PosterBrainAiClassificationProvider,
} from "./ai-classification-provider-gateway.service.js";

import {
  createPosterBrainAiHttpClassificationProvider,
  type PosterBrainAiClassificationHttpFetch,
  type PosterBrainAiClassificationHttpFetchRequest,
  type PosterBrainAiClassificationHttpFetchResponse,
} from "./ai-http-classification-provider.service.js";

import {
  createPosterBrainRuleBasedAiClassificationProvider,
} from "./rule-based-ai-classification-provider.service.js";

export const POSTER_BRAIN_AI_DEFAULT_CLASSIFICATION_TIMEOUT_MS =
  3000;

export interface PosterBrainAiRuntimeConfiguration {
  readonly endpointUrl: string | null;
  readonly timeoutMs: number;
  readonly apiKey?: string;
  readonly defaultModel?: string;
}

export interface PosterBrainAiRuntimeClassificationProviderDependencies {
  readonly environment?:
    Readonly<Record<string, string | undefined>>;

  readonly fetchImplementation?:
    PosterBrainAiClassificationHttpFetch;

  readonly now?:
    () => string;
}

function cleanOptionalString(
  value: string | undefined
): string | undefined {
  const cleaned =
    value?.trim();

  return cleaned === undefined ||
    cleaned.length === 0
    ? undefined
    : cleaned;
}

function readTimeoutMs(
  value: string | undefined
): number {
  const cleaned =
    cleanOptionalString(
      value
    );

  if (
    cleaned === undefined ||
    !/^\d+$/.test(
      cleaned
    )
  ) {
    return POSTER_BRAIN_AI_DEFAULT_CLASSIFICATION_TIMEOUT_MS;
  }

  const parsed =
    Number(
      cleaned
    );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed <= 0
  ) {
    return POSTER_BRAIN_AI_DEFAULT_CLASSIFICATION_TIMEOUT_MS;
  }

  return parsed;
}

function readEndpointUrl(
  value: string | undefined
): string | null {
  const cleaned =
    cleanOptionalString(
      value
    );

  if (cleaned === undefined) {
    return null;
  }

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        cleaned
      );
  } catch {
    throw new Error(
      "POSTER_AI_CLASSIFICATION_URL must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "POSTER_AI_CLASSIFICATION_URL must use HTTP or HTTPS."
    );
  }

  return parsed.toString();
}

export function createPosterBrainAiRuntimeConfiguration(
  environment:
    Readonly<Record<string, string | undefined>> =
      process.env
): PosterBrainAiRuntimeConfiguration {
  const endpointUrl =
    readEndpointUrl(
      environment
        .POSTER_AI_CLASSIFICATION_URL
    );

  const timeoutMs =
    readTimeoutMs(
      environment
        .POSTER_AI_CLASSIFICATION_TIMEOUT_MS
    );

  const apiKey =
    cleanOptionalString(
      environment
        .POSTER_AI_API_KEY
    );

  const defaultModel =
    cleanOptionalString(
      environment
        .POSTER_AI_DEFAULT_MODEL
    );

  return {
    endpointUrl,
    timeoutMs,

    ...(apiKey === undefined
      ? {}
      : {
          apiKey,
        }),

    ...(defaultModel === undefined
      ? {}
      : {
          defaultModel,
        }),
  };
}

function createGlobalFetchImplementation():
  PosterBrainAiClassificationHttpFetch {
  return async (
    url:
      string,

    init:
      PosterBrainAiClassificationHttpFetchRequest
  ): Promise<
    PosterBrainAiClassificationHttpFetchResponse
  > => {
    const runtimeFetch =
      (
        globalThis as unknown as {
          readonly fetch?: (
            url: string,
            init: PosterBrainAiClassificationHttpFetchRequest
          ) => Promise<
            PosterBrainAiClassificationHttpFetchResponse
          >;
        }
      ).fetch;

    if (runtimeFetch === undefined) {
      throw new Error(
        "Global fetch is unavailable for the Poster AI HTTP provider."
      );
    }

    return runtimeFetch(
      url,
      init
    );
  };
}

export function createPosterBrainAiClassificationProviderFromRuntimeEnv(
  dependencies:
    PosterBrainAiRuntimeClassificationProviderDependencies =
      {}
): PosterBrainAiClassificationProvider {
  const environment =
    dependencies.environment ??
    process.env;

  const now =
    dependencies.now ??
    (() =>
      new Date()
        .toISOString());

  const configuration =
    createPosterBrainAiRuntimeConfiguration(
      environment
    );

  const fallbackProvider =
    createPosterBrainRuleBasedAiClassificationProvider({
      now,
    });

  if (
    configuration.endpointUrl === null
  ) {
    return createPosterBrainAiClassificationProviderGateway({
      fallbackProvider,

      timeoutMs:
        configuration.timeoutMs,

      now,
    });
  }

  const fetchImplementation =
    dependencies.fetchImplementation ??
    createGlobalFetchImplementation();

  const primaryProvider =
    createPosterBrainAiHttpClassificationProvider({
      endpointUrl:
        configuration.endpointUrl,

      fetchImplementation,

      now,

      ...(configuration.apiKey === undefined
        ? {}
        : {
            apiKey:
              configuration.apiKey,
          }),

      ...(configuration.defaultModel === undefined
        ? {}
        : {
            defaultModel:
              configuration.defaultModel,
          }),
    });

  return createPosterBrainAiClassificationProviderGateway({
    primaryProvider,
    fallbackProvider,

    timeoutMs:
      configuration.timeoutMs,

    now,
  });
}