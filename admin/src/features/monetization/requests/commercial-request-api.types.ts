export type CommercialRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type CommercialRequestStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type MonetizationPlacement =
  | "home"
  | "search"
  | "trending";

export interface CommercialRequestRecord {
  id: string;

  requestReference: string;

  organizationId: string;

  submittedByUserId: string;

  requestType:
    CommercialRequestType;

  status:
    CommercialRequestStatus;

  title: string;

  objective: string;

  destinationUrl: string;

  requestedPlacements:
    MonetizationPlacement[];

  requestedStartDate: string;

  requestedEndDate: string;

  budgetMinorUnits:
    string |
    null;

  currencyCode:
    string |
    null;

  creativeSpec:
    Record<
      string,
      unknown
    >;

  commercialTerms:
    Record<
      string,
      unknown
    >;

  submittedAt: string;

  decidedAt:
    string |
    null;

  decidedByUserId:
    string |
    null;

  decisionNote:
    string |
    null;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface CommercialRequestRevisionRecord {
  id: string;

  requestId: string;

  revisionNumber: number;

  submittedByUserId: string;

  payload:
    Record<
      string,
      unknown
    >;

  createdAt: string;
}

export interface MonetizationCampaignRecord {
  id: string;

  campaignReference: string;

  organizationId: string;

  commercialRequestId: string;

  campaignType:
    CommercialRequestType;

  status: string;

  name: string;

  deliveryEligible: boolean;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface CommercialRequestListResponse {
  items:
    CommercialRequestRecord[];

  total: number;

  limit: number;

  offset: number;
}

export interface CommercialRequestDetailsResponse {
  request:
    CommercialRequestRecord;

  revisions:
    CommercialRequestRevisionRecord[];
}

export interface CommercialRequestMutationResponse {
  request:
    CommercialRequestRecord;
}

export interface CommercialRequestApprovalResponse
  extends CommercialRequestMutationResponse {
  campaign:
    MonetizationCampaignRecord;

  idempotent: boolean;
}

export interface ListCommercialRequestsInput {
  organizationId?:
    string |
    null;

  status?:
    CommercialRequestStatus |
    null;

  requestType?:
    CommercialRequestType |
    null;

  limit?: number;

  offset?: number;
}

export interface CommercialRequestDecisionInput {
  expectedRowVersion: string;

  decisionNote: string;
}

export interface CommercialRequestApprovalInput {
  expectedRowVersion: string;

  decisionNote?:
    string |
    null;

  campaignName?:
    string |
    null;
}