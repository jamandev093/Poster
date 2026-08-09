import {
  createHash,
} from "node:crypto";

import {
  POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningDatasetEvent,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningDatasetRepository,
} from "./ai-learning-dataset.repository.js";

import type {
  PosterBrainAiLearningEventCountService,
  PosterBrainAiLearningReadiness,
} from "./ai-learning-event-count.service.js";

import type {
  PosterBrainAiLearningDatasetSnapshot,
  PosterBrainAiLearningDatasetSnapshotRepository,
} from "./ai-learning-dataset-snapshot.repository.js";

const DEFAULT_SNAPSHOT_PAGE_SIZE =
  1000;

const MAX_SNAPSHOT_PAGE_SIZE =
  5000;

const DATASET_CHECKSUM_PREFIX =
  "sha256:";

export type PosterBrainAiLearningDatasetBuildStatus =
  | "disabled"
  | "collecting"
  | "built"
  | "insufficient_materialized_data";

export interface PosterBrainAiLearningDatasetBuildResult {
  readonly status:
    PosterBrainAiLearningDatasetBuildStatus;

  readonly readiness:
    PosterBrainAiLearningReadiness;

  readonly snapshot:
    PosterBrainAiLearningDatasetSnapshot |
    null;
}

export interface PosterBrainAiLearningDatasetSnapshotBuilder {
  buildIfReady():
    Promise<PosterBrainAiLearningDatasetBuildResult>;
}

export interface PosterBrainAiLearningDatasetSnapshotBuilderDependencies {
  readonly readinessService:
    PosterBrainAiLearningEventCountService;

  readonly datasetRepository:
    PosterBrainAiLearningDatasetRepository;

  readonly snapshotRepository:
    PosterBrainAiLearningDatasetSnapshotRepository;

  readonly now?:
    () => string;

  readonly pageSize?:
    number;
}

function normalizePageSize(
  value:
    number |
    undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return DEFAULT_SNAPSHOT_PAGE_SIZE;
  }

  return Math.max(
    1,
    Math.min(
      MAX_SNAPSHOT_PAGE_SIZE,
      Math.trunc(
        value
      )
    )
  );
}

