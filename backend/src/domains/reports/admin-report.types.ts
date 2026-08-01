export const ADMIN_REPORT_TYPES = [
  "misleading_content",
  "broken_link",
  "inappropriate_content",
  "publisher_issue",
  "commercial_report",
  "copyright",
] as const;

export type AdminReportType =
  (typeof ADMIN_REPORT_TYPES)[number];

export const ADMIN_REPORT_STATUSES = [
  "needs_action",
  "resolved",
  "dismissed",
] as const;

export type AdminReportStatus =
  (typeof ADMIN_REPORT_STATUSES)[number];

export const ADMIN_REPORT_AFFECTED_KINDS = [
  "content",
  "source",
  "campaign",
] as const;

export type AdminReportAffectedKind =
  (typeof ADMIN_REPORT_AFFECTED_KINDS)[number];

export interface AdminReportRecord {
  id: string;

  publicId: string;

  reportType:
    AdminReportType;

  status:
    AdminReportStatus;

  reporterName: string;

  reporterReference: string;

  affectedKind:
    AdminReportAffectedKind;

  affectedRecordId: string;

  affectedTitle: string;

  affectedMetadata: string;

  reason: string;

  routedToCopyright: boolean;

  copyrightCaseId:
    string |
    null;

  resolutionNote:
    string |
    null;

  receivedAt: Date;

  resolvedAt:
    Date |
    null;

  resolvedByUserId:
    string |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface CreateAdminReportInput {
  publicId: string;

  reportType:
    AdminReportType;

  reporterName: string;

  reporterReference: string;

  affectedKind:
    AdminReportAffectedKind;

  affectedRecordId: string;

  affectedTitle: string;

  affectedMetadata: string;

  reason: string;

  receivedAt: Date;
}

export interface ResolveAdminReportInput {
  reportId: string;

  expectedRowVersion: string;

  status:
    Extract<
      AdminReportStatus,
      "resolved" |
      "dismissed"
    >;

  resolutionNote:
    string |
    null;

  resolvedAt: Date;

  resolvedByUserId: string;
}

export interface RouteAdminReportToCopyrightInput {
  reportId: string;

  expectedRowVersion: string;

  copyrightCaseId: string;

  resolutionNote:
    string |
    null;

  resolvedAt: Date;

  resolvedByUserId: string;
}

export interface ReopenAdminReportInput {
  reportId: string;

  expectedRowVersion: string;
}

export function normalizeRequiredReportText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalReportText(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}