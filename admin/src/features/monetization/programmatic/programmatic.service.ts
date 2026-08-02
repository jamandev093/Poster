import type {
  CreateProgrammaticProviderRequest,
  CreateProgrammaticSlotMappingRequest,
  ProgrammaticApiErrorBody,
  ProgrammaticOverviewResponse,
  ProgrammaticProvider,
  ProgrammaticSlotMapping,
} from "./programmatic.types";

import {
  ProgrammaticRequestError,
} from "./programmatic.errors";

const ADMIN_API_PREFIX =
  "/api/v1/admin";

async function parseError(
  response:
    Response
): Promise<ProgrammaticRequestError> {
  let body:
    ProgrammaticApiErrorBody = {};

  try {
    body =
      await response.json() as
        ProgrammaticApiErrorBody;
  } catch {
    body = {};
  }

  return new ProgrammaticRequestError({
    code:
      body.error?.code ??
      "PROGRAMMATIC_REQUEST_FAILED",

    message:
      body.error?.message ??
      "Programmatic controls could not be loaded.",

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

export async function getProgrammaticOverview(): Promise<
  ProgrammaticOverviewResponse
> {
  return await requestJson<
    ProgrammaticOverviewResponse
  >(
    "/monetization/programmatic"
  );
}

export async function createProgrammaticProvider(
  input:
    CreateProgrammaticProviderRequest
): Promise<
  ProgrammaticProvider
> {
  return await requestJson<
    ProgrammaticProvider
  >(
    "/monetization/programmatic/providers",
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

export async function createProgrammaticSlotMapping(
  input:
    CreateProgrammaticSlotMappingRequest
): Promise<
  ProgrammaticSlotMapping
> {
  return await requestJson<
    ProgrammaticSlotMapping
  >(
    "/monetization/programmatic/slot-mappings",
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