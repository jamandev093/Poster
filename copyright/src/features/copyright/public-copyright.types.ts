export type PublicCopyrightRelationship =
  | "owner"
  | "authorized"
  | "publisher";

export interface PublicCopyrightDeclarations {
  goodFaith: boolean;

  accurate: boolean;

  authorized: boolean;
}

export interface SubmitPublicCopyrightClaimInput {
  claimantName: string;

  organization?:
    string |
    null;

  email: string;

  relationship:
    PublicCopyrightRelationship;

  workTitle: string;

  originalUrl?:
    string |
    null;

  affectedContent: string;

  explanation: string;

  evidence?:
    string |
    null;

  legalName: string;

  declarations:
    PublicCopyrightDeclarations;
}

export interface PublicBulkCopyrightItemInput {
  value: string;
}

export interface SubmitPublicBulkCopyrightRequestInput {
  claimantName: string;

  organization?:
    string |
    null;

  email: string;

  relationship:
    PublicCopyrightRelationship;

  workTitle: string;

  originalUrl?:
    string |
    null;

  items:
    PublicBulkCopyrightItemInput[];

  explanation: string;

  evidence?:
    string |
    null;

  legalName: string;

  declarations:
    PublicCopyrightDeclarations;
}

export interface LookupPublicCopyrightStatusInput {
  reference: string;

  email: string;
}

export interface LookupPublicCopyrightContentMatchesInput {
  identifiers:
    string[];
}

export interface PublicCopyrightClaimAffectedContent {
  publicId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  status: string;
}

export interface PublicCopyrightClaim {
  reference: string;

  requestType: string;

  status: string;

  receivedAt: string;

  affectedContent:
    PublicCopyrightClaimAffectedContent;

  evidenceCount: number;
}

export interface PublicCopyrightClaimResponse {
  claim:
    PublicCopyrightClaim;
}

export interface PublicCopyrightBulkRequest {
  reference: string;

  requestType: string;

  status: string;

  receivedAt: string;

  itemCount: number;

  primaryAffectedContent:
    PublicCopyrightClaimAffectedContent;

  evidenceCount: number;
}

export interface PublicCopyrightBulkRequestResponse {
  bulkRequest:
    PublicCopyrightBulkRequest;
}

export interface PublicCopyrightStatusAffectedContent {
  publicId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  status: string;
}

export interface PublicCopyrightStatus {
  reference: string;

  requestType: string;

  status: string;

  verificationStatus: string;

  actionTaken:
    string |
    null;

  preventReimport: boolean;

  receivedAt: string;

  resolvedAt:
    string |
    null;

  affectedContent:
    PublicCopyrightStatusAffectedContent;
}

export interface PublicCopyrightStatusResponse {
  status:
    PublicCopyrightStatus;
}

export type PublicCopyrightContentMatchStatus =
  | "exact_match"
  | "not_found"
  | "invalid"
  | "duplicate";

export interface PublicCopyrightMatchedContent {
  publicId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  status: string;
}

export interface PublicCopyrightContentMatchResult {
  input: string;

  status:
    PublicCopyrightContentMatchStatus;

  content?:
    PublicCopyrightMatchedContent;

  duplicateOfPublicId?:
    string;
}

export interface PublicCopyrightContentMatchCounts {
  exactMatchCount: number;

  notFoundCount: number;

  invalidCount: number;

  duplicateCount: number;
}

export interface PublicCopyrightContentMatchLookup {
  results:
    PublicCopyrightContentMatchResult[];

  counts:
    PublicCopyrightContentMatchCounts;
}

export interface PublicCopyrightContentMatchResponse {
  match:
    PublicCopyrightContentMatchLookup;
}

export interface PublicCopyrightErrorBody {
  error?: {
    code?: string;

    message?: string;

    issues?: string[];

    requestId?: string;
  };
}