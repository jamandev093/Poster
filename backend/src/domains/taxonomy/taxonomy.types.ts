export const TAXONOMY_TOPIC_STATUSES = [
  "active",
  "inactive",
  "archived",
] as const;

export type TaxonomyTopicStatus =
  (typeof TAXONOMY_TOPIC_STATUSES)[number];

export interface TaxonomyTopicRecord {
  id: string;

  slug: string;

  name: string;

  description:
    string |
    null;

  parentTopicId:
    string |
    null;

  status:
    TaxonomyTopicStatus;

  sortOrder: number;

  createdAt: Date;

  updatedAt: Date;

  archivedAt:
    Date |
    null;

  rowVersion: string;
}

export interface CreateTaxonomyTopicInput {
  slug: string;

  name: string;

  description?:
    string |
    null;

  parentTopicId?:
    string |
    null;

  status?:
    TaxonomyTopicStatus;

  sortOrder?: number;
}

export interface UpdateTaxonomyTopicInput {
  topicId: string;

  expectedRowVersion: string;

  slug: string;

  name: string;

  description?:
    string |
    null;

  parentTopicId?:
    string |
    null;

  status:
    TaxonomyTopicStatus;

  sortOrder: number;

  changedAt: Date;
}

export function normalizeTaxonomySlug(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

export function normalizeTaxonomyName(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalTaxonomyText(
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

export function assertValidTaxonomySortOrder(
  value: number
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 0
  ) {
    throw new RangeError(
      "Taxonomy sort order must be a non-negative integer."
    );
  }

  return value;
}
