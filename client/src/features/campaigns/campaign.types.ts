import type {
  CommercialCreative,
} from "../workspace/workspace.types";

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

  /**
   * null means conversion tracking is unavailable.
   * 0 means tracking is connected and zero conversions
   * were recorded.
   */
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

  placements:
    ClientCampaignPlacement[];

  startDate: string;

  endDate: string;

  trackingStatus:
    ClientTrackingStatus;

  conversionDefinition?: string;

  /**
   * Exact Admin-approved creative snapshot assigned
   * to this CMP campaign.
   *
   * The source is the canonical workspace campaign
   * record. It remains separate from the original
   * commercial request because approved creative can
   * differ after Admin review/corrections.
   */
  creative?: CommercialCreative;

  performance:
    ClientCampaignPerformance;

  financials:
    ClientCampaignFinancials;
}