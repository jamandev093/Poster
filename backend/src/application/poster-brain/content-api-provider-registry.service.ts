import type {
  PosterBrainContentApiProvider,
  PosterBrainContentApiProviderExecutionInput,
  PosterBrainContentApiProviderExecutionResult,
  PosterBrainContentApiProviderItem,
  PosterBrainContentApiProviderPage,
  PosterBrainContentApiProviderQuota,
} from "./content-api-provider.types.js";

export type PosterBrainContentApiProviderErrorCode =
  | "authentication_failed"
  | "quota_exhausted"
  | "rate_limited"
  | "provider_unavailable"
  | "provider_timeout"
  | "invalid_response";

export class PosterBrainContentApiProviderError
  extends Error
{
  readonly code:
    PosterBrainContentApiProviderErrorCode;

  readonly retryable:
    boolean;

  constructor(input: {
    readonly code:
      PosterBrainContentApiProviderErrorCode;

    readonly message:
      string;

    readonly retryable:
      boolean;
  }) {
    super(input.message);

    this.name =
      "PosterBrainContentApiProviderError";

    this.code =
      input.code;

    this.retryable =
      input.retryable;
  }
}

export interface PosterBrainContentApiProviderRegistryDependencies {
  readonly providers:
    readonly PosterBrainContentApiProvider[];

  readonly environment?:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;

  readonly timeoutMs?:
    number;

  readonly maxAttempts?:
    number;

  readonly retryDelayMs?:
    number;

  readonly sleep?:
    (
      milliseconds:
        number
    ) => Promise<void>;
}

export interface PosterBrainContentApiProviderRegistryService {
  execute(
    input:
      PosterBrainContentApiProviderExecutionInput
  ): Promise<
    PosterBrainContentApiProviderExecutionResult
  >;

  listProviderKeys():
    readonly string[];
}

const DEFAULT_TIMEOUT_MS =
  15000;

const DEFAULT_MAX_ATTEMPTS =
  3;

const DEFAULT_RETRY_DELAY_MS =
  250;

const DEFAULT_PAGE_SIZE =
  50;

const GLOBAL_MAX_PAGE_SIZE =
  100;

const FORBIDDEN_METADATA_KEYS =
  new Set([
    "audiourl",
    "contentbody",
    "dashurl",
    "downloadurl",
    "embedurl",
    "fileurl",
    "fulltext",
    "hlsurl",
    "iframeurl",
    "manifesturl",
    "mediafileurl",
    "mediaurl",
    "playbackurl",
    "playerurl",
    "rawhtml",
    "streamurl",
    "videourl",
    "transcript",
    "captions",
  ]);

function defaultSleep(
  milliseconds:
    number
): Promise<void> {
  return new Promise(
    resolve => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function cleanRequired(
  value:
    string,
  field:
    string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new Error(
      `Poster Brain API provider ${field} cannot be empty.`
    );
  }

  return cleaned;
}

function normalizeProviderKey(
  value:
    string
): string {
  const cleaned =
    cleanRequired(
      value,
      "providerKey"
    ).toLowerCase();

  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      cleaned
    )
  ) {
    throw new Error(
      "Poster Brain API providerKey contains unsupported characters."
    );
  }

  return cleaned;
}

function cleanOptional(
  value:
    string | null | undefined
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : null;
}

function normalizeLanguage(
  value:
    string | undefined
): "en" {
  const cleaned =
    value?.trim().toLowerCase() ??
    "en";

  if (
    cleaned !== "en" &&
    !cleaned.startsWith(
      "en-"
    )
  ) {
    throw new Error(
      "Poster v1 API source acquisition is English-only."
    );
  }

  return "en";
}

function normalizeRegion(
  value:
    string | null | undefined
): string | null {
  const cleaned =
    cleanOptional(
      value
    );

  return cleaned === null
    ? null
    : cleaned.toUpperCase();
}

function positiveInteger(
  value:
    number | undefined,
  fallback:
    number,
  maximum:
    number
): number {
  if (value === undefined) {
    return fallback;
  }

  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      "Poster Brain API provider numeric configuration must be a positive safe integer."
    );
  }

  return Math.min(
    value,
    maximum
  );
}

