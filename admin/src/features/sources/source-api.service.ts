import {
  isIsoTimestamp,
  isNonNegativeInteger,
  isNullableIsoTimestamp,
  isNullableString,
  isRecord,
  readApiErrorMessage,
} from "../content-sources/api-response";

import type {
  OperationalAuditEvent,
} from "../content-sources/content-sources.types";

import type {
  AdminSourceDetailsResponse,
  AdminSourceListResponse,
  AdminSourceRecord,
  BlockSourceRequest,
  SourceLifecycleRequest,
} from "./source-api.types";

const SOURCE_ENDPOINT =
  "/api/v1/admin/sources";

const ACQUISITION_METHODS =
  new Set([
    "api",
    "rss",
    "embed",
    "agreement",
    "link_only",
  ]);

const SOURCE_STATUSES =
  new Set([
    "active",
    "paused",
    "blocked",
  ]);

const SOURCE_HEALTH_VALUES =
  new Set([
    "healthy",
    "issue",
    "offline",
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
      "The Backend returned an invalid source audit event."
    );
  }

  return value as unknown as OperationalAuditEvent;
}

function parseSourceRecord(
  value: unknown
): AdminSourceRecord {
  if (
    !isRecord(
      value
    ) ||
    typeof value.id !== "string" ||
    typeof value.publicId !== "string" ||
    typeof value.name !== "string" ||
    typeof value.websiteUrl !== "string" ||
    typeof value.acquisitionMethod !== "string" ||
    !ACQUISITION_METHODS.has(
      value.acquisitionMethod
    ) ||
    typeof value.status !== "string" ||
    !SOURCE_STATUSES.has(
      value.status
    ) ||
    typeof value.health !== "string" ||
    !SOURCE_HEALTH_VALUES.has(
      value.health
    ) ||
    typeof value.displayPolicy !== "string" ||
    !isNullableString(
      value.operationalNote
    ) ||
    !isNullableIsoTimestamp(
      value.lastSyncAt
    ) ||
    !isNullableString(
      value.lastSyncError
    ) ||
    !isNonNegativeInteger(
      value.activeContentCount
    ) ||
    !isIsoTimestamp(
      value.createdAt
    ) ||
    !isIsoTimestamp(
      value.updatedAt
    ) ||
    !isNullableIsoTimestamp(
      value.pausedAt
    ) ||
    !isNullableIsoTimestamp(
      value.blockedAt
    ) ||
    typeof value.rowVersion !== "string"
  ) {
    throw new Error(
      "The Backend returned incomplete source data."
    );
  }

  return value as unknown as AdminSourceRecord;
}

function parseSourceList(
  value: unknown
): AdminSourceListResponse {
  if (
    !isRecord(
      value
    ) ||
    !isIsoTimestamp(
      value.generatedAt
    ) ||
    !Array.isArray(
      value.sources
    )
  ) {
    throw new Error(
      "The Backend returned an invalid source response."
    );
  }

  return {
    generatedAt:
      value.generatedAt,

    sources:
      value.sources.map(
        parseSourceRecord
      ),
  };
}

function parseSourceDetails(
  value: unknown
): AdminSourceDetailsResponse {
  if (
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.audit
    )
  ) {
    throw new Error(
      "The Backend returned invalid source details."
    );
  }

  return {
    source:
      parseSourceRecord(
        value.source
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

export async function fetchAdminSources(
  signal?: AbortSignal
): Promise<AdminSourceListResponse> {
  return parseSourceList(
    await requestJson(
      SOURCE_ENDPOINT,
      {
        method:
          "GET",

        signal,
      },
      "load sources"
    )
  );
}

export async function fetchAdminSourceDetails(
  sourceId: string,
  signal?: AbortSignal
): Promise<AdminSourceDetailsResponse> {
  return parseSourceDetails(
    await requestJson(
      `${SOURCE_ENDPOINT}/${encodeURIComponent(
        sourceId
      )}`,
      {
        method:
          "GET",

        signal,
      },
      "load source details"
    )
  );
}

async function changeSourceLifecycle(
  sourceId: string,
  action:
    | "pause"
    | "enable"
    | "unblock",
  input:
    SourceLifecycleRequest,
  signal?: AbortSignal
): Promise<AdminSourceRecord> {
  const value =
    await requestJson(
      `${SOURCE_ENDPOINT}/${encodeURIComponent(
        sourceId
      )}/${action}`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),

        signal,
      },
      `${action} source`
    );

  if (
    !isRecord(
      value
    )
  ) {
    throw new Error(
      "The Backend returned an invalid source action response."
    );
  }

  return parseSourceRecord(
    value.source
  );
}

export async function pauseAdminSource(
  sourceId: string,
  input:
    SourceLifecycleRequest,
  signal?: AbortSignal
): Promise<AdminSourceRecord> {
  return await changeSourceLifecycle(
    sourceId,
    "pause",
    input,
    signal
  );
}

export async function enableAdminSource(
  sourceId: string,
  input:
    SourceLifecycleRequest,
  signal?: AbortSignal
): Promise<AdminSourceRecord> {
  return await changeSourceLifecycle(
    sourceId,
    "enable",
    input,
    signal
  );
}

export async function unblockAdminSource(
  sourceId: string,
  input:
    SourceLifecycleRequest,
  signal?: AbortSignal
): Promise<AdminSourceRecord> {
  return await changeSourceLifecycle(
    sourceId,
    "unblock",
    input,
    signal
  );
}

export async function blockAdminSource(
  sourceId: string,
  input:
    BlockSourceRequest,
  signal?: AbortSignal
): Promise<AdminSourceRecord> {
  const value =
    await requestJson(
      `${SOURCE_ENDPOINT}/${encodeURIComponent(
        sourceId
      )}/block`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            input
          ),

        signal,
      },
      "block source"
    );

  if (
    !isRecord(
      value
    )
  ) {
    throw new Error(
      "The Backend returned an invalid source block response."
    );
  }

  return parseSourceRecord(
    value.source
  );
}