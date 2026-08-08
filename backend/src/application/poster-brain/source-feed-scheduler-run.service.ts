import type {
  PosterBrainSourceFeedBatchJob,
} from "./source-feed-batch-runner.service.js";

import type {
  PosterBrainSourceFeedRunCoordinatorResult,
  PosterBrainSourceFeedRunCoordinatorService,
} from "./source-feed-run-coordinator.service.js";

import type {
  PosterBrainSourceFeedRunReport,
  PosterBrainSourceFeedRunReportService,
} from "./source-feed-run-report.service.js";

import type {
  PosterBrainSourceIngestionOutcomePolicy,
  PosterBrainSourceIngestionPreviousState,
} from "./source-ingestion-outcome.service.js";

import type {
  PosterBrainSourceIngestionStateUpdate,
  PosterBrainSourceIngestionStateUpdateService,
} from "./source-ingestion-state-update.service.js";

export interface PosterBrainSourceFeedSchedulerRunInput {
  readonly jobs: readonly PosterBrainSourceFeedBatchJob[];
  readonly previousStates?: ReadonlyMap<string, PosterBrainSourceIngestionPreviousState>;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
  readonly runStartedAt: string;
  readonly runFinishedAt: string;
}

export interface PosterBrainSourceFeedSchedulerRunResult {
  readonly run: PosterBrainSourceFeedRunCoordinatorResult;
  readonly stateUpdates: readonly PosterBrainSourceIngestionStateUpdate[];
  readonly report: PosterBrainSourceFeedRunReport;
}

export interface PosterBrainSourceFeedSchedulerRunService {
  runScheduledSourceFeeds(
    input: PosterBrainSourceFeedSchedulerRunInput
  ): Promise<PosterBrainSourceFeedSchedulerRunResult>;
}

export interface PosterBrainSourceFeedSchedulerRunDependencies {
  readonly sourceFeedRunCoordinator:
    PosterBrainSourceFeedRunCoordinatorService;
  readonly sourceIngestionStateUpdateService:
    PosterBrainSourceIngestionStateUpdateService;
  readonly sourceFeedRunReportService:
    PosterBrainSourceFeedRunReportService;
}

export function createPosterBrainSourceFeedSchedulerRunService(
  dependencies: PosterBrainSourceFeedSchedulerRunDependencies
): PosterBrainSourceFeedSchedulerRunService {
  return {
    async runScheduledSourceFeeds(input) {
      const run =
        input.previousStates === undefined
          ? await dependencies
              .sourceFeedRunCoordinator
              .runSourceFeedIngestion({
                jobs:
                  input.jobs,
                policy:
                  input.policy,
                now:
                  input.runFinishedAt,
              })
          : await dependencies
              .sourceFeedRunCoordinator
              .runSourceFeedIngestion({
                jobs:
                  input.jobs,
                previousStates:
                  input.previousStates,
                policy:
                  input.policy,
                now:
                  input.runFinishedAt,
              });

      const stateUpdates =
        dependencies
          .sourceIngestionStateUpdateService
          .createStateUpdates({
            outcomes:
              run.outcomes,
            updatedAt:
              input.runFinishedAt,
          });

      const report =
        dependencies
          .sourceFeedRunReportService
          .createRunReport({
            run,
            runStartedAt:
              input.runStartedAt,
            runFinishedAt:
              input.runFinishedAt,
          });

      return {
        run,
        stateUpdates,
        report,
      };
    },
  };
}