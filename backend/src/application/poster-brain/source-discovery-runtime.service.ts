import type {
  PosterBrainSourceDiscoveryQualificationService,
} from "./source-discovery-qualification.service.js";

import type {
  PosterBrainSourceDiscoveryRuntimeClaim,
  PosterBrainSourceDiscoveryRuntimeRepository,
} from "./source-discovery-runtime.repository.js";

export const POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_MAX_ROOTS =
  2;

export const POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_SUCCESS_INTERVAL_MS =
  24 * 60 * 60 * 1000;

export const POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_FAILURE_BACKOFF_MS =
  60 * 60 * 1000;

export const POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_MAX_FAILURE_BACKOFF_MS =
  24 * 60 * 60 * 1000;

export const POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_LEASE_MS =
  30 * 60 * 1000;

export type PosterBrainSourceDiscoveryScheduledRunStatus =
  | "empty"
  | "completed"
  | "completed_with_failures"
  | "failed";

export interface PosterBrainSourceDiscoveryScheduledRootResult {
  readonly rootTopicId:
    string;

  readonly rootTopicSlug:
    string;

  readonly status:
    "succeeded" |
    "failed";

  readonly nextEligibleAt:
    string;

  readonly consecutiveFailures:
    number;

  readonly providerRequestCount:
    number;

  readonly discoveredItemCount:
    number;

  readonly uniqueCandidateCount:
    number;

  readonly qualifiedCandidateCount:
    number;

  readonly errorCode:
    string | null;
}

export interface PosterBrainSourceDiscoveryScheduledRunResult {
  readonly status:
    PosterBrainSourceDiscoveryScheduledRunStatus;

  readonly runStartedAt:
    string;

  readonly runFinishedAt:
    string;

  readonly claimedRootCount:
    number;

  readonly succeededRootCount:
    number;

  readonly failedRootCount:
    number;

  readonly roots:
    readonly PosterBrainSourceDiscoveryScheduledRootResult[];
}

export interface PosterBrainSourceDiscoveryRuntimeService {
  runDueSourceDiscovery(
    input?: {
      readonly maxRoots?:
        number;

      readonly maxDepth?:
        number;

      readonly maxTopics?:
        number;

      readonly pageSize?:
        number;

      readonly maxPagesPerQuery?:
        number;

      readonly successIntervalMs?:
        number;

      readonly failureBackoffMs?:
        number;

      readonly maxFailureBackoffMs?:
        number;

      readonly leaseMs?:
        number;
    }
  ):
    Promise<
      PosterBrainSourceDiscoveryScheduledRunResult
    >;
}

export interface PosterBrainSourceDiscoveryRuntimeDependencies {
  readonly repository:
    PosterBrainSourceDiscoveryRuntimeRepository;

  readonly qualificationService:
    PosterBrainSourceDiscoveryQualificationService;

  readonly now:
    () => string;
}

function boundedInteger(
  value:
    number | undefined,

  fallback:
    number,

  minimum:
    number,

  maximum:
    number,

  field:
    string
): number {
  const resolved =
    value ??
    fallback;

  if (
    !Number.isSafeInteger(resolved) ||
    resolved < minimum ||
    resolved > maximum
  ) {
    throw new Error(
      `${field} must be between ${minimum} and ${maximum}.`
    );
  }

  return resolved;
}

function normalizedInstant(
  value:
    string,

  field:
    string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `${field} must be a valid timestamp.`
    );
  }

  return date.toISOString();
}

function addMilliseconds(
  instant:
    string,

  milliseconds:
    number
): string {
  return new Date(
    new Date(instant).getTime() +
      milliseconds
  ).toISOString();
}

function calculateFailureBackoff(
  claim:
    PosterBrainSourceDiscoveryRuntimeClaim,

  base:
    number,

  maximum:
    number
): number {
  const exponent =
    Math.min(
      claim.consecutiveFailures,
      8
    );

  return Math.min(
    maximum,
    base *
      (2 ** exponent)
  );
}

function failureCode(
  error:
    unknown
): string {
  if (
    error instanceof Error &&
    /^[A-Za-z0-9_.-]{1,80}$/.test(
      error.name
    )
  ) {
    return error.name;
  }

  return "source_discovery_failed";
}

function createStatus(
  succeeded:
    number,

  failed:
    number
): PosterBrainSourceDiscoveryScheduledRunStatus {
  if (
    succeeded === 0 &&
    failed === 0
  ) {
    return "empty";
  }

  if (failed === 0) {
    return "completed";
  }

  if (succeeded === 0) {
    return "failed";
  }

  return "completed_with_failures";
}

