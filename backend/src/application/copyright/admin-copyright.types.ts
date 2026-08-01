import type {
  ContentSourceAuditEventRecord,
  DiscoveryContentRecord,
} from "../../domains/content-sources/index.js";

import type {
  CopyrightAuditEventRecord,
  CopyrightCaseRecord,
  CopyrightEvidenceReferenceRecord,
  CopyrightVerificationCheckRecord,
} from "../../domains/copyright/index.js";

export interface AdminCopyrightCaseSummary {
  case:
    CopyrightCaseRecord;

  content:
    DiscoveryContentRecord;
}

export interface AdminCopyrightCaseDetails
  extends AdminCopyrightCaseSummary {
  verificationChecks:
    CopyrightVerificationCheckRecord[];

  evidence:
    CopyrightEvidenceReferenceRecord[];

  audit:
    CopyrightAuditEventRecord[];

  contentAudit:
    ContentSourceAuditEventRecord[];
}

export interface CopyrightActorInput {
  actorUserId:
    string |
    null;

  actorLabel: string;
}

export interface CopyrightCaseActionInput
  extends CopyrightActorInput {
  caseId: string;

  expectedRowVersion: string;
}

export interface RemoveCopyrightContentInput
  extends CopyrightCaseActionInput {
  contentExpectedRowVersion: string;

  internalNote?:
    string |
    null;

  preventReimport: boolean;
}