import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedSchedulerStack,
  type PosterBrainClassifiedFeedIngestionResult,
  type PosterBrainClassifiedFeedIngestionRunner,
  type PosterBrainFeedFetchImplementation,
  type PosterBrainFeedHttpResponse,
  type PosterBrainSourceIngestionOutcomePolicy,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const policy: PosterBrainSourceIngestionOutcomePolicy = {
  successIntervalMinutes: 30,
  retryBaseMinutes: 5,
  retryMaxMinutes: 60,
  degradedFailureThreshold: 1,
  failingFailureThreshold: 3,
};

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
      acceptedCount: 2,
      rejectedCount: 1,
      persistedCount: 2,
      persistencePlan: null,
    };
  }
}

describe("Poster Brain source feed scheduler stack", () => {
  it("runs a successful scheduler pass through the full composed stack", async () => {
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

    const classifiedRunner =
      new RecordingClassifiedRunner();

    const stack =
      createPosterBrainSourceFeedSchedulerStack({
        fetchImplementation,
        classifiedFeedIngestionRunner:
          classifiedRunner,
        now:
          () => "2026-08-08T12:00:00.000Z",
        feedFetcherOptions: {
          timeoutMs: 3000,
          userAgent: "Poster-Test-Agent",
        },
      });

    const result =
      await stack.sourceFeedSchedulerRunService.runScheduledSourceFeeds({
        jobs: [
          {
            source,
            discoveredAt: "2026-08-08T12:05:00.000Z",
          },
        ],
        policy,
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(fetchCalls[0]).toMatchObject({
      url: "https://www.example.com/rss.xml",
    });
    expect(fetchCalls[0]?.headers["User-Agent"]).toBe(
      "Poster-Test-Agent"
    );
    expect(classifiedRunner.calls[0]).toMatchObject({
      source,
      feedXml: "<rss><channel /></rss>",
      discoveredAt: "2026-08-08T12:05:00.000Z",
    });
    expect(result.report).toMatchObject({
      status: "completed",
      totalJobs: 1,
      succeededJobs: 1,
      failedJobs: 0,
      acceptedCount: 2,
      rejectedCount: 1,
      persistedCount: 2,
    });
    expect(result.stateUpdates[0]).toMatchObject({
      sourceKey: "example-news",
      health: "healthy",
      failureCount: 0,
      updatedAt: "2026-08-08T12:10:00.000Z",
    });
  });

  it("turns HTTP failures into scheduler report failures", async () => {
    const classifiedRunner =
      new RecordingClassifiedRunner();

    const fetchImplementation: PosterBrainFeedFetchImplementation =
      async () =>
        response({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        });

    const stack =
      createPosterBrainSourceFeedSchedulerStack({
        fetchImplementation,
        classifiedFeedIngestionRunner:
          classifiedRunner,
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await stack.sourceFeedSchedulerRunService.runScheduledSourceFeeds({
        jobs: [
          {
            source,
            discoveredAt: "2026-08-08T12:05:00.000Z",
          },
        ],
        previousStates:
          new Map([
            [
              "example-news",
              {
                sourceKey: "example-news",
                failureCount: 2,
              },
            ],
          ]),
        policy,
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(classifiedRunner.calls).toHaveLength(0);
    expect(result.report).toMatchObject({
      status: "failed",
      totalJobs: 1,
      succeededJobs: 0,
      failedJobs: 1,
      failingSources: 1,
    });
    expect(result.report.failures[0]).toMatchObject({
      sourceKey: "example-news",
      health: "failing",
      failureCount: 3,
      errorCode: "http_503",
      errorMessage: "Service Unavailable",
    });
    expect(result.stateUpdates[0]).toMatchObject({
      sourceKey: "example-news",
      health: "failing",
      failureCount: 3,
      lastErrorCode: "http_503",
    });
  });

  it("returns empty scheduler output without touching fetch or ingestion", async () => {
    let fetchCalls =
      0;
    const classifiedRunner =
      new RecordingClassifiedRunner();

    const stack =
      createPosterBrainSourceFeedSchedulerStack({
        async fetchImplementation() {
          fetchCalls += 1;

          return response({
            ok: true,
            status: 200,
            body: "<rss />",
          });
        },
        classifiedFeedIngestionRunner:
          classifiedRunner,
        now:
          () => "2026-08-08T12:00:00.000Z",
      });

    const result =
      await stack.sourceFeedSchedulerRunService.runScheduledSourceFeeds({
        jobs: [],
        policy,
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(fetchCalls).toBe(0);
    expect(classifiedRunner.calls).toHaveLength(0);
    expect(result.stateUpdates).toEqual([]);
    expect(result.report).toMatchObject({
      status: "empty",
      totalJobs: 0,
      failures: [],
    });
  });
});