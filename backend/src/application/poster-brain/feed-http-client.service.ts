import type {
  PosterBrainFeedHttpClient,
  PosterBrainFeedHttpResponse,
} from "./feed-xml-http-fetcher.service.js";

export interface PosterBrainFeedFetchRequestInit {
  readonly headers: Readonly<Record<string, string>>;
}

export type PosterBrainFeedFetchImplementation = (
  url: string,
  init: PosterBrainFeedFetchRequestInit
) => Promise<PosterBrainFeedHttpResponse>;

export interface PosterBrainFetchFeedHttpClientDependencies {
  readonly fetchImplementation: PosterBrainFeedFetchImplementation;
}

function createTimeoutError(timeoutMs: number): Error {
  return new Error(
    `Poster Brain feed HTTP request timed out after ${timeoutMs}ms.`
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout =
    new Promise<never>((_resolve, reject) => {
      timeoutId =
        setTimeout(() => {
          reject(createTimeoutError(timeoutMs));
        }, timeoutMs);
    });

  try {
    return await Promise.race([
      promise,
      timeout,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function createPosterBrainFetchFeedHttpClient(
  dependencies: PosterBrainFetchFeedHttpClientDependencies
): PosterBrainFeedHttpClient {
  return {
    get(input) {
      return withTimeout(
        dependencies.fetchImplementation(
          input.url,
          {
            headers:
              input.headers,
          }
        ),
        input.timeoutMs
      );
    },
  };
}