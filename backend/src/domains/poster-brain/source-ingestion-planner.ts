import type {
  PosterBrainFeedIngestionJob,
  PosterBrainIngestionCandidateSource,
  PosterBrainSourceIngestionDecision,
  PosterBrainSourceIngestionPlan,
  PosterBrainSourceIngestionPlannerPolicy,
} from "./source-ingestion-planner.types.js";

function parseInstant(
  value: string
): number {
  const timestamp =
    Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new Error(
      `Poster Brain ingestion planner received invalid timestamp: ${value}.`
    );
  }

  return timestamp;
}

function toIso(
  timestamp: number
): string {
  return new Date(timestamp).toISOString();
}

function addMinutes(
  timestamp: number,
  minutes: number
): number {
  return timestamp + minutes * 60 * 1000;
}

function normalizePositiveInteger(input: {
  readonly value: number;
  readonly fallback: number;
}): number {
  if (
    Number.isFinite(input.value) &&
    input.value > 0
  ) {
    return Math.floor(input.value);
  }

  return input.fallback;
}

export function createPosterBrainRetryBackoffUntil(input: {
  readonly source: PosterBrainIngestionCandidateSource;
  readonly policy: PosterBrainSourceIngestionPlannerPolicy;
}): string | null {
  if (
    input.source.consecutiveFailureCount <= 0 ||
    !input.source.lastAttemptedSyncAt
  ) {
    return null;
  }

  const lastAttemptedAt =
    parseInstant(input.source.lastAttemptedSyncAt);

  const baseBackoffMinutes =
    normalizePositiveInteger({
      value:
        input.policy.baseBackoffMinutes,
      fallback:
        15,
    });

  const maxBackoffMinutes =
    normalizePositiveInteger({
      value:
        input.policy.maxBackoffMinutes,
      fallback:
        240,
    });

  const failureExponent =
    Math.max(
      0,
      input.source.consecutiveFailureCount - 1
    );

  const backoffMinutes =
    Math.min(
      maxBackoffMinutes,
      baseBackoffMinutes * 2 ** failureExponent
    );

  return toIso(
    addMinutes(lastAttemptedAt, backoffMinutes)
  );
}

function getNextDueAt(input: {
  readonly source: PosterBrainIngestionCandidateSource;
  readonly policy: PosterBrainSourceIngestionPlannerPolicy;
}): string {
  if (!input.source.lastSuccessfulSyncAt) {
    return input.policy.now;
  }

  const intervalMinutes =
    normalizePositiveInteger({
      value:
        input.source.syncIntervalMinutes,
      fallback:
        input.policy.defaultSyncIntervalMinutes,
    });

  return toIso(
    addMinutes(
      parseInstant(input.source.lastSuccessfulSyncAt),
      intervalMinutes
    )
  );
}

function chooseLaterInstant(
  left: string | null,
  right: string | null
): string | null {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return parseInstant(left) >= parseInstant(right)
    ? left
    : right;
}

export function evaluatePosterBrainSourceForIngestion(input: {
  readonly source: PosterBrainIngestionCandidateSource;
  readonly policy: PosterBrainSourceIngestionPlannerPolicy;
}): PosterBrainSourceIngestionDecision {
  const nowTimestamp =
    parseInstant(input.policy.now);

  if (input.source.status !== "active") {
    return {
      sourceKey:
        input.source.sourceKey,
      eligible:
        false,
      reason:
        "source_not_active",
      nextEligibleAt:
        null,
    };
  }

  if (!input.source.feedUrl?.trim()) {
    return {
      sourceKey:
        input.source.sourceKey,
      eligible:
        false,
      reason:
        "missing_feed_url",
      nextEligibleAt:
        null,
    };
  }

  if (
    input.source.consecutiveFailureCount >=
    input.policy.failureLimit
  ) {
    return {
      sourceKey:
        input.source.sourceKey,
      eligible:
        false,
      reason:
        "failure_limit_reached",
      nextEligibleAt:
        null,
    };
  }

  const configuredNextAllowedAt =
    input.source.nextAllowedSyncAt;

  const backoffUntil =
    createPosterBrainRetryBackoffUntil({
      source:
        input.source,
      policy:
        input.policy,
    });

  const nextBackoffGate =
    chooseLaterInstant(
      configuredNextAllowedAt,
      backoffUntil
    );

  if (
    nextBackoffGate &&
    parseInstant(nextBackoffGate) > nowTimestamp
  ) {
    return {
      sourceKey:
        input.source.sourceKey,
      eligible:
        false,
      reason:
        "backoff_active",
      nextEligibleAt:
        nextBackoffGate,
    };
  }

  const nextDueAt =
    getNextDueAt({
      source:
        input.source,
      policy:
        input.policy,
    });

  if (parseInstant(nextDueAt) > nowTimestamp) {
    return {
      sourceKey:
        input.source.sourceKey,
      eligible:
        false,
      reason:
        "sync_not_due",
      nextEligibleAt:
        nextDueAt,
    };
  }

  return {
    sourceKey:
      input.source.sourceKey,
    eligible:
      true,
    reason:
      "eligible",
    nextEligibleAt:
      input.policy.now,
  };
}

function createJob(input: {
  readonly source: PosterBrainIngestionCandidateSource;
  readonly plannedAt: string;
}): PosterBrainFeedIngestionJob {
  const feedUrl =
    input.source.feedUrl?.trim();

  if (!feedUrl) {
    throw new Error(
      "Cannot create Poster Brain feed ingestion job without feed URL."
    );
  }

  return {
    jobKey:
      `${input.source.sourceKey}:${input.plannedAt}`,
    sourceKey:
      input.source.sourceKey,
    sourceName:
      input.source.sourceName,
    feedUrl,
    plannedAt:
      input.plannedAt,
    priorityScore:
      input.source.priorityScore,
    consecutiveFailureCount:
      input.source.consecutiveFailureCount,
  };
}

function compareJobs(
  left: PosterBrainFeedIngestionJob,
  right: PosterBrainFeedIngestionJob
): number {
  if (right.priorityScore !== left.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }

  if (
    left.consecutiveFailureCount !==
    right.consecutiveFailureCount
  ) {
    return (
      left.consecutiveFailureCount -
      right.consecutiveFailureCount
    );
  }

  return left.sourceKey.localeCompare(right.sourceKey);
}

export function createPosterBrainSourceIngestionPlan(input: {
  readonly sources: readonly PosterBrainIngestionCandidateSource[];
  readonly policy: PosterBrainSourceIngestionPlannerPolicy;
}): PosterBrainSourceIngestionPlan {
  const maxJobs =
    Math.max(0, Math.floor(input.policy.maxJobs));

  const decisions: PosterBrainSourceIngestionDecision[] =
    [];

  const eligibleJobs: PosterBrainFeedIngestionJob[] =
    [];

  for (const source of input.sources) {
    const decision =
      evaluatePosterBrainSourceForIngestion({
        source,
        policy:
          input.policy,
      });

    decisions.push(decision);

    if (decision.eligible) {
      eligibleJobs.push(
        createJob({
          source,
          plannedAt:
            input.policy.now,
        })
      );
    }
  }

  return {
    plannedAt:
      input.policy.now,
    jobs:
      eligibleJobs
        .sort(compareJobs)
        .slice(0, maxJobs),
    decisions,
  };
}