import type {
  CopyrightCaseRecord,
} from "../../domains/copyright/index.js";

import type {
  AdminReportAuditEventRecord,
  AdminReportRecord,
} from "../../domains/reports/index.js";

export interface AdminReportSummary {
  report:
    AdminReportRecord;
}

export interface AdminReportDetails
  extends AdminReportSummary {
  audit:
    AdminReportAuditEventRecord[];

  copyrightCase:
    CopyrightCaseRecord |
    null;
}

export interface ReportActorInput {
  actorUserId: string;

  actorLabel: string;
}

export interface ReportActionInput
  extends ReportActorInput {
  reportId: string;

  expectedRowVersion: string;

  resolutionNote?:
    string |
    null;
}

export interface RouteReportToCopyrightInput
  extends ReportActionInput {
  copyrightCaseId: string;
}