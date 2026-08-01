import type {
  MonetizationCampaignEventRecord,
} from "../../domains/monetization/index.js";

export const ANALYTICS_VALIDATOR_VERSION =
  "poster-analytics-validator-v1";

export const ANALYTICS_DUPLICATE_WINDOW_SECONDS =
  30;

export const ANALYTICS_VALIDATION_REASON_CODES = [
  "event_time_invalid",
  "event_too_old",
  "missing_request_key",
  "duplicate_request_event",
] as const;

export type AnalyticsValidationReasonCode =
  (typeof ANALYTICS_VALIDATION_REASON_CODES)[number];

export interface AnalyticsValidationDecision {
  status:
    "valid" |
    "invalid" |
    "duplicate";

  invalidReasonCodes:
    AnalyticsValidationReasonCode[];

  duplicateOfEventId:
    string |
    null;
}

const MAX_FUTURE_EVENT_MILLISECONDS =
  5 * 60 * 1000;

const MAX_EVENT_AGE_MILLISECONDS =
  30 * 24 * 60 * 60 * 1000;

function requiresRequestKey(
  event:
    MonetizationCampaignEventRecord
): boolean {
  return (
    event.eventType ===
      "click" ||
    event.eventType ===
      "conversion"
  );
}

export function evaluateMonetizationEventValidation(
  input: {
    event:
      MonetizationCampaignEventRecord;

    trustedDuplicate:
      MonetizationCampaignEventRecord |
      null;

    evaluatedAt: Date;
  }
): AnalyticsValidationDecision {
  const reasons:
    AnalyticsValidationReasonCode[] =
      [];

  const occurredAt =
    input.event
      .occurredAt
      .getTime();

  const receivedAt =
    input.event
      .receivedAt
      .getTime();

  const evaluatedAt =
    input.evaluatedAt
      .getTime();

  if (
    !Number.isFinite(
      occurredAt
    ) ||
    !Number.isFinite(
      receivedAt
    ) ||
    occurredAt >
      receivedAt +
        MAX_FUTURE_EVENT_MILLISECONDS
  ) {
    reasons.push(
      "event_time_invalid"
    );
  }

  if (
    !Number.isFinite(
      evaluatedAt
    ) ||
    occurredAt <
      evaluatedAt -
        MAX_EVENT_AGE_MILLISECONDS
  ) {
    reasons.push(
      "event_too_old"
    );
  }

  if (
    requiresRequestKey(
      input.event
    ) &&
    !input.event.requestKeyHash
  ) {
    reasons.push(
      "missing_request_key"
    );
  }

  if (
    reasons.length > 0
  ) {
    return {
      status:
        "invalid",

      invalidReasonCodes:
        reasons,

      duplicateOfEventId:
        null,
    };
  }

  if (
    input.trustedDuplicate
  ) {
    return {
      status:
        "duplicate",

      invalidReasonCodes: [
        "duplicate_request_event",
      ],

      duplicateOfEventId:
        input.trustedDuplicate.id,
    };
  }

  return {
    status:
      "valid",

    invalidReasonCodes:
      [],

    duplicateOfEventId:
      null,
  };
}