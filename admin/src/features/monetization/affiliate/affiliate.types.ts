export type AffiliateCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled";

export type AffiliatePlacement =
  | "home"
  | "search"
  | "trending";

export type AffiliateCommissionModel =
  | "cpa"
  | "cpc"
  | "revenue_share"
  | "flat_fee"
  | "hybrid";

export type AffiliateTrackingStatus =
  | "not_configured"
  | "pending_verification"
  | "active"
  | "paused"
  | "blocked";

export type AffiliatePayoutReadinessStatus =
  | "not_ready"
  | "ready"
  | "blocked";

export interface AffiliateCampaign {
  id:
    string;

  campaignReference:
    string;

  sourceRequestId:
    string | null;

  organizationId:
    string;

  name:
    string;

  campaignType:
    "affiliate";

  origin:
    string;

  status:
    AffiliateCampaignStatus;

  placements:
    AffiliatePlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  readinessStatus:
    string;

  commercialStatus:
    string;

  deliveryEligible:
    boolean;

  createdByUserId:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface AffiliateMetadata {
  campaignId:
    string;

  partnerName:
    string;

  offerName:
    string;

  destinationUrl:
    string;

  disclosure:
    "Affiliate · Poster may earn a commission";

  commissionModel:
    AffiliateCommissionModel;

  commissionTerms:
    Record<
      string,
      unknown
    >;

  trackingStatus:
    AffiliateTrackingStatus;

  trackingUrl:
    string | null;

  payoutReadinessStatus:
    AffiliatePayoutReadinessStatus;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface AffiliateDetailResponse {
  campaign:
    AffiliateCampaign;

  metadata:
    AffiliateMetadata | null;
}

export interface AffiliateCampaignListResponse {
  items:
    AffiliateCampaign[];

  total:
    number;

  limit:
    number;

  offset:
    number;
}

export interface AffiliateMetadataCreateRequest {
  partnerName:
    string;

  offerName:
    string;

  destinationUrl:
    string;

  commissionModel:
    AffiliateCommissionModel;

  commissionTerms:
    Record<
      string,
      unknown
    >;

  trackingStatus:
    AffiliateTrackingStatus;

  trackingUrl:
    string | null;

  payoutReadinessStatus:
    AffiliatePayoutReadinessStatus;
}

export interface AffiliateMetadataUpdateRequest
  extends AffiliateMetadataCreateRequest {
  expectedRowVersion:
    string;
}

export interface AffiliateApiIssue {
  path:
    string;

  message:
    string;
}

export interface AffiliateApiErrorBody {
  error?: {
    code?:
      string;

    message?:
      string;

    requestId?:
      string;

    details?:
      AffiliateApiIssue[];
  };
}