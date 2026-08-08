import type {
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainSourceFeedJobExecutorResult,
  PosterBrainSourceFeedJobExecutorService,
} from "./source-feed-job-executor.service.js";

export interface PosterBrainSourceFeedBatchJob {
  readonly source: PosterBrainRssSource;
  readonly discoveredAt: string;
}

export interface PosterBrainSourceFeedBatchRunnerInput {
  readonly jobs: readonly PosterBrainSourceFeedBatchJob[];
}

export interface PosterBrainSourceFeedBatchRunnerResult {
  readonly totalJobs: number;
  readonly succeededJobs: number;
  readonly failedJobs: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
  readonly results: readonly PosterBrainSourceFeedJobExecutorResult[];
}

export interface PosterBrainSourceFeedBatchRunnerService {
  runSourceFeedBatch(
    input: PosterBrainSourceFeedBatchRunnerInput
  ): Promise<PosterBrainSourceFeedBatchRunnerResult>;
}

export interface PosterBrainSourceFeedBatchRunnerDependencies {
  readonly sourceFeedJobExecutor:
    PosterBrainSourceFeedJobExecutorService;
}

function createUnexpectedFailureResult(input: {
  readonly source: PosterBrainRssSource;
  readonly error: unknown;
}): PosterBrainSourceFeedJobExecutorResult {
  const errorMessage =
    input.error instanceof Error && input.error.message.trim()
      ? input.error.message
      : "Unexpected Poster Brain source feed job failure.";

  return {
    sourceKey:
      input.source.sourceKey,
    status:
      "failed",
    failureStage:
      "ingestion",
    acceptedCount:
      0,
    rejectedCount:
      0,
    persistedCount:
      0,
    errorCode:
      "source_feed_job_unhandled_exception",
    errorMessage,
    fetchedAt:
      null,
    persistencePlan:
      null,
  };
}

function summarizeResults(
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

export function createPosterBrainSourceFeedBatchRunnerService(
  dependencies: PosterBrainSourceFeedBatchRunnerDependencies
): PosterBrainSourceFeedBatchRunnerService {
  return {
    async runSourceFeedBatch(input) {
      const results: PosterBrainSourceFeedJobExecutorResult[] =
        [];

      for (const job of input.jobs) {
        try {
          results.push(
            await dependencies
              .sourceFeedJobExecutor
              .executeSourceFeedJob({
                source:
                  job.source,
                discoveredAt:
                  job.discoveredAt,
              })
          );
        } catch (error) {
          results.push(
            createUnexpectedFailureResult({
              source:
                job.source,
              error,
            })
          );
        }
      }

      return summarizeResults(results);
    },
  };
}