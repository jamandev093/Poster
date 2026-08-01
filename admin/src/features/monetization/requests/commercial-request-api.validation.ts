import type {
  CommercialRequestApprovalResponse,
  CommercialRequestDetailsResponse,
  CommercialRequestListResponse,
  CommercialRequestMutationResponse,
  CommercialRequestRecord,
  CommercialRequestRevisionRecord,
  MonetizationCampaignRecord,
} from "./commercial-request-api.types";

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

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  );
}

function isTimestamp(
  value: unknown
): value is string {
  return (
    isString(
      value
    ) &&
    Number.isFinite(
      new Date(
        value
      ).getTime()
    )
  );
}

function isNullableTimestamp(
  value: unknown
): value is
  | string
  | null {
  return (
    value === null ||
    isTimestamp(
      value
    )
  );
}

function isCommercialRequest(
  value: unknown
): value is CommercialRequestRecord {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.requestReference
    ) &&
    isString(
      value.organizationId
    ) &&
    isString(
      value.submittedByUserId
    ) &&
    isString(
      value.requestType
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.title
    ) &&
    isString(
      value.objective
    ) &&
    isString(
      value.destinationUrl
    ) &&
    Array.isArray(
      value.requestedPlacements
    ) &&
    value.requestedPlacements.every(
      isString
    ) &&
    isString(
      value.requestedStartDate
    ) &&
    isString(
      value.requestedEndDate
    ) &&
    isNullableString(
      value.budgetMinorUnits
    ) &&
    isNullableString(
      value.currencyCode
    ) &&
    isRecord(
      value.creativeSpec
    ) &&
    isRecord(
      value.commercialTerms
    ) &&
    isTimestamp(
      value.submittedAt
    ) &&
    isNullableTimestamp(
      value.decidedAt
    ) &&
    isNullableString(
      value.decidedByUserId
    ) &&
    isNullableString(
      value.decisionNote
    ) &&
    isTimestamp(
      value.createdAt
    ) &&
    isTimestamp(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

function isRevision(
  value: unknown
): value is CommercialRequestRevisionRecord {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.requestId
    ) &&
    isFiniteNumber(
      value.revisionNumber
    ) &&
    isString(
      value.submittedByUserId
    ) &&
    isRecord(
      value.payload
    ) &&
    isTimestamp(
      value.createdAt
    )
  );
}

function isCampaign(
  value: unknown
): value is MonetizationCampaignRecord {
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
    isString(
      value.organizationId
    ) &&
    isString(
      value.commercialRequestId
    ) &&
    isString(
      value.campaignType
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.name
    ) &&
    typeof value.deliveryEligible ===
      "boolean" &&
    isTimestamp(
      value.createdAt
    ) &&
    isTimestamp(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

export function parseCommercialRequestListResponse(
  value: unknown
): CommercialRequestListResponse {
  if (
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.items
    ) ||
    !value.items.every(
      isCommercialRequest
    ) ||
    !isFiniteNumber(
      value.total
    ) ||
    !isFiniteNumber(
      value.limit
    ) ||
    !isFiniteNumber(
      value.offset
    )
  ) {
    throw new TypeError(
      "The advertising-request API returned an invalid list response."
    );
  }

  return value as unknown as
    CommercialRequestListResponse;
}

export function parseCommercialRequestDetailsResponse(
  value: unknown
): CommercialRequestDetailsResponse {
  if (
    !isRecord(
      value
    ) ||
    !isCommercialRequest(
      value.request
    ) ||
    !Array.isArray(
      value.revisions
    ) ||
    !value.revisions.every(
      isRevision
    )
  ) {
    throw new TypeError(
      "The advertising-request API returned invalid request details."
    );
  }

  return value as unknown as
    CommercialRequestDetailsResponse;
}

export function parseCommercialRequestMutationResponse(
  value: unknown
): CommercialRequestMutationResponse {
  if (
    !isRecord(
      value
    ) ||
    !isCommercialRequest(
      value.request
    )
  ) {
    throw new TypeError(
      "The advertising-request API returned an invalid mutation response."
    );
  }

  return value as unknown as
    CommercialRequestMutationResponse;
}

export function parseCommercialRequestApprovalResponse(
  value: unknown
): CommercialRequestApprovalResponse {
  if (
    !isRecord(
      value
    ) ||
    !isCommercialRequest(
      value.request
    ) ||
    !isCampaign(
      value.campaign
    ) ||
    typeof value.idempotent !==
      "boolean"
  ) {
    throw new TypeError(
      "The advertising-request API returned an invalid approval response."
    );
  }

  return value as unknown as
    CommercialRequestApprovalResponse;
}