import {
  requestPosterApiJson,
} from "@/features/workspace/services/client-api.service";

export type ClientCommercialRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type ClientCommercialRequestStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type ClientCommercialRequestPlacement =
  | "home"
  | "search"
  | "trending";

export type ClientCommercialRequestCreativeLayout =
  | "standard"
  | "sliding";

export interface ClientCommercialRequestMoney {
  minorUnits:
    string;

  currency:
    "INR";
}

export interface ClientCommercialRequestMediaAsset {
  role:
    string;

  type:
    string;

  frameProfile:
    string;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;

  width:
    number;

  height:
    number;

  durationSeconds?:
    number;

  framesPerSecond?:
    number;

  altText?:
    string;

  localPreviewUrl?:
    string;
}

export interface ClientCommercialRequestSlidingCard {
  slot:
    number;

  title:
    string;

  media:
    ClientCommercialRequestMediaAsset;
}

export interface ClientCommercialRequestCreativeDraft {
  layout:
    ClientCommercialRequestCreativeLayout;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  primaryMedia?:
    ClientCommercialRequestMediaAsset;

  logoMedia?:
    ClientCommercialRequestMediaAsset;

  slidingCards?:
    ClientCommercialRequestSlidingCard[];
}

export interface ClientCommercialRequestDraft {
  type:
    ClientCommercialRequestType;

  organizationName:
    string;

  contactName:
    string;

  businessEmail:
    string;

  website:
    string;

  campaignName:
    string;

  requestedPlacements:
    ClientCommercialRequestPlacement[];

  requestedStartDate:
    string;

  requestedEndDate:
    string;

  proposedBudgetMinor?:
    number;

  proposedContractValueMinor?:
    number;

  currencyCode?:
    "INR";

  commissionModel?:
    string;

  conversionDefinition?:
    string;

  creative:
    ClientCommercialRequestCreativeDraft;

  rightsConfirmed:
    boolean;

  campaignAllowanceAccepted:
    boolean;

  metadata?:
    Record<
      string,
      unknown
    >;
}

export interface ClientCommercialRequestApiRecord {
  id:
    string;

  organizationId:
    string;

  organizationName:
    string;

  type:
    ClientCommercialRequestType;

  status:
    ClientCommercialRequestStatus;

  campaignName:
    string;

  submittedAt:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  linkedCampaignId?:
    string |
    null;

  rowVersion?:
    string;
}

export interface ClientCommercialRequestMutationResponse {
  request:
    ClientCommercialRequestApiRecord;
}

export interface SubmitClientCommercialRequestInput {
  organizationId:
    string;

  draft:
    ClientCommercialRequestDraft;
}

export interface ResubmitClientCommercialRequestInput {
  organizationId:
    string;

  requestId:
    string;

  draft:
    ClientCommercialRequestDraft;
}

function encodePathSegment(
  value:
    string
): string {
  return encodeURIComponent(
    value.trim()
  );
}

export async function submitClientCommercialRequest(
  input:
    SubmitClientCommercialRequestInput
): Promise<ClientCommercialRequestApiRecord> {
  const response =
    await requestPosterApiJson<ClientCommercialRequestMutationResponse>(
      `/api/v1/client/organizations/${encodePathSegment(
        input.organizationId
      )}/advertising-requests`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input.draft
          ),
      }
    );

  return response.request;
}

export async function resubmitClientCommercialRequest(
  input:
    ResubmitClientCommercialRequestInput
): Promise<ClientCommercialRequestApiRecord> {
  const response =
    await requestPosterApiJson<ClientCommercialRequestMutationResponse>(
      `/api/v1/client/organizations/${encodePathSegment(
        input.organizationId
      )}/advertising-requests/${encodePathSegment(
        input.requestId
      )}/resubmit`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input.draft
          ),
      }
    );

  return response.request;
}