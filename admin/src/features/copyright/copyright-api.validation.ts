import type {
  AdminCopyrightCase,
  AdminCopyrightCaseDetails,
  AdminCopyrightCaseSummary,
  AdminCopyrightContent,
  AdminCopyrightListResponse,
} from "./copyright-api.types";

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

function isBoolean(
  value: unknown
): value is boolean {
  return typeof value ===
    "boolean";
}

function isIsoTimestamp(
  value: unknown
): value is string {
  if (
    !isString(
      value
    )
  ) {
    return false;
  }

  return Number.isFinite(
    new Date(
      value
    ).getTime()
  );
}

function isNullableIsoTimestamp(
  value: unknown
): value is
  | string
  | null {
  return (
    value === null ||
    isIsoTimestamp(
      value
    )
  );
}

function isCopyrightCase(
  value: unknown
): value is AdminCopyrightCase {
  if (
    !isRecord(
      value
    )
  ) {
    return false;
  }

  return (
    isString(
      value.id
    ) &&
    isString(
      value.publicId
    ) &&
    isString(
      value.requestType
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.contentId
    ) &&
    isString(
      value.claimantName
    ) &&
    isString(
      value.claimantType
    ) &&
    isNullableString(
      value.claimantBusinessEmail
    ) &&
    isNullableString(
      value.claimantWebsiteUrl
    ) &&
    isNullableString(
      value.claimantReference
    ) &&
    isString(
      value.requestReason
    ) &&
    isNullableString(
      value.submittedOriginalUrl
    ) &&
    isNullableString(
      value.supportingInformation
    ) &&
    isString(
      value.verificationStatus
    ) &&
    isNullableString(
      value.actionTaken
    ) &&
    isBoolean(
      value.preventReimport
    ) &&
    isIsoTimestamp(
      value.receivedAt
    ) &&
    isNullableIsoTimestamp(
      value.resolvedAt
    ) &&
    isNullableString(
      value.resolvedByUserId
    ) &&
    isIsoTimestamp(
      value.createdAt
    ) &&
    isIsoTimestamp(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

function isCopyrightContent(
  value: unknown
): value is AdminCopyrightContent {
  if (
    !isRecord(
      value
    )
  ) {
    return false;
  }

  return (
    isString(
      value.id
    ) &&
    isString(
      value.publicId
    ) &&
    isString(
      value.sourceId
    ) &&
    isString(
      value.title
    ) &&
    isString(
      value.publisherName
    ) &&
    isString(
      value.originalUrl
    ) &&
    isString(
      value.acquisitionMethod
    ) &&
    isString(
      value.status
    ) &&
    isNullableIsoTimestamp(
      value.publishedAt
    ) &&
    isIsoTimestamp(
      value.addedAt
    ) &&
    isNullableIsoTimestamp(
      value.removedAt
    ) &&
    isNullableString(
      value.removalReason
    ) &&
    isNullableString(
      value.removalNote
    ) &&
    isNullableString(
      value.copyrightCaseId
    ) &&
    isNullableString(
      value.copyrightClaimant
    ) &&
    isBoolean(
      value.preventReimport
    ) &&
    isIsoTimestamp(
      value.createdAt
    ) &&
    isIsoTimestamp(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

function isCaseSummary(
  value: unknown
): value is AdminCopyrightCaseSummary {
  return (
    isRecord(
      value
    ) &&
    isCopyrightCase(
      value.case
    ) &&
    isCopyrightContent(
      value.content
    )
  );
}

function isVerificationCheck(
  value: unknown
): boolean {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.caseId
    ) &&
    isString(
      value.checkKey
    ) &&
    isString(
      value.label
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.detail
    ) &&
    isNullableString(
      value.verifiedByUserId
    ) &&
    isNullableIsoTimestamp(
      value.verifiedAt
    ) &&
    isIsoTimestamp(
      value.createdAt
    ) &&
    isIsoTimestamp(
      value.updatedAt
    ) &&
    isString(
      value.rowVersion
    )
  );
}

function isEvidenceReference(
  value: unknown
): boolean {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.caseId
    ) &&
    isString(
      value.evidenceType
    ) &&
    isString(
      value.label
    ) &&
    isString(
      value.referenceValue
    ) &&
    isNullableString(
      value.storageObjectKey
    ) &&
    isNullableString(
      value.sha256Digest
    ) &&
    isIsoTimestamp(
      value.submittedAt
    ) &&
    isIsoTimestamp(
      value.createdAt
    )
  );
}

function isAuditEvent(
  value: unknown
): boolean {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.caseId
    ) &&
    isString(
      value.action
    ) &&
    isNullableString(
      value.actorUserId
    ) &&
    isString(
      value.actorLabel
    ) &&
    isNullableString(
      value.previousStatus
    ) &&
    isNullableString(
      value.resultingStatus
    ) &&
    isRecord(
      value.metadata
    ) &&
    isIsoTimestamp(
      value.occurredAt
    )
  );
}

function isContentAuditEvent(
  value: unknown
): boolean {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.entityType
    ) &&
    isNullableString(
      value.sourceId
    ) &&
    isNullableString(
      value.contentId
    ) &&
    isString(
      value.action
    ) &&
    isNullableString(
      value.actorUserId
    ) &&
    isString(
      value.actorLabel
    ) &&
    isRecord(
      value.metadata
    ) &&
    isIsoTimestamp(
      value.occurredAt
    )
  );
}

export function parseCopyrightListResponse(
  value: unknown
): AdminCopyrightListResponse {
  if (
    !isRecord(
      value
    ) ||
    !isIsoTimestamp(
      value.generatedAt
    ) ||
    !Array.isArray(
      value.cases
    ) ||
    !value.cases.every(
      isCaseSummary
    )
  ) {
    throw new Error(
      "The Backend returned an invalid Copyright case list."
    );
  }

  return value as unknown as
    AdminCopyrightListResponse;
}

export function parseCopyrightCaseDetails(
  value: unknown
): AdminCopyrightCaseDetails {
  if (
    !isCaseSummary(
      value
    ) ||
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.verificationChecks
    ) ||
    !value
      .verificationChecks
      .every(
        isVerificationCheck
      ) ||
    !Array.isArray(
      value.evidence
    ) ||
    !value
      .evidence
      .every(
        isEvidenceReference
      ) ||
    !Array.isArray(
      value.audit
    ) ||
    !value.audit.every(
      isAuditEvent
    ) ||
    !Array.isArray(
      value.contentAudit
    ) ||
    !value
      .contentAudit
      .every(
        isContentAuditEvent
      )
  ) {
    throw new Error(
      "The Backend returned invalid Copyright case details."
    );
  }

  return value as unknown as
    AdminCopyrightCaseDetails;
}