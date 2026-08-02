import type {
  PosterPromotionApiErrorBody,
  PosterPromotionCampaignListResponse,
  PosterPromotionCreateRequest,
  PosterPromotionDetailResponse,
  PosterPromotionUpdateRequest,
} from "./poster-promotion.api-types";

import {
  PosterPromotionRequestError,
} from "./poster-promotion.errors";

const ADMIN_API_PREFIX =
  "/api/v1/admin";

async function parseError(
  response:
    Response
): Promise<
  PosterPromotionRequestError
> {
  let body:
    PosterPromotionApiErrorBody = {};

  try {
    body =
      await response.json() as
        PosterPromotionApiErrorBody;
  } catch {
    body = {};
  }

  return new PosterPromotionRequestError({
    code:
      body.error?.code ??
      "POSTER_PROMOTION_REQUEST_FAILED",

    message:
      body.error?.message ??
      "The Poster Promotion request could not be completed.",

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

export async function listPosterPromotionCampaigns(): Promise<
  PosterPromotionCampaignListResponse
> {
  const query =
    new URLSearchParams({
      campaignType:
        "poster_promotion",

      limit:
        "100",

      offset:
        "0",
    });

  return await requestJson<
    PosterPromotionCampaignListResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/campaigns?${query.toString()}`
  );
}

export async function getPosterPromotion(
  campaignId:
    string
): Promise<
  PosterPromotionDetailResponse
> {
  return await requestJson<
    PosterPromotionDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/poster-promotions/${encodeURIComponent(
      campaignId
    )}`
  );
}

export async function createPosterPromotion(
  input:
    PosterPromotionCreateRequest
): Promise<
  PosterPromotionDetailResponse
> {
  return await requestJson<
    PosterPromotionDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/poster-promotions`,
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

export async function updatePosterPromotion(
  campaignId:
    string,
  input:
    PosterPromotionUpdateRequest
): Promise<
  PosterPromotionDetailResponse
> {
  return await requestJson<
    PosterPromotionDetailResponse
  >(
    `${ADMIN_API_PREFIX}/monetization/poster-promotions/${encodeURIComponent(
      campaignId
    )}`,
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