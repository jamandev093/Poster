export type PosterBrainIngestionSourceStatus =
  | "active"
  | "paused"
  | "disabled"
  | "blocked";

export type PosterBrainIngestionHealthStatus =
  | "healthy"
  | "degraded"
  | "failing";

export type PosterBrainIngestionDecisionReason =
  | "eligible"
  | "source_not_active"
  | "missing_feed_url"
  | "sync_not_due"
  | "backoff_active"
  | "failure_limit_reached";

export interface PosterBrainIngestionCandidateSource {
  readonly sourceKey: string;
  readonly sourceName: string;
  readonly feedUrl: string | null;
  readonly status: PosterBrainIngestionSourceStatus;
  readonly healthStatus: PosterBrainIngestionHealthStatus;
  readonly syncIntervalMinutes: number;
  readonly lastSuccessfulSyncAt: string | null;
  readonly lastAttemptedSyncAt: string | null;
  readonly nextAllowedSyncAt: string | null;
  readonly consecutiveFailureCount: number;
  readonly priorityScore: number;
}

export interface PosterBrainSourceIngestionPlannerPolicy {
  readonly now: string;
  readonly maxJobs: number;
  readonly defaultSyncIntervalMinutes: number;
  readonly baseBackoffMinutes: number;
  readonly maxBackoffMinutes: number;
  readonly failureLimit: number;
}

export interface PosterBrainSourceIngestionDecision {
  readonly sourceKey: string;
  readonly eligible: boolean;
  readonly reason: PosterBrainIngestionDecisionReason;
  readonly nextEligibleAt: string | null;
}

export interface PosterBrainFeedIngestionJob {
  readonly jobKey: string;
  readonly sourceKey: string;
  readonly sourceName: string;
  readonly feedUrl: string;
  readonly plannedAt: string;
  readonly priorityScore: number;
  readonly consecutiveFailureCount: number;
}

export interface PosterBrainSourceIngestionPlan {
  readonly plannedAt: string;
  readonly jobs: readonly PosterBrainFeedIngestionJob[];
  readonly decisions: readonly PosterBrainSourceIngestionDecision[];
}