import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedRunReport,
  createPosterBrainSourceIngestionStateUpdates,
  type PosterBrainSourceFeedBatchRunnerResult,
  type PosterBrainSourceFeedJobExecutorResult,
  type PosterBrainSourceFeedRunCoordinatorResult,
  type PosterBrainSourceIngestionOutcome,
} from "../src/application/poster-brain/index.js";

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
  sourceKey: string,
  status: "succeeded" | "failed"
): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey,
    status,
    failureStage:
      status === "failed" ? "fetch" : null,
    acceptedCount:
      status === "succeeded" ? 1 : 0,
    rejectedCount:
      0,
    persistedCount:
      status === "succeeded" ? 1 : 0,
    errorCode:
      status === "failed" ? "http_500" : null,
    errorMessage:
      status === "failed" ? "HTTP 500" : null,
    fetchedAt:
      "2026-08-08T12:00:00.000Z",
    persistencePlan:
      null,
  };
}

function batch(
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

function run(
  outcomes: readonly PosterBrainSourceIngestionOutcome[]
): PosterBrainSourceFeedRunCoordinatorResult {
  const results =
    outcomes.map(item =>
      jobResult(
        item.sourceKey,
        item.succeeded ? "succeeded" : "failed"
      )
    );

  return {
    batch:
      batch(results),
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

describe("Poster Brain source feed run state and report", () => {
  it("creates scheduler-safe source state updates from outcomes", () => {
    const updates =
      createPosterBrainSourceIngestionStateUpdates({
        outcomes: [
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
        ],
        updatedAt: "2026-08-08T12:10:00.000Z",
      });

    expect(updates).toEqual([
      {
        sourceKey: "first-news",
        health: "healthy",
        failureCount: 0,
        nextEligibleAt: "2026-08-08T12:30:00.000Z",
        lastSucceededAt: "2026-08-08T12:00:00.000Z",
        lastFailedAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        lastAcceptedCount: 2,
        lastRejectedCount: 1,
        lastPersistedCount: 2,
        updatedAt: "2026-08-08T12:10:00.000Z",
      },
      {
        sourceKey: "second-news",
        health: "failing",
        failureCount: 3,
        nextEligibleAt: "2026-08-08T12:05:00.000Z",
        lastSucceededAt: null,
        lastFailedAt: "2026-08-08T12:00:00.000Z",
        lastErrorCode: "http_500",
        lastErrorMessage: "HTTP 500",
        lastAcceptedCount: 0,
        lastRejectedCount: 0,
        lastPersistedCount: 0,
        updatedAt: "2026-08-08T12:10:00.000Z",
      },
    ]);
  });

  it("creates completed run report when all jobs succeed", () => {
    const report =
      createPosterBrainSourceFeedRunReport({
        run:
          run([
            outcome({
              sourceKey: "first-news",
              succeeded: true,
              health: "healthy",
              failureCount: 0,
              acceptedCount: 2,
              persistedCount: 2,
            }),
          ]),
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:01:00.000Z",
      });

    expect(report).toMatchObject({
      status: "completed",
      totalJobs: 1,
      succeededJobs: 1,
      failedJobs: 0,
      healthySources: 1,
      acceptedCount: 2,
      persistedCount: 2,
      failures: [],
    });
  });

  it("creates completed-with-failures report with failure details", () => {
    const report =
      createPosterBrainSourceFeedRunReport({
        run:
          run([
            outcome({
              sourceKey: "first-news",
              succeeded: true,
              health: "healthy",
              failureCount: 0,
              acceptedCount: 1,
              persistedCount: 1,
            }),
            outcome({
              sourceKey: "second-news",
              succeeded: false,
              health: "failing",
              failureCount: 3,
              errorCode: "http_500",
              errorMessage: "HTTP 500",
            }),
          ]),
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:01:00.000Z",
      });

    expect(report).toMatchObject({
      status: "completed_with_failures",
      totalJobs: 2,
      succeededJobs: 1,
      failedJobs: 1,
      healthySources: 1,
      failingSources: 1,
      acceptedCount: 1,
      persistedCount: 1,
    });
    expect(report.failures).toEqual([
      {
        sourceKey: "second-news",
        health: "failing",
        failureCount: 3,
        nextEligibleAt: "2026-08-08T12:05:00.000Z",
        errorCode: "http_500",
        errorMessage: "HTTP 500",
      },
    ]);
  });

  it("creates failed report when all jobs fail", () => {
    const report =
      createPosterBrainSourceFeedRunReport({
        run:
          run([
            outcome({
              sourceKey: "broken-news",
              succeeded: false,
              health: "degraded",
              failureCount: 1,
              errorCode: "timeout",
            }),
          ]),
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:01:00.000Z",
      });

    expect(report.status).toBe("failed");
    expect(report.failedJobs).toBe(1);
    expect(report.failures[0]?.sourceKey).toBe("broken-news");
  });

  it("creates empty report when there are no jobs", () => {
    const report =
      createPosterBrainSourceFeedRunReport({
        run:
          run([]),
        runStartedAt: "2026-08-08T12:00:00.000Z",
        runFinishedAt: "2026-08-08T12:01:00.000Z",
      });

    expect(report).toMatchObject({
      status: "empty",
      totalJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      failures: [],
    });
  });
});