export const MONETIZATION_EVENT_TYPES = [
  "impression",
  "click",
  "conversion",
] as const;

export type MonetizationEventType =
  (typeof MONETIZATION_EVENT_TYPES)[number];

export const MONETIZATION_EVENT_PLACEMENTS = [
  "home",
  "search",
  "trending",
] as const;

export type MonetizationEventPlacement =
  (typeof MONETIZATION_EVENT_PLACEMENTS)[number];

export interface MonetizationCampaignEventRecord {
  id: string;

  eventKey: string;

  campaignId: string;

  eventType:
    MonetizationEventType;

  placement:
    MonetizationEventPlacement;

  occurredAt: Date;

  receivedAt: Date;

  source: string;

  schemaVersion: number;

  sessionKeyHash:
    string |
    null;

  userKeyHash:
    string |
    null;

  requestKeyHash:
    string |
    null;

  destinationHost:
    string |
    null;

  metadata:
    Record<
      string,
      unknown
    >;
}

export interface CreateMonetizationCampaignEventInput {
  eventKey: string;

  campaignId: string;

  eventType:
    MonetizationEventType;

  placement:
    MonetizationEventPlacement;

  occurredAt: Date;

  receivedAt: Date;

  source: string;

  schemaVersion?: number;

  sessionKeyHash?:
    string |
    null;

  userKeyHash?:
    string |
    null;

  requestKeyHash?:
    string |
    null;

  destinationHost?:
    string |
    null;

  metadata?:
    Record<
      string,
      unknown
    >;
}

export function normalizeRequiredAnalyticsText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalAnalyticsText(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}