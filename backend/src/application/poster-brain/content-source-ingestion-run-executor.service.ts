import type {
  PosterBrainContentSourceIngestionRunExecutor,
  PosterBrainContentSourceIngestionRunExecutorInput,
} from "./content-sources-route-adapter.service.js";

import type {
  PosterBrainContentSourceIngestionRunResult,
} from "../../routes/poster-brain-content-sources.routes.js";

import type {
  PosterBrainSourceFeedBatchJob,
} from "./source-feed-batch-runner.service.js";

import type {
  PosterBrainSourceFeedSchedulerRunService,
} from "./source-feed-scheduler-run.service.js";

import type {
  PosterBrainSourceIngestionOutcomePolicy,
} from "./source-ingestion-outcome.service.js";

export interface PosterBrainContentSourceIngestionJobProviderInput {
  readonly actorUserId: string;
  readonly sourceKeys?: readonly string[];
  readonly maxSources: number;
  readonly force: boolean;
  readonly requestedAt: string;
}

export interface PosterBrainContentSourceIngestionJobProvider {
  listJobs(
    input: PosterBrainContentSourceIngestionJobProviderInput
  ): Promise<readonly PosterBrainSourceFeedBatchJob[]>;
}

export interface PosterBrainContentSourceIngestionRunExecutorDependencies {
  readonly jobProvider: PosterBrainContentSourceIngestionJobProvider;
  readonly schedulerRunService: PosterBrainSourceFeedSchedulerRunService;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
  readonly now: () => string;
  readonly createRunId?: (input: {
    readonly requestedAt: string;
  }) => string;
}

function createDefaultRunId(input: {
  readonly requestedAt: string;
}): string {
  const safeTimestamp =
    input
      .requestedAt
      .replace(
        /[^0-9A-Za-z]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return `manual-ingestion-${safeTimestamp}`;
}

function createJobProviderInput(
  input: PosterBrainContentSourceIngestionRunExecutorInput
): PosterBrainContentSourceIngestionJobProviderInput {
  if (input.sourceKeys === undefined) {
    return {
      actorUserId:
        input.actorUserId,

      maxSources:
        input.maxSources,

      force:
        input.force,

      requestedAt:
        input.requestedAt,
    };
  }

  return {
    actorUserId:
      input.actorUserId,

    sourceKeys:
      input.sourceKeys,

    maxSources:
      input.maxSources,

    force:
      input.force,

    requestedAt:
      input.requestedAt,
  };
}

function createRejectedResult(input: {
  readonly runId: string;
  readonly requestedAt: string;
  readonly plannedSources: number;
}): PosterBrainContentSourceIngestionRunResult {
  return {
    runId:
      input.runId,

    status:
      "rejected",

    requestedAt:
      input.requestedAt,

    summary: {
      plannedSources:
        input.plannedSources,

      attemptedSources:
        0,

      succeededSources:
        0,

      failedSources:
        0,

      persistedItems:
        0,
    },
  };
}

export function createPosterBrainContentSourceIngestionRunExecutor(
  dependencies: PosterBrainContentSourceIngestionRunExecutorDependencies
): PosterBrainContentSourceIngestionRunExecutor {
  return {
    async requestRun(input) {
      const runId =
        dependencies.createRunId?.({
          requestedAt:
            input.requestedAt,
        }) ??
        createDefaultRunId({
          requestedAt:
            input.requestedAt,
        });

      const jobs =
        await dependencies
          .jobProvider
          .listJobs(
            createJobProviderInput(input)
          );

      if (jobs.length === 0) {
        return createRejectedResult({
          runId,
          requestedAt:
            input.requestedAt,
          plannedSources:
            0,
        });
      }

      const runFinishedAt =
        dependencies.now();

      const result =
        await dependencies
          .schedulerRunService
          .runScheduledSourceFeeds({
            jobs,
            policy:
              dependencies.policy,
            runStartedAt:
              input.requestedAt,
            runFinishedAt,
          });

      return {
        runId,

        status:
          "completed",

        requestedAt:
          input.requestedAt,

        summary: {
          plannedSources:
            jobs.length,

          attemptedSources:
            result.run.totalJobs,

          succeededSources:
            result.run.succeededJobs,

          failedSources:
            result.run.failedJobs,

          persistedItems:
            result.run.persistedCount,
        },
      };
    },
  };
}