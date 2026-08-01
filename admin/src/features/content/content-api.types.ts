import type {
  AcquisitionMethod,
  OperationalAuditEvent,
} from "../content-sources/content-sources.types";

export type ContentStatus =
  | "active"
  | "removed";

export type RemovalReason =
  | "copyright"
  | "publisher_request"
  | "misleading_unsafe"
  | "broken_unavailable"
  | "other";

export interface AdminContentRecord {
  id: string;

  publicId: string;

  sourceId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  acquisitionMethod:
    AcquisitionMethod;

  status:
    ContentStatus;

  publishedAt:
    string |
    null;

  addedAt: string;

  removedAt:
    string |
    null;

  removalReason:
    RemovalReason |
    null;

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

export interface AdminContentListResponse {
  generatedAt: string;

  records:
    AdminContentRecord[];
}

export interface AdminContentDetailsResponse {
  record:
    AdminContentRecord;

  audit:
    OperationalAuditEvent[];
}

export interface RemoveAdminContentRequest {
  expectedRowVersion: string;

  reason:
    RemovalReason;

  note:
    string |
    null;

  copyrightCaseId:
    string |
    null;

  copyrightClaimant:
    string |
    null;

  preventReimport: boolean;
}

export interface RestoreAdminContentRequest {
  expectedRowVersion: string;
}