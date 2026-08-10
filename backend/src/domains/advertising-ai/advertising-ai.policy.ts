import {
  ADVERTISING_AI_EVENT_TYPES,
  type AdvertisingAiEligibilityFacts,
  type AdvertisingAiLearningSignal,
} from "./advertising-ai.types.js";

export const ADVERTISING_AI_DATA_DOMAIN =
  "advertising" as const;

export const ADVERTISING_AI_ORGANIC_DATA_ALLOWED =
  false as const;

export interface AdvertisingAiEligibilityDecision {
  readonly eligible:
    boolean;

  readonly reasonCodes:
    readonly string[];
}

export function evaluateAdvertisingAiHardEligibility(
  facts:
    AdvertisingAiEligibilityFacts
): AdvertisingAiEligibilityDecision {
  const failures:
    string[] =
    [];

  if (!facts.campaignDeliveryEligible) {
    failures.push(
      "campaign_not_delivery_eligible"
    );
  }

  if (!facts.placementAllowed) {
    failures.push(
      "placement_not_allowed"
    );
  }

  if (!facts.frameApproved) {
    failures.push(
      "frame_not_approved"
    );
  }

  if (!facts.safetyAllowed) {
    failures.push(
      "safety_blocked"
    );
  }

  if (!facts.regionAllowed) {
    failures.push(
      "region_blocked"
    );
  }

  if (!facts.deviceAllowed) {
    failures.push(
      "device_blocked"
    );
  }

  if (!facts.frequencyAllowed) {
    failures.push(
      "frequency_blocked"
    );
  }

  if (!facts.budgetAvailable) {
    failures.push(
      "budget_unavailable"
    );
  }

  if (!facts.notHiddenByUser) {
    failures.push(
      "hidden_by_user"
    );
  }

  return {
    eligible:
      failures.length === 0,

    reasonCodes:
      failures,
  };
}

export function assertAdvertisingAiLearningSignal(
  value:
    AdvertisingAiLearningSignal
): AdvertisingAiLearningSignal {
  if (
    (
      value as {
        domain?: unknown;
      }
    ).domain !==
    ADVERTISING_AI_DATA_DOMAIN
  ) {
    throw new Error(
      "Advertising AI accepts advertising learning signals only."
    );
  }

  if (
    !ADVERTISING_AI_EVENT_TYPES.includes(
      value.eventType
    )
  ) {
    throw new Error(
      "Advertising AI event type is invalid."
    );
  }

  if (
    typeof value.candidateId !==
      "string" ||
    value.candidateId.trim().length ===
      0
  ) {
    throw new Error(
      "Advertising AI candidate id is required."
    );
  }

  const occurredAt =
    new Date(
      value.occurredAt
    );

  if (
    Number.isNaN(
      occurredAt.getTime()
    )
  ) {
    throw new Error(
      "Advertising AI event timestamp is invalid."
    );
  }

  return value;
}