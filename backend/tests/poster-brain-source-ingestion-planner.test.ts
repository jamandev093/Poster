import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceIngestionPlannerService,
} from "../src/application/poster-brain/index.js";

import {
  createPosterBrainRetryBackoffUntil,
  createPosterBrainSourceIngestionPlan,
  evaluatePosterBrainSourceForIngestion,
  type PosterBrainIngestionCandidateSource,
  type PosterBrainSourceIngestionPlannerPolicy,
} from "../src/domains/poster-brain/index.js";

const policy: PosterBrainSourceIngestionPlannerPolicy = {
  now: "2026-08-08T12:00:00.000Z",
  maxJobs: 2,
  defaultSyncIntervalMinutes: 30,
  baseBackoffMinutes: 10,
  maxBackoffMinutes: 120,
  failureLimit: 5,
};

function source(
  overrides: Partial<PosterBrainIngestionCandidateSource> = {}
): PosterBrainIngestionCandidateSource {
  return {
    sourceKey: "example-news",
    sourceName: "Example News",
    feedUrl: "https://example.com/rss.xml",
    status: "active",
    healthStatus: "healthy",
    syncIntervalMinutes: 30,
    lastSuccessfulSyncAt: null,
    lastAttemptedSyncAt: null,
    nextAllowedSyncAt: null,
    consecutiveFailureCount: 0,
    priorityScore: 0.9,
    ...overrides,
  };
}

describe("Poster Brain source ingestion planner", () => {
  it("marks active due RSS sources as eligible", () => {
    const decision =
      evaluatePosterBrainSourceForIngestion({
        source:
          source({
            lastSuccessfulSyncAt:
              "2026-08-08T11:00:00.000Z",
          }),
        policy,
      });

    expect(decision).toEqual({
      sourceKey: "example-news",
      eligible: true,
      reason: "eligible",
      nextEligibleAt: "2026-08-08T12:00:00.000Z",
    });
  });

  it("skips inactive and missing-feed sources", () => {
    expect(
      evaluatePosterBrainSourceForIngestion({
        source:
          source({
            status: "paused",
          }),
        policy,
      }).reason
    ).toBe("source_not_active");

    expect(
      evaluatePosterBrainSourceForIngestion({
        source:
          source({
            feedUrl: null,
          }),
        policy,
      }).reason
    ).toBe("missing_feed_url");
  });

  it("respects sync interval before planning another fetch", () => {
    const decision =
      evaluatePosterBrainSourceForIngestion({
        source:
          source({
            lastSuccessfulSyncAt:
              "2026-08-08T11:45:00.000Z",
          }),
        policy,
      });

    expect(decision).toEqual({
      sourceKey: "example-news",
      eligible: false,
      reason: "sync_not_due",
      nextEligibleAt: "2026-08-08T12:15:00.000Z",
    });
  });

  it("applies exponential retry backoff and failure limit", () => {
    const failingSource =
      source({
        lastAttemptedSyncAt:
          "2026-08-08T11:50:00.000Z",
        consecutiveFailureCount:
          2,
      });

    expect(
      createPosterBrainRetryBackoffUntil({
        source:
          failingSource,
        policy,
      })
    ).toBe("2026-08-08T12:10:00.000Z");

    expect(
      evaluatePosterBrainSourceForIngestion({
        source:
          failingSource,
        policy,
      })
    ).toMatchObject({
      eligible: false,
      reason: "backoff_active",
      nextEligibleAt: "2026-08-08T12:10:00.000Z",
    });

    expect(
      evaluatePosterBrainSourceForIngestion({
        source:
          source({
            consecutiveFailureCount:
              5,
          }),
        policy,
      }).reason
    ).toBe("failure_limit_reached");
  });

  it("plans eligible feed jobs by priority and max job cap", () => {
    const plan =
      createPosterBrainSourceIngestionPlan({
        policy,
        sources: [
          source({
            sourceKey: "low",
            sourceName: "Low",
            priorityScore: 0.2,
            lastSuccessfulSyncAt:
              "2026-08-08T10:00:00.000Z",
          }),
          source({
            sourceKey: "high",
            sourceName: "High",
            priorityScore: 0.95,
            lastSuccessfulSyncAt:
              "2026-08-08T10:00:00.000Z",
          }),
          source({
            sourceKey: "medium",
            sourceName: "Medium",
            priorityScore: 0.7,
            lastSuccessfulSyncAt:
              "2026-08-08T10:00:00.000Z",
          }),
        ],
      });

    expect(plan.jobs.map(job => job.sourceKey)).toEqual([
      "high",
      "medium",
    ]);
    expect(plan.decisions).toHaveLength(3);
  });

  it("exposes the planner through the application service", () => {
    const service =
      createPosterBrainSourceIngestionPlannerService();

    const plan =
      service.createPlan({
        policy,
        sources: [
          source({
            sourceKey:
              "service-source",
          }),
        ],
      });

    expect(plan.jobs).toHaveLength(1);
    expect(
      service.evaluateSource({
        source:
          source({
            sourceKey:
              "paused-source",
            status:
              "paused",
          }),
        policy,
      }).reason
    ).toBe("source_not_active");
  });
});