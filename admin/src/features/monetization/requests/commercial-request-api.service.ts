import {
  createCommercialRequestApiError,
} from "./commercial-request-api.errors";

import {
  parseCommercialRequestApprovalResponse,
  parseCommercialRequestDetailsResponse,
  parseCommercialRequestListResponse,
  parseCommercialRequestMutationResponse,
} from "./commercial-request-api.validation";

import type {
  CommercialRequestApprovalInput,
  CommercialRequestApprovalResponse,
  CommercialRequestDecisionInput,
  CommercialRequestDetailsResponse,
  CommercialRequestListResponse,
  CommercialRequestMutationResponse,
  ListCommercialRequestsInput,
} from "./commercial-request-api.types";

const ENDPOINT =
  "/api/v1/admin/monetization/requests";

async function requestJson(
  url: string,
  init:
    RequestInit =
    {}
): Promise<unknown> {
  const response =
    await fetch(
      url,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(
            init.body
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}
          ),

          ...init.headers,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw await createCommercialRequestApiError(
      response
    );
  }

  return await response.json();
}

export async function listCommercialRequests(
  input:
    ListCommercialRequestsInput =
    {}
): Promise<CommercialRequestListResponse> {
  const query =
    new URLSearchParams();

  if (
    input.organizationId
  ) {
    query.set(
      "organizationId",
      input.organizationId
    );
  }

  if (
    input.status
  ) {
    query.set(
      "status",
      input.status
    );
  }

  if (
    input.requestType
  ) {
    query.set(
      "requestType",
      input.requestType
    );
  }

  query.set(
    "limit",
    String(
      input.limit ??
      50
    )
  );

  query.set(
    "offset",
    String(
      input.offset ??
      0
    )
  );

  return parseCommercialRequestListResponse(
    await requestJson(
      `${ENDPOINT}?${query.toString()}`
    )
  );
}

export async function getCommercialRequest(
  requestId: string
): Promise<CommercialRequestDetailsResponse> {
  return parseCommercialRequestDetailsResponse(
    await requestJson(
      `${ENDPOINT}/${encodeURIComponent(
        requestId
      )}`
    )
  );
}

export async function requestCommercialRequestChanges(
  requestId: string,
  input:
    CommercialRequestDecisionInput
): Promise<CommercialRequestMutationResponse> {
  return parseCommercialRequestMutationResponse(
    await requestJson(
      `${ENDPOINT}/${encodeURIComponent(
        requestId
      )}/request-changes`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      }
    )
  );
}

export async function rejectCommercialRequest(
  requestId: string,
  input:
    CommercialRequestDecisionInput
): Promise<CommercialRequestMutationResponse> {
  return parseCommercialRequestMutationResponse(
    await requestJson(
      `${ENDPOINT}/${encodeURIComponent(
        requestId
      )}/reject`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      }
    )
  );
}

export async function approveCommercialRequest(
  requestId: string,
  input:
    CommercialRequestApprovalInput
): Promise<CommercialRequestApprovalResponse> {
  return parseCommercialRequestApprovalResponse(
    await requestJson(
      `${ENDPOINT}/${encodeURIComponent(
        requestId
      )}/approve`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      }
    )
  );
}