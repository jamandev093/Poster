export type ClientCampaignType =
  | "direct_sponsorship"
  | "affiliate";

export type ClientCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

export type ClientCampaignPlacement =
  | "home"
  | "search"
  | "trending";

export type ClientTrackingStatus =
  | "connected"
  | "not_configured"
  | "unavailable";

export interface ClientCampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number | null;
}

export interface ClientCampaignFinancials {
  currency: "INR";

  contractValue?: number;
  budget?: number;
  commission?: number;
  revenue?: number;

  deliveryTarget?: number;
  delivered?: number;
}

export interface ClientCampaignRecord {
  id: string;
  requestId: string;

  name: string;
  type: ClientCampaignType;
  status: ClientCampaignStatus;

  organization: string;
  placements: ClientCampaignPlacement[];

  startDate: string;
  endDate: string;

  trackingStatus: ClientTrackingStatus;
  conversionDefinition?: string;

  performance: ClientCampaignPerformance;
  financials: ClientCampaignFinancials;
}