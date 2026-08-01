import type {
  AdminReport,
  AdminReportAuditEvent,
  AdminReportCopyrightCase,
  AdminReportDetails,
  AdminReportsListResponse,
  AdminReportSummary,
} from "./reports-api.types";

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

function isReport(
  value: unknown
): value is AdminReport {
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
      value.reportType
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.reporterName
    ) &&
    isString(
      value.reporterReference
    ) &&
    isString(
      value.affectedKind
    ) &&
    isString(
      value.affectedRecordId
    ) &&
    isString(
      value.affectedTitle
    ) &&
    isString(
      value.affectedMetadata
    ) &&
    isString(
      value.reason
    ) &&
    isBoolean(
      value.routedToCopyright
    ) &&
    isNullableString(
      value.copyrightCaseId
    ) &&
    isNullableString(
      value.resolutionNote
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

function isReportSummary(
  value: unknown
): value is AdminReportSummary {
  return (
    isRecord(
      value
    ) &&
    isReport(
      value.report
    )
  );
}

function isAuditEvent(
  value: unknown
): value is AdminReportAuditEvent {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.id
    ) &&
    isString(
      value.reportId
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

function isCopyrightCase(
  value: unknown
): value is AdminReportCopyrightCase {
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

export function parseReportsListResponse(
  value: unknown
): AdminReportsListResponse {
  if (
    !isRecord(
      value
    ) ||
    !isIsoTimestamp(
      value.generatedAt
    ) ||
    !Array.isArray(
      value.reports
    ) ||
    !value.reports.every(
      isReportSummary
    )
  ) {
    throw new TypeError(
      "The Reports API returned an invalid list response."
    );
  }

  return value as unknown as
    AdminReportsListResponse;
}

export function parseReportDetails(
  value: unknown
): AdminReportDetails {
  if (
    !isRecord(
      value
    ) ||
    !isReport(
      value.report
    ) ||
    !Array.isArray(
      value.audit
    ) ||
    !value.audit.every(
      isAuditEvent
    ) ||
    !(
      value.copyrightCase ===
        null ||
      isCopyrightCase(
        value.copyrightCase
      )
    )
  ) {
    throw new TypeError(
      "The Reports API returned invalid report details."
    );
  }

  return value as unknown as
    AdminReportDetails;
}