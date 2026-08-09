import type {
  PosterBrainAiClassification,
  PosterBrainAiClassificationProvider,
  PosterBrainAiClassificationRequest,
} from "./ai-classification-provider-gateway.service.js";

export interface PosterBrainAiClassificationHttpFetchRequest {
  readonly method: "POST";
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface PosterBrainAiClassificationHttpFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
  text?(): Promise<string>;
}

export type PosterBrainAiClassificationHttpFetch = (
  url: string,
  init: PosterBrainAiClassificationHttpFetchRequest
) => Promise<PosterBrainAiClassificationHttpFetchResponse>;

export interface PosterBrainAiHttpClassificationProviderDependencies {
  readonly endpointUrl: string;
  readonly fetchImplementation: PosterBrainAiClassificationHttpFetch;
  readonly now: () => string;
  readonly apiKey?: string;
  readonly providerName?: string;
  readonly defaultModel?: string;
}

export class PosterBrainAiHttpClassificationProviderError extends Error {
  readonly status:
    number |
    undefined;

  constructor(input: {
    readonly message: string;
    readonly status?: number;
  }) {
    super(input.message);

    this.name =
      "PosterBrainAiHttpClassificationProviderError";

    this.status =
      input.status;
  }
}

function cleanString(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

function readRecord(
  value: unknown
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new PosterBrainAiHttpClassificationProviderError({
      message:
        "Poster Brain AI HTTP provider returned an invalid JSON object.",
    });
  }

  return value as Record<string, unknown>;
}

function readStringArray(
  value: unknown
): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen =
    new Set<string>();

  const result:
    string[] =
    [];

  for (const item of value) {
    const cleaned =
      cleanString(item);

    if (cleaned === undefined) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);
  }

  return result.slice(0, 12);
}

function clampConfidence(
  value: unknown
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
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

function createHeaders(
  dependencies: PosterBrainAiHttpClassificationProviderDependencies
): Readonly<Record<string, string>> {
  const headers:
    Record<string, string> =
    {
      "content-type":
        "application/json",

      "accept":
        "application/json",
    };

  const apiKey =
    cleanString(
      dependencies.apiKey
    );

  if (apiKey !== undefined) {
    headers.authorization =
      `Bearer ${apiKey}`;
  }

  return headers;
}

function createPayload(
  input: PosterBrainAiClassificationRequest
): Record<string, unknown> {
  const payload:
    Record<string, unknown> =
    {
      sourceKey:
        input.sourceKey,

      url:
        input.url,

      title:
        input.title,
    };

  if (input.excerpt !== undefined) {
    payload.excerpt =
      input.excerpt;
  }

  if (input.categories !== undefined) {
    payload.categories =
      input.categories;
  }

  if (input.publishedAt !== undefined) {
    payload.publishedAt =
      input.publishedAt;
  }

  return payload;
}

async function readFailureMessage(
  response: PosterBrainAiClassificationHttpFetchResponse
): Promise<string> {
  try {
    const text =
      await response.text?.();

    if (text !== undefined && text.trim().length > 0) {
      return text.trim();
    }
  } catch {
    return `HTTP ${response.status}`;
  }

  return `HTTP ${response.status}`;
}

function createClassification(input: {
  readonly body: Record<string, unknown>;
  readonly now: string;
  readonly providerName: string;
  readonly defaultModel?: string;
}): PosterBrainAiClassification {
  const primaryCategory =
    cleanString(
      input.body.primaryCategory
    ) ??
    cleanString(
      input.body.category
    );

  if (primaryCategory === undefined) {
    throw new PosterBrainAiHttpClassificationProviderError({
      message:
        "Poster Brain AI HTTP provider response is missing primaryCategory.",
    });
  }

  const topics =
    readStringArray(
      input.body.topics
    );

  const provider =
    cleanString(
      input.body.provider
    ) ??
    input.providerName;

  const classifiedAt =
    cleanString(
      input.body.classifiedAt
    ) ??
    input.now;

  const base: PosterBrainAiClassification = {
    primaryCategory,

    topics:
      topics.length > 0
        ? topics
        : [
            primaryCategory.toLowerCase(),
          ],

    confidence:
      clampConfidence(
        input.body.confidence
      ),

    provider,

    classifiedAt,
  };

  const model =
    cleanString(
      input.body.model
    ) ??
    cleanString(
      input.defaultModel
    );

  if (model === undefined) {
    return base;
  }

  return {
    ...base,
    model,
  };
}

export function createPosterBrainAiHttpClassificationProvider(
  dependencies: PosterBrainAiHttpClassificationProviderDependencies
): PosterBrainAiClassificationProvider {
  const providerName =
    cleanString(
      dependencies.providerName
    ) ??
    "poster_ai_http";

  return {
    async classifyContent(input) {
      const response =
        await dependencies.fetchImplementation(
          dependencies.endpointUrl,
          {
            method:
              "POST",

            headers:
              createHeaders(
                dependencies
              ),

            body:
              JSON.stringify(
                createPayload(input)
              ),
          }
        );

      if (!response.ok) {
        throw new PosterBrainAiHttpClassificationProviderError({
          message:
            `Poster Brain AI HTTP provider failed: ${await readFailureMessage(response)}`,
          status:
            response.status,
        });
      }

      return createClassification({
        body:
          readRecord(
            await response.json()
          ),

        now:
          dependencies.now(),

        providerName,

        defaultModel:
          dependencies.defaultModel,
      });
    },
  };
}