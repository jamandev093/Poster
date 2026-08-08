import type {
  PosterBrainSourceFeedJobExecutorResult,
} from "./source-feed-job-executor.service.js";

export type PosterBrainSourceIngestionOutcomeHealth =
  | "healthy"
  | "degraded"
  | "failing";

export interface PosterBrainSourceIngestionOutcomePolicy {
  readonly successIntervalMinutes: number;
  readonly retryBaseMinutes: number;
  readonly retryMaxMinutes: number;
  readonly degradedFailureThreshold: number;
  readonly failingFailureThreshold: number;
}

export interface PosterBrainSourceIngestionPreviousState {
  readonly sourceKey: string;
  readonly failureCount: number;
}

export interface PosterBrainSourceIngestionOutcomeInput {
  readonly result: PosterBrainSourceFeedJobExecutorResult;
  readonly previousState?: PosterBrainSourceIngestionPreviousState;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
  readonly now: string;
}

export interface PosterBrainSourceIngestionOutcome {
  readonly sourceKey: string;
  readonly succeeded: boolean;
  readonly health: PosterBrainSourceIngestionOutcomeHealth;
  readonly failureCount: number;
  readonly nextEligibleAt: string;
  readonly lastSucceededAt: string | null;
  readonly lastFailedAt: string | null;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
}

export interface PosterBrainSourceIngestionOutcomeService {
  evaluateOutcome(
    input: PosterBrainSourceIngestionOutcomeInput
  ): PosterBrainSourceIngestionOutcome;

  evaluateBatchOutcomes(input: {
    readonly results: readonly PosterBrainSourceFeedJobExecutorResult[];
    readonly previousStates?: ReadonlyMap<string, PosterBrainSourceIngestionPreviousState>;
    readonly policy: PosterBrainSourceIngestionOutcomePolicy;
    readonly now: string;
  }): readonly PosterBrainSourceIngestionOutcome[];
}

function addMinutes(input: {
  readonly isoTimestamp: string;
  readonly minutes: number;
}): string {
  const timestamp =
    Date.parse(input.isoTimestamp);

  if (!Number.isFinite(timestamp)) {
    throw new Error("Poster Brain source outcome received an invalid timestamp.");
  }

  return new Date(
    timestamp + input.minutes * 60 * 1000
  ).toISOString();
}

function clampPolicyMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function createRetryDelayMinutes(input: {
  readonly failureCount: number;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
}): number {
  const base =
    clampPolicyMinutes(input.policy.retryBaseMinutes);
  const max =
    clampPolicyMinutes(input.policy.retryMaxMinutes);

  const multiplier =
    2 ** Math.max(0, input.failureCount - 1);

  return Math.min(
    max,
    base * multiplier
  );
}

function createHealth(input: {
  readonly succeeded: boolean;
  readonly failureCount: number;
  readonly policy: PosterBrainSourceIngestionOutcomePolicy;
}): PosterBrainSourceIngestionOutcomeHealth {
  if (input.succeeded) {
    return "healthy";
  }

  if (input.failureCount >= input.policy.failingFailureThreshold) {
    return "failing";
  }

  if (input.failureCount >= input.policy.degradedFailureThreshold) {
    return "degraded";
  }

  return "degraded";
}

export function evaluatePosterBrainSourceIngestionOutcome(
  input: PosterBrainSourceIngestionOutcomeInput
): PosterBrainSourceIngestionOutcome {
  const succeeded =
    input.result.status === "succeeded";

  const previousFailureCount =
    input.previousState?.failureCount ?? 0;

  const failureCount =
    succeeded
      ? 0
      : previousFailureCount + 1;

  const delayMinutes =
    succeeded
      ? clampPolicyMinutes(input.policy.successIntervalMinutes)
      : createRetryDelayMinutes({
          failureCount,
          policy:
            input.policy,
        });

  return {
    sourceKey:
      input.result.sourceKey,
    succeeded,
    health:
      createHealth({
        succeeded,
        failureCount,
        policy:
          input.policy,
      }),
    failureCount,
    nextEligibleAt:
      addMinutes({
        isoTimestamp:
          input.now,
        minutes:
          delayMinutes,
      }),
    lastSucceededAt:
      succeeded ? input.now : null,
    lastFailedAt:
      succeeded ? null : input.now,
    acceptedCount:
      input.result.acceptedCount,
    rejectedCount:
      input.result.rejectedCount,
    persistedCount:
      input.result.persistedCount,
    errorCode:
      input.result.errorCode,
    errorMessage:
      input.result.errorMessage,
  };
}

export function createPosterBrainSourceIngestionOutcomeService():
  PosterBrainSourceIngestionOutcomeService {
  return {
    evaluateOutcome(input) {
      return evaluatePosterBrainSourceIngestionOutcome(input);
    },

    evaluateBatchOutcomes(input) {
      return input.results.map(result => {
        const previousState =
          input.previousStates?.get(result.sourceKey);

        if (previousState === undefined) {
          return evaluatePosterBrainSourceIngestionOutcome({
            result,
            policy:
              input.policy,
            now:
              input.now,
          });
        }

        return evaluatePosterBrainSourceIngestionOutcome({
          result,
          previousState,
          policy:
            input.policy,
          now:
            input.now,
        });
      });
    },
  };
}