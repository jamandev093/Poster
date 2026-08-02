import type {
  JsonObject,
} from "./commercial.types.js";

export const AFFILIATE_DISCLOSURE =
  "Affiliate · Poster may earn a commission";

export const AFFILIATE_COMMISSION_MODELS = [
  "cpa",
  "cpc",
  "revenue_share",
  "flat_fee",
  "hybrid",
] as const;

export type AffiliateCommissionModel =
  (typeof AFFILIATE_COMMISSION_MODELS)[number];

export const AFFILIATE_TRACKING_STATUSES = [
  "not_configured",
  "pending_verification",
  "active",
  "paused",
  "blocked",
] as const;

export type AffiliateTrackingStatus =
  (typeof AFFILIATE_TRACKING_STATUSES)[number];

export const AFFILIATE_PAYOUT_READINESS_STATUSES = [
  "not_ready",
  "ready",
  "blocked",
] as const;

export type AffiliatePayoutReadinessStatus =
  (typeof AFFILIATE_PAYOUT_READINESS_STATUSES)[number];

export interface AffiliateMetadataRecord {
  campaignId:
    string;

  partnerName:
    string;

  offerName:
    string;

  destinationUrl:
    string;

  disclosure:
    typeof AFFILIATE_DISCLOSURE;

  commissionModel:
    AffiliateCommissionModel;

  commissionTerms:
    JsonObject;

  trackingStatus:
    AffiliateTrackingStatus;

  trackingUrl:
    string | null;

  payoutReadinessStatus:
    AffiliatePayoutReadinessStatus;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface AffiliateMetadataDraftInput {
  partnerName:
    string;

  offerName:
    string;

  destinationUrl:
    string;

  disclosure:
    typeof AFFILIATE_DISCLOSURE;

  commissionModel:
    AffiliateCommissionModel;

  commissionTerms:
    JsonObject;

  trackingStatus:
    AffiliateTrackingStatus;

  trackingUrl:
    string | null;

  payoutReadinessStatus:
    AffiliatePayoutReadinessStatus;
}

export interface CreateAffiliateMetadataInput
  extends AffiliateMetadataDraftInput {
  campaignId:
    string;

  createdAt:
    Date;
}

export interface UpdateAffiliateMetadataInput
  extends AffiliateMetadataDraftInput {
  campaignId:
    string;

  expectedRowVersion:
    string;

  updatedAt:
    Date;
}

export type AffiliateMetadataMutationOutcome =
  | {
      status:
        "updated";

      metadata:
        AffiliateMetadataRecord;
    }
  | {
      status:
        "conflict";

      metadata:
        AffiliateMetadataRecord;
    }
  | {
      status:
        "not_found";
    };

export interface AffiliateValidationIssue {
  field:
    string;

  code:
    | "required"
    | "invalid"
    | "too_short"
    | "too_long"
    | "unsupported";

  message:
    string;
}