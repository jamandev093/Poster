import type {
  PosterBrainSourceFeedRunCoordinatorResult,
} from "./source-feed-run-coordinator.service.js";

import type {
  PosterBrainSourceIngestionOutcome,
  PosterBrainSourceIngestionOutcomeHealth,
} from "./source-ingestion-outcome.service.js";

export type PosterBrainSourceFeedRunReportStatus =
  | "empty"
  | "completed"
  | "completed_with_failures"
  | "failed";

export interface PosterBrainSourceFeedRunReportFailure {
  readonly sourceKey: string;
  readonly health: PosterBrainSourceIngestionOutcomeHealth;
  readonly failureCount: number;
  readonly nextEligibleAt: string;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
}

export interface PosterBrainSourceFeedRunReport {
  readonly status: PosterBrainSourceFeedRunReportStatus;
  readonly runStartedAt: string;
  readonly runFinishedAt: string;
  readonly totalJobs: number;
  readonly succeededJobs: number;
  readonly failedJobs: number;
  readonly healthySources: number;
  readonly degradedSources: number;
  readonly failingSources: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
  readonly failures: readonly PosterBrainSourceFeedRunReportFailure[];
}

export interface PosterBrainSourceFeedRunReportInput {
  readonly run: PosterBrainSourceFeedRunCoordinatorResult;
  readonly runStartedAt: string;
  readonly runFinishedAt: string;
}

export interface PosterBrainSourceFeedRunReportService {
  createRunReport(
    input: PosterBrainSourceFeedRunReportInput
  ): PosterBrainSourceFeedRunReport;
}

function createReportStatus(
  run: PosterBrainSourceFeedRunCoordinatorResult
): PosterBrainSourceFeedRunReportStatus {
  if (run.totalJobs === 0) {
    return "empty";
  }

  if (run.failedJobs === 0) {
    return "completed";
  }

  if (run.succeededJobs === 0) {
    return "failed";
  }

  return "completed_with_failures";
}

function createFailure(
  outcome: PosterBrainSourceIngestionOutcome
): PosterBrainSourceFeedRunReportFailure {
  return {
    sourceKey:
      outcome.sourceKey,
    health:
      outcome.health,
    failureCount:
      outcome.failureCount,
    nextEligibleAt:
      outcome.nextEligibleAt,
    errorCode:
      outcome.errorCode,
    errorMessage:
      outcome.errorMessage,
  };
}

export function createPosterBrainSourceFeedRunReport(
  input: PosterBrainSourceFeedRunReportInput
): PosterBrainSourceFeedRunReport {
  return {
    status:
      createReportStatus(input.run),
    runStartedAt:
      input.runStartedAt,
    runFinishedAt:
      input.runFinishedAt,
    totalJobs:
      input.run.totalJobs,
    succeededJobs:
      input.run.succeededJobs,
    failedJobs:
      input.run.failedJobs,
    healthySources:
      input.run.healthySources,
    degradedSources:
      input.run.degradedSources,
    failingSources:
      input.run.failingSources,
    acceptedCount:
      input.run.acceptedCount,
    rejectedCount:
      input.run.rejectedCount,
    persistedCount:
      input.run.persistedCount,
    failures:
      input.run.outcomes
        .filter(outcome => !outcome.succeeded)
        .map(createFailure),
  };
}

export function createPosterBrainSourceFeedRunReportService():
  PosterBrainSourceFeedRunReportService {
  return {
    createRunReport(input) {
      return createPosterBrainSourceFeedRunReport(input);
    },
  };
}