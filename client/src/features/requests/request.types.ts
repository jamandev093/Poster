export type ClientRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type ClientRequestStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type ClientPlacement =
  | "home"
  | "search"
  | "trending";

export interface ClientRequestCreative {
  headline: string;
  body: string;
  callToAction: string;
  destinationUrl: string;
}

export interface ClientRequestRecord {
  id: string;
  type: ClientRequestType;
  status: ClientRequestStatus;

  organization: string;
  contactName: string;
  businessEmail: string;
  website: string;

  campaignName: string;
  submittedAt: string;

  requestedPlacements: ClientPlacement[];
  requestedStartDate: string;
  requestedEndDate: string;

  proposedBudget?: number;
  proposedContractValue?: number;
  commissionModel?: string;
  conversionDefinition?: string;

  creative: ClientRequestCreative;

  reviewNote?: string;
  linkedCampaignId?: string;
}