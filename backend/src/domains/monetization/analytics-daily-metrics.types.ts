import type {
  MonetizationEventPlacement,
} from "./analytics-event.types.js";

export interface MonetizationDailyMetricRecord {
  campaignId: string;

  metricDate: string;

  placement:
    MonetizationEventPlacement;

  validImpressions: string;

  invalidImpressions: string;

  duplicateImpressions: string;

  validClicks: string;

  invalidClicks: string;

  duplicateClicks: string;

  validConversions: string;

  invalidConversions: string;

  duplicateConversions: string;

  unattributedConversions: string;

  sourceEventWatermark:
    Date |
    null;

  finalizedAt:
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface AggregateMonetizationDailyMetricInput {
  campaignId: string;

  metricDate: string;

  placement:
    MonetizationEventPlacement;

  finalizedAt?:
    Date |
    null;
}