import type {
  MonetizationCampaignEventRecord,
  MonetizationEventPlacement,
  MonetizationEventType,
  MonetizationEventValidationRecord,
} from "../../domains/monetization/index.js";

export interface IngestMonetizationEventInput {
  eventKey: string;

  campaignId: string;

  eventType:
    MonetizationEventType;

  placement:
    MonetizationEventPlacement;

  occurredAt: Date;

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

export interface IngestMonetizationEventResult {
  event:
    MonetizationCampaignEventRecord;

  validation:
    MonetizationEventValidationRecord;

  idempotent: boolean;
}