function httpUrl(
  value:
    string,
  field:
    string
): string {
  const cleaned =
    cleanRequired(
      value,
      field
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
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        `Poster Brain API provider returned invalid ${field}.`,
    });
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        `Poster Brain API provider ${field} must use HTTP or HTTPS.`,
    });
  }

  return parsed.toString();
}

function optionalHttpUrl(
  value:
    string | null,
  field:
    string
): string | null {
  return value === null
    ? null
    : httpUrl(
        value,
        field
      );
}

function timestampOrNull(
  value:
    string | null
): string | null {
  if (value === null) {
    return null;
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Poster Brain API provider returned invalid publishedAt.",
    });
  }

  return parsed.toISOString();
}

function durationOrNull(
  value:
    number | null
): number | null {
  if (value === null) {
    return null;
  }

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Poster Brain API provider returned invalid durationSeconds.",
    });
  }

  return value;
}

function normalizedStrings(
  values:
    readonly string[]
): readonly string[] {
  const seen =
    new Set<string>();

  const output:
    string[] =
    [];

  for (const value of values) {
    const cleaned =
      value.trim();

    if (!cleaned) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    output.push(
      cleaned
    );
  }

  return output;
}

function assertMetadataSafe(
  value:
    unknown,
  path:
    string = "metadata"
): void {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(
      (
        item,
        index
      ) => {
        assertMetadataSafe(
          item,
          `${path}[${index}]`
        );
      }
    );

    return;
  }

  for (
    const [
      key,
      nested,
    ]
    of Object.entries(
      value as
        Record<
          string,
          unknown
        >
    )
  ) {
    const normalizedKey =
      key
        .replace(
          /[_\-\s]/g,
          ""
        )
        .toLowerCase();

    if (
      FORBIDDEN_METADATA_KEYS.has(
        normalizedKey
      )
    ) {
      throw new PosterBrainContentApiProviderError({
        code:
          "invalid_response",

        retryable:
          false,

        message:
          `Poster Brain metadata-only policy rejected ${path}.${key}.`,
      });
    }

    assertMetadataSafe(
      nested,
      `${path}.${key}`
    );
  }
}

function isEnglish(
  value:
    string
): boolean {
  const language =
    value
      .trim()
      .toLowerCase();

  return (
    language === "en" ||
    language.startsWith(
      "en-"
    )
  );
}

function normalizeItem(
  item:
    PosterBrainContentApiProviderItem
): PosterBrainContentApiProviderItem | null {
  if (
    !isEnglish(
      item.languageCode
    )
  ) {
    return null;
  }

  assertMetadataSafe(
    item.metadata
  );

  const externalContentId =
    cleanRequired(
      item.externalContentId,
      "externalContentId"
    );

  const title =
    cleanRequired(
      item.title,
      "title"
    );

  const excerpt =
    item.excerpt.trim();

  const publisherName =
    cleanRequired(
      item.publisherName,
      "publisherName"
    );

  const originalUrl =
    httpUrl(
      item.originalUrl,
      "originalUrl"
    );

  const sourceExternalId =
    cleanOptional(
      item.sourceExternalId
    );

  const sourceName =
    cleanOptional(
      item.sourceName
    );

  const sourceUrl =
    optionalHttpUrl(
      cleanOptional(
        item.sourceUrl
      ),
      "sourceUrl"
    );

  const thumbnailUrl =
    optionalHttpUrl(
      cleanOptional(
        item.thumbnailUrl
      ),
      "thumbnailUrl"
    );

  const imageUrl =
    optionalHttpUrl(
      cleanOptional(
        item.imageUrl
      ),
      "imageUrl"
    );

  return {
    externalContentId,
    contentKind:
      item.contentKind,
    title,
    excerpt,
    originalUrl,
    thumbnailUrl,
    imageUrl,
    publisherName,
    sourceExternalId,
    sourceName,
    sourceUrl,
    languageCode:
      "en",
    regionCode:
      normalizeRegion(
        item.regionCode
      ),
    publishedAt:
      timestampOrNull(
        item.publishedAt
      ),
    durationSeconds:
      durationOrNull(
        item.durationSeconds
      ),
    tags:
      normalizedStrings(
        item.tags
      ),
    topics:
      normalizedStrings(
        item.topics
      ),
    metadata:
      item.metadata,
  };
}

