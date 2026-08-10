import type {
  MonetizationEventPlacement,
  MonetizationEventType,
} from "../../domains/monetization/index.js";

export const ADVERTISING_AI_TRAINING_MIN_EVENTS =
  10_000;

export const ADVERTISING_AI_TRAINING_MIN_POSITIVE_EVENTS =
  100;

export type AdvertisingAiLearningDatasetStatus =
  | "collecting"
  | "ready";

export interface AdvertisingAiLearningEventCountSnapshot {
  readonly totalEventCount:
    number;

  readonly impressionEventCount:
    number;

  readonly clickEventCount:
    number;

  readonly conversionEventCount:
    number;

  readonly positiveEventCount:
    number;

  readonly firstEventAt:
    string |
    null;

  readonly lastEventAt:
    string |
    null;

  readonly sourceCutoffAt:
    string;
}

export interface AdvertisingAiLearningReadiness {
  readonly status:
    AdvertisingAiLearningDatasetStatus;

  readonly source:
    "validated_monetization_campaign_events";

  readonly counts:
    AdvertisingAiLearningEventCountSnapshot;

  readonly trainingMinEvents:
    number;

  readonly trainingMinPositiveEvents:
    number;

  readonly remainingEventCount:
    number;

  readonly remainingPositiveEventCount:
    number;

  readonly canBuildTrainingSnapshot:
    boolean;

  readonly organicEventsIncluded:
    false;

  readonly userIdentityIncluded:
    false;

  readonly financialLedgerIncluded:
    false;
}

export interface AdvertisingAiLearningDatasetEvent {
  /*
   * Backend-generated event identity only.
   * Client event_key is intentionally not exposed.
   */
  readonly eventKey:
    string;

  readonly sourceEventId:
    string;

  readonly campaignId:
    string;

  readonly eventType:
    MonetizationEventType;

  readonly placement:
    MonetizationEventPlacement;

  readonly occurredAt:
    string;
}

export interface AdvertisingAiLearningDatasetCursor {
  readonly occurredAt:
    string;

  readonly sourceEventId:
    string;
}

export interface AdvertisingAiLearningDatasetPageInput {
  readonly sourceCutoffAt:
    string;

  readonly limit?:
    number;

  readonly cursor?:
    string |
    null;
}

export interface AdvertisingAiLearningDatasetPage {
  readonly events:
    readonly AdvertisingAiLearningDatasetEvent[];

  readonly nextCursor:
    string |
    null;

  readonly sourceCutoffAt:
    string;
}