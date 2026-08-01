import type {
  AdminReportStatus,
} from "./admin-report.types.js";

export interface AdminReportAuditEventRecord {
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

  occurredAt: Date;
}

export interface AppendAdminReportAuditEventInput {
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

  metadata?:
    Record<
      string,
      unknown
    >;

  occurredAt: Date;
}