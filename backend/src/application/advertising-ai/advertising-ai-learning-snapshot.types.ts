import type {
  AdvertisingAiLearningDatasetEvent,
} from "./advertising-ai-learning-dataset.types.js";

export type AdvertisingAiLearningSnapshotStatus =
  | "building"
  | "ready"
  | "failed";

export interface AdvertisingAiLearningSnapshot {
  readonly id:
    string;

  readonly schemaVersion:
    1;

  readonly status:
    AdvertisingAiLearningSnapshotStatus;

  readonly sourceEventCount:
    number;

  readonly materializedEventCount:
    number;

  readonly sourceCutoffAt:
    string;

  readonly firstEventAt:
    string |
    null;

  readonly lastEventAt:
    string |
    null;

  readonly datasetChecksum:
    string |
    null;

  readonly createdAt:
    string;

  readonly completedAt:
    string |
    null;

  readonly failedAt:
    string |
    null;

  readonly failureCode:
    string |
    null;
}

export interface AdvertisingAiFrozenLearningPage {
  readonly events:
    readonly AdvertisingAiLearningDatasetEvent[];

  readonly nextCursor:
    string |
    null;
}

export type AdvertisingAiLearningSnapshotBuildStatus =
  | "collecting"
  | "ready"
  | "failed";

export interface AdvertisingAiLearningSnapshotBuildResult {
  readonly status:
    AdvertisingAiLearningSnapshotBuildStatus;

  readonly snapshot:
    AdvertisingAiLearningSnapshot |
    null;

  readonly reason:
    string;
}