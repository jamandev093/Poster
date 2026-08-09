import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainContentSourceIngestionRunExecutor,
  type PosterBrainContentSourceIngestionJobProvider,
} from "../src/application/poster-brain/content-source-ingestion-run-executor.service.js";

import type {
  PosterBrainSourceFeedBatchJob,
} from "../src/application/poster-brain/source-feed-batch-runner.service.js";

import type {
  PosterBrainSourceFeedSchedulerRunService,
} from "../src/application/poster-brain/source-feed-scheduler-run.service.js";

import type {
  PosterBrainSourceIngestionOutcomePolicy,
} from "../src/application/poster-brain/source-ingestion-outcome.service.js";

const REQUESTED_AT =
  "2026-08-09T03:30:00.000Z";

const FINISHED_AT =
  "2026-08-09T03:30:05.000Z";

const POLICY =
  {} as PosterBrainSourceIngestionOutcomePolicy;

const JOBS =
  [
    {
      discoveredAt:
        REQUESTED_AT,

      source: {
        sourceKey:
          "source-one",

        feedUrl:
          "https://publisher.example/rss.xml",

        displayName:
          "Publisher Example",

        status:
          "active",

        priority:
          50,
      },
    },
    {
      discoveredAt:
        REQUESTED_AT,

      source: {
        sourceKey:
          "source-two",

        feedUrl:
          "https://second.example/rss.xml",

        displayName:
          "Second Publisher",

        status:
          "active",

        priority:
          25,
      },
    },
  ] as unknown as readonly PosterBrainSourceFeedBatchJob[];

describe(
  "Poster Brain content source ingestion run executor",
  () => {
    it(
      "maps source ingestion requests into scheduler runs",
      async () => {
        const listJobs =
          vi
            .fn<
              PosterBrainContentSourceIngestionJobProvider["listJobs"]
            >()
            .mockResolvedValue(
              JOBS
            );

        const runScheduledSourceFeeds =
          vi
            .fn<
              PosterBrainSourceFeedSchedulerRunService["runScheduledSourceFeeds"]
            >()
            .mockResolvedValue({
              run: {
                totalJobs:
                  2,

                succeededJobs:
                  1,

                failedJobs:
                  1,

                persistedCount:
                  7,
              },
              stateUpdates: [],
              report: {},
            } as unknown as Awaited<
              ReturnType<
                PosterBrainSourceFeedSchedulerRunService["runScheduledSourceFeeds"]
              >
            >);

        const executor =
          createPosterBrainContentSourceIngestionRunExecutor({
            jobProvider: {
              listJobs,
            },

            schedulerRunService: {
              runScheduledSourceFeeds,
            },

            policy:
              POLICY,

            now:
              () =>
                FINISHED_AT,

            createRunId:
              () =>
                "manual-run-001",
          });

        const result =
          await executor.requestRun({
            actorUserId:
              "00000000-0000-4000-8000-000000000001",

            sourceKeys: [
              "source-one",
              "source-two",
            ],

            maxSources:
              10,

            force:
              true,

            requestedAt:
              REQUESTED_AT,
          });

        expect(
          listJobs
        ).toHaveBeenCalledWith({
          actorUserId:
            "00000000-0000-4000-8000-000000000001",

          sourceKeys: [
            "source-one",
            "source-two",
          ],

          maxSources:
            10,

          force:
            true,

          requestedAt:
            REQUESTED_AT,
        });

        expect(
          runScheduledSourceFeeds
        ).toHaveBeenCalledWith({
          jobs:
            JOBS,

          policy:
            POLICY,

          runStartedAt:
            REQUESTED_AT,

          runFinishedAt:
            FINISHED_AT,
        });

        expect(
          result
        ).toEqual({
          runId:
            "manual-run-001",

          status:
            "completed",

          requestedAt:
            REQUESTED_AT,

          summary: {
            plannedSources:
              2,

            attemptedSources:
              2,

            succeededSources:
              1,

            failedSources:
              1,

            persistedItems:
              7,
          },
        });
      }
    );

    it(
      "rejects requests when no eligible source jobs are available",
      async () => {
        const listJobs =
          vi
            .fn<
              PosterBrainContentSourceIngestionJobProvider["listJobs"]
            >()
            .mockResolvedValue([]);

        const runScheduledSourceFeeds =
          vi
            .fn<
              PosterBrainSourceFeedSchedulerRunService["runScheduledSourceFeeds"]
            >();

        const executor =
          createPosterBrainContentSourceIngestionRunExecutor({
            jobProvider: {
              listJobs,
            },

            schedulerRunService: {
              runScheduledSourceFeeds,
            },

            policy:
              POLICY,

            now:
              () =>
                FINISHED_AT,

            createRunId:
              () =>
                "manual-run-empty",
          });

        const result =
          await executor.requestRun({
            actorUserId:
              "00000000-0000-4000-8000-000000000001",

            maxSources:
              5,

            force:
              false,

            requestedAt:
              REQUESTED_AT,
          });

        expect(
          runScheduledSourceFeeds
        ).not.toHaveBeenCalled();

        expect(
          result
        ).toEqual({
          runId:
            "manual-run-empty",

          status:
            "rejected",

          requestedAt:
            REQUESTED_AT,

          summary: {
            plannedSources:
              0,

            attemptedSources:
              0,

            succeededSources:
              0,

            failedSources:
              0,

            persistedItems:
              0,
          },
        });
      }
    );
  }
);