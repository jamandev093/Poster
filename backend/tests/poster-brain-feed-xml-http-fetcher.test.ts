import { describe, expect, it } from "vitest";

import {
  createPosterBrainFeedXmlHttpFetcher,
  type PosterBrainFeedHttpClient,
  type PosterBrainFeedHttpResponse,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const source: PosterBrainRssSource = {
  sourceKey: "example-news",
  sourceName: "Example News",
  homepageUrl: "https://www.example.com",
  feedUrl: "https://www.example.com/rss.xml",
  publisherName: "Example News",
  defaultLanguage: "en",
  defaultRegion: "IN",
  acquisitionMethod: "authorized_rss",
};

class RecordingHttpClient implements PosterBrainFeedHttpClient {
  readonly calls: Array<{
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly timeoutMs: number;
  }> = [];

  constructor(
    private readonly response: PosterBrainFeedHttpResponse
  ) {}

  async get(input: {
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly timeoutMs: number;
  }): Promise<PosterBrainFeedHttpResponse> {
    this.calls.push(input);

    return this.response;
  }
}

class ThrowingHttpClient implements PosterBrainFeedHttpClient {
  async get(): Promise<PosterBrainFeedHttpResponse> {
    throw new Error("Network unavailable.");
  }
}

function response(input: {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText?: string;
  readonly body?: string;
}): PosterBrainFeedHttpResponse {
  return {
    ok:
      input.ok,
    status:
      input.status,
    statusText:
      input.statusText ?? "",
    async text() {
      return input.body ?? "";
    },
  };
}

describe("Poster Brain feed XML HTTP fetcher", () => {
  it("fetches source feed XML with RSS-safe request headers", async () => {
    const httpClient =
      new RecordingHttpClient(
        response({
          ok: true,
          status: 200,
          body: "<rss><channel /></rss>",
        })
      );

    const fetcher =
      createPosterBrainFeedXmlHttpFetcher({
        httpClient,
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await fetcher.fetchFeedXml({
        source,
      });

    expect(result).toEqual({
      status: "succeeded",
      feedXml: "<rss><channel /></rss>",
      fetchedAt: "2026-08-08T12:00:00.000Z",
      errorCode: null,
      errorMessage: null,
    });
    expect(httpClient.calls[0]).toMatchObject({
      url: "https://www.example.com/rss.xml",
      timeoutMs: 15000,
    });
    expect(httpClient.calls[0]?.headers.Accept).toContain(
      "application/rss+xml"
    );
    expect(httpClient.calls[0]?.headers["User-Agent"]).toBe(
      "PosterBrainRSSBot/1.0"
    );
  });

  it("supports configured timeout and user agent", async () => {
    const httpClient =
      new RecordingHttpClient(
        response({
          ok: true,
          status: 200,
          body: "<feed />",
        })
      );

    const fetcher =
      createPosterBrainFeedXmlHttpFetcher({
        httpClient,
        now:
          () => "2026-08-08T12:00:00.000Z",
        options: {
          timeoutMs: 2500,
          userAgent: "Poster-Test-Agent",
        },
      });

    await fetcher.fetchFeedXml({
      source,
    });

    expect(httpClient.calls[0]).toMatchObject({
      timeoutMs: 2500,
    });
    expect(httpClient.calls[0]?.headers["User-Agent"]).toBe(
      "Poster-Test-Agent"
    );
  });

  it("returns failed result for non-OK HTTP responses", async () => {
    const fetcher =
      createPosterBrainFeedXmlHttpFetcher({
        httpClient:
          new RecordingHttpClient(
            response({
              ok: false,
              status: 503,
              statusText: "Service Unavailable",
            })
          ),
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await fetcher.fetchFeedXml({
        source,
      });

    expect(result).toEqual({
      status: "failed",
      feedXml: null,
      fetchedAt: "2026-08-08T12:00:00.000Z",
      errorCode: "http_503",
      errorMessage: "Service Unavailable",
    });
  });

  it("converts thrown HTTP client errors into failed fetch results", async () => {
    const fetcher =
      createPosterBrainFeedXmlHttpFetcher({
        httpClient:
          new ThrowingHttpClient(),
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await fetcher.fetchFeedXml({
        source,
      });

    expect(result).toEqual({
      status: "failed",
      feedXml: null,
      fetchedAt: "2026-08-08T12:00:00.000Z",
      errorCode: "feed_http_fetch_exception",
      errorMessage: "Network unavailable.",
    });
  });
});