export interface PosterBrainAiClassificationRequest {
  readonly sourceKey: string;
  readonly url: string;
  readonly title: string;
  readonly excerpt?: string;
  readonly categories?: readonly string[];
  readonly publishedAt?: string | null;
}

export interface PosterBrainAiClassification {
  readonly primaryCategory: string;
  readonly topics: readonly string[];
  readonly confidence: number;
  readonly provider: string;
  readonly model?: string;
  readonly classifiedAt: string;
}

export interface PosterBrainAiClassificationProvider {
  classifyContent(
    input: PosterBrainAiClassificationRequest
  ): Promise<PosterBrainAiClassification>;
}

export type PosterBrainAiClassificationProviderPath =
  | "primary"
  | "fallback";

export type PosterBrainAiClassificationFallbackReason =
  | "missing-primary"
  | "timeout"
  | "error";

export interface PosterBrainAiClassificationGatewayResult {
  readonly classification: PosterBrainAiClassification;
  readonly providerPath: PosterBrainAiClassificationProviderPath;
  readonly fallbackReason?: PosterBrainAiClassificationFallbackReason;
}

export interface PosterBrainAiClassificationProviderFailure {
  readonly input: PosterBrainAiClassificationRequest;
  readonly failedAt: string;
  readonly reason: PosterBrainAiClassificationFallbackReason;
  readonly error: unknown;
}

export interface PosterBrainAiClassificationProviderGatewayDependencies {
  readonly fallbackProvider: PosterBrainAiClassificationProvider;
  readonly primaryProvider?: PosterBrainAiClassificationProvider;
  readonly timeoutMs: number;
  readonly now: () => string;
  readonly onPrimaryProviderFailure?: (
    failure: PosterBrainAiClassificationProviderFailure
  ) => void;
}

export class PosterBrainAiClassificationProviderTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(
      `Poster Brain AI classification provider timed out after ${timeoutMs}ms.`
    );

    this.name =
      "PosterBrainAiClassificationProviderTimeoutError";
  }
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function normalizeTopics(input: {
  readonly topics: readonly string[];
  readonly fallbackTopic: string;
}): readonly string[] {
  const seen =
    new Set<string>();

  const topics:
    string[] =
    [];

  for (const topic of input.topics) {
    const normalized =
      topic.trim();

    const key =
      normalized.toLowerCase();

    if (normalized.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(
      key
    );

    topics.push(
      normalized
    );
  }

  if (topics.length === 0) {
    return [
      input.fallbackTopic,
    ];
  }

  return topics.slice(
    0,
    12
  );
}

function normalizeClassification(input: {
  readonly classification: PosterBrainAiClassification;
  readonly now: string;
}): PosterBrainAiClassification {
  const primaryCategory =
    input
      .classification
      .primaryCategory
      .trim() ||
    "general";

  const provider =
    input
      .classification
      .provider
      .trim() ||
    "unknown";

  const classifiedAt =
    input
      .classification
      .classifiedAt
      .trim() ||
    input.now;

  const normalized: PosterBrainAiClassification = {
    primaryCategory,

    topics:
      normalizeTopics({
        topics:
          input.classification.topics,
        fallbackTopic:
          primaryCategory,
      }),

    confidence:
      clampConfidence(
        input.classification.confidence
      ),

    provider,

    classifiedAt,
  };

  const model =
    input
      .classification
      .model
      ?.trim();

  if (model === undefined || model.length === 0) {
    return normalized;
  }

  return {
    ...normalized,
    model,
  };
}

async function runProviderWithTimeout(input: {
  readonly provider: PosterBrainAiClassificationProvider;
  readonly request: PosterBrainAiClassificationRequest;
  readonly timeoutMs: number;
}): Promise<PosterBrainAiClassification> {
  let timeout:
    ReturnType<typeof setTimeout> |
    undefined;

  const timeoutPromise =
    new Promise<never>(
      (_resolve, reject) => {
        timeout =
          setTimeout(
            () => {
              reject(
                new PosterBrainAiClassificationProviderTimeoutError(
                  input.timeoutMs
                )
              );
            },
            input.timeoutMs
          );
      }
    );

  try {
    return await Promise.race([
      input.provider.classifyContent(
        input.request
      ),
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(
        timeout
      );
    }
  }
}

function createResult(input: {
  readonly classification: PosterBrainAiClassification;
  readonly providerPath: PosterBrainAiClassificationProviderPath;
  readonly fallbackReason?: PosterBrainAiClassificationFallbackReason;
}): PosterBrainAiClassificationGatewayResult {
  if (input.fallbackReason === undefined) {
    return {
      classification:
        input.classification,

      providerPath:
        input.providerPath,
    };
  }

  return {
    classification:
      input.classification,

    providerPath:
      input.providerPath,

    fallbackReason:
      input.fallbackReason,
  };
}

function getFailureReason(
  error: unknown
): PosterBrainAiClassificationFallbackReason {
  if (error instanceof PosterBrainAiClassificationProviderTimeoutError) {
    return "timeout";
  }

  return "error";
}

export function createPosterBrainAiClassificationProviderGateway(
  dependencies: PosterBrainAiClassificationProviderGatewayDependencies
): PosterBrainAiClassificationProvider {
  return {
    async classifyContent(input) {
      const currentTime =
        dependencies.now();

      if (dependencies.primaryProvider === undefined) {
        const fallbackClassification =
          await dependencies
            .fallbackProvider
            .classifyContent(
              input
            );

        return createResult({
          classification:
            normalizeClassification({
              classification:
                fallbackClassification,
              now:
                currentTime,
            }),

          providerPath:
            "fallback",

          fallbackReason:
            "missing-primary",
        }).classification;
      }

      try {
        const classification =
          await runProviderWithTimeout({
            provider:
              dependencies.primaryProvider,
            request:
              input,
            timeoutMs:
              dependencies.timeoutMs,
          });

        return createResult({
          classification:
            normalizeClassification({
              classification,
              now:
                currentTime,
            }),

          providerPath:
            "primary",
        }).classification;
      } catch (error) {
        const reason =
          getFailureReason(
            error
          );

        dependencies
          .onPrimaryProviderFailure
          ?.({
            input,
            failedAt:
              currentTime,
            reason,
            error,
          });

        const fallbackClassification =
          await dependencies
            .fallbackProvider
            .classifyContent(
              input
            );

        return createResult({
          classification:
            normalizeClassification({
              classification:
                fallbackClassification,
              now:
                currentTime,
            }),

          providerPath:
            "fallback",

          fallbackReason:
            reason,
        }).classification;
      }
    },
  };
}

export function createPosterBrainAiClassificationProviderGatewayWithResult(
  dependencies: PosterBrainAiClassificationProviderGatewayDependencies
): {
  classifyContent(
    input: PosterBrainAiClassificationRequest
  ): Promise<PosterBrainAiClassificationGatewayResult>;
} {
  const gateway =
    createPosterBrainAiClassificationProviderGateway(
      dependencies
    );

  return {
    async classifyContent(input) {
      const currentTime =
        dependencies.now();

      if (dependencies.primaryProvider === undefined) {
        const classification =
          await dependencies
            .fallbackProvider
            .classifyContent(
              input
            );

        return createResult({
          classification:
            normalizeClassification({
              classification,
              now:
                currentTime,
            }),

          providerPath:
            "fallback",

          fallbackReason:
            "missing-primary",
        });
      }

      try {
        const classification =
          await runProviderWithTimeout({
            provider:
              dependencies.primaryProvider,
            request:
              input,
            timeoutMs:
              dependencies.timeoutMs,
          });

        return createResult({
          classification:
            normalizeClassification({
              classification,
              now:
                currentTime,
            }),

          providerPath:
            "primary",
        });
      } catch (error) {
        const reason =
          getFailureReason(
            error
          );

        dependencies
          .onPrimaryProviderFailure
          ?.({
            input,
            failedAt:
              currentTime,
            reason,
            error,
          });

        const classification =
          await gateway.classifyContent(
            input
          );

        return createResult({
          classification,
          providerPath:
            "fallback",
          fallbackReason:
            reason,
        });
      }
    },
  };
}