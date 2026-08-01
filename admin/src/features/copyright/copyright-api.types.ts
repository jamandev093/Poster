export type CopyrightRequestType =
  | "copyright_strike"
  | "copyright_request"
  | "publisher_removal";

export type CopyrightCaseStatus =
  | "needs_action"
  | "removed"
  | "resolved";

export type CopyrightVerificationStatus =
  | "pending"
  | "verified"
  | "needs_review";

export type CopyrightCaseAction =
  | "removed"
  | "removed_prevent_reimport"
  | "dismissed"
  | "restored";

export type CopyrightVerificationCheckKey =
  | "poster_content_match"
  | "original_work_match"
  | "claimant_identity_match"
  | "business_contact_match"
  | "source_context_match"
  | "supporting_reference_match";

export type CopyrightVerificationCheckStatus =
  | "passed"
  | "review"
  | "failed";

export type CopyrightEvidenceType =
  | "original_work_url"
  | "supporting_url"
  | "document"
  | "screenshot"
  | "correspondence"
  | "publisher_reference"
  | "other";

export type DiscoveryContentAcquisitionMethod =
  | "api"
  | "rss"
  | "embed"
  | "agreement"
  | "link_only";

export type DiscoveryContentStatus =
  | "active"
  | "removed";

export type DiscoveryContentRemovalReason =
  | "copyright"
  | "publisher_request"
  | "policy"
  | "quality"
  | null;

export interface AdminCopyrightCase {
  id: string;

  publicId: string;

  requestType:
    CopyrightRequestType;

  status:
    CopyrightCaseStatus;

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

  verificationStatus:
    CopyrightVerificationStatus;

  actionTaken:
    CopyrightCaseAction |
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

export interface AdminCopyrightContent {
  id: string;

  publicId: string;

  sourceId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  acquisitionMethod:
    DiscoveryContentAcquisitionMethod;

  status:
    DiscoveryContentStatus;

  publishedAt:
    string |
    null;

  addedAt: string;

  removedAt:
    string |
    null;

  removalReason:
    DiscoveryContentRemovalReason;

  removalNote:
    string |
    null;

  copyrightCaseId:
    string |
    null;

  copyrightClaimant:
    string |
    null;

  preventReimport: boolean;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminCopyrightVerificationCheck {
  id: string;

  caseId: string;

  checkKey:
    CopyrightVerificationCheckKey;

  label: string;

  status:
    CopyrightVerificationCheckStatus;

  detail: string;

  verifiedByUserId:
    string |
    null;

  verifiedAt:
    string |
    null;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminCopyrightEvidenceReference {
  id: string;

  caseId: string;

  evidenceType:
    CopyrightEvidenceType;

  label: string;

  referenceValue: string;

  storageObjectKey:
    string |
    null;

  sha256Digest:
    string |
    null;

  submittedAt: string;

  createdAt: string;
}

export interface AdminCopyrightAuditEvent {
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

  occurredAt: string;
}

export interface AdminCopyrightContentAuditEvent {
  id: string;

  entityType:
    "content" |
    "source";

  sourceId:
    string |
    null;

  contentId:
    string |
    null;

  action: string;

  actorUserId:
    string |
    null;

  actorLabel: string;

  metadata:
    Record<
      string,
      unknown
    >;

  occurredAt: string;
}

export interface AdminCopyrightCaseSummary {
  case:
    AdminCopyrightCase;

  content:
    AdminCopyrightContent;
}

export interface AdminCopyrightCaseDetails
  extends AdminCopyrightCaseSummary {
  verificationChecks:
    AdminCopyrightVerificationCheck[];

  evidence:
    AdminCopyrightEvidenceReference[];

  audit:
    AdminCopyrightAuditEvent[];

  contentAudit:
    AdminCopyrightContentAuditEvent[];
}

export interface AdminCopyrightListResponse {
  generatedAt: string;

  cases:
    AdminCopyrightCaseSummary[];
}

export interface CopyrightRemoveRequest {
  expectedRowVersion: string;

  contentExpectedRowVersion: string;

  internalNote:
    string |
    null;

  preventReimport: boolean;
}

export interface CopyrightDismissRequest {
  expectedRowVersion: string;
}

export interface CopyrightRestoreRequest {
  expectedRowVersion: string;

  contentExpectedRowVersion: string;
}