import type {
  PosterBrainSourceFeedBatchJob,
  PosterBrainSourceFeedBatchRunnerResult,
  PosterBrainSourceFeedBatchRunnerService,
} from "./source-feed-batch-runner.service.js";

import type {
  PosterBrainSourceIngestionOutcome,
  PosterBrainSourceIngestionOutcomePolicy,
  PosterBrainSourceIngestionOutcomeService,
  PosterBrainSourceIngestionPreviousState,
} from "./source-ingestion-outcome.service.js";

export interface PosterBrainSourceFeedRunCoordinatorInput {
  readonly jobs: readonly PosterBrainSourceFeedBatchJob[];
  readonly previousStates?: ReadonlyMap<string, PosterBrainSourceIngestionPreviousState>;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
  readonly now: string;
}

export interface PosterBrainSourceFeedRunCoordinatorResult {
  readonly batch: PosterBrainSourceFeedBatchRunnerResult;
  readonly outcomes: readonly PosterBrainSourceIngestionOutcome[];
  readonly totalJobs: number;
  readonly succeededJobs: number;
  readonly failedJobs: number;
  readonly healthySources: number;
  readonly degradedSources: number;
  readonly failingSources: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
}

export interface PosterBrainSourceFeedRunCoordinatorService {
  runSourceFeedIngestion(
    input: PosterBrainSourceFeedRunCoordinatorInput
  ): Promise<PosterBrainSourceFeedRunCoordinatorResult>;
}

export interface PosterBrainSourceFeedRunCoordinatorDependencies {
  readonly sourceFeedBatchRunner:
    PosterBrainSourceFeedBatchRunnerService;
  readonly sourceIngestionOutcomeService:
    PosterBrainSourceIngestionOutcomeService;
}

function countHealth(input: {
  readonly outcomes: readonly PosterBrainSourceIngestionOutcome[];
  readonly health: "healthy" | "degraded" | "failing";
}): number {
  return input.outcomes.filter(
    outcome => outcome.health === input.health
  ).length;
}

function createCoordinatorResult(input: {
  readonly batch: PosterBrainSourceFeedBatchRunnerResult;
  readonly outcomes: readonly PosterBrainSourceIngestionOutcome[];
}): PosterBrainSourceFeedRunCoordinatorResult {
  return {
    batch:
      input.batch,
    outcomes:
      input.outcomes,
    totalJobs:
      input.batch.totalJobs,
    succeededJobs:
      input.batch.succeededJobs,
    failedJobs:
      input.batch.failedJobs,
    healthySources:
      countHealth({
        outcomes:
          input.outcomes,
        health:
          "healthy",
      }),
    degradedSources:
      countHealth({
        outcomes:
          input.outcomes,
        health:
          "degraded",
      }),
    failingSources:
      countHealth({
        outcomes:
          input.outcomes,
        health:
          "failing",
      }),
    acceptedCount:
      input.batch.acceptedCount,
    rejectedCount:
      input.batch.rejectedCount,
    persistedCount:
      input.batch.persistedCount,
  };
}

export function createPosterBrainSourceFeedRunCoordinatorService(
  dependencies: PosterBrainSourceFeedRunCoordinatorDependencies
): PosterBrainSourceFeedRunCoordinatorService {
  return {
    async runSourceFeedIngestion(input) {
      const batch =
        await dependencies.sourceFeedBatchRunner.runSourceFeedBatch({
          jobs:
            input.jobs,
        });

      const outcomes =
        input.previousStates === undefined
          ? dependencies
              .sourceIngestionOutcomeService
              .evaluateBatchOutcomes({
                results:
                  batch.results,
                policy:
                  input.policy,
                now:
                  input.now,
              })
          : dependencies
              .sourceIngestionOutcomeService
              .evaluateBatchOutcomes({
                results:
                  batch.results,
                previousStates:
                  input.previousStates,
                policy:
                  input.policy,
                now:
                  input.now,
              });

      return createCoordinatorResult({
        batch,
        outcomes,
      });
    },
  };
}