import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedRunReportService,
  createPosterBrainSourceFeedSchedulerRunService,
  createPosterBrainSourceIngestionStateUpdateService,
  type PosterBrainSourceFeedBatchJob,
  type PosterBrainSourceFeedBatchRunnerResult,
  type PosterBrainSourceFeedJobExecutorResult,
  type PosterBrainSourceFeedRunCoordinatorInput,
  type PosterBrainSourceFeedRunCoordinatorResult,
  type PosterBrainSourceFeedRunCoordinatorService,
  type PosterBrainSourceIngestionOutcome,
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

function outcome(input: {
  readonly sourceKey: string;
  readonly succeeded: boolean;
  readonly health: "healthy" | "degraded" | "failing";
  readonly failureCount: number;
  readonly acceptedCount?: number;
  readonly rejectedCount?: number;
  readonly persistedCount?: number;
  readonly errorCode?: string | null;
  readonly errorMessage?: string | null;
}): PosterBrainSourceIngestionOutcome {
  return {
    sourceKey:
      input.sourceKey,
    succeeded:
      input.succeeded,
    health:
      input.health,
    failureCount:
      input.failureCount,
    nextEligibleAt:
      input.succeeded
        ? "2026-08-08T12:30:00.000Z"
        : "2026-08-08T12:05:00.000Z",
    lastSucceededAt:
      input.succeeded ? "2026-08-08T12:00:00.000Z" : null,
    lastFailedAt:
      input.succeeded ? null : "2026-08-08T12:00:00.000Z",
    acceptedCount:
      input.acceptedCount ?? 0,
    rejectedCount:
      input.rejectedCount ?? 0,
    persistedCount:
      input.persistedCount ?? 0,
    errorCode:
      input.errorCode ?? null,
    errorMessage:
      input.errorMessage ?? null,
  };
}

function jobResult(
  item: PosterBrainSourceIngestionOutcome
): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey:
      item.sourceKey,
    status:
      item.succeeded ? "succeeded" : "failed",
    failureStage:
      item.succeeded ? null : "fetch",
    acceptedCount:
      item.acceptedCount,
    rejectedCount:
      item.rejectedCount,
    persistedCount:
      item.persistedCount,
    errorCode:
      item.errorCode,
    errorMessage:
      item.errorMessage,
    fetchedAt:
      "2026-08-08T12:00:00.000Z",
    persistencePlan:
      null,
  };
}

