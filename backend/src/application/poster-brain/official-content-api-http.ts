import {
  PosterBrainContentApiProviderError,
} from "./content-api-provider-registry.service.js";

export interface PosterBrainOfficialApiHttpRequest {
  readonly method:
    "GET";

  readonly headers:
    Readonly<
      Record<
        string,
        string
      >
    >;

  readonly signal:
    AbortSignal;
}

export interface PosterBrainOfficialApiHttpResponse {
  readonly ok:
    boolean;

  readonly status:
    number;

  json():
    Promise<unknown>;
}

export type PosterBrainOfficialApiHttpFetch =
  (
    url:
      string,

    request:
      PosterBrainOfficialApiHttpRequest
  ) =>
    Promise<
      PosterBrainOfficialApiHttpResponse
    >;

const runtimeFetch:
  PosterBrainOfficialApiHttpFetch =
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
    };
  };

function objectOrNull(
  value:
    unknown
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as
    Record<string, unknown>;
}

function youtubeErrorReasons(
  value:
    unknown
): readonly string[] {
  const root =
    objectOrNull(
      value
    );

  const error =
    objectOrNull(
      root?.["error"]
    );

  const errors =
    error?.["errors"];

  if (!Array.isArray(errors)) {
    return [];
  }

  const reasons:
    string[] =
    [];

  for (const item of errors) {
    const record =
      objectOrNull(
        item
      );

    const reason =
      record?.["reason"];

    if (
      typeof reason ===
      "string"
    ) {
      reasons.push(
        reason
      );
    }
  }

  return reasons;
}

function throwHttpError(
  status:
    number,

  payload:
    unknown
): never {
  const reasons =
    youtubeErrorReasons(
      payload
    );

  if (
    reasons.some(
      reason =>
        reason === "quotaExceeded" ||
        reason === "dailyLimitExceeded" ||
        reason === "dailyLimitExceededUnreg"
    )
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "quota_exhausted",

      retryable:
        false,

      message:
        "Official content API quota is exhausted.",
    });
  }

  if (
    status === 429 ||
    reasons.some(
      reason =>
        reason === "rateLimitExceeded" ||
        reason === "userRateLimitExceeded"
    )
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "rate_limited",

      retryable:
        true,

      message:
        "Official content API rate limit was reached.",
    });
  }

  if (
    status === 401 ||
    status === 403
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "authentication_failed",

      retryable:
        false,

      message:
        "Official content API authentication failed.",
    });
  }

  if (
    status >= 500
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "provider_unavailable",

      retryable:
        true,

      message:
        `Official content API returned HTTP ${status}.`,
    });
  }

  throw new PosterBrainContentApiProviderError({
    code:
      "invalid_response",

    retryable:
      false,

    message:
      `Official content API returned HTTP ${status}.`,
  });
}

export async function fetchPosterBrainOfficialApiJson(
  input: {
    readonly url:
      string;

    readonly signal:
      AbortSignal;

    readonly fetchImplementation?:
      PosterBrainOfficialApiHttpFetch;

    readonly headers?:
      Readonly<
        Record<
          string,
          string
        >
      >;
  }
): Promise<unknown> {
  const fetchImplementation =
    input.fetchImplementation ??
    runtimeFetch;

  const response =
    await fetchImplementation(
      input.url,
      {
        method:
          "GET",

        headers: {
          accept:
            "application/json",

          ...(
            input.headers ??
            {}
          ),
        },

        signal:
          input.signal,
      }
    );

  let payload:
    unknown;

  try {
    payload =
      await response.json();
  }
  catch {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Official content API returned invalid JSON.",
    });
  }

  if (!response.ok) {
    throwHttpError(
      response.status,
      payload
    );
  }

  return payload;
}