function normalizeTimestamp(
  value:
    string,
  fieldName:
    string
): string {
  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid Poster Brain dataset builder timestamp: ${fieldName}`
    );
  }

  return parsed.toISOString();
}

function canonicalizeJson(
  value:
    unknown
): unknown {
  if (
    value === null ||
    typeof value !==
      "object"
  ) {
    return value;
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      canonicalizeJson
    );
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const result:
    Record<
      string,
      unknown
    > =
    {};

  for (
    const key
    of Object.keys(
      source
    ).sort()
  ) {
    const item =
      source[key];

    if (
      item ===
      undefined
    ) {
      continue;
    }

    result[key] =
      canonicalizeJson(
        item
      );
  }

  return result;
}

function serializeDatasetEvent(
  event:
    PosterBrainAiLearningDatasetEvent
): string {
  return JSON.stringify(
    canonicalizeJson(
      event
    )
  );
}

function earlierTimestamp(
  current:
    string |
    null,
  candidate:
    string
): string {
  if (
    current ===
    null
  ) {
    return candidate;
  }

  return new Date(
    candidate
  ).getTime() <
    new Date(
      current
    ).getTime()
    ? candidate
    : current;
}

function laterTimestamp(
  current:
    string |
    null,
  candidate:
    string
): string {
  if (
    current ===
    null
  ) {
    return candidate;
  }

  return new Date(
    candidate
  ).getTime() >
    new Date(
      current
    ).getTime()
    ? candidate
    : current;
}

async function bestEffortFailSnapshot(input: {
  readonly repository:
    PosterBrainAiLearningDatasetSnapshotRepository;

  readonly datasetId:
    string;

  readonly reason:
    string;

  readonly completedAt:
    string;
}): Promise<void> {
  try {
    await input.repository.failSnapshot({
      datasetId:
        input.datasetId,

      failureReason:
        input.reason,

      completedAt:
        input.completedAt,
    });
  }
  catch {
    // Preserve the original build failure.
    // A later operational repair can inspect a stale building snapshot.
  }
}

export class DefaultPosterBrainAiLearningDatasetSnapshotBuilder
  implements PosterBrainAiLearningDatasetSnapshotBuilder
{
  private readonly now:
    () => string;

  private readonly pageSize:
    number;

  constructor(
    private readonly dependencies:
      PosterBrainAiLearningDatasetSnapshotBuilderDependencies
  ) {
    this.now =
      dependencies.now ??
      (() =>
        new Date()
          .toISOString());

    this.pageSize =
      normalizePageSize(
        dependencies.pageSize
      );
  }

  async buildIfReady():
    Promise<PosterBrainAiLearningDatasetBuildResult> {
    const readiness =
      await this.dependencies
        .readinessService
        .getReadiness();

    if (
      readiness.status ===
      "disabled"
    ) {
      return {
        status:
          "disabled",

        readiness,

        snapshot:
          null,
      };
    }

    if (
      readiness.status !==
      "ready"
    ) {
      return {
        status:
          "collecting",

        readiness,

        snapshot:
          null,
      };
    }

    /**
     * Readiness is intentionally checked before the cutoff.
     *
     * The resulting cutoff therefore cannot exclude a normal source
     * row that contributed to the readiness query merely because new
     * engagement arrives after readiness is read.
     *
     * Every subsequent dataset page receives this exact same cutoff.
     */
    const sourceCutoffAt =
      normalizeTimestamp(
        this.now(),
        "sourceCutoffAt"
      );

    const buildingSnapshot =
      await this.dependencies
        .snapshotRepository
        .createBuildingSnapshot({
          schemaVersion:
            POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION,

          sourceEventCount:
            readiness.snapshot
              .observedEventCount,

          sourceCutoffAt,
        });

    const checksum =
      createHash(
        "sha256"
      );

    let materializedEventCount =
      0;

    let materializedContentCount =
      0;

    let firstEventAt:
      string |
      null =
      null;

    let lastEventAt:
      string |
      null =
      null;

    let cursor:
      string |
      null =
      null;

    let previousCursor:
      string |
      null =
      null;

    try {
      while (true) {
        const page =
          await this.dependencies
            .datasetRepository
            .listPage({
              limit:
                this.pageSize,

              cursor,

              sourceCutoffAt:
                buildingSnapshot
                  .sourceCutoffAt,
            });

        for (
          const event
          of page.events
        ) {
          const occurredAt =
            normalizeTimestamp(
              event.occurredAt,
              "event.occurredAt"
            );

          firstEventAt =
            earlierTimestamp(
              firstEventAt,
              occurredAt
            );

          lastEventAt =
            laterTimestamp(
              lastEventAt,
              occurredAt
            );

          checksum.update(
            serializeDatasetEvent(
              event
            ),
            "utf8"
          );

          checksum.update(
            "\n",
            "utf8"
          );
        }

        const persisted =
          await this.dependencies
            .snapshotRepository
            .appendPage({
              datasetId:
                buildingSnapshot.id,

              events:
                page.events,
            });

        materializedEventCount +=
          persisted.insertedEventCount;

        materializedContentCount +=
          persisted.insertedContentCount;

        if (
          page.nextCursor ===
          null
        ) {
          break;
        }

        if (
          page.events.length ===
          0
        ) {
          throw new Error(
            "Poster Brain dataset pagination returned an empty page with a continuation cursor."
          );
        }

        if (
          page.nextCursor ===
          cursor ||
          page.nextCursor ===
          previousCursor
        ) {
          throw new Error(
            "Poster Brain dataset pagination cursor did not advance."
          );
        }

        previousCursor =
          cursor;

        cursor =
          page.nextCursor;
      }

      if (
        materializedEventCount <
        readiness.trainingMinEvents
      ) {
        const completedAt =
          normalizeTimestamp(
            this.now(),
            "failedAt"
          );

        const failedSnapshot =
          await this.dependencies
            .snapshotRepository
            .failSnapshot({
              datasetId:
                buildingSnapshot.id,

              failureReason:
                "materialized_event_threshold_not_met",

              completedAt,
            });

        return {
          status:
            "insufficient_materialized_data",

          readiness,

          snapshot:
            failedSnapshot,
        };
      }

      const datasetChecksum =
        DATASET_CHECKSUM_PREFIX +
        checksum.digest(
          "hex"
        );

      const completedAt =
        normalizeTimestamp(
          this.now(),
          "completedAt"
        );

      const completedSnapshot =
        await this.dependencies
          .snapshotRepository
          .completeSnapshot({
            datasetId:
              buildingSnapshot.id,

            materializedEventCount,

            materializedContentCount,

            firstEventAt,

            lastEventAt,

            datasetChecksum,

            completedAt,
          });

      return {
        status:
          "built",

        readiness,

        snapshot:
          completedSnapshot,
      };
    }
    catch (
      error
    ) {
      await bestEffortFailSnapshot({
        repository:
          this.dependencies
            .snapshotRepository,

        datasetId:
          buildingSnapshot.id,

        reason:
          "snapshot_build_failed",

        completedAt:
          normalizeTimestamp(
            this.now(),
            "failedAt"
          ),
      });

      throw error;
    }
  }
}

export function createPosterBrainAiLearningDatasetSnapshotBuilder(
  dependencies:
    PosterBrainAiLearningDatasetSnapshotBuilderDependencies
): PosterBrainAiLearningDatasetSnapshotBuilder {
  return new DefaultPosterBrainAiLearningDatasetSnapshotBuilder(
    dependencies
  );
}