function normalizeQuota(
  quota:
    PosterBrainContentApiProviderQuota | null
): PosterBrainContentApiProviderQuota | null {
  if (quota === null) {
    return null;
  }

  for (const value of [
    quota.limit,
    quota.remaining,
  ]) {
    if (
      value !== null &&
      (
        !Number.isFinite(value) ||
        value < 0
      )
    ) {
      throw new PosterBrainContentApiProviderError({
        code:
          "invalid_response",

        retryable:
          false,

        message:
          "Poster Brain API provider returned invalid quota metadata.",
      });
    }
  }

  return {
    limit:
      quota.limit,
    remaining:
      quota.remaining,
    resetAt:
      timestampOrNull(
        quota.resetAt
      ),
  };
}

function missingCredentials(input: {
  readonly provider:
    PosterBrainContentApiProvider;

  readonly environment:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;
}): readonly string[] {
  return input.provider
    .capabilities
    .requiredEnvironmentKeys
    .filter(
      key => {
        const value =
          input.environment[
            key
          ];

        return (
          value === undefined ||
          value.trim().length === 0
        );
      }
    );
}

function normalizePage(input: {
  readonly page:
    PosterBrainContentApiProviderPage;
}): {
  readonly items:
    readonly PosterBrainContentApiProviderItem[];

  readonly droppedNonEnglishItems:
    number;

  readonly nextCursor:
    string | null;

  readonly quota:
    PosterBrainContentApiProviderQuota | null;
} {
  const items:
    PosterBrainContentApiProviderItem[] =
    [];

  let droppedNonEnglishItems =
    0;

  for (
    const raw
    of input.page.items
  ) {
    const item =
      normalizeItem(
        raw
      );

    if (item === null) {
      droppedNonEnglishItems +=
        1;

      continue;
    }

    items.push(
      item
    );
  }

  return {
    items,
    droppedNonEnglishItems,
    nextCursor:
      cleanOptional(
        input.page.nextCursor
      ),
    quota:
      normalizeQuota(
        input.page.quota
      ),
  };
}

async function executeWithTimeout(input: {
  readonly provider:
    PosterBrainContentApiProvider;

  readonly request:
    Omit<
      Parameters<
        PosterBrainContentApiProvider["fetchPage"]
      >[0],
      "signal"
    >;

  readonly timeoutMs:
    number;
}): Promise<
  PosterBrainContentApiProviderPage
> {
  const controller =
    new AbortController();

  let timeoutHandle:
    ReturnType<
      typeof setTimeout
    > | null =
    null;

  try {
    const timeout =
      new Promise<never>(
        (
          _resolve,
          reject
        ) => {
          timeoutHandle =
            setTimeout(
              () => {
                controller.abort();

                reject(
                  new PosterBrainContentApiProviderError({
                    code:
                      "provider_timeout",

                    retryable:
                      true,

                    message:
                      `Poster Brain API provider timed out after ${input.timeoutMs}ms.`,
                  })
                );
              },
              input.timeoutMs
            );
        }
      );

    return await Promise.race([
      input.provider.fetchPage({
        ...input.request,
        signal:
          controller.signal,
      }),
      timeout,
    ]);
  }
  finally {
    if (
      timeoutHandle !==
      null
    ) {
      clearTimeout(
        timeoutHandle
      );
    }
  }
}

