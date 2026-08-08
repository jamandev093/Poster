import type {
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainFeedXmlFetcher,
  PosterBrainFeedXmlFetchResult,
} from "./source-feed-job-executor.service.js";

export interface PosterBrainFeedHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  text(): Promise<string>;
}

export interface PosterBrainFeedHttpClient {
  get(input: {
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly timeoutMs: number;
  }): Promise<PosterBrainFeedHttpResponse>;
}

export interface PosterBrainFeedXmlHttpFetcherOptions {
  readonly timeoutMs?: number;
  readonly userAgent?: string;
}

export interface PosterBrainFeedXmlHttpFetcherDependencies {
  readonly httpClient: PosterBrainFeedHttpClient;
  readonly now: () => string;
  readonly options?: PosterBrainFeedXmlHttpFetcherOptions;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_USER_AGENT = "PosterBrainRSSBot/1.0";

function createHeaders(
  options: PosterBrainFeedXmlHttpFetcherOptions | undefined
): Readonly<Record<string, string>> {
  return {
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
    "User-Agent":
      options?.userAgent?.trim() || DEFAULT_USER_AGENT,
  };
}

function createTimeoutMs(
  options: PosterBrainFeedXmlHttpFetcherOptions | undefined
): number {
  const timeoutMs =
    options?.timeoutMs;

  if (!Number.isFinite(timeoutMs)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(
    60000,
    Math.max(1000, Math.floor(timeoutMs ?? DEFAULT_TIMEOUT_MS))
  );
}

function createFailedFetchResult(input: {
  readonly fetchedAt: string;
  readonly errorCode: string;
  readonly errorMessage: string;
}): PosterBrainFeedXmlFetchResult {
  return {
    status:
      "failed",
    feedXml:
      null,
    fetchedAt:
      input.fetchedAt,
    errorCode:
      input.errorCode,
    errorMessage:
      input.errorMessage,
  };
}

function createSucceededFetchResult(input: {
  readonly fetchedAt: string;
  readonly feedXml: string;
}): PosterBrainFeedXmlFetchResult {
  return {
    status:
      "succeeded",
    feedXml:
      input.feedXml,
    fetchedAt:
      input.fetchedAt,
    errorCode:
      null,
    errorMessage:
      null,
  };
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Poster Brain feed HTTP fetch failed.";
}

export function createPosterBrainFeedXmlHttpFetcher(
  dependencies: PosterBrainFeedXmlHttpFetcherDependencies
): PosterBrainFeedXmlFetcher {
  return {
    async fetchFeedXml(input: {
      readonly source: PosterBrainRssSource;
    }): Promise<PosterBrainFeedXmlFetchResult> {
      const fetchedAt =
        dependencies.now();

      try {
        const response =
          await dependencies.httpClient.get({
            url:
              input.source.feedUrl,
            headers:
              createHeaders(dependencies.options),
            timeoutMs:
              createTimeoutMs(dependencies.options),
          });

        if (!response.ok) {
          return createFailedFetchResult({
            fetchedAt,
            errorCode:
              `http_${response.status}`,
            errorMessage:
              response.statusText.trim()
                ? response.statusText
                : `Feed fetch failed with HTTP ${response.status}.`,
          });
        }

        return createSucceededFetchResult({
          fetchedAt,
          feedXml:
            await response.text(),
        });
      } catch (error) {
        return createFailedFetchResult({
          fetchedAt,
          errorCode:
            "feed_http_fetch_exception",
          errorMessage:
            normalizeErrorMessage(error),
        });
      }
    },
  };
}