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

  readinessStatus?:
    string;

  commercialStatus?:
    string;

  title?:
    string;

  campaignName?:
    string;

  objective?:
    string;

  destinationUrl?:
    string;

  requestedPlacements?:
    ClientCommercialRequestPlacement[];

  requestedStartDate?:
    string;

  requestedEndDate?:
    string;

  budgetMinorUnits?:
    number |
    null;

  currencyCode?:
    string |
    null;

  creativeSpec?:
    ClientCommercialRequestJsonObject;

  commercialTerms?:
    ClientCommercialRequestJsonObject;

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

export interface ClientCommercialRequestRevision {
  id:
    string;

  requestId:
    string;

  revisionNumber?:
    number;

  createdAt:
    string;

  changeReason?:
    string |
    null;
}

export interface ClientCommercialRequestMutationResponse {
  request:
    ClientCommercialRequestApiRecord;
}

export interface ClientCommercialRequestListResponse {
  requests:
    ClientCommercialRequestApiRecord[];
}

export interface ClientCommercialRequestDetailResponse {
  request:
    ClientCommercialRequestApiRecord;

  revisions?:
    ClientCommercialRequestRevision[];
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

export interface ListClientCommercialRequestsInput {
  organizationId:
    string;

  limit?:
    number;

  offset?:
    number;
}

export interface GetClientCommercialRequestInput {
  organizationId:
    string;

  requestId:
    string;
}

function encodePathSegment(
  value:
    string
): string {
  return encodeURIComponent(
    value.trim()
  );
}

function normalizeLimit(
  limit:
    number |
    undefined
): number | undefined {
  if (
    limit === undefined ||
    !Number.isFinite(
      limit
    )
  ) {
    return undefined;
  }

  return Math.max(
    1,
    Math.min(
      100,
      Math.trunc(
        limit
      )
    )
  );
}

function normalizeOffset(
  offset:
    number |
    undefined
): number | undefined {
  if (
    offset === undefined ||
    !Number.isFinite(
      offset
    )
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.trunc(
      offset
    )
  );
}

export async function listClientCommercialRequests(
  input:
    ListClientCommercialRequestsInput
): Promise<ClientCommercialRequestApiRecord[]> {
  const response =
    await requestPosterApiJson<ClientCommercialRequestListResponse>(
      `/api/v1/client/organizations/${encodePathSegment(
        input.organizationId
      )}/advertising-requests`,
      {
        method:
          "GET",
      },
      {
        limit:
          normalizeLimit(
            input.limit
          ),

        offset:
          normalizeOffset(
            input.offset
          ),
      }
    );

  return response.requests;
}

export async function getClientCommercialRequest(
  input:
    GetClientCommercialRequestInput
): Promise<ClientCommercialRequestDetailResponse> {
  return await requestPosterApiJson<ClientCommercialRequestDetailResponse>(
    `/api/v1/client/organizations/${encodePathSegment(
      input.organizationId
    )}/advertising-requests/${encodePathSegment(
      input.requestId
    )}`,
    {
      method:
        "GET",
    }
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