export function createPosterBrainContentApiProviderRegistryService(
  dependencies:
    PosterBrainContentApiProviderRegistryDependencies
): PosterBrainContentApiProviderRegistryService {
  const providers =
    new Map<
      string,
      PosterBrainContentApiProvider
    >();

  for (
    const provider
    of dependencies.providers
  ) {
    const providerKey =
      normalizeProviderKey(
        provider.providerKey
      );

    if (
      providers.has(
        providerKey
      )
    ) {
      throw new Error(
        `Duplicate Poster Brain API provider: ${providerKey}`
      );
    }

    if (
      provider.capabilities.metadataOnly !==
      true
    ) {
      throw new Error(
        `Poster Brain API provider ${providerKey} must be metadata-only.`
      );
    }

    if (
      !Number.isSafeInteger(
        provider.capabilities.maxPageSize
      ) ||
      provider.capabilities.maxPageSize <=
        0
    ) {
      throw new Error(
        `Poster Brain API provider ${providerKey} has invalid maxPageSize.`
      );
    }

    providers.set(
      providerKey,
      provider
    );
  }

  const environment =
    dependencies.environment ??
    process.env;

  const timeoutMs =
    positiveInteger(
      dependencies.timeoutMs,
      DEFAULT_TIMEOUT_MS,
      120000
    );

  const maxAttempts =
    positiveInteger(
      dependencies.maxAttempts,
      DEFAULT_MAX_ATTEMPTS,
      5
    );

  const retryDelayMs =
    dependencies.retryDelayMs ===
      undefined
      ? DEFAULT_RETRY_DELAY_MS
      : positiveInteger(
          dependencies.retryDelayMs,
          DEFAULT_RETRY_DELAY_MS,
          10000
        );

  const sleep =
    dependencies.sleep ??
    defaultSleep;

  return {
    listProviderKeys() {
      return [
        ...providers.keys(),
      ];
    },

    async execute(
      input
    ) {
      const providerKey =
        normalizeProviderKey(
          input.providerKey
        );

      const provider =
        providers.get(
          providerKey
        );

      if (
        provider ===
        undefined
      ) {
        throw new Error(
          `Unknown Poster Brain API provider: ${providerKey}`
        );
      }

      const missing =
        missingCredentials({
          provider,
          environment,
        });

      if (
        missing.length >
        0
      ) {
        return {
          providerKey,
          status:
            "disabled",
          health:
            "disabled",
          reason:
            `missing_credentials:${missing.join(",")}`,
          attempts:
            0,
          items:
            [],
          droppedNonEnglishItems:
            0,
          nextCursor:
            null,
          quota:
            null,
        };
      }

      const requestedPageSize =
        positiveInteger(
          input.pageSize,
          DEFAULT_PAGE_SIZE,
          GLOBAL_MAX_PAGE_SIZE
        );

      const pageSize =
        Math.min(
          requestedPageSize,
          provider
            .capabilities
            .maxPageSize,
          GLOBAL_MAX_PAGE_SIZE
        );

      const request = {
        query:
          cleanOptional(
            input.query
          ),
        sourceExternalId:
          cleanOptional(
            input.sourceExternalId
          ),
        cursor:
          cleanOptional(
            input.cursor
          ),
        pageSize,
        languageCode:
          normalizeLanguage(
            input.languageCode
          ),
        regionCode:
          normalizeRegion(
            input.regionCode
          ),
      } as const;

      let lastReason:
        string | null =
        null;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
      ) {
        try {
          const page =
            await executeWithTimeout({
              provider,
              request,
              timeoutMs,
            });

          const normalized =
            normalizePage({
              page,
            });

          return {
            providerKey,
            status:
              "succeeded",
            health:
              "healthy",
            reason:
              null,
            attempts:
              attempt,
            items:
              normalized.items,
            droppedNonEnglishItems:
              normalized
                .droppedNonEnglishItems,
            nextCursor:
              normalized.nextCursor,
            quota:
              normalized.quota,
          };
        }
        catch (error) {
          const providerError =
            error instanceof
            PosterBrainContentApiProviderError
              ? error
              : new PosterBrainContentApiProviderError({
                  code:
                    "provider_unavailable",

                  retryable:
                    true,

                  message:
                    "Poster Brain API provider request failed.",
                });

          lastReason =
            providerError.code;

          if (
            !providerError.retryable ||
            attempt >=
              maxAttempts
          ) {
            return {
              providerKey,
              status:
                "failed",
              health:
                "degraded",
              reason:
                lastReason,
              attempts:
                attempt,
              items:
                [],
              droppedNonEnglishItems:
                0,
              nextCursor:
                null,
              quota:
                null,
            };
          }

          await sleep(
            retryDelayMs *
            2 **
              (
                attempt -
                1
              )
          );
        }
      }

      return {
        providerKey,
        status:
          "failed",
        health:
          "degraded",
        reason:
          lastReason ??
          "provider_unavailable",
        attempts:
          maxAttempts,
        items:
          [],
        droppedNonEnglishItems:
          0,
        nextCursor:
          null,
        quota:
          null,
      };
    },
  };
}