import type {
  MonetizationEventPlacement,
} from "./analytics-event.types.js";

export interface MonetizationAnalyticsMetricTotals {
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
}

export interface MonetizationAnalyticsPlacementRecord
  extends MonetizationAnalyticsMetricTotals {
  placement:
    MonetizationEventPlacement;

  ctr: number;
}

export interface MonetizationAnalyticsCampaignRecord
  extends MonetizationAnalyticsMetricTotals {
  campaignId: string;

  campaignReference: string;

  campaignName: string;

  campaignType: string;

  campaignStatus: string;

  ctr: number;

  latestSourceEventWatermark:
    Date |
    null;

  finalizedMetricRows: number;

  totalMetricRows: number;
}

export interface MonetizationAnalyticsOverviewRecord
  extends MonetizationAnalyticsMetricTotals {
  startDate: string;

  endDate: string;

  ctr: number;

  latestSourceEventWatermark:
    Date |
    null;

  finalizedMetricRows: number;

  totalMetricRows: number;

  placements:
    MonetizationAnalyticsPlacementRecord[];

  campaigns:
    MonetizationAnalyticsCampaignRecord[];
}

export interface ReadMonetizationAnalyticsInput {
  startDate: string;

  endDate: string;

  campaignId?:
    string |
    null;

  organizationId?:
    string |
    null;
}