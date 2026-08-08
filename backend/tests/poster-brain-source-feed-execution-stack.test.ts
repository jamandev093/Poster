import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedExecutionStack,
  type PosterBrainClassifiedFeedIngestionResult,
  type PosterBrainClassifiedFeedIngestionRunner,
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

class RecordingClassifiedRunner
  implements PosterBrainClassifiedFeedIngestionRunner {
  readonly calls: Array<{
    readonly source: PosterBrainRssSource;
    readonly feedXml: string;
    readonly discoveredAt: string;
  }> = [];

  async ingestClassifiedFeed(input: {
    readonly source: PosterBrainRssSource;
    readonly feedXml: string;
    readonly discoveredAt: string;
  }): Promise<PosterBrainClassifiedFeedIngestionResult> {
    this.calls.push(input);

    return {
      acceptedCount: 1,
      rejectedCount: 0,
      persistedCount: 1,
      persistencePlan: null,
    };
  }
}

describe("Poster Brain source feed execution stack", () => {
  it("wires fetch client, feed fetcher, job executor, and batch runner", async () => {
    const fetchCalls: Array<{
      readonly url: string;
      readonly headers: Readonly<Record<string, string>>;
    }> = [];

    const fetchImplementation: PosterBrainFeedFetchImplementation =
      async (url, init) => {
        fetchCalls.push({
          url,
          headers:
            init.headers,
        });

        return response({
          ok: true,
          status: 200,
          body: "<rss><channel /></rss>",
        });
      };

    const runner =
      new RecordingClassifiedRunner();

    const stack =
      createPosterBrainSourceFeedExecutionStack({
        fetchImplementation,
        classifiedFeedIngestionRunner:
          runner,
        now:
          () => "2026-08-08T12:00:00.000Z",
        feedFetcherOptions: {
          timeoutMs: 3000,
          userAgent: "Poster-Test-Agent",
        },
      });

    const batch =
      await stack.sourceFeedBatchRunner.runSourceFeedBatch({
        jobs: [
          {
            source,
            discoveredAt:
              "2026-08-08T12:10:00.000Z",
          },
        ],
      });

    expect(batch).toMatchObject({
      totalJobs: 1,
      succeededJobs: 1,
      failedJobs: 0,
      acceptedCount: 1,
      persistedCount: 1,
    });
    expect(fetchCalls[0]).toMatchObject({
      url: "https://www.example.com/rss.xml",
    });
    expect(fetchCalls[0]?.headers["User-Agent"]).toBe(
      "Poster-Test-Agent"
    );
    expect(runner.calls[0]).toMatchObject({
      source,
      feedXml: "<rss><channel /></rss>",
      discoveredAt: "2026-08-08T12:10:00.000Z",
    });
  });

  it("flows HTTP fetch failures into batch failed results", async () => {
    const fetchImplementation: PosterBrainFeedFetchImplementation =
      async () =>
        response({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

    const runner =
      new RecordingClassifiedRunner();

    const stack =
      createPosterBrainSourceFeedExecutionStack({
        fetchImplementation,
        classifiedFeedIngestionRunner:
          runner,
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const batch =
      await stack.sourceFeedBatchRunner.runSourceFeedBatch({
        jobs: [
          {
            source,
            discoveredAt:
              "2026-08-08T12:10:00.000Z",
          },
        ],
      });

    expect(batch).toMatchObject({
      totalJobs: 1,
      succeededJobs: 0,
      failedJobs: 1,
      acceptedCount: 0,
      persistedCount: 0,
    });
    expect(batch.results[0]).toMatchObject({
      status: "failed",
      failureStage: "fetch",
      errorCode: "http_404",
      errorMessage: "Not Found",
    });
    expect(runner.calls).toHaveLength(0);
  });
});