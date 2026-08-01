import type {
  CopyrightCaseStatus,
} from "./copyright-case.types.js";

export interface CopyrightAuditEventRecord {
  id: string;

  caseId: string;

  action: string;

  actorUserId:
    string |
    null;

  actorLabel: string;

  previousStatus:
    CopyrightCaseStatus |
    null;

  resultingStatus:
    CopyrightCaseStatus |
    null;

  metadata:
    Record<
      string,
      unknown
    >;

  occurredAt: Date;
}

export interface AppendCopyrightAuditEventInput {
  caseId: string;

  action: string;

  actorUserId:
    string |
    null;

  actorLabel: string;

  previousStatus:
    CopyrightCaseStatus |
    null;

  resultingStatus:
    CopyrightCaseStatus |
    null;

  metadata?:
    Record<
      string,
      unknown
    >;

  occurredAt: Date;
}