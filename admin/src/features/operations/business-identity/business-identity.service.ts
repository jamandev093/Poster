import type {
  BusinessIdentityApiErrorBody,
  BusinessIdentityResponse,
  UpdateBusinessIdentityRequest,
} from "./business-identity.types";

import {
  BusinessIdentityRequestError,
} from "./business-identity.errors";

const ADMIN_API_PREFIX =
  "/api/v1/admin";

async function parseError(
  response:
    Response
): Promise<BusinessIdentityRequestError> {
  let body:
    BusinessIdentityApiErrorBody = {};

  try {
    body =
      await response.json() as
        BusinessIdentityApiErrorBody;
  } catch {
    body = {};
  }

  return new BusinessIdentityRequestError({
    code:
      body.error?.code ??
      "BUSINESS_IDENTITY_REQUEST_FAILED",

    message:
      body.error?.message ??
      "Business identity could not be loaded.",

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

async function requestJson<TResult>(
  path:
    string,
  init?:
    RequestInit
): Promise<TResult> {
  const response =
    await fetch(
      `${ADMIN_API_PREFIX}${path}`,
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

export async function getBusinessIdentity(): Promise<
  BusinessIdentityResponse
> {
  return await requestJson<
    BusinessIdentityResponse
  >(
    "/operations/business-identity"
  );
}

export async function updateBusinessIdentity(
  input:
    UpdateBusinessIdentityRequest
): Promise<
  BusinessIdentityResponse
> {
  return await requestJson<
    BusinessIdentityResponse
  >(
    "/operations/business-identity",
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