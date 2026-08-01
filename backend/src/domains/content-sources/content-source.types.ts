export const CONTENT_SOURCE_METHODS = [
  "api",
  "rss",
  "embed",
  "agreement",
  "link_only",
] as const;

export type ContentSourceMethod =
  (typeof CONTENT_SOURCE_METHODS)[number];

export const CONTENT_SOURCE_STATUSES = [
  "active",
  "paused",
  "blocked",
] as const;

export type ContentSourceStatus =
  (typeof CONTENT_SOURCE_STATUSES)[number];

export const CONTENT_SOURCE_HEALTH_VALUES = [
  "healthy",
  "issue",
  "offline",
] as const;

export type ContentSourceHealth =
  (typeof CONTENT_SOURCE_HEALTH_VALUES)[number];

export interface ContentSourceRecord {
  id: string;

  publicId: string;

  name: string;

  websiteUrl: string;

  acquisitionMethod:
    ContentSourceMethod;

  status:
    ContentSourceStatus;

  health:
    ContentSourceHealth;

  displayPolicy: string;

  operationalNote:
    string |
    null;

  lastSyncAt:
    Date |
    null;

  lastSyncError:
    string |
    null;

  createdAt: Date;

  updatedAt: Date;

  pausedAt:
    Date |
    null;

  blockedAt:
    Date |
    null;

  rowVersion: string;
}

export interface CreateContentSourceInput {
  publicId: string;

  name: string;

  websiteUrl: string;

  acquisitionMethod:
    ContentSourceMethod;

  displayPolicy: string;

  operationalNote?:
    string |
    null;
}

export interface UpdateContentSourceLifecycleInput {
  sourceId: string;

  expectedRowVersion: string;

  status:
    ContentSourceStatus;

  changedAt: Date;
}

export interface UpdateContentSourceHealthInput {
  sourceId: string;

  expectedRowVersion: string;

  health:
    ContentSourceHealth;

  lastSyncAt?:
    Date |
    null;

  lastSyncError?:
    string |
    null;

  operationalNote?:
    string |
    null;
}

export function normalizeRequiredSourceText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalSourceText(
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

export function normalizeSourceWebsiteUrl(
  value: string
): string {
  return value
    .trim()
    .replace(
      /\/+$/,
      ""
    );
}