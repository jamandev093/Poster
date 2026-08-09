import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainAiLearningDatasetHandoffService,
} from "../src/application/poster-brain/ai-learning-dataset-handoff.service.js";

import type {
  PosterBrainAiLearningDatasetHandoffFetchRequest,
} from "../src/application/poster-brain/ai-learning-dataset-handoff.service.js";

import type {
  PosterBrainAiLearningDatasetReadySnapshot,
  PosterBrainAiLearningDatasetSnapshotReadPage,
  PosterBrainAiLearningDatasetSnapshotReadRepository,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.js";

import type {
  PosterBrainAiLearningDatasetEvent,
} from "../src/application/poster-brain/ai-learning-dataset.types.js";

const DATASET_ID =
  "11111111-1111-4111-8111-111111111111";

const SOURCE_CUTOFF =
  "2026-08-09T16:00:00.000Z";

const EVENT_COUNT =
  10000;

const CONTENT_COUNT =
  20;

function createSnapshot(
  overrides:
    Partial<
      PosterBrainAiLearningDatasetReadySnapshot
    > = {}
): PosterBrainAiLearningDatasetReadySnapshot {
  return {
    id:
      DATASET_ID,

    schemaVersion:
      1,

    status:
      "ready",

    sourceEventCount:
      EVENT_COUNT,

    materializedEventCount:
      EVENT_COUNT,

    materializedContentCount:
      CONTENT_COUNT,

    sourceCutoffAt:
      SOURCE_CUTOFF,

    firstEventAt:
      "2026-08-09T13:13:20.000Z",

    lastEventAt:
      "2026-08-09T15:59:59.000Z",

    datasetChecksum:
      "sha256:" +
      "a".repeat(
        64
      ),

    createdAt:
      SOURCE_CUTOFF,

    completedAt:
      "2026-08-09T16:01:00.000Z",

    ...overrides,
  };
}

function createEvent(
  index:
    number
): PosterBrainAiLearningDatasetEvent {
  const occurredAt =
    new Date(
      Date.parse(
        SOURCE_CUTOFF
      ) -
      (
        index +
        1
      ) *
      1000
    ).toISOString();

  return {
    schemaVersion:
      1,

    eventKey:
      `organic_content_event:event-${String(index).padStart(5, "0")}`,

    source:
      "organic_content_event",

    sourceEventId:
      `event-${String(index).padStart(5, "0")}`,

    signalType:
      "impression",

    occurredAt,

    surface:
      "home",

    reasonId:
      null,

    reportStatus:
      null,

    bookmarkActive:
      null,

    content: {
      contentId:
        `content-${index % CONTENT_COUNT}`,

      sourceKey:
        "example-feed",

      publisherName:
        "Example Publisher",

      title:
        `Example title ${index}`,

      excerpt:
        "Example excerpt",

      mediaType:
        "article",

      languageCode:
        "en",

      regionCode:
        "IN",

      category:
        "technology",

      canonicalTopicIds:
        [
          "ai",
        ],

      evolvingTopicIds:
        [
          "agents",
        ],

      tags:
        [
          "AI",
        ],

      searchKeywords:
        [
          "artificial intelligence",
        ],

      aiClassification: {
        category:
          "technology",

        confidence:
          0.91,
      },

      qualityScore:
        0.8,

      publishedAt:
        "2026-08-09T10:00:00.000Z",

      contentStatus:
        "active",
    },
  };
}

function createEvents(): readonly PosterBrainAiLearningDatasetEvent[] {
  return Array.from(
    {
      length:
        EVENT_COUNT,
    },
    (
      _,
      index
    ) =>
      createEvent(
        index
      )
  );
}

function createRepository(input?: {
  readonly snapshot?:
    PosterBrainAiLearningDatasetReadySnapshot |
    null;

  readonly pages?:
    readonly PosterBrainAiLearningDatasetSnapshotReadPage[];
}) {
  const snapshot =
    input?.snapshot ===
      undefined
      ? createSnapshot()
      : input.snapshot;

  const pages =
    input?.pages ??
    [];

  let pageIndex =
    0;

  const getReadySnapshot =
    vi.fn(
      async () =>
        snapshot
    );

  const listReadySnapshotPage =
    vi.fn(
      async () => {
        const page =
          pages[
            pageIndex
          ];

        pageIndex +=
          1;

        if (
          page ===
          undefined
        ) {
          throw new Error(
            "Unexpected frozen dataset page request."
          );
        }

        return page;
      }
    );

  const repository:
    PosterBrainAiLearningDatasetSnapshotReadRepository =
    {
      getReadySnapshot,

      listReadySnapshotPage,
    };

  return {
    repository,
    getReadySnapshot,
    listReadySnapshotPage,
  };
}

async function readStream(
  body:
    ReadableStream<
      Uint8Array
    >
): Promise<string> {
  const reader =
    body.getReader();

  const decoder =
    new TextDecoder();

  let result =
    "";

  while (true) {
    const next =
      await reader.read();

    if (next.done) {
      break;
    }

    result +=
      decoder.decode(
        next.value,
        {
          stream:
            true,
        }
      );
  }

  result +=
    decoder.decode();

  return result;
}

function createValidatedResponse() {
  return {
    status:
      "validated",

    accepted:
      true,

    datasetId:
      DATASET_ID,

    schemaVersion:
      1,

    datasetChecksum:
      "sha256:" +
      "a".repeat(
        64
      ),

    pageCount:
      2,

    eventCount:
      EVENT_COUNT,

    contentCount:
      CONTENT_COUNT,

    sourceCutoffAt:
      SOURCE_CUTOFF,

    trainingStarted:
      false,
  };
}

describe(
  "Poster Brain learning dataset Backend to Python handoff",
  () => {

    it(
      "streams a ready frozen 10000-event snapshot as bounded NDJSON with duplex half",
      async () => {

        const events =
          createEvents();

        const firstPage =
          events.slice(
            0,
            5000
          );

        const secondPage =
          events.slice(
            5000
          );

        const firstCursor =
          firstPage[
            firstPage.length -
            1
          ]!.occurredAt +
          "|" +
          firstPage[
            firstPage.length -
            1
          ]!.eventKey;

        const {
          repository,
          listReadySnapshotPage,
        } =
          createRepository({
            pages: [
              {
                events:
                  firstPage,

                nextCursor:
                  firstCursor,
              },

              {
                events:
                  secondPage,

                nextCursor:
                  null,
              },
            ],
          });

        let observedRequest:
          PosterBrainAiLearningDatasetHandoffFetchRequest |
          null =
            null;

        let observedBody =
          "";

        const fetchImplementation =
          vi.fn(
            async (
              _url:
                string,

              request:
                PosterBrainAiLearningDatasetHandoffFetchRequest
            ) => {
              observedRequest =
                request;

              observedBody =
                await readStream(
                  request.body
                );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return createValidatedResponse();
                },
              };
            }
          );

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        const result =
          await service.handoffReadySnapshot(
            DATASET_ID
          );

        expect(
          result
        ).toEqual(
          createValidatedResponse()
        );

        expect(
          fetchImplementation
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          observedRequest
        ).not.toBeNull();

        expect(
          observedRequest!.method
        ).toBe(
          "POST"
        );

        expect(
          observedRequest!.duplex
        ).toBe(
          "half"
        );

        expect(
          observedRequest!.headers[
            "content-type"
          ]
        ).toBe(
          "application/x-ndjson"
        );

        expect(
          observedRequest!.signal.aborted
        ).toBe(
          false
        );

        const lines =
          observedBody
            .trimEnd()
            .split(
              "\n"
            )
            .map(
              (
                line
              ) =>
                JSON.parse(
                  line
                ) as Record<
                  string,
                  unknown
                >
            );

        expect(
          lines
        ).toHaveLength(
          3
        );

        expect(
          lines[0]?.kind
        ).toBe(
          "manifest"
        );

        const manifestLine =
          lines[0] as {
            handoff: {
              manifest: {
                datasetId:
                  string;

                materializedEventCount:
                  number;

                materializedContentCount:
                  number;

                datasetChecksum:
                  string;
              };
            };
          };

        expect(
          manifestLine.handoff
            .manifest
            .datasetId
        ).toBe(
          DATASET_ID
        );

        expect(
          manifestLine.handoff
            .manifest
            .materializedEventCount
        ).toBe(
          EVENT_COUNT
        );

        expect(
          manifestLine.handoff
            .manifest
            .materializedContentCount
        ).toBe(
          CONTENT_COUNT
        );

        const firstLine =
          lines[1] as {
            page: {
              pageNumber:
                number;

              events:
                readonly unknown[];

              isFinalPage:
                boolean;
            };
          };

        const secondLine =
          lines[2] as {
            page: {
              pageNumber:
                number;

              events:
                readonly unknown[];

              isFinalPage:
                boolean;
            };
          };

        expect(
          firstLine.page
            .pageNumber
        ).toBe(
          1
        );

        expect(
          firstLine.page
            .events
        ).toHaveLength(
          5000
        );

        expect(
          firstLine.page
            .isFinalPage
        ).toBe(
          false
        );

        expect(
          secondLine.page
            .pageNumber
        ).toBe(
          2
        );

        expect(
          secondLine.page
            .events
        ).toHaveLength(
          5000
        );

        expect(
          secondLine.page
            .isFinalPage
        ).toBe(
          true
        );

        expect(
          listReadySnapshotPage
        ).toHaveBeenNthCalledWith(
          1,
          {
            datasetId:
              DATASET_ID,

            limit:
              5000,

            cursor:
              null,
          }
        );

        expect(
          listReadySnapshotPage
        ).toHaveBeenNthCalledWith(
          2,
          {
            datasetId:
              DATASET_ID,

            limit:
              5000,

            cursor:
              firstCursor,
          }
        );
      }
    );

    it(
      "rejects a dataset that is not ready before starting HTTP transport",
      async () => {

        const {
          repository,
        } =
          createRepository({
            snapshot:
              null,
          });

        const fetchImplementation =
          vi.fn();

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        await expect(
          service.handoffReadySnapshot(
            DATASET_ID
          )
        ).rejects.toMatchObject({
          name:
            "PosterBrainAiLearningDatasetHandoffError",

          code:
            "snapshot_not_ready",
        });

        expect(
          fetchImplementation
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a frozen stream whose event count does not match its ready manifest",
      async () => {

        const events =
          createEvents().slice(
            0,
            EVENT_COUNT -
            1
          );

        const {
          repository,
        } =
          createRepository({
            pages: [
              {
                events,

                nextCursor:
                  null,
              },
            ],
          });

        const fetchImplementation =
          vi.fn(
            async (
              _url:
                string,

              request:
                PosterBrainAiLearningDatasetHandoffFetchRequest
            ) => {
              await readStream(
                request.body
              );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return createValidatedResponse();
                },
              };
            }
          );

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              120000,

            pageSize:
              5000,

            fetchImplementation,
          });

        await expect(
          service.handoffReadySnapshot(
            DATASET_ID
          )
        ).rejects.toMatchObject({
          name:
            "PosterBrainAiLearningDatasetHandoffError",

          code:
            "snapshot_invalid",
        });

        expect(
          fetchImplementation
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "accepts semantically identical Python UTC sourceCutoffAt formatting",
      async () => {

        const events =
          createEvents();

        const firstPage =
          events.slice(
            0,
            5000
          );

        const secondPage =
          events.slice(
            5000
          );

        const firstCursor =
          firstPage[
            firstPage.length -
            1
          ]!.occurredAt +
          "|" +
          firstPage[
            firstPage.length -
            1
          ]!.eventKey;

        const {
          repository,
        } =
          createRepository({
            pages: [
              {
                events:
                  firstPage,

                nextCursor:
                  firstCursor,
              },

              {
                events:
                  secondPage,

                nextCursor:
                  null,
              },
            ],
          });

        const fetchImplementation =
          vi.fn(
            async (
              _url:
                string,

              request:
                PosterBrainAiLearningDatasetHandoffFetchRequest
            ) => {
              await readStream(
                request.body
              );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return {
                    ...createValidatedResponse(),

                    sourceCutoffAt:
                      "2026-08-09T16:00:00Z",
                  };
                },
              };
            }
          );

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        await expect(
          service.handoffReadySnapshot(
            DATASET_ID
          )
        ).resolves.toMatchObject({
          status:
            "validated",

          sourceCutoffAt:
            SOURCE_CUTOFF,

          trainingStarted:
            false,
        });
      }
    );

    it(
      "surfaces a Python validation rejection without pretending training started",
      async () => {

        const events =
          createEvents();

        const {
          repository,
        } =
          createRepository({
            pages: [
              {
                events:
                  events.slice(
                    0,
                    5000
                  ),

                nextCursor:
                  "cursor-next",
              },

              {
                events:
                  events.slice(
                    5000
                  ),

                nextCursor:
                  null,
              },
            ],
          });

        const fetchImplementation =
          vi.fn(
            async (
              _url:
                string,

              request:
                PosterBrainAiLearningDatasetHandoffFetchRequest
            ) => {
              await readStream(
                request.body
              );

              return {
                ok:
                  false,

                status:
                  422,

                async json() {
                  return {
                    detail:
                      "training_dataset_handoff_invalid",
                  };
                },
              };
            }
          );

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        await expect(
          service.handoffReadySnapshot(
            DATASET_ID
          )
        ).rejects.toMatchObject({
          code:
            "remote_rejected",

          status:
            422,
        });
      }
    );

    it(
      "aborts a stalled Python handoff at the configured timeout",
      async () => {

        const {
          repository,
        } =
          createRepository();

        const fetchImplementation =
          vi.fn(
            async (
              _url:
                string,

              request:
                PosterBrainAiLearningDatasetHandoffFetchRequest
            ) => {
              await new Promise<void>(
                (
                  _resolve,
                  reject
                ) => {
                  request.signal.addEventListener(
                    "abort",
                    () => {
                      reject(
                        new Error(
                          "aborted"
                        )
                      );
                    },
                    {
                      once:
                        true,
                    }
                  );
                }
              );

              throw new Error(
                "unreachable"
              );
            }
          );

        const service =
          createPosterBrainAiLearningDatasetHandoffService({
            repository,

            endpointUrl:
              "http://127.0.0.1:8080/v1/training-dataset/handoff",

            timeoutMs:
              5,

            fetchImplementation,
          });

        await expect(
          service.handoffReadySnapshot(
            DATASET_ID
          )
        ).rejects.toMatchObject({
          code:
            "transport_timeout",
        });
      }
    );
  }
);