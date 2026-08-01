import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createMonetizationCampaignEvent,
  createPendingMonetizationEventValidation,
  findMonetizationCampaignById,
  findMonetizationCampaignEventByKey,
  type MonetizationCampaignEventRecord,
} from "../../domains/monetization/index.js";

import {
  AnalyticsIngestionError,
} from "./analytics-ingestion.errors.js";

import type {
  IngestMonetizationEventInput,
  IngestMonetizationEventResult,
} from "./analytics-ingestion.types.js";

const MAX_FUTURE_EVENT_MILLISECONDS =
  5 * 60 * 1000;

const MAX_EVENT_AGE_MILLISECONDS =
  30 * 24 * 60 * 60 * 1000;

export interface AnalyticsIngestionService {
  ingest:
    (
      input:
        IngestMonetizationEventInput
    ) => Promise<
      IngestMonetizationEventResult
    >;
}

export interface AnalyticsIngestionServiceDependencies {
  findCampaign:
    typeof findMonetizationCampaignById;

  findEventByKey:
    typeof findMonetizationCampaignEventByKey;

  createEvent:
    typeof createMonetizationCampaignEvent;

  createPendingValidation:
    typeof createPendingMonetizationEventValidation;

  now:
    () => Date;
}

export interface CreateAnalyticsIngestionServiceOptions {
  dependencies?:
    Partial<
      AnalyticsIngestionServiceDependencies
    >;
}

function assertEventTime(
  occurredAt: Date,
  receivedAt: Date
): void {
  const occurredTimestamp =
    occurredAt.getTime();

  const receivedTimestamp =
    receivedAt.getTime();

  if (
    !Number.isFinite(
      occurredTimestamp
    )
  ) {
    throw new AnalyticsIngestionError(
      "ANALYTICS_EVENT_TIME_INVALID",
      "The campaign event occurrence time is invalid."
    );
  }

  if (
    occurredTimestamp >
    receivedTimestamp +
      MAX_FUTURE_EVENT_MILLISECONDS
  ) {
    throw new AnalyticsIngestionError(
      "ANALYTICS_EVENT_TIME_INVALID",
      "The campaign event occurrence time is too far in the future."
    );
  }

  if (
    occurredTimestamp <
    receivedTimestamp -
      MAX_EVENT_AGE_MILLISECONDS
  ) {
    throw new AnalyticsIngestionError(
      "ANALYTICS_EVENT_TIME_INVALID",
      "The campaign event is older than the accepted ingestion window."
    );
  }
}

function assertExistingEventMatches(
  existing:
    MonetizationCampaignEventRecord,
  input:
    IngestMonetizationEventInput
): void {
  if (
    existing.campaignId !==
      input.campaignId ||
    existing.eventType !==
      input.eventType ||
    existing.placement !==
      input.placement ||
    existing.occurredAt.getTime() !==
      input.occurredAt.getTime()
  ) {
    throw new AnalyticsIngestionError(
      "ANALYTICS_EVENT_KEY_CONFLICT",
      "The event key is already associated with a different campaign event."
    );
  }
}

export function createAnalyticsIngestionService(
  options:
    CreateAnalyticsIngestionServiceOptions =
    {}
): AnalyticsIngestionService {
  const dependencies:
    AnalyticsIngestionServiceDependencies = {
    findCampaign:
      findMonetizationCampaignById,

    findEventByKey:
      findMonetizationCampaignEventByKey,

    createEvent:
      createMonetizationCampaignEvent,

    createPendingValidation:
      createPendingMonetizationEventValidation,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    ingest:
      async input =>
        await runDatabaseTransaction(
          async executor => {
            const receivedAt =
              dependencies.now();

            assertEventTime(
              input.occurredAt,
              receivedAt
            );

            const campaign =
              await dependencies
                .findCampaign(
                  input.campaignId,
                  executor
                );

            if (
              !campaign
            ) {
              throw new AnalyticsIngestionError(
                "ANALYTICS_CAMPAIGN_NOT_FOUND",
                "The campaign linked to this event was not found."
              );
            }

            if (
              campaign.status !==
                "active" ||
              !campaign.deliveryEligible
            ) {
              throw new AnalyticsIngestionError(
                "ANALYTICS_CAMPAIGN_NOT_ELIGIBLE",
                "The campaign is not currently eligible for delivery events."
              );
            }

            if (
              !campaign.placements.includes(
                input.placement
              )
            ) {
              throw new AnalyticsIngestionError(
                "ANALYTICS_PLACEMENT_NOT_ALLOWED",
                "The event placement is not enabled for this campaign."
              );
            }

            const existing =
              await dependencies
                .findEventByKey(
                  input.eventKey,
                  executor
                );

            if (
              existing
            ) {
              assertExistingEventMatches(
                existing,
                input
              );

              const validation =
                await dependencies
                  .createPendingValidation(
                    {
                      eventId:
                        existing.id,
                    },
                    executor
                  );

              return {
                event:
                  existing,

                validation,

                idempotent:
                  true,
              };
            }

            const created =
              await dependencies
                .createEvent(
                  {
                    ...input,

                    receivedAt,
                  },
                  executor
                );

            if (
              created
            ) {
              const validation =
                await dependencies
                  .createPendingValidation(
                    {
                      eventId:
                        created.id,
                    },
                    executor
                  );

              return {
                event:
                  created,

                validation,

                idempotent:
                  false,
              };
            }

            const concurrentExisting =
              await dependencies
                .findEventByKey(
                  input.eventKey,
                  executor
                );

            if (
              !concurrentExisting
            ) {
              throw new AnalyticsIngestionError(
                "ANALYTICS_EVENT_CREATION_FAILED",
                "The campaign event could not be created or recovered."
              );
            }

            assertExistingEventMatches(
              concurrentExisting,
              input
            );

            const validation =
              await dependencies
                .createPendingValidation(
                  {
                    eventId:
                      concurrentExisting.id,
                  },
                  executor
                );

            return {
              event:
                concurrentExisting,

              validation,

              idempotent:
                true,
            };
          }
        ),
  };
}