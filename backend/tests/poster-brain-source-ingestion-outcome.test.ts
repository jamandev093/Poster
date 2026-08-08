import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceIngestionOutcomeService,
  evaluatePosterBrainSourceIngestionOutcome,
  type PosterBrainSourceFeedJobExecutorResult,
  type PosterBrainSourceIngestionOutcomePolicy,
} from "../src/application/poster-brain/index.js";

const policy: PosterBrainSourceIngestionOutcomePolicy = {
  successIntervalMinutes: 30,
  retryBaseMinutes: 5,
  retryMaxMinutes: 60,
  degradedFailureThreshold: 1,
  failingFailureThreshold: 3,
};

function result(input: {
  readonly sourceKey?: string;
  readonly status: "succeeded" | "failed";
  readonly acceptedCount?: number;
  readonly rejectedCount?: number;
  readonly persistedCount?: number;
  readonly errorCode?: string | null;
  readonly errorMessage?: string | null;
}): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey:
      input.sourceKey ?? "example-news",
    status:
      input.status,
    failureStage:
      input.status === "failed" ? "fetch" : null,
    acceptedCount:
      input.acceptedCount ?? 0,
    rejectedCount:
      input.rejectedCount ?? 0,
    persistedCount:
      input.persistedCount ?? 0,
    errorCode:
      input.errorCode ?? null,
    errorMessage:
      input.errorMessage ?? null,
    fetchedAt:
      "2026-08-08T12:00:00.000Z",
    persistencePlan:
      null,
  };
}

describe("Poster Brain source ingestion outcome policy", () => {
  it("resets failure count and schedules normal interval after success", () => {
    const outcome =
      evaluatePosterBrainSourceIngestionOutcome({
        result:
          result({
            status: "succeeded",
            acceptedCount: 4,
            rejectedCount: 1,
            persistedCount: 4,
          }),
        previousState: {
          sourceKey: "example-news",
          failureCount: 2,
        },
        policy,
        now: "2026-08-08T12:00:00.000Z",
      });

    expect(outcome).toMatchObject({
      sourceKey: "example-news",
      succeeded: true,
      health: "healthy",
      failureCount: 0,
      nextEligibleAt: "2026-08-08T12:30:00.000Z",
      lastSucceededAt: "2026-08-08T12:00:00.000Z",
      lastFailedAt: null,
      acceptedCount: 4,
      rejectedCount: 1,
      persistedCount: 4,
    });
  });

  it("applies retry backoff after first failure", () => {
    const outcome =
      evaluatePosterBrainSourceIngestionOutcome({
        result:
          result({
            status: "failed",
            errorCode: "http_500",
            errorMessage: "Server failed.",
          }),
        previousState: {
          sourceKey: "example-news",
          failureCount: 0,
        },
        policy,
        now: "2026-08-08T12:00:00.000Z",
      });

    expect(outcome).toMatchObject({
      succeeded: false,
      health: "degraded",
      failureCount: 1,
      nextEligibleAt: "2026-08-08T12:05:00.000Z",
      lastSucceededAt: null,
      lastFailedAt: "2026-08-08T12:00:00.000Z",
      errorCode: "http_500",
      errorMessage: "Server failed.",
    });
  });

  it("uses exponential retry delay and failing health after threshold", () => {
    const outcome =
      evaluatePosterBrainSourceIngestionOutcome({
        result:
          result({
            status: "failed",
            errorCode: "timeout",
          }),
        previousState: {
          sourceKey: "example-news",
          failureCount: 2,
        },
        policy,
        now: "2026-08-08T12:00:00.000Z",
      });

    expect(outcome.failureCount).toBe(3);
    expect(outcome.health).toBe("failing");
    expect(outcome.nextEligibleAt).toBe("2026-08-08T12:20:00.000Z");
  });

  it("caps retry delay at policy maximum", () => {
    const outcome =
      evaluatePosterBrainSourceIngestionOutcome({
        result:
          result({
            status: "failed",
          }),
        previousState: {
          sourceKey: "example-news",
          failureCount: 10,
        },
        policy,
        now: "2026-08-08T12:00:00.000Z",
      });

    expect(outcome.failureCount).toBe(11);
    expect(outcome.nextEligibleAt).toBe("2026-08-08T13:00:00.000Z");
  });

  it("evaluates batch outcomes with previous source states", () => {
    const service =
      createPosterBrainSourceIngestionOutcomeService();

    const outcomes =
      service.evaluateBatchOutcomes({
        results: [
          result({
            sourceKey: "first-news",
            status: "succeeded",
            persistedCount: 2,
          }),
          result({
            sourceKey: "second-news",
            status: "failed",
            errorCode: "http_404",
          }),
        ],
        previousStates:
          new Map([
            [
              "second-news",
              {
                sourceKey: "second-news",
                failureCount: 2,
              },
            ],
          ]),
        policy,
        now: "2026-08-08T12:00:00.000Z",
      });

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]).toMatchObject({
      sourceKey: "first-news",
      health: "healthy",
      failureCount: 0,
    });
    expect(outcomes[1]).toMatchObject({
      sourceKey: "second-news",
      health: "failing",
      failureCount: 3,
      errorCode: "http_404",
    });
  });
});