function batch(
  outcomes: readonly PosterBrainSourceIngestionOutcome[]
): PosterBrainSourceFeedBatchRunnerResult {
  const results =
    outcomes.map(jobResult);

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

function runResult(
  outcomes: readonly PosterBrainSourceIngestionOutcome[]
): PosterBrainSourceFeedRunCoordinatorResult {
  return {
    batch:
      batch(outcomes),
    outcomes,
    totalJobs:
      outcomes.length,
    succeededJobs:
      outcomes.filter(item => item.succeeded).length,
    failedJobs:
      outcomes.filter(item => !item.succeeded).length,
    healthySources:
      outcomes.filter(item => item.health === "healthy").length,
    degradedSources:
      outcomes.filter(item => item.health === "degraded").length,
    failingSources:
      outcomes.filter(item => item.health === "failing").length,
    acceptedCount:
      outcomes.reduce((sum, item) => sum + item.acceptedCount, 0),
    rejectedCount:
      outcomes.reduce((sum, item) => sum + item.rejectedCount, 0),
    persistedCount:
      outcomes.reduce((sum, item) => sum + item.persistedCount, 0),
  };
}

class StaticCoordinator implements PosterBrainSourceFeedRunCoordinatorService {
  readonly calls: PosterBrainSourceFeedRunCoordinatorInput[] =
    [];

  constructor(
    private readonly result: PosterBrainSourceFeedRunCoordinatorResult
  ) {}

  async runSourceFeedIngestion(
    input: PosterBrainSourceFeedRunCoordinatorInput
  ): Promise<PosterBrainSourceFeedRunCoordinatorResult> {
    this.calls.push(input);

    return this.result;
  }
}

describe("Poster Brain source feed scheduler run", () => {
  it("creates run result, source state updates, and report in one scheduler output", async () => {
    const coordinator =
      new StaticCoordinator(
        runResult([
          outcome({
            sourceKey: "first-news",
            succeeded: true,
            health: "healthy",
            failureCount: 0,
            acceptedCount: 2,
            rejectedCount: 1,
            persistedCount: 2,
          }),
          outcome({
            sourceKey: "second-news",
            succeeded: false,
            health: "failing",
            failureCount: 3,
            errorCode: "http_500",
            errorMessage: "HTTP 500",
          }),
        ])
      );

    const previousStates =
      new Map([
        [
          "second-news",
          {
            sourceKey: "second-news",
            failureCount: 2,
          },
        ],
      ]);

    const service =
      createPosterBrainSourceFeedSchedulerRunService({
        sourceFeedRunCoordinator:
          coordinator,
        sourceIngestionStateUpdateService:
          createPosterBrainSourceIngestionStateUpdateService(),
        sourceFeedRunReportService:
          createPosterBrainSourceFeedRunReportService(),
      });

    const result =
      await service.runScheduledSourceFeeds({
        jobs: [
          job("first-news"),
          job("second-news"),
        ],
        previousStates,
        policy,
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(coordinator.calls[0]?.previousStates).toBe(previousStates);
    expect(coordinator.calls[0]?.now).toBe("2026-08-08T12:10:00.000Z");

    expect(result.run).toMatchObject({
      totalJobs: 2,
      succeededJobs: 1,
      failedJobs: 1,
      acceptedCount: 2,
      rejectedCount: 1,
      persistedCount: 2,
    });

    expect(result.stateUpdates).toHaveLength(2);
    expect(result.stateUpdates[0]).toMatchObject({
      sourceKey: "first-news",
      health: "healthy",
      updatedAt: "2026-08-08T12:10:00.000Z",
    });
    expect(result.stateUpdates[1]).toMatchObject({
      sourceKey: "second-news",
      health: "failing",
      failureCount: 3,
      lastErrorCode: "http_500",
    });

    expect(result.report).toMatchObject({
      status: "completed_with_failures",
      runStartedAt: "2026-08-08T12:00:00.000Z",
      runFinishedAt: "2026-08-08T12:10:00.000Z",
      totalJobs: 2,
      failedJobs: 1,
      persistedCount: 2,
    });
    expect(result.report.failures[0]).toMatchObject({
      sourceKey: "second-news",
      errorCode: "http_500",
    });
  });

  it("omits previous states when none are provided", async () => {
    const coordinator =
      new StaticCoordinator(
        runResult([])
      );

    const service =
      createPosterBrainSourceFeedSchedulerRunService({
        sourceFeedRunCoordinator:
          coordinator,
        sourceIngestionStateUpdateService:
          createPosterBrainSourceIngestionStateUpdateService(),
        sourceFeedRunReportService:
          createPosterBrainSourceFeedRunReportService(),
      });

    await service.runScheduledSourceFeeds({
      jobs: [],
      policy,
      runStartedAt: "2026-08-08T12:00:00.000Z",
      runFinishedAt: "2026-08-08T12:10:00.000Z",
    });

    const call =
      coordinator.calls[0];

    expect(call).toBeDefined();

    if (!call) {
      throw new Error("Expected scheduler run coordinator call.");
    }

    expect("previousStates" in call).toBe(false);
  });

  it("creates empty report and no state updates for empty runs", async () => {
    const coordinator =
      new StaticCoordinator(
        runResult([])
      );

    const service =
      createPosterBrainSourceFeedSchedulerRunService({
        sourceFeedRunCoordinator:
          coordinator,
        sourceIngestionStateUpdateService:
          createPosterBrainSourceIngestionStateUpdateService(),
        sourceFeedRunReportService:
          createPosterBrainSourceFeedRunReportService(),
      });

    const result =
      await service.runScheduledSourceFeeds({
        jobs: [],
        policy,
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(result.stateUpdates).toEqual([]);
    expect(result.report).toMatchObject({
      status: "empty",
      totalJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      failures: [],
    });
  });
});