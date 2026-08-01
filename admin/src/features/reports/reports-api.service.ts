import {
  createReportsApiError,
} from "./reports-api.errors";

import {
  parseReportDetails,
  parseReportsListResponse,
} from "./reports-api.validation";

import type {
  AdminReportDetails,
  AdminReportsListResponse,
  ReportActionRequest,
  RouteReportToCopyrightRequest,
} from "./reports-api.types";

const REPORTS_ENDPOINT =
  "/api/v1/admin/reports";

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
    throw await createReportsApiError(
      response
    );
  }

  return await response.json();
}

export async function fetchReports(
  signal?:
    AbortSignal
): Promise<AdminReportsListResponse> {
  return parseReportsListResponse(
    await requestJson(
      REPORTS_ENDPOINT,
      {
        method:
          "GET",
      },
      signal
    )
  );
}

export async function fetchActionableReports(
  signal?:
    AbortSignal
): Promise<AdminReportsListResponse> {
  return parseReportsListResponse(
    await requestJson(
      `${REPORTS_ENDPOINT}/actionable`,
      {
        method:
          "GET",
      },
      signal
    )
  );
}

export async function fetchReportDetails(
  reportId: string,
  signal?:
    AbortSignal
): Promise<AdminReportDetails> {
  return parseReportDetails(
    await requestJson(
      `${REPORTS_ENDPOINT}/${encodeURIComponent(
        reportId
      )}`,
      {
        method:
          "GET",
      },
      signal
    )
  );
}

export async function resolveReport(
  reportId: string,
  input:
    ReportActionRequest,
  signal?:
    AbortSignal
): Promise<AdminReportDetails> {
  return parseReportDetails(
    await requestJson(
      `${REPORTS_ENDPOINT}/${encodeURIComponent(
        reportId
      )}/resolve`,
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

export async function dismissReport(
  reportId: string,
  input:
    ReportActionRequest,
  signal?:
    AbortSignal
): Promise<AdminReportDetails> {
  return parseReportDetails(
    await requestJson(
      `${REPORTS_ENDPOINT}/${encodeURIComponent(
        reportId
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

export async function routeReportToCopyright(
  reportId: string,
  input:
    RouteReportToCopyrightRequest,
  signal?:
    AbortSignal
): Promise<AdminReportDetails> {
  return parseReportDetails(
    await requestJson(
      `${REPORTS_ENDPOINT}/${encodeURIComponent(
        reportId
      )}/route-copyright`,
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