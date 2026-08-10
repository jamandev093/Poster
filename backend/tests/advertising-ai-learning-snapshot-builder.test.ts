import {
  createHash,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiLearningSnapshotBuilderService,
  type AdvertisingAiLearningDatasetEvent,
  type AdvertisingAiLearningDatasetService,
  type AdvertisingAiLearningSnapshot,
  type AdvertisingAiLearningSnapshotRepository,
} from "../src/application/advertising-ai/index.js";

const DATASET_ID =
  "00000000-0000-4000-8000-000000000301";

const CUTOFF =
  "2026-08-10T15:00:00.000Z";

function snapshot(
  overrides:
    Partial<
      AdvertisingAiLearningSnapshot
    > = {}
):
  AdvertisingAiLearningSnapshot {
  return {
    id:
      DATASET_ID,

    schemaVersion:
      1,

    status:
      "building",

    sourceEventCount:
      2,

    materializedEventCount:
      0,

    sourceCutoffAt:
      CUTOFF,

    firstEventAt:
      null,

    lastEventAt:
      null,

    datasetChecksum:
      null,

    createdAt:
      CUTOFF,

    completedAt:
      null,

    failedAt:
      null,

    failureCode:
      null,

    ...overrides,
  };
}

const EVENTS:
  readonly AdvertisingAiLearningDatasetEvent[] =
  [
    {
      eventKey:
        "advertising:00000000-0000-4000-8000-000000000402",

      sourceEventId:
        "00000000-0000-4000-8000-000000000402",

      campaignId:
        "00000000-0000-4000-8000-000000000501",

      eventType:
        "click",

      placement:
        "home",

      occurredAt:
        "2026-08-10T14:01:00.000Z",
    },

    {
      eventKey:
        "advertising:00000000-0000-4000-8000-000000000401",

      sourceEventId:
        "00000000-0000-4000-8000-000000000401",

      campaignId:
        "00000000-0000-4000-8000-000000000501",

      eventType:
        "impression",

      placement:
        "home",

      occurredAt:
        "2026-08-10T14:00:00.000Z",
    },
  ];

function expectedChecksum():
  string {
  const hash =
    createHash(
      "sha256"
    );

  for (
    const event of
    EVENTS
  ) {
    hash.update(
      JSON.stringify({
        campaignId:
          event.campaignId,

        eventKey:
          event.eventKey,

        eventType:
          event.eventType,

        occurredAt:
          event.occurredAt,

        placement:
          event.placement,

        sourceEventId:
          event.sourceEventId,
      })
    );

    hash.update(
      "\n"
    );
  }

  return `sha256:${hash.digest(
    "hex"
  )}`;
}

