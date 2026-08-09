import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiLearningDatasetSnapshotBuilder,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-builder.service.js";

import type {
  PosterBrainAiLearningDatasetRepository,
  PosterBrainAiLearningDatasetQuery,
} from "../src/application/poster-brain/ai-learning-dataset.repository.js";

import type {
  PosterBrainAiLearningDatasetEvent,
  PosterBrainAiLearningDatasetPage,
} from "../src/application/poster-brain/ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningEventCountService,
  PosterBrainAiLearningReadiness,
} from "../src/application/poster-brain/ai-learning-event-count.service.js";

import type {
  AppendPosterBrainAiLearningDatasetSnapshotPageInput,
  AppendPosterBrainAiLearningDatasetSnapshotPageResult,
  CompletePosterBrainAiLearningDatasetSnapshotInput,
  CreatePosterBrainAiLearningDatasetSnapshotInput,
  FailPosterBrainAiLearningDatasetSnapshotInput,
  PosterBrainAiLearningDatasetSnapshot,
  PosterBrainAiLearningDatasetSnapshotRepository,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot.repository.js";

class FixedReadinessService
  implements PosterBrainAiLearningEventCountService
{
  constructor(
    private readonly readiness:
      PosterBrainAiLearningReadiness
  ) {}

  async getReadiness():
    Promise<PosterBrainAiLearningReadiness> {
    return this.readiness;
  }
}

class ScriptedDatasetRepository
  implements PosterBrainAiLearningDatasetRepository
{
  readonly calls:
    PosterBrainAiLearningDatasetQuery[] =
    [];

  constructor(
    private readonly pages:
      readonly PosterBrainAiLearningDatasetPage[],

    private readonly failureAtCall:
      number |
      null =
      null
  ) {}

  async listPage(
    query:
      PosterBrainAiLearningDatasetQuery =
        {}
  ): Promise<PosterBrainAiLearningDatasetPage> {
    const callIndex =
      this.calls.length;

    this.calls.push(
      query
    );

    if (
      this.failureAtCall ===
      callIndex
    ) {
      throw new Error(
        "dataset read failed"
      );
    }

    return (
      this.pages[
        callIndex
      ] ?? {
        events:
          [],

        nextCursor:
          null,
      }
    );
  }
}

class RecordingSnapshotRepository
  implements PosterBrainAiLearningDatasetSnapshotRepository
{
  readonly createInputs:
    CreatePosterBrainAiLearningDatasetSnapshotInput[] =
    [];

  readonly appendInputs:
    AppendPosterBrainAiLearningDatasetSnapshotPageInput[] =
    [];

  readonly completeInputs:
    CompletePosterBrainAiLearningDatasetSnapshotInput[] =
    [];

  readonly failInputs:
    FailPosterBrainAiLearningDatasetSnapshotInput[] =
    [];

  private readonly seenContentIds =
    new Set<string>();

  private buildingSnapshot:
    PosterBrainAiLearningDatasetSnapshot |
    null =
    null;

  constructor(
    private readonly appendResults:
      readonly AppendPosterBrainAiLearningDatasetSnapshotPageResult[] =
      []
  ) {}

  async createBuildingSnapshot(
    input:
      CreatePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    this.createInputs.push(
      input
    );

    const snapshot:
      PosterBrainAiLearningDatasetSnapshot =
      {
        id:
          "11111111-1111-4111-8111-111111111111",

        schemaVersion:
          input.schemaVersion,

        status:
          "building",

        sourceEventCount:
          input.sourceEventCount,

        materializedEventCount:
          0,

        materializedContentCount:
          0,

        sourceCutoffAt:
          new Date(
            input.sourceCutoffAt
          ).toISOString(),

        firstEventAt:
          null,

        lastEventAt:
          null,

        datasetChecksum:
          null,

        failureReason:
          null,

        createdAt:
          "2026-08-09T16:00:01.000Z",

        completedAt:
          null,
      };

    this.buildingSnapshot =
      snapshot;

    return snapshot;
  }

  async appendPage(
    input:
      AppendPosterBrainAiLearningDatasetSnapshotPageInput
  ): Promise<AppendPosterBrainAiLearningDatasetSnapshotPageResult> {
    const callIndex =
      this.appendInputs.length;

    this.appendInputs.push(
      input
    );

    const scripted =
      this.appendResults[
        callIndex
      ];

    if (scripted !== undefined) {
      return scripted;
    }

    let insertedContentCount =
      0;

    for (
      const event
      of input.events
    ) {
      const contentId =
        event.content
          .contentId;

      if (
        this.seenContentIds.has(
          contentId
        )
      ) {
        continue;
      }

      this.seenContentIds.add(
        contentId
      );

      insertedContentCount +=
        1;
    }

    return {
      insertedContentCount,

      insertedEventCount:
        input.events.length,
    };
  }

  async completeSnapshot(
    input:
      CompletePosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    this.completeInputs.push(
      input
    );

    const building =
      this.requireBuildingSnapshot();

    return {
      ...building,

      status:
        "ready",

      materializedEventCount:
        input.materializedEventCount,

      materializedContentCount:
        input.materializedContentCount,

      firstEventAt:
        input.firstEventAt,

      lastEventAt:
        input.lastEventAt,

      datasetChecksum:
        input.datasetChecksum,

      failureReason:
        null,

      completedAt:
        new Date(
          input.completedAt
        ).toISOString(),
    };
  }

  async failSnapshot(
    input:
      FailPosterBrainAiLearningDatasetSnapshotInput
  ): Promise<PosterBrainAiLearningDatasetSnapshot> {
    this.failInputs.push(
      input
    );

    const building =
      this.requireBuildingSnapshot();

    return {
      ...building,

      status:
        "failed",

      failureReason:
        input.failureReason,

      completedAt:
        new Date(
          input.completedAt
        ).toISOString(),
    };
  }

  private requireBuildingSnapshot():
    PosterBrainAiLearningDatasetSnapshot {
    if (
      this.buildingSnapshot ===
      null
    ) {
      throw new Error(
        "Snapshot was not created."
      );
    }

    return this.buildingSnapshot;
  }
}

function createReadiness(input: {
  readonly observedEventCount:
    number;

  readonly trainingMinEvents:
    number;
}): PosterBrainAiLearningReadiness {
  return {
    status:
      "ready",

    snapshot: {
      organicContentEvents:
        input.observedEventCount,

      shareEvents:
        0,

      reportEvents:
        0,

      bookmarkEvents:
        0,

      articleInteractions:
        0,

      articleFeedback:
        0,

      observedEventCount:
        input.observedEventCount,
    },

    trainingMinEvents:
      input.trainingMinEvents,

    remainingEventCount:
      0,

    canStartTraining:
      true,
  };
}

function createEvent(input: {
  readonly eventKey:
    string;

  readonly occurredAt:
    string;

  readonly classificationOrder?:
    "alpha-beta" |
    "beta-alpha";
}): PosterBrainAiLearningDatasetEvent {
  const aiClassification =
    input.classificationOrder ===
    "beta-alpha"
      ? {
          beta:
            2,

          alpha:
            1,
        }
      : {
          alpha:
            1,

          beta:
            2,
        };

  return {
    schemaVersion:
      1,

    eventKey:
      input.eventKey,

    source:
      "organic_content_event",

    sourceEventId:
      input.eventKey,

    signalType:
      "impression",

    occurredAt:
      input.occurredAt,

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
        "22222222-2222-4222-8222-222222222222",

      sourceKey:
        "example-feed",

      publisherName:
        "Example Publisher",

      title:
        "Example title",

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

      aiClassification,

      qualityScore:
        0.8,

      publishedAt:
        "2026-08-09T14:00:00.000Z",

      contentStatus:
        "active",
    },
  };
}

