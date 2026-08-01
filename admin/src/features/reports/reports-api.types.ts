export type AdminReportType =
  | "misleading_content"
  | "broken_link"
  | "inappropriate_content"
  | "publisher_issue"
  | "commercial_report"
  | "copyright";

export type AdminReportStatus =
  | "needs_action"
  | "resolved"
  | "dismissed";

export type AdminReportAffectedKind =
  | "content"
  | "source"
  | "campaign";

export interface AdminReport {
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

  receivedAt: string;

  resolvedAt:
    string |
    null;

  resolvedByUserId:
    string |
    null;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminReportAuditEvent {
  id: string;

  reportId: string;

  action: string;

  actorUserId:
    string |
    null;

  actorLabel: string;

  previousStatus:
    AdminReportStatus |
    null;

  resultingStatus:
    AdminReportStatus |
    null;

  metadata:
    Record<
      string,
      unknown
    >;

  occurredAt: string;
}

export interface AdminReportCopyrightCase {
  id: string;

  publicId: string;

  requestType: string;

  status: string;

  contentId: string;

  claimantName: string;

  claimantType: string;

  claimantBusinessEmail:
    string |
    null;

  claimantWebsiteUrl:
    string |
    null;

  claimantReference:
    string |
    null;

  requestReason: string;

  submittedOriginalUrl:
    string |
    null;

  supportingInformation:
    string |
    null;

  verificationStatus: string;

  actionTaken:
    string |
    null;

  preventReimport: boolean;

  receivedAt: string;

  resolvedAt:
    string |
    null;

  resolvedByUserId:
    string |
    null;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminReportSummary {
  report:
    AdminReport;
}

export interface AdminReportDetails
  extends AdminReportSummary {
  audit:
    AdminReportAuditEvent[];

  copyrightCase:
    AdminReportCopyrightCase |
    null;
}

export interface AdminReportsListResponse {
  generatedAt: string;

  reports:
    AdminReportSummary[];
}

export interface ReportActionRequest {
  expectedRowVersion: string;

  resolutionNote?:
    string |
    null;
}

export interface RouteReportToCopyrightRequest
  extends ReportActionRequest {
  copyrightCaseId: string;
}

export type ReportRunningAction =
  | "resolve"
  | "dismiss"
  | "route_copyright";