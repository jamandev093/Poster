export type AnalyticsPlacement =
  | "home"
  | "search"
  | "trending";

export interface AnalyticsMetricTotals {
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

export interface AnalyticsPlacementRecord
  extends AnalyticsMetricTotals {
  placement:
    AnalyticsPlacement;

  ctr: number;
}

export interface AnalyticsCampaignRecord
  extends AnalyticsMetricTotals {
  campaignId: string;

  campaignReference: string;

  campaignName: string;

  campaignType: string;

  campaignStatus: string;

  ctr: number;

  latestSourceEventWatermark:
    string |
    null;

  finalizedMetricRows: number;

  totalMetricRows: number;
}

export interface AdminAnalyticsOverview
  extends AnalyticsMetricTotals {
  startDate: string;

  endDate: string;

  ctr: number;

  latestSourceEventWatermark:
    string |
    null;

  finalizedMetricRows: number;

  totalMetricRows: number;

  placements:
    AnalyticsPlacementRecord[];

  campaigns:
    AnalyticsCampaignRecord[];
}

export interface AdminAnalyticsQuery {
  startDate: string;

  endDate: string;

  campaignId?:
    string |
    null;

  organizationId?:
    string |
    null;
}