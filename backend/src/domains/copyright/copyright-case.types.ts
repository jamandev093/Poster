export const COPYRIGHT_REQUEST_TYPES = [
  "copyright_strike",
  "copyright_request",
  "publisher_removal",
] as const;

export type CopyrightRequestType =
  (typeof COPYRIGHT_REQUEST_TYPES)[number];

export const COPYRIGHT_CASE_STATUSES = [
  "needs_action",
  "removed",
  "resolved",
] as const;

export type CopyrightCaseStatus =
  (typeof COPYRIGHT_CASE_STATUSES)[number];

export const COPYRIGHT_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "needs_review",
] as const;

export type CopyrightVerificationStatus =
  (typeof COPYRIGHT_VERIFICATION_STATUSES)[number];

export const COPYRIGHT_CASE_ACTIONS = [
  "removed",
  "removed_prevent_reimport",
  "dismissed",
  "restored",
] as const;

export type CopyrightCaseAction =
  (typeof COPYRIGHT_CASE_ACTIONS)[number];

export interface CopyrightCaseRecord {
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

export interface CreateCopyrightCaseInput {
  publicId: string;

  requestType:
    CopyrightRequestType;

  contentId: string;

  claimantName: string;

  claimantType: string;

  claimantBusinessEmail?:
    string |
    null;

  claimantWebsiteUrl?:
    string |
    null;

  claimantReference?:
    string |
    null;

  requestReason: string;

  submittedOriginalUrl?:
    string |
    null;

  supportingInformation?:
    string |
    null;

  receivedAt: Date;
}

export interface ResolveCopyrightCaseInput {
  caseId: string;

  expectedRowVersion: string;

  status:
    CopyrightCaseStatus;

  actionTaken:
    CopyrightCaseAction;

  preventReimport: boolean;

  resolvedAt: Date;

  resolvedByUserId:
    string |
    null;
}

export function normalizeRequiredCopyrightText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalCopyrightText(
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

export function normalizeCopyrightUrl(
  value:
    string |
    null |
    undefined
): string | null {
  const normalized =
    normalizeOptionalCopyrightText(
      value
    );

  return normalized
    ? normalized.replace(
        /\/+$/,
        ""
      )
    : null;
}