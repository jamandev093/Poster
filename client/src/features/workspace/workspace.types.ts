export type CommercialRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type CommercialRequestStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled";

export type Placement =
  | "home"
  | "search"
  | "trending";

export type TrackingStatus =
  | "connected"
  | "not_configured"
  | "unavailable";

export type BillingModel =
  | "fixed_contract"
  | "budget_based"
  | "cpc"
  | "cpm"
  | "cpa"
  | "affiliate";

/**
 * Creative format is independent from:
 *
 * - commercial request type;
 * - campaign placement.
 *
 * Both Direct Sponsorship and Affiliate may request
 * either supported creative layout.
 */
export type CreativeLayout =
  | "standard"
  | "sliding";

export type CreativeMediaType =
  | "image"
  | "video";

export type CreativeMediaRole =
  | "primary"
  | "logo"
  | "slide";

export type CreativeFrameProfile =
  | "standard_media"
  | "sliding_card_media";

export interface CreativeMediaAsset {
  id?: string;

  role: CreativeMediaRole;

  type: CreativeMediaType;

  frameProfile?: CreativeFrameProfile;

  fileName: string;

  mimeType?: string;

  sizeBytes?: number;

  width?: number;

  height?: number;

  /**
   * Browser-side duration detection is supported.
   *
   * Poster advertising videos are limited to
   * 10 seconds maximum.
   */
  durationSeconds?: number;

  /**
   * Browser File APIs do not reliably expose true FPS.
   *
   * Backend media processing will verify that uploaded
   * advertising video is between 30 and 45 FPS.
   */
  framesPerSecond?: number;

  altText?: string;

  /**
   * Permanent URL is populated only after Backend /
   * object-storage upload.
   *
   * Never persist a browser object URL here.
   */
  url?: string;

  /**
   * Generated or uploaded preview/poster for video.
   */
  thumbnailUrl?: string;
}

export type SlidingCardSlot =
  | 1
  | 2
  | 3;

export interface SlidingCreativeCard {
  /**
   * Locked Poster sliding-ad structure:
   *
   * Card 1 -> video
   * Card 2 -> image
   * Card 3 -> image
   *
   * All three render inside the already-finalized
   * square 1:1 sliding-card media frame.
   */
  slot: SlidingCardSlot;

  title: string;

  media: CreativeMediaAsset;
}

export interface CommercialCreative {
  /**
   * STANDARD
   *
   * One image OR one video.
   * Existing finalized mobile frame: 16:9 landscape.
   *
   * SLIDING
   *
   * Exactly three square cards:
   *
   * 1 -> video
   * 2 -> image
   * 3 -> image
   */
  layout?: CreativeLayout;

  headline: string;

  body: string;

  callToAction: string;

  destinationUrl: string;

  /**
   * Used only by standard layout.
   *
   * May be image OR video.
   */
  primaryMedia?: CreativeMediaAsset;

  /**
   * Used only by sliding layout.
   *
   * Locked:
   *
   * - exactly 3 cards;
   * - Card 1 video;
   * - Card 2 image;
   * - Card 3 image;
   * - every card fits the finalized 1:1 frame.
   */
  slidingCards?: SlidingCreativeCard[];

  /**
   * Optional organization/advertiser logo.
   */
  logoMedia?: CreativeMediaAsset;

  /**
   * Temporary backward-compatible fields.
   *
   * Remove only after all legacy mock/request data has
   * migrated to CreativeMediaAsset records.
   */
  imageName?: string;

  logoName?: string;
}

export interface RequestReview {
  requestedChanges: string[];

  reviewNote?: string;

  reviewedAt?: string;
}

export interface CommercialRequest {
  id: string;

  organizationId: string;

  organizationName: string;

  type: CommercialRequestType;

  status: CommercialRequestStatus;

  campaignName: string;

  submittedAt: string;

  updatedAt: string;

  requestedPlacements: Placement[];

  requestedStartDate: string;

  requestedEndDate: string;

  proposedBudget?: number;

  proposedContractValue?: number;

  commissionModel?: string;

  conversionDefinition?: string;

  contactName: string;

  businessEmail: string;

  website: string;

  rightsConfirmed: boolean;

  creative: CommercialCreative;

  review?: RequestReview;

  linkedCampaignId?: string;
}

export interface CampaignPerformance {
  impressions: number;

  clicks: number;

  /**
   * null = conversion tracking unavailable.
   *
   * 0 = tracking active but zero conversions recorded.
   */
  conversions: number | null;
}

export interface CampaignFinancials {
  currency: "INR";

  contractValue?: number;

  budget?: number;

  utilized?: number;

  commission?: number;

  revenue?: number;

  cost?: number;

  netEarnings?: number;

  deliveryTarget?: number;

  delivered?: number;
}

export interface ClientCampaign {
  id: string;

  requestId: string;

  organizationId: string;

  organizationName: string;

  name: string;

  type: CommercialRequestType;

  status: CampaignStatus;

  placements: Placement[];

  billingModel: BillingModel;

  startDate: string;

  endDate: string;

  destinationUrl?: string;

  trackingStatus: TrackingStatus;

  conversionDefinition?: string;

  /**
   * Exact Admin-approved creative snapshot attached
   * to this campaign.
   *
   * Campaign Details can therefore show both:
   *
   * - what advertisement is running;
   * - how that exact campaign is performing.
   */
  creative?: CommercialCreative;

  performance: CampaignPerformance;

  financials: CampaignFinancials;
}

export interface ClientOrganization {
  id: string;

  name: string;

  primaryContactName: string;

  primaryContactEmail: string;

  website: string;
}

export function calculateCtr(
  impressions: number,
  clicks: number
): number {
  if (
    impressions <=
    0
  ) {
    return 0;
  }

  return (
    clicks /
    impressions
  ) * 100;
}

export function calculateConversionRate(
  clicks: number,
  conversions: number | null
): number | null {
  if (
    conversions ===
    null
  ) {
    return null;
  }

  if (
    clicks <=
    0
  ) {
    return conversions ===
      0
      ? 0
      : null;
  }

  return (
    conversions /
    clicks
  ) * 100;
}

export function calculateDeliveryProgress(
  target?: number,
  delivered?: number
): number | null {
  if (
    target ===
      undefined ||
    delivered ===
      undefined ||
    target <=
      0
  ) {
    return null;
  }

  return Math.min(
    (
      delivered /
      target
    ) * 100,
    100
  );
}

export function calculateRevenuePerClick(
  clicks: number,
  revenue?: number
): number | null {
  if (
    revenue ===
    undefined
  ) {
    return null;
  }

  if (
    clicks <=
    0
  ) {
    return 0;
  }

  return (
    revenue /
    clicks
  );
}
