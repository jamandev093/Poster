export const COPYRIGHT_VERIFICATION_CHECK_KEYS = [
  "poster_content_match",
  "original_work_match",
  "claimant_identity_match",
  "business_contact_match",
  "source_context_match",
  "supporting_reference_match",
] as const;

export type CopyrightVerificationCheckKey =
  (typeof COPYRIGHT_VERIFICATION_CHECK_KEYS)[number];

export const COPYRIGHT_VERIFICATION_CHECK_STATUSES = [
  "passed",
  "review",
  "failed",
] as const;

export type CopyrightVerificationCheckStatus =
  (typeof COPYRIGHT_VERIFICATION_CHECK_STATUSES)[number];

export interface CopyrightVerificationCheckRecord {
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
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface UpsertCopyrightVerificationCheckInput {
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
    Date |
    null;
}