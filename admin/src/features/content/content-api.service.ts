import {
  isIsoTimestamp,
  isNullableIsoTimestamp,
  isNullableString,
  isRecord,
  readApiErrorMessage,
} from "../content-sources/api-response";

import type {
  OperationalAuditEvent,
} from "../content-sources/content-sources.types";

import type {
  AdminContentDetailsResponse,
  AdminContentListResponse,
  AdminContentRecord,
  RemoveAdminContentRequest,
  RestoreAdminContentRequest,
} from "./content-api.types";

const CONTENT_ENDPOINT =
  "/api/v1/admin/content";

const ACQUISITION_METHODS =
  new Set([
    "api",
    "rss",
    "embed",
    "agreement",
    "link_only",
  ]);

const CONTENT_STATUSES =
  new Set([
    "active",
    "removed",
  ]);

const REMOVAL_REASONS =
  new Set([
    "copyright",
    "publisher_request",
    "misleading_unsafe",
    "broken_unavailable",
    "other",
  ]);

function parseAuditEvent(
  value: unknown
): OperationalAuditEvent {
  if (
    !isRecord(
      value
    ) ||
    typeof value.id !== "string" ||
    typeof value.action !== "string" ||
    !isNullableString(
      value.actorUserId
    ) ||
    typeof value.actorLabel !== "string" ||
    !isRecord(
      value.metadata
    ) ||
    !isIsoTimestamp(
      value.occurredAt
    )
  ) {
    throw new Error(
      "The Backend returned an invalid audit event."
    );
  }

  return value as unknown as OperationalAuditEvent;
}

function parseContentRecord(
  value: unknown
): AdminContentRecord {
  if (
    !isRecord(
      value
    ) ||
    typeof value.id !== "string" ||
    typeof value.publicId !== "string" ||
    typeof value.sourceId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.publisherName !== "string" ||
    typeof value.originalUrl !== "string" ||
    typeof value.acquisitionMethod !== "string" ||
    !ACQUISITION_METHODS.has(
      value.acquisitionMethod
    ) ||
    typeof value.status !== "string" ||
    !CONTENT_STATUSES.has(
      value.status
    ) ||
    !isNullableIsoTimestamp(
      value.publishedAt
    ) ||
    !isIsoTimestamp(
      value.addedAt
    ) ||
    !isNullableIsoTimestamp(
      value.removedAt
    ) ||
    !(
      value.removalReason === null ||
      (
        typeof value.removalReason === "string" &&
        REMOVAL_REASONS.has(
          value.removalReason
        )
      )
    ) ||
    !isNullableString(
      value.removalNote
    ) ||
    !isNullableString(
      value.copyrightCaseId
    ) ||
    !isNullableString(
      value.copyrightClaimant
    ) ||
    typeof value.preventReimport !== "boolean" ||
    !isIsoTimestamp(
      value.createdAt
    ) ||
    !isIsoTimestamp(
      value.updatedAt
    ) ||
    typeof value.rowVersion !== "string"
  ) {
    throw new Error(
      "The Backend returned incomplete content data."
    );
  }

  return value as unknown as AdminContentRecord;
}

function parseContentList(
  value: unknown
): AdminContentListResponse {
  if (
    !isRecord(
      value
    ) ||
    !isIsoTimestamp(
      value.generatedAt
    ) ||
    !Array.isArray(
      value.records
    )
  ) {
    throw new Error(
      "The Backend returned an invalid content response."
    );
  }

  return {
    generatedAt:
      value.generatedAt,

    records:
      value.records.map(
        parseContentRecord
      ),
  };
}

function parseContentDetails(
  value: unknown
): AdminContentDetailsResponse {
  if (
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.audit
    )
  ) {
    throw new Error(
      "The Backend returned invalid content details."
    );
  }

  return {
    record:
      parseContentRecord(
        value.record
      ),

    audit:
      value.audit.map(
        parseAuditEvent
      ),
  };
}

async function requestJson(
  url: string,
  init: RequestInit,
  fallbackLabel: string
): Promise<unknown> {
  const response =
    await fetch(
      url,
      {
        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",

          ...(init.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },

        ...init,
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await readApiErrorMessage(
        response,
        fallbackLabel
      )
    );
  }

  return await response.json();
}

export async function fetchAdminContent(
  signal?: AbortSignal
): Promise<AdminContentListResponse> {
  return parseContentList(
    await requestJson(
      CONTENT_ENDPOINT,
      {
        method:
          "GET",

        signal,
      },
      "load content"
    )
  );
}

export async function fetchAdminContentDetails(
  contentId: string,
  signal?: AbortSignal
): Promise<AdminContentDetailsResponse> {
  return parseContentDetails(
    await requestJson(
      `${CONTENT_ENDPOINT}/${encodeURIComponent(
        contentId
      )}`,
      {
        method:
          "GET",

        signal,
      },
      "load content details"
    )
  );
}

export async function removeAdminContent(
  contentId: string,
  input:
    RemoveAdminContentRequest,
  signal?: AbortSignal
): Promise<AdminContentDetailsResponse> {
  return parseContentDetails(
    await requestJson(
      `${CONTENT_ENDPOINT}/${encodeURIComponent(
        contentId
      )}/remove`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),

        signal,
      },
      "remove content"
    )
  );
}

export async function restoreAdminContent(
  contentId: string,
  input:
    RestoreAdminContentRequest,
  signal?: AbortSignal
): Promise<AdminContentDetailsResponse> {
  return parseContentDetails(
    await requestJson(
      `${CONTENT_ENDPOINT}/${encodeURIComponent(
        contentId
      )}/restore`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),

        signal,
      },
      "restore content"
    )
  );
}