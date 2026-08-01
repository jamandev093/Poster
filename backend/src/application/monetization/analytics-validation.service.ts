import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  completeMonetizationEventValidation,
  findMonetizationCampaignEventById,
  findMonetizationEventValidation,
  findTrustedDuplicateMonetizationCampaignEvent,
  type MonetizationEventValidationRecord,
} from "../../domains/monetization/index.js";

import {
  AnalyticsValidationError,
} from "./analytics-validation.errors.js";

import {
  ANALYTICS_DUPLICATE_WINDOW_SECONDS,
  ANALYTICS_VALIDATOR_VERSION,
  evaluateMonetizationEventValidation,
} from "./analytics-validation.policy.js";

export interface ValidateMonetizationEventInput {
  eventId: string;

  expectedRowVersion: string;
}

export interface AnalyticsValidationService {
  validate:
    (
      input:
        ValidateMonetizationEventInput
    ) => Promise<
      MonetizationEventValidationRecord
    >;
}

export interface AnalyticsValidationServiceDependencies {
  findEvent:
    typeof findMonetizationCampaignEventById;

  findValidation:
    typeof findMonetizationEventValidation;

  findTrustedDuplicate:
    typeof findTrustedDuplicateMonetizationCampaignEvent;

  completeValidation:
    typeof completeMonetizationEventValidation;

  now:
    () => Date;
}

export interface CreateAnalyticsValidationServiceOptions {
  dependencies?:
    Partial<
      AnalyticsValidationServiceDependencies
    >;
}

export function createAnalyticsValidationService(
  options:
    CreateAnalyticsValidationServiceOptions =
    {}
): AnalyticsValidationService {
  const dependencies:
    AnalyticsValidationServiceDependencies = {
    findEvent:
      findMonetizationCampaignEventById,

    findValidation:
      findMonetizationEventValidation,

    findTrustedDuplicate:
      findTrustedDuplicateMonetizationCampaignEvent,

    completeValidation:
      completeMonetizationEventValidation,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    validate:
      async input =>
        await runDatabaseTransaction(
          async executor => {
            const event =
              await dependencies
                .findEvent(
                  input.eventId,
                  executor
                );

            if (
              !event
            ) {
              throw new AnalyticsValidationError(
                "ANALYTICS_EVENT_NOT_FOUND",
                "The monetization campaign event was not found."
              );
            }

            const validation =
              await dependencies
                .findValidation(
                  event.id,
                  executor
                );

            if (
              !validation
            ) {
              throw new AnalyticsValidationError(
                "ANALYTICS_VALIDATION_NOT_FOUND",
                "The pending validation record for this campaign event was not found."
              );
            }

            if (
              validation.validationStatus !==
              "pending"
            ) {
              throw new AnalyticsValidationError(
                "ANALYTICS_VALIDATION_ALREADY_COMPLETED",
                "This campaign event validation has already been completed."
              );
            }

            const trustedDuplicate =
              await dependencies
                .findTrustedDuplicate(
                  {
                    eventId:
                      event.id,

                    campaignId:
                      event.campaignId,

                    eventType:
                      event.eventType,

                    placement:
                      event.placement,

                    requestKeyHash:
                      event.requestKeyHash,

                    occurredAt:
                      event.occurredAt,

                    duplicateWindowSeconds:
                      ANALYTICS_DUPLICATE_WINDOW_SECONDS,
                  },
                  executor
                );

            const validatedAt =
              dependencies.now();

            const decision =
              evaluateMonetizationEventValidation({
                event,
                trustedDuplicate,
                evaluatedAt:
                  validatedAt,
              });

            const completed =
              await dependencies
                .completeValidation(
                  {
                    eventId:
                      event.id,

                    expectedRowVersion:
                      input.expectedRowVersion,

                    validationStatus:
                      decision.status,

                    invalidReasonCodes:
                      decision
                        .invalidReasonCodes,

                    duplicateOfEventId:
                      decision
                        .duplicateOfEventId,

                    validatorVersion:
                      ANALYTICS_VALIDATOR_VERSION,

                    validatedAt,
                  },
                  executor
                );

            if (
              !completed
            ) {
              throw new AnalyticsValidationError(
                "ANALYTICS_VALIDATION_VERSION_CONFLICT",
                "The event validation changed before completion. Refresh and retry."
              );
            }

            return completed;
          }
        ),
  };
}