export function createPosterBrainSourceDiscoveryRuntimeService(
  dependencies:
    PosterBrainSourceDiscoveryRuntimeDependencies
): PosterBrainSourceDiscoveryRuntimeService {
  return {
    async runDueSourceDiscovery(
      input = {}
    ) {
      const maxRoots =
        boundedInteger(
          input.maxRoots,
          POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_MAX_ROOTS,
          1,
          10,
          "maxRoots"
        );

      const maxDepth =
        boundedInteger(
          input.maxDepth,
          2,
          0,
          5,
          "maxDepth"
        );

      const maxTopics =
        boundedInteger(
          input.maxTopics,
          8,
          1,
          24,
          "maxTopics"
        );

      const pageSize =
        boundedInteger(
          input.pageSize,
          25,
          1,
          50,
          "pageSize"
        );

      const maxPagesPerQuery =
        boundedInteger(
          input.maxPagesPerQuery,
          1,
          1,
          2,
          "maxPagesPerQuery"
        );

      const successIntervalMs =
        boundedInteger(
          input.successIntervalMs,
          POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_SUCCESS_INTERVAL_MS,
          60 * 60 * 1000,
          7 * 24 * 60 * 60 * 1000,
          "successIntervalMs"
        );

      const failureBackoffMs =
        boundedInteger(
          input.failureBackoffMs,
          POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_FAILURE_BACKOFF_MS,
          5 * 60 * 1000,
          24 * 60 * 60 * 1000,
          "failureBackoffMs"
        );

      const maxFailureBackoffMs =
        boundedInteger(
          input.maxFailureBackoffMs,
          POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_MAX_FAILURE_BACKOFF_MS,
          failureBackoffMs,
          7 * 24 * 60 * 60 * 1000,
          "maxFailureBackoffMs"
        );

      const leaseMs =
        boundedInteger(
          input.leaseMs,
          POSTER_BRAIN_SOURCE_DISCOVERY_DEFAULT_LEASE_MS,
          5 * 60 * 1000,
          2 * 60 * 60 * 1000,
          "leaseMs"
        );

      const runStartedAt =
        normalizedInstant(
          dependencies.now(),
          "runStartedAt"
        );

      const claims =
        await dependencies
          .repository
          .claimDueRoots({
            now:
              runStartedAt,

            leaseUntil:
              addMilliseconds(
                runStartedAt,
                leaseMs
              ),

            limit:
              maxRoots,
          });

      const roots:
        PosterBrainSourceDiscoveryScheduledRootResult[] =
        [];

      let succeededRootCount =
        0;

      let failedRootCount =
        0;

      /*
       * Roots intentionally execute sequentially.
       * Each discovery orchestrator already executes its
       * configured providers concurrently, so additional
       * root-level concurrency would multiply API bursts.
       */
      for (
        const claim
        of claims
      ) {
        try {
          const result =
            await dependencies
              .qualificationService
              .run({
                parentTopicSlug:
                  claim.rootTopicSlug,

                maxDepth,
                maxTopics,
                pageSize,
                maxPagesPerQuery,
              });

          const finishedAt =
            normalizedInstant(
              dependencies.now(),
              "rootFinishedAt"
            );

          const nextEligibleAt =
            addMilliseconds(
              finishedAt,
              successIntervalMs
            );

          const summary = {
            providerRequestCount:
              result.discovery
                .providerRequestCount,

            discoveredItemCount:
              result.discovery
                .discoveredItemCount,

            uniqueCandidateCount:
              result.discovery
                .uniqueCandidateCount,

            qualifiedCandidateCount:
              result.qualifiedCandidateCount,
          };

          await dependencies
            .repository
            .markSucceeded({
              rootTopicId:
                claim.rootTopicId,

              finishedAt,
              nextEligibleAt,
              summary,
            });

          succeededRootCount +=
            1;

          roots.push({
            rootTopicId:
              claim.rootTopicId,

            rootTopicSlug:
              claim.rootTopicSlug,

            status:
              "succeeded",

            nextEligibleAt,

            consecutiveFailures:
              0,

            ...summary,

            errorCode:
              null,
          });
        }
        catch (error) {
          const finishedAt =
            normalizedInstant(
              dependencies.now(),
              "rootFailedAt"
            );

          const nextFailureCount =
            claim.consecutiveFailures +
            1;

          const nextEligibleAt =
            addMilliseconds(
              finishedAt,
              calculateFailureBackoff(
                claim,
                failureBackoffMs,
                maxFailureBackoffMs
              )
            );

          const errorCode =
            failureCode(error);

          await dependencies
            .repository
            .markFailed({
              rootTopicId:
                claim.rootTopicId,

              finishedAt,
              nextEligibleAt,

              consecutiveFailures:
                nextFailureCount,

              errorCode,

              /*
               * Do not persist arbitrary upstream error bodies,
               * URLs, credentials, or provider response content.
               */
              errorMessage:
                "Poster Brain source discovery root run failed.",
            });

          failedRootCount +=
            1;

          roots.push({
            rootTopicId:
              claim.rootTopicId,

            rootTopicSlug:
              claim.rootTopicSlug,

            status:
              "failed",

            nextEligibleAt,

            consecutiveFailures:
              nextFailureCount,

            providerRequestCount:
              0,

            discoveredItemCount:
              0,

            uniqueCandidateCount:
              0,

            qualifiedCandidateCount:
              0,

            errorCode,
          });
        }
      }

      const runFinishedAt =
        normalizedInstant(
          dependencies.now(),
          "runFinishedAt"
        );

      return {
        status:
          createStatus(
            succeededRootCount,
            failedRootCount
          ),

        runStartedAt,
        runFinishedAt,

        claimedRootCount:
          claims.length,

        succeededRootCount,
        failedRootCount,

        roots,
      };
    },
  };
}