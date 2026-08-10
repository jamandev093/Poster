import {
  createHash,
} from "node:crypto";

import type {
  AdvertisingAiLearningDatasetEvent,
  AdvertisingAiLearningDatasetService,
} from "./index.js";

import type {
  AdvertisingAiLearningSnapshotBuildResult,
} from "./advertising-ai-learning-snapshot.types.js";

import type {
  AdvertisingAiLearningSnapshotRepository,
} from "./advertising-ai-learning-snapshot.repository.js";

export interface AdvertisingAiLearningSnapshotBuilderService {
  build():
    Promise<
      AdvertisingAiLearningSnapshotBuildResult
    >;
}

export interface AdvertisingAiLearningSnapshotBuilderDependencies {
  readonly learningDatasetService:
    AdvertisingAiLearningDatasetService;

  readonly snapshotRepository:
    AdvertisingAiLearningSnapshotRepository;

  readonly now?:
    () => string;

  readonly pageSize?:
    number;
}

function normalizedPageSize(
  value:
    number |
    undefined
): number {
  const result =
    value ??
    5000;

  if (
    !Number.isSafeInteger(
      result
    ) ||
    result < 1 ||
    result > 5000
  ) {
    throw new Error(
      "Advertising AI snapshot page size must be between 1 and 5000."
    );
  }

  return result;
}

function canonicalEventJson(
  event:
    AdvertisingAiLearningDatasetEvent
): string {
  /*
   * Keys deliberately remain alphabetically ordered.
   * Python S04B2 will reproduce this exact canonical JSON
   * with sort_keys=True and compact separators.
   */
  return JSON.stringify({
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
  });
}

function earlier(
  left:
    string |
    null,

  right:
    string
): string {
  if (left === null) {
    return right;
  }

  return (
    Date.parse(
      right
    ) <
    Date.parse(
      left
    )
      ? right
      : left
  );
}

function later(
  left:
    string |
    null,

  right:
    string
): string {
  if (left === null) {
    return right;
  }

  return (
    Date.parse(
      right
    ) >
    Date.parse(
      left
    )
      ? right
      : left
  );
}

export function createAdvertisingAiLearningSnapshotBuilderService(
  dependencies:
    AdvertisingAiLearningSnapshotBuilderDependencies
): AdvertisingAiLearningSnapshotBuilderService {
  const now =
    dependencies.now ??
    (
      () =>
        new Date()
          .toISOString()
    );

  const pageSize =
    normalizedPageSize(
      dependencies.pageSize
    );

  return {
    async build() {
      const sourceCutoffAt =
        now();

      const readiness =
        await dependencies
          .learningDatasetService
          .getReadiness(
            sourceCutoffAt
          );

      if (
        !readiness
          .canBuildTrainingSnapshot
      ) {
        return {
          status:
            "collecting",

          snapshot:
            null,

          reason:
            "training_threshold_not_met",
        };
      }

      const snapshot =
        await dependencies
          .snapshotRepository
          .createSnapshot({
            sourceEventCount:
              readiness.counts
                .totalEventCount,

            sourceCutoffAt,
          });

      try {
        const hash =
          createHash(
            "sha256"
          );

        let cursor:
          string |
          null =
          null;

        let materializedEventCount =
          0;

        let firstEventAt:
          string |
          null =
          null;

        let lastEventAt:
          string |
          null =
          null;

        while (true) {
          const page =
            await dependencies
              .learningDatasetService
              .listDatasetPage({
                sourceCutoffAt,
                limit:
                  pageSize,

                cursor,
              });

          if (
            page.events.length ===
            0
          ) {
            if (
              page.nextCursor !==
              null
            ) {
              throw new Error(
                "Advertising AI dataset returned an empty non-final page."
              );
            }

            break;
          }

          for (
            const event of
            page.events
          ) {
            hash.update(
              canonicalEventJson(
                event
              ),
              "utf8"
            );

            hash.update(
              "\n",
              "utf8"
            );

            firstEventAt =
              earlier(
                firstEventAt,
                event.occurredAt
              );

            lastEventAt =
              later(
                lastEventAt,
                event.occurredAt
              );
          }

          const inserted =
            await dependencies
              .snapshotRepository
              .appendEvents({
                datasetId:
                  snapshot.id,

                events:
                  page.events,
              });

          if (
            inserted !==
            page.events.length
          ) {
            const failed =
              await dependencies
                .snapshotRepository
                .failSnapshot({
                  datasetId:
                    snapshot.id,

                  failureCode:
                    "duplicate_or_missing_frozen_event",

                  failedAt:
                    now(),
                });

            return {
              status:
                "failed",

              snapshot:
                failed,

              reason:
                "frozen_event_insert_count_mismatch",
            };
          }

          materializedEventCount +=
            inserted;

          if (
            page.nextCursor ===
            null
          ) {
            break;
          }

          cursor =
            page.nextCursor;
        }

        if (
          materializedEventCount !==
          readiness.counts
            .totalEventCount ||
          firstEventAt ===
            null ||
          lastEventAt ===
            null
        ) {
          const failed =
            await dependencies
              .snapshotRepository
              .failSnapshot({
                datasetId:
                  snapshot.id,

                failureCode:
                  "source_snapshot_count_mismatch",

                failedAt:
                  now(),
              });

          return {
            status:
              "failed",

            snapshot:
              failed,

            reason:
              "source_snapshot_count_mismatch",
          };
        }

        const completed =
          await dependencies
            .snapshotRepository
            .completeSnapshot({
              datasetId:
                snapshot.id,

              materializedEventCount,

              firstEventAt,

              lastEventAt,

              datasetChecksum:
                `sha256:${hash.digest(
                  "hex"
                )}`,

              completedAt:
                now(),
            });

        return {
          status:
            "ready",

          snapshot:
            completed,

          reason:
            "frozen_advertising_dataset_ready",
        };
      }
      catch (
        error
      ) {
        try {
          await dependencies
            .snapshotRepository
            .failSnapshot({
              datasetId:
                snapshot.id,

              failureCode:
                "snapshot_build_failed",

              failedAt:
                now(),
            });
        }
        catch {
          /*
           * Preserve the original build error.
           */
        }

        throw error;
      }
    },
  };
}