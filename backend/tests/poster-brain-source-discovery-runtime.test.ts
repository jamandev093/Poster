import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceDiscoveryRuntimeService,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainSourceDiscoveryQualificationService,
  PosterBrainSourceDiscoveryRuntimeRepository,
} from "../src/application/poster-brain/index.js";

describe(
  "Poster Brain automatic source discovery runtime",
  () => {

    it(
      "runs due canonical roots sequentially and isolates root failures",
      async () => {
        const succeeded:
          unknown[] =
          [];

        const failed:
          unknown[] =
          [];

        const repository = {
          async claimDueRoots() {
            return [
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

              {
                rootTopicId:
                  "00000000-0000-4000-8000-000000000002",

                rootTopicSlug:
                  "physics",

                rootTopicName:
                  "Physics",

                sortOrder:
                  200,

                consecutiveFailures:
                  0,
              },
            ];
          },

          async markSucceeded(
            input
          ) {
            succeeded.push(
              input
            );
          },

          async markFailed(
            input
          ) {
            failed.push(
              input
            );
          },
        } satisfies PosterBrainSourceDiscoveryRuntimeRepository;

        const order:
          string[] =
          [];

        const qualificationService = {
          async run(
            input
          ) {
            order.push(
              input.parentTopicSlug
            );

            if (
              input.parentTopicSlug ===
              "physics"
            ) {
              throw new Error(
                "upstream private provider detail must not persist"
              );
            }

            expect(
              input
            ).toMatchObject({
              maxDepth:
                2,

              maxTopics:
                8,

              pageSize:
                25,

              maxPagesPerQuery:
                1,
            });

            return {
              discovery: {
                providerRequestCount:
                  16,

                discoveredItemCount:
                  40,

                uniqueCandidateCount:
                  9,
              },

              qualifiedCandidateCount:
                3,
            } as never;
          },
        } satisfies PosterBrainSourceDiscoveryQualificationService;

        const runtime =
          createPosterBrainSourceDiscoveryRuntimeService({
            repository,
            qualificationService,

            now:
              () =>
                "2026-08-10T15:00:00.000Z",
          });

        const result =
          await runtime.runDueSourceDiscovery();

        expect(
          order
        ).toEqual([
          "computer-science",
          "physics",
        ]);

        expect(
          result.status
        ).toBe(
          "completed_with_failures"
        );

        expect(
          result.claimedRootCount
        ).toBe(
          2
        );

        expect(
          result.succeededRootCount
        ).toBe(
          1
        );

        expect(
          result.failedRootCount
        ).toBe(
          1
        );

        expect(
          succeeded
        ).toEqual([
          expect.objectContaining({
            rootTopicId:
              "00000000-0000-4000-8000-000000000001",

            nextEligibleAt:
              "2026-08-11T15:00:00.000Z",

            summary: {
              providerRequestCount:
                16,

              discoveredItemCount:
                40,

              uniqueCandidateCount:
                9,

              qualifiedCandidateCount:
                3,
            },
          }),
        ]);

        expect(
          failed
        ).toEqual([
          expect.objectContaining({
            rootTopicId:
              "00000000-0000-4000-8000-000000000002",

            nextEligibleAt:
              "2026-08-10T16:00:00.000Z",

            consecutiveFailures:
              1,

            errorMessage:
              "Poster Brain source discovery root run failed.",
          }),
        ]);

        expect(
          JSON.stringify(
            failed
          )
        ).not.toContain(
          "upstream private provider detail"
        );
      }
    );

    it(
      "uses exponential bounded retry backoff",
      async () => {
        const failures:
          Array<{
            readonly nextEligibleAt:
              string;

            readonly consecutiveFailures:
              number;
          }> =
          [];

        const repository = {
          async claimDueRoots() {
            return [
              {
                rootTopicId:
                  "00000000-0000-4000-8000-000000000010",

                rootTopicSlug:
                  "biology",

                rootTopicName:
                  "Biology",

                sortOrder:
                  600,

                consecutiveFailures:
                  2,
              },
            ];
          },

          async markSucceeded() {
            throw new Error(
              "must not succeed"
            );
          },

          async markFailed(
            input
          ) {
            failures.push({
              nextEligibleAt:
                input.nextEligibleAt,

              consecutiveFailures:
                input.consecutiveFailures,
            });
          },
        } satisfies PosterBrainSourceDiscoveryRuntimeRepository;

        const runtime =
          createPosterBrainSourceDiscoveryRuntimeService({
            repository,

            qualificationService: {
              async run() {
                throw new Error(
                  "provider unavailable"
                );
              },
            },

            now:
              () =>
                "2026-08-10T15:00:00.000Z",
          });

        await runtime.runDueSourceDiscovery();

        /*
         * Existing failures=2:
         * base 1h * 2^2 = 4h.
         */
        expect(
          failures
        ).toEqual([
          {
            nextEligibleAt:
              "2026-08-10T19:00:00.000Z",

            consecutiveFailures:
              3,
          },
        ]);
      }
    );

    it(
      "returns empty when no canonical root is currently due",
      async () => {
        const repository = {
          async claimDueRoots() {
            return [];
          },

          async markSucceeded() {
            throw new Error(
              "unexpected success"
            );
          },

          async markFailed() {
            throw new Error(
              "unexpected failure"
            );
          },
        } satisfies PosterBrainSourceDiscoveryRuntimeRepository;

        const runtime =
          createPosterBrainSourceDiscoveryRuntimeService({
            repository,

            qualificationService: {
              async run() {
                throw new Error(
                  "must not run"
                );
              },
            },

            now:
              () =>
                "2026-08-10T15:00:00.000Z",
          });

        const result =
          await runtime.runDueSourceDiscovery();

        expect(
          result
        ).toMatchObject({
          status:
            "empty",

          claimedRootCount:
            0,

          succeededRootCount:
            0,

          failedRootCount:
            0,

          roots:
            [],
        });
      }
    );
  }
);