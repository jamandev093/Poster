import {
  ADVERTISING_AI_TRAINING_MIN_EVENTS,
  ADVERTISING_AI_TRAINING_MIN_POSITIVE_EVENTS,
  type AdvertisingAiLearningDatasetPage,
  type AdvertisingAiLearningDatasetPageInput,
  type AdvertisingAiLearningReadiness,
} from "./advertising-ai-learning-dataset.types.js";

import type {
  AdvertisingAiLearningDatasetRepository,
} from "./advertising-ai-learning-dataset.repository.js";

export interface AdvertisingAiLearningDatasetService {
  getReadiness(
    sourceCutoffAt?:
      string
  ):
    Promise<
      AdvertisingAiLearningReadiness
    >;

  listDatasetPage(
    input:
      AdvertisingAiLearningDatasetPageInput
  ):
    Promise<
      AdvertisingAiLearningDatasetPage
    >;
}

export interface AdvertisingAiLearningDatasetServiceDependencies {
  readonly repository:
    AdvertisingAiLearningDatasetRepository;

  readonly now?:
    () => string;

  readonly trainingMinEvents?:
    number;

  readonly trainingMinPositiveEvents?:
    number;
}

function positiveInteger(
  value:
    number,

  field:
    string
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 1
  ) {
    throw new Error(
      `Advertising AI ${field} must be a positive integer.`
    );
  }

  return value;
}

export function createAdvertisingAiLearningDatasetService(
  dependencies:
    AdvertisingAiLearningDatasetServiceDependencies
): AdvertisingAiLearningDatasetService {
  const now =
    dependencies.now ??
    (
      () =>
        new Date()
          .toISOString()
    );

  const trainingMinEvents =
    positiveInteger(
      dependencies.trainingMinEvents ??
      ADVERTISING_AI_TRAINING_MIN_EVENTS,
      "training minimum event count"
    );

  const trainingMinPositiveEvents =
    positiveInteger(
      dependencies.trainingMinPositiveEvents ??
      ADVERTISING_AI_TRAINING_MIN_POSITIVE_EVENTS,
      "training minimum positive event count"
    );

  return {
    async getReadiness(
      sourceCutoffAt =
        now()
    ) {
      const counts =
        await dependencies
          .repository
          .readEventCounts(
            sourceCutoffAt
          );

      const remainingEventCount =
        Math.max(
          trainingMinEvents -
          counts.totalEventCount,
          0
        );

      const remainingPositiveEventCount =
        Math.max(
          trainingMinPositiveEvents -
          counts.positiveEventCount,
          0
        );

      const ready =
        remainingEventCount ===
          0 &&
        remainingPositiveEventCount ===
          0;

      return {
        status:
          ready
            ? "ready"
            : "collecting",

        source:
          "validated_monetization_campaign_events",

        counts,

        trainingMinEvents,

        trainingMinPositiveEvents,

        remainingEventCount,

        remainingPositiveEventCount,

        canBuildTrainingSnapshot:
          ready,

        organicEventsIncluded:
          false,

        userIdentityIncluded:
          false,

        financialLedgerIncluded:
          false,
      };
    },

    async listDatasetPage(
      input
    ) {
      return await dependencies
        .repository
        .listEvents(
          input
        );
    },
  };
}