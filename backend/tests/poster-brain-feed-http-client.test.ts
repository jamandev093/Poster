import { describe, expect, it } from "vitest";

import {
  createPosterBrainFeedXmlHttpFetcher,
  createPosterBrainFetchFeedHttpClient,
  type PosterBrainFeedFetchImplementation,
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

describe("Poster Brain fetch feed HTTP client", () => {
  it("passes URL and headers to the injected fetch implementation", async () => {
    const calls: Array<{
      readonly url: string;
      readonly headers: Readonly<Record<string, string>>;
    }> = [];

    const fetchImplementation: PosterBrainFeedFetchImplementation =
      async (url, init) => {
        calls.push({
          url,
          headers:
            init.headers,
        });

        return response({
          ok: true,
          status: 200,
          body: "<rss />",
        });
      };

    const client =
      createPosterBrainFetchFeedHttpClient({
        fetchImplementation,
      });

    const result =
      await client.get({
        url: "https://www.example.com/rss.xml",
        headers: {
          Accept: "application/rss+xml",
        },
        timeoutMs: 5000,
      });

    expect(calls).toEqual([
      {
        url: "https://www.example.com/rss.xml",
        headers: {
          Accept: "application/rss+xml",
        },
      },
    ]);
    expect(result.ok).toBe(true);
    expect(await result.text()).toBe("<rss />");
  });

  it("propagates fetch implementation failures", async () => {
    const client =
      createPosterBrainFetchFeedHttpClient({
        async fetchImplementation() {
          throw new Error("Network failed.");
        },
      });

    await expect(
      client.get({
        url: "https://www.example.com/rss.xml",
        headers: {},
        timeoutMs: 5000,
      })
    ).rejects.toThrow("Network failed.");
  });

  it("plugs into the feed XML HTTP fetcher", async () => {
    const client =
      createPosterBrainFetchFeedHttpClient({
        async fetchImplementation() {
          return response({
            ok: true,
            status: 200,
            body: "<rss><channel /></rss>",
          });
        },
      });

    const fetcher =
      createPosterBrainFeedXmlHttpFetcher({
        httpClient:
          client,
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
  });
});