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

export type ClientCommercialRequestJsonObject =
  Record<
    string,
    unknown
  >;

export interface ClientCommercialRequestDraft {
  requestType:
    ClientCommercialRequestType;

  title:
    string;

  objective:
    string;

  destinationUrl:
    string;

  requestedPlacements:
    ClientCommercialRequestPlacement[];

  requestedStartDate:
    string;

  requestedEndDate:
    string;

  budgetMinorUnits?:
    number |
    null;

  currencyCode?:
    string |
    null;

  creativeSpec:
    ClientCommercialRequestJsonObject;

  commercialTerms:
    ClientCommercialRequestJsonObject;
}

export interface ClientCommercialRequestApiRecord {
  id:
    string;

  organizationId:
    string;

  requestReference?:
    string;

  requestType?:
    ClientCommercialRequestType;

  type?:
    ClientCommercialRequestType;

  status:
    ClientCommercialRequestStatus;

  title?:
    string;

  campaignName?:
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