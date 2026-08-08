import {
  createPosterBrainSourceFeedExecutionStack,
  type PosterBrainSourceFeedExecutionStack,
} from "./source-feed-execution-stack.service.js";

import {
  createPosterBrainSourceFeedRunCoordinatorService,
  type PosterBrainSourceFeedRunCoordinatorService,
} from "./source-feed-run-coordinator.service.js";

import {
  createPosterBrainSourceFeedRunReportService,
  type PosterBrainSourceFeedRunReportService,
} from "./source-feed-run-report.service.js";

import {
  createPosterBrainSourceFeedSchedulerRunService,
  type PosterBrainSourceFeedSchedulerRunService,
} from "./source-feed-scheduler-run.service.js";

import {
  createPosterBrainSourceIngestionOutcomeService,
  type PosterBrainSourceIngestionOutcomeService,
} from "./source-ingestion-outcome.service.js";

import {
  createPosterBrainSourceIngestionStateUpdateService,
  type PosterBrainSourceIngestionStateUpdateService,
} from "./source-ingestion-state-update.service.js";

import type {
  PosterBrainClassifiedFeedIngestionRunner,
} from "./source-feed-job-executor.service.js";

import type {
  PosterBrainFeedFetchImplementation,
} from "./feed-http-client.service.js";

import type {
  PosterBrainFeedXmlHttpFetcherOptions,
} from "./feed-xml-http-fetcher.service.js";

export interface PosterBrainSourceFeedSchedulerStackDependencies {
  readonly fetchImplementation: PosterBrainFeedFetchImplementation;
  readonly classifiedFeedIngestionRunner:
    PosterBrainClassifiedFeedIngestionRunner;
  readonly now: () => string;
  readonly feedFetcherOptions?: PosterBrainFeedXmlHttpFetcherOptions;
}

export interface PosterBrainSourceFeedSchedulerStack {
  readonly executionStack: PosterBrainSourceFeedExecutionStack;
  readonly sourceIngestionOutcomeService:
    PosterBrainSourceIngestionOutcomeService;
  readonly sourceFeedRunCoordinator:
    PosterBrainSourceFeedRunCoordinatorService;
  readonly sourceIngestionStateUpdateService:
    PosterBrainSourceIngestionStateUpdateService;
  readonly sourceFeedRunReportService:
    PosterBrainSourceFeedRunReportService;
  readonly sourceFeedSchedulerRunService:
    PosterBrainSourceFeedSchedulerRunService;
}

export function createPosterBrainSourceFeedSchedulerStack(
  dependencies: PosterBrainSourceFeedSchedulerStackDependencies
): PosterBrainSourceFeedSchedulerStack {
  const executionStack =
    dependencies.feedFetcherOptions === undefined
      ? createPosterBrainSourceFeedExecutionStack({
          fetchImplementation:
            dependencies.fetchImplementation,
          classifiedFeedIngestionRunner:
            dependencies.classifiedFeedIngestionRunner,
          now:
            dependencies.now,
        })
      : createPosterBrainSourceFeedExecutionStack({
          fetchImplementation:
            dependencies.fetchImplementation,
          classifiedFeedIngestionRunner:
            dependencies.classifiedFeedIngestionRunner,
          now:
            dependencies.now,
          feedFetcherOptions:
            dependencies.feedFetcherOptions,
        });

  const sourceIngestionOutcomeService =
    createPosterBrainSourceIngestionOutcomeService();

  const sourceFeedRunCoordinator =
    createPosterBrainSourceFeedRunCoordinatorService({
      sourceFeedBatchRunner:
        executionStack.sourceFeedBatchRunner,
      sourceIngestionOutcomeService,
    });

  const sourceIngestionStateUpdateService =
    createPosterBrainSourceIngestionStateUpdateService();

  const sourceFeedRunReportService =
    createPosterBrainSourceFeedRunReportService();

  const sourceFeedSchedulerRunService =
    createPosterBrainSourceFeedSchedulerRunService({
      sourceFeedRunCoordinator,
      sourceIngestionStateUpdateService,
      sourceFeedRunReportService,
    });

  return {
    executionStack,
    sourceIngestionOutcomeService,
    sourceFeedRunCoordinator,
    sourceIngestionStateUpdateService,
    sourceFeedRunReportService,
    sourceFeedSchedulerRunService,
  };
}