function createClock(
  values:
    readonly string[]
): () => string {
  let index =
    0;

  return () => {
    const value =
      values[
        Math.min(
          index,
          values.length - 1
        )
      ];

    index +=
      1;

    if (value === undefined) {
      throw new Error(
        "Test clock has no values."
      );
    }

    return value;
  };
}

describe(
  "Poster Brain AI learning dataset snapshot builder",
  () => {
    it(
      "uses one immutable cutoff across multiple dataset pages and completes from persisted counts",
      async () => {
        const firstEvent =
          createEvent({
            eventKey:
              "organic_content_event:event-1",

            occurredAt:
              "2026-08-09T15:20:00.000Z",
          });

        const secondEvent =
          createEvent({
            eventKey:
              "organic_content_event:event-2",

            occurredAt:
              "2026-08-09T15:30:00.000Z",
          });

        const datasetRepository =
          new ScriptedDatasetRepository([
            {
              events: [
                firstEvent,
              ],

              nextCursor:
                "cursor-1",
            },

            {
              events: [
                secondEvent,
              ],

              nextCursor:
                null,
            },
          ]);

        const snapshotRepository =
          new RecordingSnapshotRepository();

        const builder =
          createPosterBrainAiLearningDatasetSnapshotBuilder({
            readinessService:
              new FixedReadinessService(
                createReadiness({
                  observedEventCount:
                    2,

                  trainingMinEvents:
                    2,
                })
              ),

            datasetRepository,
            snapshotRepository,

            pageSize:
              1,

            now:
              createClock([
                "2026-08-09T16:00:00Z",
                "2026-08-09T16:05:00Z",
              ]),
          });

        const result =
          await builder.buildIfReady();

        expect(
          result.status
        ).toBe(
          "built"
        );

        expect(
          datasetRepository.calls
        ).toHaveLength(
          2
        );

        expect(
          datasetRepository.calls[0]
        ).toEqual({
          limit:
            1,

          cursor:
            null,

          sourceCutoffAt:
            "2026-08-09T16:00:00.000Z",
        });

        expect(
          datasetRepository.calls[1]
        ).toEqual({
          limit:
            1,

          cursor:
            "cursor-1",

          sourceCutoffAt:
            "2026-08-09T16:00:00.000Z",
        });

        expect(
          snapshotRepository.appendInputs
        ).toHaveLength(
          2
        );

        expect(
          snapshotRepository.completeInputs
        ).toHaveLength(
          1
        );

        expect(
          snapshotRepository.failInputs
        ).toHaveLength(
          0
        );

        const completion =
          snapshotRepository
            .completeInputs[0];

        expect(
          completion
        ).toBeDefined();

        expect(
          completion
            ?.materializedEventCount
        ).toBe(
          2
        );

        expect(
          completion
            ?.materializedContentCount
        ).toBe(
          1
        );

        expect(
          completion
            ?.firstEventAt
        ).toBe(
          "2026-08-09T15:20:00.000Z"
        );

        expect(
          completion
            ?.lastEventAt
        ).toBe(
          "2026-08-09T15:30:00.000Z"
        );

        expect(
          completion
            ?.datasetChecksum
        ).toMatch(
          /^sha256:[0-9a-f]{64}$/
        );
      }
    );

    it(
      "produces the same canonical checksum when nested JSON key insertion order differs",
      async () => {
        async function buildChecksum(
          classificationOrder:
            "alpha-beta" |
            "beta-alpha"
        ): Promise<string> {
          const event =
            createEvent({
              eventKey:
                "organic_content_event:event-1",

              occurredAt:
                "2026-08-09T15:20:00.000Z",

              classificationOrder,
            });

          const datasetRepository =
            new ScriptedDatasetRepository([
              {
                events: [
                  event,
                ],

                nextCursor:
                  null,
              },
            ]);

          const snapshotRepository =
            new RecordingSnapshotRepository();

          const builder =
            createPosterBrainAiLearningDatasetSnapshotBuilder({
              readinessService:
                new FixedReadinessService(
                  createReadiness({
                    observedEventCount:
                      1,

                    trainingMinEvents:
                      1,
                  })
                ),

              datasetRepository,
              snapshotRepository,

              now:
                createClock([
                  "2026-08-09T16:00:00Z",
                  "2026-08-09T16:05:00Z",
                ]),
            });

          const result =
            await builder.buildIfReady();

          expect(
            result.status
          ).toBe(
            "built"
          );

          const checksum =
            snapshotRepository
              .completeInputs[0]
              ?.datasetChecksum;

          if (
            checksum ===
            undefined
          ) {
            throw new Error(
              "Expected completed dataset checksum."
            );
          }

          return checksum;
        }

        const first =
          await buildChecksum(
            "alpha-beta"
          );

        const second =
          await buildChecksum(
            "beta-alpha"
          );

        expect(
          first
        ).toBe(
          second
        );

        expect(
          first
        ).toMatch(
          /^sha256:[0-9a-f]{64}$/
        );
      }
    );

    it(
      "does not mark a snapshot ready when real materialized events remain below the 10000 threshold",
      async () => {
        const event =
          createEvent({
            eventKey:
              "organic_content_event:event-1",

            occurredAt:
              "2026-08-09T15:20:00.000Z",
          });

        const datasetRepository =
          new ScriptedDatasetRepository([
            {
              events: [
                event,
              ],

              nextCursor:
                null,
            },
          ]);

        const snapshotRepository =
          new RecordingSnapshotRepository([
            {
              insertedContentCount:
                1,

              insertedEventCount:
                9999,
            },
          ]);

        const builder =
          createPosterBrainAiLearningDatasetSnapshotBuilder({
            readinessService:
              new FixedReadinessService(
                createReadiness({
                  observedEventCount:
                    10000,

                  trainingMinEvents:
                    10000,
                })
              ),

            datasetRepository,
            snapshotRepository,

            now:
              createClock([
                "2026-08-09T16:00:00Z",
                "2026-08-09T16:05:00Z",
              ]),
          });

        const result =
          await builder.buildIfReady();

        expect(
          result.status
        ).toBe(
          "insufficient_materialized_data"
        );

        expect(
          snapshotRepository.completeInputs
        ).toHaveLength(
          0
        );

        expect(
          snapshotRepository.failInputs
        ).toHaveLength(
          1
        );

        expect(
          snapshotRepository.failInputs[0]
            ?.failureReason
        ).toBe(
          "materialized_event_threshold_not_met"
        );

        expect(
          result.snapshot?.status
        ).toBe(
          "failed"
        );
      }
    );

    it(
      "marks an interrupted building snapshot failed and preserves the original build error",
      async () => {
        const datasetRepository =
          new ScriptedDatasetRepository(
            [],
            0
          );

        const snapshotRepository =
          new RecordingSnapshotRepository();

        const builder =
          createPosterBrainAiLearningDatasetSnapshotBuilder({
            readinessService:
              new FixedReadinessService(
                createReadiness({
                  observedEventCount:
                    10000,

                  trainingMinEvents:
                    10000,
                })
              ),

            datasetRepository,
            snapshotRepository,

            now:
              createClock([
                "2026-08-09T16:00:00Z",
                "2026-08-09T16:01:00Z",
              ]),
          });

        await expect(
          builder.buildIfReady()
        ).rejects.toThrow(
          "dataset read failed"
        );

        expect(
          snapshotRepository.completeInputs
        ).toHaveLength(
          0
        );

        expect(
          snapshotRepository.failInputs
        ).toHaveLength(
          1
        );

        expect(
          snapshotRepository.failInputs[0]
            ?.failureReason
        ).toBe(
          "snapshot_build_failed"
        );
      }
    );
  }
);