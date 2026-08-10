import {
  createServer,
  type Server,
} from "node:http";

import type {
  AddressInfo,
} from "node:net";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceFeedSchedulerStack,
  type PosterBrainClassifiedFeedIngestionResult,
  type PosterBrainClassifiedFeedIngestionRunner,
  type PosterBrainSourceIngestionOutcomePolicy,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const servers:
  Server[] =
  [];

const policy:
  PosterBrainSourceIngestionOutcomePolicy = {
    successIntervalMinutes:
      30,

    retryBaseMinutes:
      5,

    retryMaxMinutes:
      60,

    degradedFailureThreshold:
      1,

    failingFailureThreshold:
      3,
  };

async function listen(
  server:
    Server
): Promise<number> {
  servers.push(
    server
  );

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      server.once(
        "error",
        reject
      );

      server.listen(
        0,
        "127.0.0.1",
        () => {
          server.off(
            "error",
            reject
          );

          resolve();
        }
      );
    }
  );

  const address =
    server.address();

  if (
    address === null ||
    typeof address === "string"
  ) {
    throw new Error(
      "Scheduler runtime proof server address is unavailable."
    );
  }

  return (
    address as AddressInfo
  ).port;
}

async function closeServer(
  server:
    Server
): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      server.close(
        error => {
          if (error) {
            reject(
              error
            );

            return;
          }

          resolve();
        }
      );
    }
  );
}

class RecordingClassifiedRunner
  implements PosterBrainClassifiedFeedIngestionRunner
{
  readonly calls:
    Array<{
      readonly source:
        PosterBrainRssSource;

      readonly feedXml:
        string;

      readonly discoveredAt:
        string;
    }> =
    [];

  async ingestClassifiedFeed(
    input: {
      readonly source:
        PosterBrainRssSource;

      readonly feedXml:
        string;

      readonly discoveredAt:
        string;
    }
  ): Promise<
    PosterBrainClassifiedFeedIngestionResult
  > {
    this.calls.push(
      input
    );

    return {
      acceptedCount:
        2,

      rejectedCount:
        0,

      persistedCount:
        2,

      persistencePlan:
        null,
    };
  }
}

afterEach(
  async () => {
    const active =
      servers.splice(
        0,
        servers.length
      );

    await Promise.all(
      active.map(
        closeServer
      )
    );
  }
);

describe(
  "Poster Brain scheduler real runtime proof",
  () => {

    it(
      "executes a scheduled source feed through real Node TCP fetch",
      async () => {

        const requestPaths:
          string[] =
          [];

        const userAgents:
          Array<
            string |
            undefined
          > =
          [];

        const rss =
          "<rss><channel><title>Runtime Proof</title></channel></rss>";

        const server =
          createServer(
            (
              request,
              response
            ) => {

              requestPaths.push(
                request.url ??
                ""
              );

              userAgents.push(
                request.headers[
                  "user-agent"
                ]
              );

              response.statusCode =
                200;

              response.setHeader(
                "content-type",
                "application/rss+xml; charset=utf-8"
              );

              response.end(
                rss
              );
            }
          );

        const port =
          await listen(
            server
          );

        const source:
          PosterBrainRssSource = {
            sourceKey:
              "runtime-proof",

            sourceName:
              "Runtime Proof",

            homepageUrl:
              `http://127.0.0.1:${port}`,

            feedUrl:
              `http://127.0.0.1:${port}/feed.xml`,

            publisherName:
              "Runtime Proof",

            defaultLanguage:
              "en",

            defaultRegion:
              "IN",

            acquisitionMethod:
              "authorized_rss",
          };

        const runner =
          new RecordingClassifiedRunner();

        const stack =
          createPosterBrainSourceFeedSchedulerStack({
            fetchImplementation:
              globalThis.fetch.bind(
                globalThis
              ),

            classifiedFeedIngestionRunner:
              runner,

            now:
              () =>
                "2026-08-10T09:10:00.000Z",

            feedFetcherOptions: {
              timeoutMs:
                3000,

              userAgent:
                "Poster-Scheduler-Runtime-Proof/1.0",
            },
          });

        const result =
          await stack
            .sourceFeedSchedulerRunService
            .runScheduledSourceFeeds({
              jobs: [
                {
                  source,

                  discoveredAt:
                    "2026-08-10T09:05:00.000Z",
                },
              ],

              policy,

              runStartedAt:
                "2026-08-10T09:00:00.000Z",

              runFinishedAt:
                "2026-08-10T09:10:00.000Z",
            });

        expect(
          requestPaths
        ).toEqual([
          "/feed.xml",
        ]);

        expect(
          userAgents
        ).toEqual([
          "Poster-Scheduler-Runtime-Proof/1.0",
        ]);

        expect(
          runner.calls
        ).toHaveLength(
          1
        );

        expect(
          runner.calls[0]
        ).toMatchObject({
          source,

          feedXml:
            rss,

          discoveredAt:
            "2026-08-10T09:05:00.000Z",
        });

        expect(
          result.report
        ).toMatchObject({
          status:
            "completed",

          totalJobs:
            1,

          succeededJobs:
            1,

          failedJobs:
            0,

          acceptedCount:
            2,

          persistedCount:
            2,
        });

        expect(
          result.stateUpdates
        ).toHaveLength(
          1
        );

        expect(
          result.stateUpdates[0]
        ).toMatchObject({
          sourceKey:
            "runtime-proof",

          health:
            "healthy",

          failureCount:
            0,

          updatedAt:
            "2026-08-10T09:10:00.000Z",
        });
      }
    );
  }
);