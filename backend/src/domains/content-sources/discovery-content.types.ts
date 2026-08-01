import type {
  ContentSourceMethod,
} from "./content-source.types.js";

export const DISCOVERY_CONTENT_STATUSES = [
  "active",
  "removed",
] as const;

export type DiscoveryContentStatus =
  (typeof DISCOVERY_CONTENT_STATUSES)[number];

export const CONTENT_REMOVAL_REASONS = [
  "copyright",
  "publisher_request",
  "misleading_unsafe",
  "broken_unavailable",
  "other",
] as const;

export type ContentRemovalReason =
  (typeof CONTENT_REMOVAL_REASONS)[number];

export interface DiscoveryContentRecord {
  id: string;

  publicId: string;

  sourceId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  acquisitionMethod:
    ContentSourceMethod;

  status:
    DiscoveryContentStatus;

  publishedAt:
    Date |
    null;

  addedAt: Date;

  removedAt:
    Date |
    null;

  removalReason:
    ContentRemovalReason |
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

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface CreateDiscoveryContentInput {
  publicId: string;

  sourceId: string;

  title: string;

  publisherName: string;

  originalUrl: string;

  acquisitionMethod:
    ContentSourceMethod;

  publishedAt?:
    Date |
    null;
}

export interface RemoveDiscoveryContentInput {
  contentId: string;

  expectedRowVersion: string;

  reason:
    ContentRemovalReason;

  note?:
    string |
    null;

  copyrightCaseId?:
    string |
    null;

  copyrightClaimant?:
    string |
    null;

  preventReimport: boolean;

  removedAt: Date;
}

export interface RestoreDiscoveryContentInput {
  contentId: string;

  expectedRowVersion: string;
}

export function normalizeRequiredContentText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalContentText(
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

export function normalizeOriginalContentUrl(
  value: string
): string {
  return value
    .trim()
    .replace(
      /\/+$/,
      ""
    );
}