describe(
  "Advertising AI frozen learning snapshot builder",
  () => {

    it(
      "does not create a snapshot before the real telemetry threshold is ready",
      async () => {
        let created =
          false;

        const learningDatasetService = {
          async getReadiness() {
            return {
              status:
                "collecting" as const,

              source:
                "validated_monetization_campaign_events" as const,

              counts: {
                totalEventCount:
                  9999,

                impressionEventCount:
                  9900,

                clickEventCount:
                  90,

                conversionEventCount:
                  9,

                positiveEventCount:
                  99,

                firstEventAt:
                  "2026-08-01T00:00:00.000Z",

                lastEventAt:
                  "2026-08-10T14:00:00.000Z",

                sourceCutoffAt:
                  CUTOFF,
              },

              trainingMinEvents:
                10000,

              trainingMinPositiveEvents:
                100,

              remainingEventCount:
                1,

              remainingPositiveEventCount:
                1,

              canBuildTrainingSnapshot:
                false,

              organicEventsIncluded:
                false as const,

              userIdentityIncluded:
                false as const,

              financialLedgerIncluded:
                false as const,
            };
          },

          async listDatasetPage() {
            throw new Error(
              "Should not page dataset."
            );
          },
        } satisfies AdvertisingAiLearningDatasetService;

        const repository = {
          async createSnapshot() {
            created =
              true;

            return snapshot();
          },

          async appendEvents() {
            return 0;
          },

          async completeSnapshot() {
            return snapshot();
          },

          async failSnapshot() {
            return snapshot();
          },

          async getReadySnapshot() {
            return null;
          },

          async listFrozenEvents() {
            return {
              events:
                [],

              nextCursor:
                null,
            };
          },
        } satisfies AdvertisingAiLearningSnapshotRepository;

        const builder =
          createAdvertisingAiLearningSnapshotBuilderService({
            learningDatasetService,

            snapshotRepository:
              repository,

            now:
              () =>
                CUTOFF,
          });

        const result =
          await builder.build();

        expect(
          result.status
        ).toBe(
          "collecting"
        );

        expect(
          created
        ).toBe(
          false
        );
      }
    );

    it(
      "materializes one reproducible frozen dataset and checksum",
      async () => {
        let completedInput:
          {
            readonly materializedEventCount:
              number;

            readonly firstEventAt:
              string;

            readonly lastEventAt:
              string;

            readonly datasetChecksum:
              string;
          } |
          null =
          null;

        const learningDatasetService = {
          async getReadiness() {
            return {
              status:
                "ready" as const,

              source:
                "validated_monetization_campaign_events" as const,

              counts: {
                totalEventCount:
                  2,

                impressionEventCount:
                  1,

                clickEventCount:
                  1,

                conversionEventCount:
                  0,

                positiveEventCount:
                  1,

                firstEventAt:
                  EVENTS[1]!
                    .occurredAt,

                lastEventAt:
                  EVENTS[0]!
                    .occurredAt,

                sourceCutoffAt:
                  CUTOFF,
              },

              trainingMinEvents:
                2,

              trainingMinPositiveEvents:
                1,

              remainingEventCount:
                0,

              remainingPositiveEventCount:
                0,

              canBuildTrainingSnapshot:
                true,

              organicEventsIncluded:
                false as const,

              userIdentityIncluded:
                false as const,

              financialLedgerIncluded:
                false as const,
            };
          },

          async listDatasetPage() {
            return {
              events:
                EVENTS,

              nextCursor:
                null,

              sourceCutoffAt:
                CUTOFF,
            };
          },
        } satisfies AdvertisingAiLearningDatasetService;

        const repository = {
          async createSnapshot() {
            return snapshot();
          },

          async appendEvents(
            input
          ) {
            return input.events
              .length;
          },

          async completeSnapshot(
            input
          ) {
            completedInput =
              input;

            return snapshot({
              status:
                "ready",

              materializedEventCount:
                input.materializedEventCount,

              firstEventAt:
                input.firstEventAt,

              lastEventAt:
                input.lastEventAt,

              datasetChecksum:
                input.datasetChecksum,

              completedAt:
                input.completedAt,
            });
          },

          async failSnapshot() {
            throw new Error(
              "Snapshot should not fail."
            );
          },

          async getReadySnapshot() {
            return null;
          },

          async listFrozenEvents() {
            return {
              events:
                [],

              nextCursor:
                null,
            };
          },
        } satisfies AdvertisingAiLearningSnapshotRepository;

        const builder =
          createAdvertisingAiLearningSnapshotBuilderService({
            learningDatasetService,

            snapshotRepository:
              repository,

            now:
              () =>
                CUTOFF,

            pageSize:
              5000,
          });

        const result =
          await builder.build();

        expect(
          result.status
        ).toBe(
          "ready"
        );

        expect(
          completedInput
        ).toMatchObject({
          materializedEventCount:
            2,

          firstEventAt:
            EVENTS[1]!
              .occurredAt,

          lastEventAt:
            EVENTS[0]!
              .occurredAt,

          datasetChecksum:
            expectedChecksum(),
        });
      }
    );

    it(
      "fails the snapshot rather than training from an inconsistent source count",
      async () => {
        let failureCode:
          string |
          null =
          null;

        const learningDatasetService = {
          async getReadiness() {
            return {
              status:
                "ready" as const,

              source:
                "validated_monetization_campaign_events" as const,

              counts: {
                totalEventCount:
                  3,

                impressionEventCount:
                  2,

                clickEventCount:
                  1,

                conversionEventCount:
                  0,

                positiveEventCount:
                  1,

                firstEventAt:
                  EVENTS[1]!
                    .occurredAt,

                lastEventAt:
                  EVENTS[0]!
                    .occurredAt,

                sourceCutoffAt:
                  CUTOFF,
              },

              trainingMinEvents:
                3,

              trainingMinPositiveEvents:
                1,

              remainingEventCount:
                0,

              remainingPositiveEventCount:
                0,

              canBuildTrainingSnapshot:
                true,

              organicEventsIncluded:
                false as const,

              userIdentityIncluded:
                false as const,

              financialLedgerIncluded:
                false as const,
            };
          },

          async listDatasetPage() {
            return {
              events:
                EVENTS,

              nextCursor:
                null,

              sourceCutoffAt:
                CUTOFF,
            };
          },
        } satisfies AdvertisingAiLearningDatasetService;

        const repository = {
          async createSnapshot() {
            return snapshot({
              sourceEventCount:
                3,
            });
          },

          async appendEvents(
            input
          ) {
            return input.events
              .length;
          },

          async completeSnapshot() {
            throw new Error(
              "Should not complete."
            );
          },

          async failSnapshot(
            input
          ) {
            failureCode =
              input.failureCode;

            return snapshot({
              status:
                "failed",

              sourceEventCount:
                3,

              materializedEventCount:
                2,

              failedAt:
                input.failedAt,

              failureCode:
                input.failureCode,
            });
          },

          async getReadySnapshot() {
            return null;
          },

          async listFrozenEvents() {
            return {
              events:
                [],

              nextCursor:
                null,
            };
          },
        } satisfies AdvertisingAiLearningSnapshotRepository;

        const result =
          await createAdvertisingAiLearningSnapshotBuilderService({
            learningDatasetService,

            snapshotRepository:
              repository,

            now:
              () =>
                CUTOFF,
          }).build();

        expect(
          result.status
        ).toBe(
          "failed"
        );

        expect(
          failureCode
        ).toBe(
          "source_snapshot_count_mismatch"
        );
      }
    );
  }
);