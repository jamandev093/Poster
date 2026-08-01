import type {
  AcquisitionMethod,
  OperationalAuditEvent,
} from "../content-sources/content-sources.types";

export type SourceStatus =
  | "active"
  | "paused"
  | "blocked";

export type SourceHealth =
  | "healthy"
  | "issue"
  | "offline";

export interface AdminSourceRecord {
  id: string;

  publicId: string;

  name: string;

  websiteUrl: string;

  acquisitionMethod:
    AcquisitionMethod;

  status:
    SourceStatus;

  health:
    SourceHealth;

  displayPolicy: string;

  operationalNote:
    string |
    null;

  lastSyncAt:
    string |
    null;

  lastSyncError:
    string |
    null;

  activeContentCount: number;

  createdAt: string;

  updatedAt: string;

  pausedAt:
    string |
    null;

  blockedAt:
    string |
    null;

  rowVersion: string;
}

export interface AdminSourceListResponse {
  generatedAt: string;

  sources:
    AdminSourceRecord[];
}

export interface AdminSourceDetailsResponse {
  source:
    AdminSourceRecord;

  audit:
    OperationalAuditEvent[];
}

export interface SourceLifecycleRequest {
  expectedRowVersion: string;
}

export interface BlockSourceRequest
  extends SourceLifecycleRequest {
  removeExistingContent: boolean;
}