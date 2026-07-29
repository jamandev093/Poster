export const COMMERCIAL_REQUEST_TYPES = [
  "direct_sponsorship",
  "affiliate",
] as const;

export type CommercialRequestType =
  (typeof COMMERCIAL_REQUEST_TYPES)[number];

export const COMMERCIAL_REQUEST_STATUSES = [
  "pending_review",
  "changes_requested",
  "approved",
  "rejected",
] as const;

export type CommercialRequestStatus =
  (typeof COMMERCIAL_REQUEST_STATUSES)[number];

export const MONETIZATION_PLACEMENTS = [
  "home",
  "search",
  "trending",
] as const;

export type MonetizationPlacement =
  (typeof MONETIZATION_PLACEMENTS)[number];

export const CAMPAIGN_TYPES = [
  "poster_promotion",
  "affiliate",
  "direct_sponsorship",
  "programmatic",
] as const;

export type CampaignType =
  (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_ORIGINS = [
  "client_request",
  "admin_internal",
  "programmatic_provider",
] as const;

export type CampaignOrigin =
  (typeof CAMPAIGN_ORIGINS)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "ended",
  "disabled",
] as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_READINESS_STATUSES = [
  "pending_setup",
  "ready",
  "blocked",
] as const;

export type CampaignReadinessStatus =
  (typeof CAMPAIGN_READINESS_STATUSES)[number];

export const CAMPAIGN_COMMERCIAL_STATUSES = [
  "approved",
  "pending_funding",
  "funded",
  "blocked",
] as const;

export type CampaignCommercialStatus =
  (typeof CAMPAIGN_COMMERCIAL_STATUSES)[number];

export type JsonObject =
  Record<string, unknown>;

export interface CommercialRequestRecord {
  id: string;
  requestReference: string;
  organizationId: string;
  submittedByUserId: string;
  requestType: CommercialRequestType;
  status: CommercialRequestStatus;
  title: string;
  objective: string;
  destinationUrl: string;
  requestedPlacements: readonly MonetizationPlacement[];
  requestedStartDate: string;
  requestedEndDate: string;
  budgetMinorUnits: string | null;
  currencyCode: string | null;
  creativeSpec: JsonObject;
  commercialTerms: JsonObject;
  submittedAt: Date;
  decidedAt: Date | null;
  decidedByUserId: string | null;
  decisionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CommercialRequestRevisionRecord {
  id: string;
  requestId: string;
  revisionNumber: number;
  submittedByUserId: string;
  payload: JsonObject;
  createdAt: Date;
}

export interface MonetizationCampaignRecord {
  id: string;
  campaignReference: string;
  sourceRequestId: string | null;
  organizationId: string;
  name: string;
  campaignType: CampaignType;
  origin: CampaignOrigin;
  status: CampaignStatus;
  placements: readonly MonetizationPlacement[];
  scheduledStartDate: string;
  scheduledEndDate: string;
  readinessStatus: CampaignReadinessStatus;
  commercialStatus: CampaignCommercialStatus;
  deliveryEligible: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CommercialRequestDraftInput {
  requestType: CommercialRequestType;
  title: string;
  objective: string;
  destinationUrl: string;
  requestedPlacements: readonly MonetizationPlacement[];
  requestedStartDate: string;
  requestedEndDate: string;
  budgetMinorUnits?: number | null | undefined;
  currencyCode?: string | null | undefined;
  creativeSpec: JsonObject;
  commercialTerms: JsonObject;
}

export interface CreateCommercialRequestInput
  extends CommercialRequestDraftInput {
  requestReference: string;
  organizationId: string;
  submittedByUserId: string;
  submittedAt: Date;
}

export interface ResubmitCommercialRequestInput
  extends CommercialRequestDraftInput {
  requestId: string;
  organizationId: string;
  submittedByUserId: string;
  expectedRowVersion: string;
  submittedAt: Date;
}

export interface CreateCommercialRequestRevisionInput {
  requestId: string;
  submittedByUserId: string;
  payload: JsonObject;
  createdAt: Date;
}

export interface ListCommercialRequestsInput {
  organizationId?: string | null | undefined;
  status?: CommercialRequestStatus | null | undefined;
  requestType?: CommercialRequestType | null | undefined;
  limit: number;
  offset: number;
}

export interface CommercialRequestListResult {
  items: CommercialRequestRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommercialDecisionInput {
  requestId: string;
  actorUserId: string;
  expectedRowVersion: string;
  decisionNote: string | null;
  decidedAt: Date;
}

export interface ApproveCommercialRequestInput
  extends CommercialDecisionInput {
  campaignReference: string;
  campaignName: string | null;
}

export type CommercialRequestMutationOutcome =
  | {
      status: "not_found";
    }
  | {
      status: "conflict";
      request: CommercialRequestRecord;
    }
  | {
      status: "updated";
      request: CommercialRequestRecord;
    };

export type CommercialRequestApprovalOutcome =
  | {
      status: "not_found";
    }
  | {
      status: "conflict";
      request: CommercialRequestRecord;
    }
  | {
      status: "approved";
      request: CommercialRequestRecord;
      campaign: MonetizationCampaignRecord;
      idempotent: boolean;
    };
