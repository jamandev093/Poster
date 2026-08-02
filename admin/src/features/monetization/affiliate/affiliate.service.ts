import type {
  AffiliateApiErrorBody,
  AffiliateCampaignListResponse,
  AffiliateDetailResponse,
  AffiliateMetadataCreateRequest,
  AffiliateMetadataUpdateRequest,
} from "./affiliate.types";

import {
  AffiliateRequestError,
} from "./affiliate.errors";

const ADMIN_API_PREFIX =
  "/api/v1/admin";

async function parseError(
  response:
    Response
): Promise<
  AffiliateRequestError
> {
  let body:
    AffiliateApiErrorBody = {};

  try {
    body =
      await response.json() as
        AffiliateApiErrorBody;
  } catch {
    body = {};
  }

  return new AffiliateRequestError({
    code:
      body.error?.code ??
      "AFFILIATE_REQUEST_FAILED",

    message:
      body.error?.message ??
      "Affiliate campaigns could not be loaded.",

    status:
      response.status,

    requestId:
      body.error?.requestId ??
      null,

    issues:
      body.error?.details ??
      [],
  });
}

async function requestJson<
  TResult
>(
  input:
    RequestInfo | URL,
  init?:
    RequestInit
): Promise<TResult> {
  const response =
    await fetch(
      input,
      {
        credentials:
          "include",

        cache:
          "no-store",

        ...init,

        headers: {
          accept:
            "application/json",

          ...(init?.body
            ? {
                "content-type":
                  "application/json",
              }
            : {}),

          ...init?.headers,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw await parseError(
      response
    );
  }

  return await response.json() as
    TResult;
}

export async function listAffiliateCampaigns(): Promise<
  AffiliateCampaignListResponse
> {
  const query =
    new URLSearchParams({
      campaignType:
        "affiliate",

      limit:
        "100",

      offset:
        "0",
    });

  return await requestJson<
    AffiliateCampaignListResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/campaigns?${query.toString()}`
  );
}

export async function getAffiliateDetail(
  campaignId:
    string
): Promise<
  AffiliateDetailResponse
> {
  return await requestJson<
    AffiliateDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/affiliates/${encodeURIComponent(
      campaignId
    )}`
  );
}

export async function createAffiliateMetadata(
  campaignId:
    string,
  input:
    AffiliateMetadataCreateRequest
): Promise<
  AffiliateDetailResponse
> {
  return await requestJson<
    AffiliateDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/affiliates/${encodeURIComponent(
      campaignId
    )}/metadata`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          input
        ),
    }
  );
}

export async function updateAffiliateMetadata(
  campaignId:
    string,
  input:
    AffiliateMetadataUpdateRequest
): Promise<
  AffiliateDetailResponse
> {
  return await requestJson<
    AffiliateDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/affiliates/${encodeURIComponent(
      campaignId
    )}/metadata`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify(
          input
        ),
    }
  );
}