import {
  createCopyrightApiError,
} from "./copyright-api.errors";

import {
  parseCopyrightCaseDetails,
  parseCopyrightListResponse,
} from "./copyright-api.validation";

import type {
  AdminCopyrightCaseDetails,
  AdminCopyrightListResponse,
  CopyrightDismissRequest,
  CopyrightRemoveRequest,
  CopyrightRestoreRequest,
} from "./copyright-api.types";

const COPYRIGHT_ENDPOINT =
  "/api/v1/admin/copyright";

async function requestJson(
  endpoint: string,
  init: RequestInit,
  signal?:
    AbortSignal
): Promise<unknown> {
  const response =
    await fetch(
      endpoint,
      {
        ...init,

        cache:
          "no-store",

        credentials:
          "include",

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

        signal,
      }
    );

  if (
    !response.ok
  ) {
    throw await createCopyrightApiError(
      response
    );
  }

  return await response.json();
}

export async function fetchCopyrightCases(
  signal?:
    AbortSignal
): Promise<AdminCopyrightListResponse> {
  return parseCopyrightListResponse(
    await requestJson(
      COPYRIGHT_ENDPOINT,
      {
        method:
          "GET",
      },
      signal
    )
  );
}

export async function fetchCopyrightCaseDetails(
  caseId: string,
  signal?:
    AbortSignal
): Promise<AdminCopyrightCaseDetails> {
  return parseCopyrightCaseDetails(
    await requestJson(
      `${COPYRIGHT_ENDPOINT}/${encodeURIComponent(
        caseId
      )}`,
      {
        method:
          "GET",
      },
      signal
    )
  );
}

export async function removeCopyrightContent(
  caseId: string,
  input:
    CopyrightRemoveRequest,
  signal?:
    AbortSignal
): Promise<AdminCopyrightCaseDetails> {
  return parseCopyrightCaseDetails(
    await requestJson(
      `${COPYRIGHT_ENDPOINT}/${encodeURIComponent(
        caseId
      )}/remove`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      },
      signal
    )
  );
}

export async function dismissCopyrightCase(
  caseId: string,
  input:
    CopyrightDismissRequest,
  signal?:
    AbortSignal
): Promise<AdminCopyrightCaseDetails> {
  return parseCopyrightCaseDetails(
    await requestJson(
      `${COPYRIGHT_ENDPOINT}/${encodeURIComponent(
        caseId
      )}/dismiss`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      },
      signal
    )
  );
}

export async function restoreCopyrightCase(
  caseId: string,
  input:
    CopyrightRestoreRequest,
  signal?:
    AbortSignal
): Promise<AdminCopyrightCaseDetails> {
  return parseCopyrightCaseDetails(
    await requestJson(
      `${COPYRIGHT_ENDPOINT}/${encodeURIComponent(
        caseId
      )}/restore`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),
      },
      signal
    )
  );
}