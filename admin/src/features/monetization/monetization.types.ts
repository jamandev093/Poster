export type CampaignType =
  | "direct_sponsorship"
  | "affiliate"
  | "poster_promotion"
  | "programmatic";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled";

export type CommercialRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type CommercialRequestStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type Placement =
  | "home"
  | "search"
  | "trending";

export type BillingModel =
  | "fixed_contract"
  | "budget_based"
  | "cpm"
  | "cpc"
  | "cpa"
  | "affiliate"
  | "internal_promotion";

export type TrackingStatus =
  | "connected"
  | "not_configured"
  | "unavailable";

export interface CampaignPerformance {
  impressions: number;

  clicks: number;

  /**
   * null means conversion tracking is not available.
   *
   * This is intentionally different from 0.
   *
   * 0 = tracking worked and recorded zero conversions.
   * null = conversions were not tracked.
   */
  conversions: number | null;

  previousImpressions?: number;

  previousClicks?: number;

  previousConversions?:
    | number
    | null;
}

export interface CampaignFinancials {
  currency: "INR";

  /**
   * Used primarily for fixed direct sponsorship agreements.
   */
  contractValue?: number;

  /**
   * Used for budget-based campaigns.
   */
  budget?: number;

  /**
   * Amount of a budget already consumed.
   */
  utilized?: number;

  /**
   * Spend/cost where the commercial model requires it.
   */
  spend?: number;

  /**
   * Revenue attributable to the campaign.
   */
  revenue?: number;

  /**
   * Affiliate commission earned.
   */
  commission?: number;

  /**
   * Internal or external campaign cost where applicable.
   */
  cost?: number;

  /**
   * Revenue minus applicable cost.
   */
  netEarnings?: number;

  /**
   * Guaranteed delivery target, normally impressions.
   */
  deliveryTarget?: number;

  /**
   * Delivered amount against the target.
   */
  delivered?: number;
}

export interface CampaignRecord {
  id: string;

  requestId?: string;

  name: string;

  type: CampaignType;

  status: CampaignStatus;

  organization: string;

  placements: Placement[];

  billingModel: BillingModel;

  startDate: string;

  endDate: string;

  destinationUrl?: string;

  trackingStatus: TrackingStatus;

  conversionDefinition?: string;

  performance: CampaignPerformance;

  financials: CampaignFinancials;
}

export interface CommercialCreative {
  headline: string;

  body: string;

  callToAction: string;

  destinationUrl: string;

  imageName?: string;

  logoName?: string;
}

export interface CommercialRequest {
  id: string;

  type: CommercialRequestType;

  status: CommercialRequestStatus;

  organization: string;

  contactName: string;

  businessEmail: string;

  website: string;

  campaignName: string;

  submittedAt: string;

  requestedPlacements: Placement[];

  requestedStartDate: string;

  requestedEndDate: string;

  proposedBudget?: number;

  proposedContractValue?: number;

  commissionModel?: string;

  conversionDefinition?: string;

  rightsConfirmed: boolean;

  creative: CommercialCreative;

  linkedCampaignId?: string;

  reviewNote?: string;
}

export function calculateCtr(
  impressions: number,
  clicks: number
): number {
  if (
    impressions <= 0
  ) {
    return 0;
  }

  return (
    (clicks /
      impressions) *
    100
  );
}

export function calculateConversionRate(
  clicks: number,
  conversions:
    | number
    | null
): number | null {
  if (
    conversions === null
  ) {
    return null;
  }

  if (
    clicks <= 0
  ) {
    return 0;
  }

  return (
    (conversions /
      clicks) *
    100
  );
}

export function calculateDeliveryProgress(
  target?: number,
  delivered?: number
): number | null {
  if (
    !target ||
    target <= 0 ||
    delivered === undefined
  ) {
    return null;
  }

  return Math.min(
    (delivered /
      target) *
      100,
    100
  );
}