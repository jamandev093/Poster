import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedRunCoordinatorService,
  createPosterBrainSourceIngestionOutcomeService,
  type PosterBrainSourceFeedBatchJob,
  type PosterBrainSourceFeedBatchRunnerInput,
  type PosterBrainSourceFeedBatchRunnerResult,
  type PosterBrainSourceFeedBatchRunnerService,
  type PosterBrainSourceFeedJobExecutorResult,
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

function job(sourceKey: string): PosterBrainSourceFeedBatchJob {
  return {
    source:
      source(sourceKey),
    discoveredAt:
      "2026-08-08T12:00:00.000Z",
  };
}

function feedResult(input: {
  readonly sourceKey: string;
  readonly status: "succeeded" | "failed";
  readonly acceptedCount?: number;
  readonly rejectedCount?: number;
  readonly persistedCount?: number;
  readonly errorCode?: string | null;
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
      input.errorCode ?? null,
    errorMessage:
      input.errorCode ?? null,
    fetchedAt:
      "2026-08-08T12:00:00.000Z",
    persistencePlan:
      null,
  };
}

function batchResult(
  results: readonly PosterBrainSourceFeedJobExecutorResult[]
): PosterBrainSourceFeedBatchRunnerResult {
  return {
    totalJobs:
      results.length,
    succeededJobs:
      results.filter(result => result.status === "succeeded").length,
    failedJobs:
      results.filter(result => result.status === "failed").length,
    acceptedCount:
      results.reduce((sum, result) => sum + result.acceptedCount, 0),
    rejectedCount:
      results.reduce((sum, result) => sum + result.rejectedCount, 0),
    persistedCount:
      results.reduce((sum, result) => sum + result.persistedCount, 0),
    results,
  };
}

class StaticBatchRunner implements PosterBrainSourceFeedBatchRunnerService {
  readonly calls: PosterBrainSourceFeedBatchRunnerInput[] =
    [];

  constructor(
    private readonly result: PosterBrainSourceFeedBatchRunnerResult
  ) {}

  async runSourceFeedBatch(
    input: PosterBrainSourceFeedBatchRunnerInput
  ): Promise<PosterBrainSourceFeedBatchRunnerResult> {
    this.calls.push(input);

    return this.result;
  }
}

describe("Poster Brain source feed run coordinator", () => {
  it("runs the source feed batch and evaluates source outcomes", async () => {
    const batchRunner =
      new StaticBatchRunner(
        batchResult([
          feedResult({
            sourceKey: "first-news",
            status: "succeeded",
            acceptedCount: 3,
            rejectedCount: 1,
            persistedCount: 3,
          }),
          feedResult({
            sourceKey: "second-news",
            status: "failed",
            errorCode: "http_500",
          }),
        ])
      );

    const coordinator =
      createPosterBrainSourceFeedRunCoordinatorService({
        sourceFeedBatchRunner:
          batchRunner,
        sourceIngestionOutcomeService:
          createPosterBrainSourceIngestionOutcomeService(),
      });

    const result =
      await coordinator.runSourceFeedIngestion({
        jobs: [
          job("first-news"),
          job("second-news"),
        ],
        previousStates:
          new Map([
            [
              "second-news",
              {
                sourceKey: "second-news",
                failureCount: 2,
              },
            ],
          ]),
        policy,
        now: "2026-08-08T12:10:00.000Z",
      });

    expect(batchRunner.calls[0]?.jobs.map(item => item.source.sourceKey)).toEqual([
      "first-news",
      "second-news",
    ]);
    expect(result).toMatchObject({
      totalJobs: 2,
      succeededJobs: 1,
      failedJobs: 1,
      healthySources: 1,
      degradedSources: 0,
      failingSources: 1,
      acceptedCount: 3,
      rejectedCount: 1,
      persistedCount: 3,
    });
    expect(result.outcomes[0]).toMatchObject({
      sourceKey: "first-news",
      health: "healthy",
      failureCount: 0,
    });
    expect(result.outcomes[1]).toMatchObject({
      sourceKey: "second-news",
      health: "failing",
      failureCount: 3,
      errorCode: "http_500",
    });
  });

  it("returns empty run summary when there are no jobs", async () => {
    const batchRunner =
      new StaticBatchRunner(
        batchResult([])
      );

    const coordinator =
      createPosterBrainSourceFeedRunCoordinatorService({
        sourceFeedBatchRunner:
          batchRunner,
        sourceIngestionOutcomeService:
          createPosterBrainSourceIngestionOutcomeService(),
      });

    const result =
      await coordinator.runSourceFeedIngestion({
        jobs: [],
        policy,
        now: "2026-08-08T12:10:00.000Z",
      });

    expect(result).toMatchObject({
      totalJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      healthySources: 0,
      degradedSources: 0,
      failingSources: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      persistedCount: 0,
    });
    expect(result.outcomes).toEqual([]);
  });
});