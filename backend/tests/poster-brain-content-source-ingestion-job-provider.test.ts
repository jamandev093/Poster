import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainContentSourceIngestionJobProvider,
  type PosterBrainContentSourceIngestionJobProviderQueryExecutor,
} from "../src/application/poster-brain/content-source-ingestion-job-provider.service.js";

const REQUESTED_AT =
  "2026-08-09T04:00:00.000Z";

describe(
  "Poster Brain content source ingestion job provider",
  () => {
    it(
      "maps active DB source rows into source feed batch jobs",
      async () => {
        const queries:
          {
            readonly text: string;
            readonly values?: readonly unknown[];
          }[] =
          [];

        const executor:
          PosterBrainContentSourceIngestionJobProviderQueryExecutor = {
          async query<Row = Record<string, unknown>>(
            text: string,
            values?: readonly unknown[]
          ) {
                        if (values === undefined) {
              queries.push({
                text,
              });
            } else {
              queries.push({
                text,
                values,
              });
            }

            const rows =
              [
                {
                  sourceKey:
                    "source-one",

                  displayName:
                    "Source One",

                  feedUrl:
                    "https://source-one.example/rss.xml",

                  status:
                    "active",

                  priority:
                    25,

                  lastFetchedAt:
                    null,

                  nextAllowedAt:
                    null,
                },
                {
                  sourceKey:
                    "source-two",

                  displayName:
                    "Source Two",

                  feedUrl:
                    "https://source-two.example/rss.xml",

                  status:
                    "active",

                  priority:
                    10,

                  lastFetchedAt:
                    "2026-08-08T04:00:00.000Z",

                  nextAllowedAt:
                    "2026-08-09T03:30:00.000Z",
                },
              ] as const;

            return {
              rows:
                rows as unknown as readonly Row[],
            };
          },
        };

        const provider =
          createPosterBrainContentSourceIngestionJobProvider({
            executor,
          });

        const jobs =
          await provider.listJobs({
            actorUserId:
              "00000000-0000-4000-8000-000000000001",

            sourceKeys: [
              "source-one",
              "source-two",
            ],

            maxSources:
              5,

            force:
              false,

            requestedAt:
              REQUESTED_AT,
          });

        expect(
          queries
        ).toHaveLength(
          1
        );

        expect(
          queries[0]?.values
        ).toEqual([
          [
            "source-one",
            "source-two",
          ],
          5,
          false,
          REQUESTED_AT,
        ]);

        expect(
          jobs
        ).toHaveLength(
          2
        );

        expect(
          jobs[0]?.discoveredAt
        ).toBe(
          REQUESTED_AT
        );

        expect(
          jobs.map(job => {
            const source =
              job.source as unknown as Record<string, unknown>;

            return {
              sourceKey:
                source.sourceKey,

              displayName:
                source.displayName,

              feedUrl:
                source.feedUrl,

              status:
                source.status,

              priority:
                source.priority,
            };
          })
        ).toEqual([
          {
            sourceKey:
              "source-one",

            displayName:
              "Source One",

            feedUrl:
              "https://source-one.example/rss.xml",

            status:
              "active",

            priority:
              25,
          },
          {
            sourceKey:
              "source-two",

            displayName:
              "Source Two",

            feedUrl:
              "https://source-two.example/rss.xml",

            status:
              "active",

            priority:
              10,
          },
        ]);
      }
    );

    it(
      "uses null source-key filter when request does not name sources",
      async () => {
        const queries:
          {
            readonly values?: readonly unknown[];
          }[] =
          [];

        const executor:
          PosterBrainContentSourceIngestionJobProviderQueryExecutor = {
          async query<Row = Record<string, unknown>>(
            _text: string,
            values?: readonly unknown[]
          ) {
                        if (values === undefined) {
              queries.push({});
            } else {
              queries.push({
                values,
              });
            }

            return {
              rows:
                [] as readonly Row[],
            };
          },
        };

        const provider =
          createPosterBrainContentSourceIngestionJobProvider({
            executor,
          });

        const jobs =
          await provider.listJobs({
            actorUserId:
              "00000000-0000-4000-8000-000000000001",

            maxSources:
              3,

            force:
              true,

            requestedAt:
              REQUESTED_AT,
          });

        expect(
          jobs
        ).toEqual([]);

        expect(
          queries[0]?.values
        ).toEqual([
          null,
          3,
          true,
          REQUESTED_AT,
        ]);
      }
    );

    it(
      "keeps source selection constrained to active sources",
      async () => {
        let queryText =
          "";

        const executor:
          PosterBrainContentSourceIngestionJobProviderQueryExecutor = {
          async query<Row = Record<string, unknown>>(
            text: string
          ) {
            queryText =
              text;

            return {
              rows:
                [] as readonly Row[],
            };
          },
        };

        const provider =
          createPosterBrainContentSourceIngestionJobProvider({
            executor,
          });

        await provider.listJobs({
          actorUserId:
            "00000000-0000-4000-8000-000000000001",

          maxSources:
            20,

          force:
            true,

          requestedAt:
            REQUESTED_AT,
        });

        expect(
          queryText
        ).toContain(
          "\"status\" = 'active'"
        );

        expect(
          queryText
        ).toContain(
          "LIMIT $2::integer"
        );
      }
    );
  }
);