export type CampaignType =
  | "poster_promotion"
  | "affiliate"
  | "direct_sponsorship"
  | "programmatic";

export type CampaignOrigin =
  | "client_request"
  | "admin_internal"
  | "programmatic_provider";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled";

export type CampaignReadinessStatus =
  | "pending_setup"
  | "ready"
  | "blocked";

export type CampaignCommercialStatus =
  | "approved"
  | "pending_funding"
  | "funded"
  | "blocked";

export type CampaignPlacement =
  | "home"
  | "search"
  | "trending";

export interface AdminCampaign {
  id: string;

  campaignReference: string;

  sourceRequestId:
    string |
    null;

  organizationId: string;

  name: string;

  campaignType:
    CampaignType;

  origin:
    CampaignOrigin;

  status:
    CampaignStatus;

  placements:
    CampaignPlacement[];

  scheduledStartDate: string;

  scheduledEndDate: string;

  readinessStatus:
    CampaignReadinessStatus;

  commercialStatus:
    CampaignCommercialStatus;

  deliveryEligible: boolean;

  createdByUserId: string;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminCampaignListResponse {
  items:
    AdminCampaign[];

  total: number;

  limit: number;

  offset: number;
}

export interface AdminCampaignDetailsResponse {
  campaign:
    AdminCampaign;
}

export interface ListAdminCampaignsInput {
  status?:
    CampaignStatus |
    null;

  campaignType?:
    CampaignType |
    null;

  organizationId?:
    string |
    null;

  limit?: number;

  offset?: number;
}

interface ApiErrorBody {
  error?: {
    message?: unknown;
  };
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value ===
    "string";
}

function isNullableString(
  value: unknown
): value is
  | string
  | null {
  return (
    value === null ||
    isString(
      value
    )
  );
}

function isCampaign(
  value: unknown
): value is AdminCampaign {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.campaignReference
    ) &&
    isNullableString(
      value.sourceRequestId
    ) &&
    isString(
      value.organizationId
    ) &&
    isString(
      value.name
    ) &&
    isString(
      value.campaignType
    ) &&
    isString(
      value.origin
    ) &&
    isString(
      value.status
    ) &&
    Array.isArray(
      value.placements
    ) &&
    value.placements.every(
      isString
    ) &&
    isString(
      value.scheduledStartDate
    ) &&
    isString(
      value.scheduledEndDate
    ) &&
    isString(
      value.readinessStatus
    ) &&
    isString(
      value.commercialStatus
    ) &&
    typeof value.deliveryEligible ===
      "boolean" &&
    isString(
      value.createdByUserId
    ) &&
    isString(
      value.createdAt
    ) &&
    isString(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

function parseListResponse(
  value: unknown
): AdminCampaignListResponse {
  if (
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.items
    ) ||
    !value.items.every(
      isCampaign
    ) ||
    typeof value.total !==
      "number" ||
    typeof value.limit !==
      "number" ||
    typeof value.offset !==
      "number"
  ) {
    throw new TypeError(
      "The Campaign API returned an invalid list response."
    );
  }

  return value as unknown as
    AdminCampaignListResponse;
}

function parseDetailsResponse(
  value: unknown
): AdminCampaignDetailsResponse {
  if (
    !isRecord(
      value
    ) ||
    !isCampaign(
      value.campaign
    )
  ) {
    throw new TypeError(
      "The Campaign API returned invalid campaign details."
    );
  }

  return value as unknown as
    AdminCampaignDetailsResponse;
}

async function createApiError(
  response: Response
): Promise<Error> {
  let message =
    `Campaign request failed (${response.status}).`;

  try {
    const body =
      await response.json() as
        ApiErrorBody;

    if (
      typeof body.error
        ?.message ===
      "string"
    ) {
      message =
        body.error.message;
    }
  } catch {
    // Preserve the safe fallback.
  }

  if (
    response.status ===
    401
  ) {
    message =
      "Your Admin session has expired. Sign in again.";
  } else if (
    response.status ===
    403
  ) {
    message =
      "You do not have permission to view campaigns.";
  }

  return new Error(
    message
  );
}

async function requestJson(
  url: string
): Promise<unknown> {
  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (
    !response.ok
  ) {
    throw await createApiError(
      response
    );
  }

  return await response.json();
}

export async function listAdminCampaigns(
  input:
    ListAdminCampaignsInput =
    {}
): Promise<AdminCampaignListResponse> {
  const query =
    new URLSearchParams();

  if (
    input.status
  ) {
    query.set(
      "status",
      input.status
    );
  }

  if (
    input.campaignType
  ) {
    query.set(
      "campaignType",
      input.campaignType
    );
  }

  if (
    input.organizationId
  ) {
    query.set(
      "organizationId",
      input.organizationId
    );
  }

  query.set(
    "limit",
    String(
      input.limit ??
      100
    )
  );

  query.set(
    "offset",
    String(
      input.offset ??
      0
    )
  );

  return parseListResponse(
    await requestJson(
      `/api/v1/admin/monetization/campaigns?${query.toString()}`
    )
  );
}

export async function getAdminCampaign(
  campaignId: string
): Promise<AdminCampaignDetailsResponse> {
  return parseDetailsResponse(
    await requestJson(
      `/api/v1/admin/monetization/campaigns/${encodeURIComponent(
        campaignId
      )}`
    )
  );
}

export function formatCampaignTimestamp(
  value: string
): string {
  const date =
    new Date(
      value
    );

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}