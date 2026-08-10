import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceDiscoveryRuntimeRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainSourceDiscoveryRuntimeQueryExecutor,
} from "../src/application/poster-brain/index.js";

class RecordingExecutor
  implements PosterBrainSourceDiscoveryRuntimeQueryExecutor
{
  readonly calls:
    Array<{
      readonly text:
        string;

      readonly values:
        readonly unknown[];
    }> =
    [];

  constructor(
    private readonly responses:
      readonly (
        readonly Record<string, unknown>[]
      )[] = []
  ) {}

  async query(
    text:
      string,

    values:
      readonly unknown[] = []
  ) {
    this.calls.push({
      text,
      values,
    });

    return {
      rows:
        this.responses[
          this.calls.length - 1
        ] ??
        [],
    };
  }
}

describe(
  "Poster Brain source discovery runtime repository",
  () => {

    it(
      "atomically claims due canonical root domains with SKIP LOCKED",
      async () => {
        const executor =
          new RecordingExecutor([
            [
              {
                root_topic_id:
                  "00000000-0000-4000-8000-000000000001",

                root_topic_slug:
                  "computer-science",

                root_topic_name:
                  "Computer Science",

                sort_order:
                  300,

                consecutive_failures:
                  0,
              },
            ],
          ]);

        const repository =
          createPosterBrainSourceDiscoveryRuntimeRepository(
            executor
          );

        const roots =
          await repository.claimDueRoots({
            now:
              "2026-08-10T15:00:00.000Z",

            leaseUntil:
              "2026-08-10T15:30:00.000Z",

            limit:
              2,
          });

        expect(
          roots
        ).toEqual([
          {
            rootTopicId:
              "00000000-0000-4000-8000-000000000001",

            rootTopicSlug:
              "computer-science",

            rootTopicName:
              "Computer Science",

            sortOrder:
              300,

            consecutiveFailures:
              0,
          },
        ]);

        const call =
          executor.calls[0]!;

        expect(
          call.text
        ).toContain(
          "topic.parent_topic_id IS NULL"
        );

        expect(
          call.text
        ).toContain(
          "FOR UPDATE OF state"
        );

        expect(
          call.text
        ).toContain(
          "SKIP LOCKED"
        );

        expect(
          call.text
        ).toContain(
          "LIMIT $2::integer"
        );

        expect(
          call.values
        ).toEqual([
          "2026-08-10T15:00:00.000Z",
          2,
          "2026-08-10T15:30:00.000Z",
        ]);
      }
    );

    it(
      "persists success and failure scheduling state",
      async () => {
        const executor =
          new RecordingExecutor([
            [
              {
                root_topic_id:
                  "root-1",
              },
            ],

            [
              {
                root_topic_id:
                  "root-2",
              },
            ],
          ]);

        const repository =
          createPosterBrainSourceDiscoveryRuntimeRepository(
            executor
          );

        await repository.markSucceeded({
          rootTopicId:
            "00000000-0000-4000-8000-000000000001",

          finishedAt:
            "2026-08-10T15:10:00.000Z",

          nextEligibleAt:
            "2026-08-11T15:10:00.000Z",

          summary: {
            providerRequestCount:
              12,

            discoveredItemCount:
              35,

            uniqueCandidateCount:
              8,

            qualifiedCandidateCount:
              2,
          },
        });

        await repository.markFailed({
          rootTopicId:
            "00000000-0000-4000-8000-000000000002",

          finishedAt:
            "2026-08-10T15:20:00.000Z",

          nextEligibleAt:
            "2026-08-10T16:20:00.000Z",

          consecutiveFailures:
            1,

          errorCode:
            "Error",

          errorMessage:
            "Poster Brain source discovery root run failed.",
        });

        expect(
          executor.calls[0]?.text
        ).toContain(
          "total_successes = total_successes + 1"
        );

        expect(
          executor.calls[1]?.text
        ).toContain(
          "total_failures = total_failures + 1"
        );

        expect(
          executor.calls[1]?.values[5]
        ).toBe(
          "Poster Brain source discovery root run failed."
        );
      }
    );
  }
);