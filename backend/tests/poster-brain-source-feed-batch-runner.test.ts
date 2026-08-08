import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedBatchRunnerService,
  type PosterBrainSourceFeedJobExecutorResult,
  type PosterBrainSourceFeedJobExecutorService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

function source(sourceKey: string): PosterBrainRssSource {
  return {
    sourceKey,
    sourceName: sourceKey,
    homepageUrl: `https://${sourceKey}.example.com`,
    feedUrl: `https://${sourceKey}.example.com/rss.xml`,
    publisherName: sourceKey,
    defaultLanguage: "en",
    defaultRegion: "IN",
    acquisitionMethod: "authorized_rss",
  };
}

function result(input: {
  readonly sourceKey: string;
  readonly status: "succeeded" | "failed";
  readonly acceptedCount?: number;
  readonly rejectedCount?: number;
  readonly persistedCount?: number;
}): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey:
      input.sourceKey,
    status:
      input.status,
    failureStage:
      input.status === "failed" ? "fetch" : null,
    acceptedCount:
      input.acceptedCount ?? 0,
    rejectedCount:
      input.rejectedCount ?? 0,
    persistedCount:
      input.persistedCount ?? 0,
    errorCode:
      input.status === "failed" ? "feed_fetch_failed" : null,
    errorMessage:
      input.status === "failed" ? "Feed fetch failed." : null,
    fetchedAt:
      "2026-08-08T12:00:00.000Z",
    persistencePlan:
      null,
  };
}

class RecordingExecutor implements PosterBrainSourceFeedJobExecutorService {
  readonly calls: Array<{
    readonly source: PosterBrainRssSource;
    readonly discoveredAt: string;
  }> = [];

  constructor(
    private readonly resultsBySourceKey:
      ReadonlyMap<string, PosterBrainSourceFeedJobExecutorResult>
  ) {}

  async executeSourceFeedJob(input: {
    readonly source: PosterBrainRssSource;
    readonly discoveredAt: string;
  }): Promise<PosterBrainSourceFeedJobExecutorResult> {
    this.calls.push(input);

    const saved =
      this.resultsBySourceKey.get(input.source.sourceKey);

    if (!saved) {
      throw new Error(`Missing job result for ${input.source.sourceKey}.`);
    }

    return saved;
  }
}

class ThrowingExecutor implements PosterBrainSourceFeedJobExecutorService {
  async executeSourceFeedJob(): Promise<PosterBrainSourceFeedJobExecutorResult> {
    throw new Error("Unexpected executor failure.");
  }
}

describe("Poster Brain source feed batch runner", () => {
  it("executes planned source feed jobs in order", async () => {
    const first =
      source("first-news");
    const second =
      source("second-news");

    const executor =
      new RecordingExecutor(
        new Map([
          [
            "first-news",
            result({
              sourceKey: "first-news",
              status: "succeeded",
              acceptedCount: 2,
              rejectedCount: 1,
              persistedCount: 2,
            }),
          ],
          [
            "second-news",
            result({
              sourceKey: "second-news",
              status: "succeeded",
              acceptedCount: 3,
              rejectedCount: 0,
              persistedCount: 3,
            }),
          ],
        ])
      );

    const service =
      createPosterBrainSourceFeedBatchRunnerService({
        sourceFeedJobExecutor:
          executor,
      });

    const batch =
      await service.runSourceFeedBatch({
        jobs: [
          {
            source:
              first,
            discoveredAt:
              "2026-08-08T12:00:00.000Z",
          },
          {
            source:
              second,
            discoveredAt:
              "2026-08-08T12:05:00.000Z",
          },
        ],
      });

    expect(executor.calls.map(call => call.source.sourceKey)).toEqual([
      "first-news",
      "second-news",
    ]);
    expect(batch).toMatchObject({
      totalJobs: 2,
      succeededJobs: 2,
      failedJobs: 0,
      acceptedCount: 5,
      rejectedCount: 1,
      persistedCount: 5,
    });
  });

  it("keeps failed source jobs in the batch summary", async () => {
    const first =
      source("first-news");
    const failed =
      source("failed-news");

    const executor =
      new RecordingExecutor(
        new Map([
          [
            "first-news",
            result({
              sourceKey: "first-news",
              status: "succeeded",
              acceptedCount: 2,
              persistedCount: 2,
            }),
          ],
          [
            "failed-news",
            result({
              sourceKey: "failed-news",
              status: "failed",
            }),
          ],
        ])
      );

    const service =
      createPosterBrainSourceFeedBatchRunnerService({
        sourceFeedJobExecutor:
          executor,
      });

    const batch =
      await service.runSourceFeedBatch({
        jobs: [
          {
            source:
              first,
            discoveredAt:
              "2026-08-08T12:00:00.000Z",
          },
          {
            source:
              failed,
            discoveredAt:
              "2026-08-08T12:05:00.000Z",
          },
        ],
      });

    expect(batch).toMatchObject({
      totalJobs: 2,
      succeededJobs: 1,
      failedJobs: 1,
      acceptedCount: 2,
      persistedCount: 2,
    });
    expect(batch.results[1]?.status).toBe("failed");
  });

  it("converts unexpected executor exceptions into failed results", async () => {
    const service =
      createPosterBrainSourceFeedBatchRunnerService({
        sourceFeedJobExecutor:
          new ThrowingExecutor(),
      });

    const batch =
      await service.runSourceFeedBatch({
        jobs: [
          {
            source:
              source("broken-news"),
            discoveredAt:
              "2026-08-08T12:00:00.000Z",
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
      sourceKey: "broken-news",
      status: "failed",
      failureStage: "ingestion",
      errorCode: "source_feed_job_unhandled_exception",
      errorMessage: "Unexpected executor failure.",
    });
  });

  it("returns an empty summary for an empty batch", async () => {
    const service =
      createPosterBrainSourceFeedBatchRunnerService({
        sourceFeedJobExecutor:
          new ThrowingExecutor(),
      });

    const batch =
      await service.runSourceFeedBatch({
        jobs: [],
      });

    expect(batch).toEqual({
      totalJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      persistedCount: 0,
      results: [],
    });
  });
});