import {
  randomInt,
} from "node:crypto";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  findDiscoveryContentById,
  findDiscoveryContentByOriginalUrl,
  findDiscoveryContentByPublicId,
  type DiscoveryContentRecord,
} from "../../domains/content-sources/index.js";

import {
  appendCopyrightAuditEvent,
  appendCopyrightEvidenceReference,
  createCopyrightCase,
  findCopyrightCaseByPublicId,
  type CopyrightAuditEventRecord,
  type CopyrightCaseRecord,
  type CopyrightEvidenceReferenceRecord,
} from "../../domains/copyright/index.js";

export type PublicCopyrightRelationship =
  | "owner"
  | "authorized"
  | "publisher";

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

  declarations: {
    goodFaith: boolean;
    accurate: boolean;
    authorized: boolean;
  };
}

export interface LookupPublicCopyrightStatusInput {
  reference: string;

  email: string;
}

export interface LookupPublicCopyrightContentMatchesInput {
  identifiers:
    string[];
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

  status:
    DiscoveryContentRecord["status"];
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

export interface PublicCopyrightContentMatchLookup {
  results:
    PublicCopyrightContentMatchResult[];

  exactMatchCount: number;

  notFoundCount: number;

  invalidCount: number;

  duplicateCount: number;
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

  declarations: {
    goodFaith: boolean;
    accurate: boolean;
    authorized: boolean;
  };
}

export interface PublicCopyrightClaimSubmission {
  case:
    CopyrightCaseRecord;

  content:
    Pick<
      DiscoveryContentRecord,
      | "id"
      | "publicId"
      | "title"
      | "publisherName"
      | "originalUrl"
      | "status"
    >;

  evidence:
    CopyrightEvidenceReferenceRecord[];

  audit:
    CopyrightAuditEventRecord;
}

export interface PublicCopyrightBulkSubmission {
  case:
    CopyrightCaseRecord;

  primaryContent:
    Pick<
      DiscoveryContentRecord,
      | "id"
      | "publicId"
      | "title"
      | "publisherName"
      | "originalUrl"
      | "status"
    >;

  itemCount: number;

  evidence:
    CopyrightEvidenceReferenceRecord[];

  audit:
    CopyrightAuditEventRecord;
}

export interface PublicCopyrightStatusLookup {
  reference: string;

  requestType:
    CopyrightCaseRecord["requestType"];

  status:
    CopyrightCaseRecord["status"];

  verificationStatus:
    CopyrightCaseRecord["verificationStatus"];

  actionTaken:
    CopyrightCaseRecord["actionTaken"];

  preventReimport: boolean;

  receivedAt: Date;

  resolvedAt:
    Date |
    null;

  affectedContent:
    Pick<
      DiscoveryContentRecord,
      | "publicId"
      | "title"
      | "publisherName"
      | "originalUrl"
      | "status"
    >;
}

export type PublicCopyrightErrorCode =
  | "COPYRIGHT_VALIDATION_FAILED"
  | "COPYRIGHT_CONTENT_NOT_FOUND"
  | "COPYRIGHT_CONTENT_REMOVED"
  | "COPYRIGHT_BULK_VALIDATION_FAILED"
  | "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED"
  | "COPYRIGHT_STATUS_VALIDATION_FAILED"
  | "COPYRIGHT_STATUS_NOT_FOUND";

export class PublicCopyrightSubmissionError
  extends Error {
  readonly code:
    PublicCopyrightErrorCode;

  readonly statusCode:
    number;

  readonly issues:
    string[];

  constructor(
    code:
      PublicCopyrightErrorCode,
    message: string,
    statusCode: number,
    issues:
      string[] = []
  ) {
    super(message);

    this.name =
      "PublicCopyrightSubmissionError";

    this.code =
      code;

    this.statusCode =
      statusCode;

    this.issues =
      issues;
  }
}

export interface PublicCopyrightService {
  submitSingleClaim:
    (
      input:
        SubmitPublicCopyrightClaimInput
    ) => Promise<
      PublicCopyrightClaimSubmission
    >;

  submitBulkRemoval:
    (
      input:
        SubmitPublicBulkCopyrightRequestInput
    ) => Promise<
      PublicCopyrightBulkSubmission
    >;

  lookupContentMatches?:
    (
      input:
        LookupPublicCopyrightContentMatchesInput
    ) => Promise<
      PublicCopyrightContentMatchLookup
    >;

  lookupStatus:
    (
      input:
        LookupPublicCopyrightStatusInput
    ) => Promise<
      PublicCopyrightStatusLookup
    >;
}

export interface PublicCopyrightServiceDependencies {
  findContentByPublicId:
    typeof findDiscoveryContentByPublicId;

  findContentByOriginalUrl:
    typeof findDiscoveryContentByOriginalUrl;

  findContentById:
    typeof findDiscoveryContentById;

  findCaseByPublicId:
    typeof findCopyrightCaseByPublicId;

  createCase:
    typeof createCopyrightCase;

  appendEvidence:
    typeof appendCopyrightEvidenceReference;

  appendAudit:
    typeof appendCopyrightAuditEvent;

  runTransaction:
    typeof runDatabaseTransaction;

  generatePublicId:
    () => string;

  now:
    () => Date;
}

export interface CreatePublicCopyrightServiceOptions {
  dependencies?:
    Partial<
      PublicCopyrightServiceDependencies
    >;
}

const RELATIONSHIP_LABELS:
  Record<
    PublicCopyrightRelationship,
    string
  > = {
    owner:
      "Rights holder",

    authorized:
      "Authorized representative",

    publisher:
      "Publisher / organization",
  };

function normalizeString(
  value: string
): string {
  return value.trim();
}

function normalizeEmail(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizePublicReference(
  value: string
): string {
  return value
    .trim()
    .toUpperCase();
}

function normalizeOptionalString(
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

function isHttpUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function normalizeOriginalUrl(
  value:
    string |
    null |
    undefined
): string | null {
  const normalized =
    normalizeOptionalString(
      value
    );

  if (!normalized) {
    return null;
  }

  if (!isHttpUrl(normalized)) {
    return null;
  }

  const url =
    new URL(
      normalized
    );

  url.hash =
    "";

  return url
    .toString()
    .replace(
      /\/+$/,
      ""
    );
}

function normalizeAffectedContent(
  value: string
): string {
  const normalized =
    normalizeString(
      value
    );

  if (
    /^CNT-\d+$/i.test(
      normalized
    )
  ) {
    return normalized.toUpperCase();
  }

  return normalized;
}

function extractContentPublicIdFromUrl(
  value: string
): string | null {
  if (!isHttpUrl(value)) {
    return null;
  }

  const url =
    new URL(
      value
    );

  const match =
    url.pathname.match(
      /\/(CNT-\d+)(?:\/)?$/i
    ) ??
    url.href.match(
      /(CNT-\d+)/i
    );

  return match?.[1]
    ? match[1].toUpperCase()
    : null;
}

async function resolveContent(
  input:
    SubmitPublicCopyrightClaimInput,
  dependencies:
    PublicCopyrightServiceDependencies,
  executor:
    DatabaseQueryExecutor
): Promise<
  DiscoveryContentRecord
> {
  const affectedContent =
    normalizeAffectedContent(
      input.affectedContent
    );

  if (
    /^CNT-\d+$/.test(
      affectedContent
    )
  ) {
    const content =
      await dependencies
        .findContentByPublicId(
          affectedContent,
          executor
        );

    if (content) {
      return content;
    }
  }

  const extractedPublicId =
    extractContentPublicIdFromUrl(
      affectedContent
    );

  if (extractedPublicId) {
    const content =
      await dependencies
        .findContentByPublicId(
          extractedPublicId,
          executor
        );

    if (content) {
      return content;
    }
  }

  const affectedAsUrl =
    normalizeOriginalUrl(
      affectedContent
    );

  if (affectedAsUrl) {
    const content =
      await dependencies
        .findContentByOriginalUrl(
          affectedAsUrl,
          executor
        );

    if (content) {
      return content;
    }
  }

  const originalUrl =
    normalizeOriginalUrl(
      input.originalUrl
    );

  if (originalUrl) {
    const content =
      await dependencies
        .findContentByOriginalUrl(
          originalUrl,
          executor
        );

    if (content) {
      return content;
    }
  }

  throw new PublicCopyrightSubmissionError(
    "COPYRIGHT_CONTENT_NOT_FOUND",
    "The affected Poster content record was not found.",
    404
  );
}

function validateSubmission(
  input:
    SubmitPublicCopyrightClaimInput
): void {
  const issues:
    string[] = [];

  const requiredFields:
    Array<
      [
        string,
        string
      ]
    > = [
      [
        "claimantName",
        input.claimantName,
      ],
      [
        "email",
        input.email,
      ],
      [
        "workTitle",
        input.workTitle,
      ],
      [
        "affectedContent",
        input.affectedContent,
      ],
      [
        "explanation",
        input.explanation,
      ],
      [
        "legalName",
        input.legalName,
      ],
    ];

  for (
    const [
      field,
      value,
    ] of requiredFields
  ) {
    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      issues.push(
        `${field} is required.`
      );
    }
  }

  if (
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
      input.email.trim()
    )
  ) {
    issues.push(
      "email must be a valid email address."
    );
  }

  if (
    !Object.hasOwn(
      RELATIONSHIP_LABELS,
      input.relationship
    )
  ) {
    issues.push(
      "relationship is not supported."
    );
  }

  if (
    input.originalUrl &&
    input.originalUrl.trim().length > 0 &&
    !normalizeOriginalUrl(
      input.originalUrl
    )
  ) {
    issues.push(
      "originalUrl must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    !input.declarations.goodFaith ||
    !input.declarations.accurate ||
    !input.declarations.authorized
  ) {
    issues.push(
      "All required declarations must be confirmed."
    );
  }

  if (
    issues.length > 0
  ) {
    throw new PublicCopyrightSubmissionError(
      "COPYRIGHT_VALIDATION_FAILED",
      "The copyright claim submission is invalid.",
      400,
      issues
    );
  }
}

function validateContentMatchLookup(
  input:
    LookupPublicCopyrightContentMatchesInput
): string[] {
  const issues:
    string[] = [];

  const identifiers =
    Array.isArray(
      input.identifiers
    )
      ? input.identifiers
      : [];

  if (
    identifiers.length === 0
  ) {
    issues.push(
      "At least one identifier is required."
    );
  }

  if (
    identifiers.length > 100
  ) {
    issues.push(
      "Content match lookup accepts at most 100 identifiers."
    );
  }

  if (
    issues.length > 0
  ) {
    throw new PublicCopyrightSubmissionError(
      "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",
      "The content match lookup is invalid.",
      400,
      issues
    );
  }

  return identifiers.map(
    identifier =>
      typeof identifier === "string"
        ? identifier
        : ""
  );
}

function serializeMatchedContent(
  content:
    DiscoveryContentRecord
): PublicCopyrightMatchedContent {
  return {
    publicId:
      content.publicId,

    title:
      content.title,

    publisherName:
      content.publisherName,

    originalUrl:
      content.originalUrl,

    status:
      content.status,
  };
}

function canonicalContentMatchIdentifier(
  value: string
): string | null {
  const trimmed =
    value.trim();

  if (
    trimmed.length === 0
  ) {
    return null;
  }

  const normalizedContentId =
    normalizeAffectedContent(
      trimmed
    );

  if (
    /^CNT-\d+$/.test(
      normalizedContentId
    )
  ) {
    return `content_id:${normalizedContentId}`;
  }

  const normalizedUrl =
    normalizeOriginalUrl(
      trimmed
    );

  if (
    normalizedUrl
  ) {
    return `url:${normalizedUrl.toLowerCase()}`;
  }

  return null;
}

async function resolveContentMatchIdentifier(
  value: string,
  dependencies:
    PublicCopyrightServiceDependencies
): Promise<
  DiscoveryContentRecord |
  null |
  "invalid"
> {
  const trimmed =
    value.trim();

  if (
    trimmed.length === 0
  ) {
    return "invalid";
  }

  const normalizedContentId =
    normalizeAffectedContent(
      trimmed
    );

  if (
    /^CNT-\d+$/.test(
      normalizedContentId
    )
  ) {
    return await dependencies
      .findContentByPublicId(
        normalizedContentId
      );
  }

  if (
    isHttpUrl(
      trimmed
    )
  ) {
    const extractedPublicId =
      extractContentPublicIdFromUrl(
        trimmed
      );

    if (
      extractedPublicId
    ) {
      const content =
        await dependencies
          .findContentByPublicId(
            extractedPublicId
          );

      if (
        content
      ) {
        return content;
      }
    }

    const normalizedOriginalUrl =
      normalizeOriginalUrl(
        trimmed
      );

    if (
      normalizedOriginalUrl
    ) {
      return await dependencies
        .findContentByOriginalUrl(
          normalizedOriginalUrl
        );
    }
  }

  return "invalid";
}

async function lookupPublicCopyrightContentMatches(
  input:
    LookupPublicCopyrightContentMatchesInput,
  dependencies:
    PublicCopyrightServiceDependencies
): Promise<
  PublicCopyrightContentMatchLookup
> {
  const identifiers =
    validateContentMatchLookup(
      input
    );

  const seenIdentifiers =
    new Set<string>();

  const seenContentPublicIds =
    new Set<string>();

  const results:
    PublicCopyrightContentMatchResult[] = [];

  for (
    const identifier of identifiers
  ) {
    const canonicalIdentifier =
      canonicalContentMatchIdentifier(
        identifier
      );

    if (
      !canonicalIdentifier
    ) {
      results.push({
        input:
          identifier,

        status:
          "invalid",
      });

      continue;
    }

    if (
      seenIdentifiers.has(
        canonicalIdentifier
      )
    ) {
      results.push({
        input:
          identifier,

        status:
          "duplicate",
      });

      continue;
    }

    seenIdentifiers.add(
      canonicalIdentifier
    );

    const content =
      await resolveContentMatchIdentifier(
        identifier,
        dependencies
      );

    if (
      content === "invalid"
    ) {
      results.push({
        input:
          identifier,

        status:
          "invalid",
      });

      continue;
    }

    if (
      !content
    ) {
      results.push({
        input:
          identifier,

        status:
          "not_found",
      });

      continue;
    }

    if (
      seenContentPublicIds.has(
        content.publicId
      )
    ) {
      results.push({
        input:
          identifier,

        status:
          "duplicate",

        duplicateOfPublicId:
          content.publicId,
      });

      continue;
    }

    seenContentPublicIds.add(
      content.publicId
    );

    results.push({
      input:
        identifier,

      status:
        "exact_match",

      content:
        serializeMatchedContent(
          content
        ),
    });
  }

  return {
    results,

    exactMatchCount:
      results.filter(
        result =>
          result.status ===
          "exact_match"
      ).length,

    notFoundCount:
      results.filter(
        result =>
          result.status ===
          "not_found"
      ).length,

    invalidCount:
      results.filter(
        result =>
          result.status ===
          "invalid"
      ).length,

    duplicateCount:
      results.filter(
        result =>
          result.status ===
          "duplicate"
      ).length,
  };
}

function validateStatusLookup(
  input:
    LookupPublicCopyrightStatusInput
): {
  reference: string;
  email: string;
} {
  const issues:
    string[] = [];

  const reference =
    normalizePublicReference(
      input.reference
    );

  const email =
    normalizeEmail(
      input.email
    );

  if (
    !/^CR-[0-9]{4,}$/.test(
      reference
    )
  ) {
    issues.push(
      "reference must be a valid copyright claim reference."
    );
  }

  if (
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
      email
    )
  ) {
    issues.push(
      "email must be a valid email address."
    );
  }

  if (
    issues.length > 0
  ) {
    throw new PublicCopyrightSubmissionError(
      "COPYRIGHT_STATUS_VALIDATION_FAILED",
      "The copyright status lookup is invalid.",
      400,
      issues
    );
  }

  return {
    reference,
    email,
  };
}

function throwStatusNotFound():
  never {
  throw new PublicCopyrightSubmissionError(
    "COPYRIGHT_STATUS_NOT_FOUND",
    "No matching copyright request was found with those details.",
    404
  );
}

function isValidBulkIdentifier(
  value: string
): boolean {
  return (
    /^CNT-\d+$/i.test(
      value.trim()
    ) ||
    isHttpUrl(
      value
    )
  );
}

function normalizeBulkItemValue(
  value: string
): string {
  const normalized =
    normalizeAffectedContent(
      value
    );

  return normalizeOriginalUrl(
    normalized
  ) ??
  normalized;
}

function validateBulkSubmission(
  input:
    SubmitPublicBulkCopyrightRequestInput
): {
  items: string[];
} {
  const issues:
    string[] = [];

  const requiredFields:
    Array<
      [
        string,
        string
      ]
    > = [
      [
        "claimantName",
        input.claimantName,
      ],
      [
        "email",
        input.email,
      ],
      [
        "workTitle",
        input.workTitle,
      ],
      [
        "explanation",
        input.explanation,
      ],
      [
        "legalName",
        input.legalName,
      ],
    ];

  for (
    const [
      field,
      value,
    ] of requiredFields
  ) {
    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      issues.push(
        `${field} is required.`
      );
    }
  }

  if (
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
      input.email.trim()
    )
  ) {
    issues.push(
      "email must be a valid email address."
    );
  }

  if (
    !Object.hasOwn(
      RELATIONSHIP_LABELS,
      input.relationship
    )
  ) {
    issues.push(
      "relationship is not supported."
    );
  }

  if (
    input.originalUrl &&
    input.originalUrl.trim().length > 0 &&
    !normalizeOriginalUrl(
      input.originalUrl
    )
  ) {
    issues.push(
      "originalUrl must be a valid HTTP or HTTPS URL."
    );
  }

  if (
    !input.declarations.goodFaith ||
    !input.declarations.accurate ||
    !input.declarations.authorized
  ) {
    issues.push(
      "All required declarations must be confirmed."
    );
  }

  const rawItems =
    Array.isArray(
      input.items
    )
      ? input.items
      : [];

  const seen =
    new Set<string>();

  const items:
    string[] = [];

  for (
    const item of rawItems
  ) {
    const value =
      typeof item.value === "string"
        ? normalizeBulkItemValue(
            item.value
          )
        : "";

    if (
      value.length === 0
    ) {
      continue;
    }

    if (
      !isValidBulkIdentifier(
        value
      )
    ) {
      issues.push(
        "items must contain only Poster Content IDs or HTTP/HTTPS URLs."
      );

      continue;
    }

    const key =
      /^CNT-\d+$/i.test(
        value
      )
        ? value.toUpperCase()
        : value.toLowerCase();

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    items.push(
      value
    );
  }

  if (
    items.length === 0
  ) {
    issues.push(
      "At least one affected item is required."
    );
  }

  if (
    items.length > 100
  ) {
    issues.push(
      "Bulk requests can include at most 100 affected items."
    );
  }

  if (
    issues.length > 0
  ) {
    throw new PublicCopyrightSubmissionError(
      "COPYRIGHT_BULK_VALIDATION_FAILED",
      "The bulk copyright request is invalid.",
      400,
      issues
    );
  }

  return {
    items,
  };
}

async function resolveContentFromPublicIdentifier(
  value: string,
  dependencies:
    PublicCopyrightServiceDependencies,
  executor:
    DatabaseQueryExecutor
): Promise<
  DiscoveryContentRecord |
  null
> {
  const normalized =
    normalizeAffectedContent(
      value
    );

  if (
    /^CNT-\d+$/.test(
      normalized
    )
  ) {
    return await dependencies
      .findContentByPublicId(
        normalized,
        executor
      );
  }

  const extractedPublicId =
    extractContentPublicIdFromUrl(
      normalized
    );

  if (
    extractedPublicId
  ) {
    const content =
      await dependencies
        .findContentByPublicId(
          extractedPublicId,
          executor
        );

    if (content) {
      return content;
    }
  }

  const originalUrl =
    normalizeOriginalUrl(
      normalized
    );

  if (
    originalUrl
  ) {
    return await dependencies
      .findContentByOriginalUrl(
        originalUrl,
        executor
      );
  }

  return null;
}

async function resolvePrimaryBulkContent(
  items: string[],
  dependencies:
    PublicCopyrightServiceDependencies,
  executor:
    DatabaseQueryExecutor
): Promise<
  DiscoveryContentRecord
> {
  let removedContentFound =
    false;

  for (
    const item of items
  ) {
    const content =
      await resolveContentFromPublicIdentifier(
        item,
        dependencies,
        executor
      );

    if (
      !content
    ) {
      continue;
    }

    if (
      content.status === "removed"
    ) {
      removedContentFound =
        true;

      continue;
    }

    return content;
  }

  if (
    removedContentFound
  ) {
    throw new PublicCopyrightSubmissionError(
      "COPYRIGHT_CONTENT_REMOVED",
      "The affected Poster content record is already removed.",
      409
    );
  }

  throw new PublicCopyrightSubmissionError(
    "COPYRIGHT_CONTENT_NOT_FOUND",
    "At least one affected Poster content record must match an existing active Poster record.",
    404
  );
}

function summarizeBulkSupportingInformation(
  input:
    SubmitPublicBulkCopyrightRequestInput,
  items: string[]
): string {
  const previewItems =
    items
      .slice(
        0,
        10
      )
      .map(
        item =>
          `- ${item}`
      )
      .join(
        "\n"
      );

  const parts:
    string[] = [
      `Bulk request item count: ${items.length}`,
      `Work title: ${normalizeString(input.workTitle)}`,
      `Legal signer: ${normalizeString(input.legalName)}`,
      "Affected item preview:",
      previewItems,
    ];

  const organization =
    normalizeOptionalString(
      input.organization
    );

  if (organization) {
    parts.push(
      `Organization: ${organization}`
    );
  }

  const evidence =
    normalizeOptionalString(
      input.evidence
    );

  if (evidence) {
    parts.push(
      `Evidence summary: ${evidence}`
    );
  }

  if (
    items.length > 10
  ) {
    parts.push(
      `Additional affected items stored as evidence references: ${items.length - 10}`
    );
  }

  return parts.join(
    "\n"
  );
}

function summarizeSupportingInformation(
  input:
    SubmitPublicCopyrightClaimInput
): string {
  const parts:
    string[] = [
      `Work title: ${normalizeString(input.workTitle)}`,
      `Legal signer: ${normalizeString(input.legalName)}`,
    ];

  const organization =
    normalizeOptionalString(
      input.organization
    );

  if (organization) {
    parts.push(
      `Organization: ${organization}`
    );
  }

  const evidence =
    normalizeOptionalString(
      input.evidence
    );

  if (evidence) {
    parts.push(
      `Evidence: ${evidence}`
    );
  }

  return parts.join(
    "\n"
  );
}

function generatePublicCopyrightReference():
  string {
  return `CR-${randomInt(
    100000,
    999999
  )}`;
}

export function createPublicCopyrightService(
  options:
    CreatePublicCopyrightServiceOptions =
    {}
): PublicCopyrightService {
  const dependencies:
    PublicCopyrightServiceDependencies = {
    findContentByPublicId:
      findDiscoveryContentByPublicId,

    findContentByOriginalUrl:
      findDiscoveryContentByOriginalUrl,

    findContentById:
      findDiscoveryContentById,

    findCaseByPublicId:
      findCopyrightCaseByPublicId,

    createCase:
      createCopyrightCase,

    appendEvidence:
      appendCopyrightEvidenceReference,

    appendAudit:
      appendCopyrightAuditEvent,

    runTransaction:
      runDatabaseTransaction,

    generatePublicId:
      generatePublicCopyrightReference,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    submitSingleClaim:
      async input => {
        validateSubmission(
          input
        );

        const submittedAt =
          dependencies.now();

        return await dependencies
          .runTransaction(
            async executor => {
              const content =
                await resolveContent(
                  input,
                  dependencies,
                  executor
                );

              if (
                content.status ===
                "removed"
              ) {
                throw new PublicCopyrightSubmissionError(
                  "COPYRIGHT_CONTENT_REMOVED",
                  "The affected Poster content record is already removed.",
                  409
                );
              }

              const copyrightCase =
                await dependencies
                  .createCase(
                    {
                      publicId:
                        dependencies
                          .generatePublicId(),

                      requestType:
                        "copyright_strike",

                      contentId:
                        content.id,

                      claimantName:
                        normalizeString(
                          input.claimantName
                        ),

                      claimantType:
                        RELATIONSHIP_LABELS[
                          input.relationship
                        ],

                      claimantBusinessEmail:
                        normalizeEmail(
                          input.email
                        ),

                      claimantWebsiteUrl:
                        null,

                      claimantReference:
                        normalizeOptionalString(
                          input.organization
                        ),

                      requestReason:
                        normalizeString(
                          input.explanation
                        ),

                      submittedOriginalUrl:
                        normalizeOriginalUrl(
                          input.originalUrl
                        ) ??
                        content.originalUrl,

                      supportingInformation:
                        summarizeSupportingInformation(
                          input
                        ),

                      receivedAt:
                        submittedAt,
                    },
                    executor
                  );

              const evidence:
                CopyrightEvidenceReferenceRecord[] = [];

              const originalUrl =
                normalizeOriginalUrl(
                  input.originalUrl
                );

              if (originalUrl) {
                evidence.push(
                  await dependencies
                    .appendEvidence(
                      {
                        caseId:
                          copyrightCase.id,

                        evidenceType:
                          "original_work_url",

                        label:
                          "Original publication URL",

                        referenceValue:
                          originalUrl,

                        storageObjectKey:
                          null,

                        sha256Digest:
                          null,

                        submittedAt,
                      },
                      executor
                    )
                );
              }

              const supportingEvidence =
                normalizeOptionalString(
                  input.evidence
                );

              if (supportingEvidence) {
                evidence.push(
                  await dependencies
                    .appendEvidence(
                      {
                        caseId:
                          copyrightCase.id,

                        evidenceType:
                          "supporting_url",

                        label:
                          "Claimant supporting evidence",

                        referenceValue:
                          supportingEvidence,

                        storageObjectKey:
                          null,

                        sha256Digest:
                          null,

                        submittedAt,
                      },
                      executor
                    )
                );
              }

              const audit =
                await dependencies
                  .appendAudit(
                    {
                      caseId:
                        copyrightCase.id,

                      action:
                        "Public copyright claim submitted",

                      actorUserId:
                        null,

                      actorLabel:
                        "Public copyright claimant",

                      previousStatus:
                        null,

                      resultingStatus:
                        copyrightCase.status,

                      metadata: {
                        requestType:
                          copyrightCase.requestType,

                        contentPublicId:
                          content.publicId,

                        claimantRelationship:
                          input.relationship,

                        claimantEmail:
                          normalizeEmail(
                            input.email
                          ),
                      },

                      occurredAt:
                        submittedAt,
                    },
                    executor
                  );

              return {
                case:
                  copyrightCase,

                content: {
                  id:
                    content.id,

                  publicId:
                    content.publicId,

                  title:
                    content.title,

                  publisherName:
                    content.publisherName,

                  originalUrl:
                    content.originalUrl,

                  status:
                    content.status,
                },

                evidence,

                audit,
              };
            }
          );
      },

    submitBulkRemoval:
      async input => {
        const bulk =
          validateBulkSubmission(
            input
          );

        const submittedAt =
          dependencies.now();

        return await dependencies
          .runTransaction(
            async executor => {
              const primaryContent =
                await resolvePrimaryBulkContent(
                  bulk.items,
                  dependencies,
                  executor
                );

              const copyrightCase =
                await dependencies
                  .createCase(
                    {
                      publicId:
                        dependencies
                          .generatePublicId(),

                      requestType:
                        "copyright_request",

                      contentId:
                        primaryContent.id,

                      claimantName:
                        normalizeString(
                          input.claimantName
                        ),

                      claimantType:
                        RELATIONSHIP_LABELS[
                          input.relationship
                        ],

                      claimantBusinessEmail:
                        normalizeEmail(
                          input.email
                        ),

                      claimantWebsiteUrl:
                        null,

                      claimantReference:
                        normalizeOptionalString(
                          input.organization
                        ),

                      requestReason:
                        normalizeString(
                          input.explanation
                        ),

                      submittedOriginalUrl:
                        normalizeOriginalUrl(
                          input.originalUrl
                        ) ??
                        primaryContent.originalUrl,

                      supportingInformation:
                        summarizeBulkSupportingInformation(
                          input,
                          bulk.items
                        ),

                      receivedAt:
                        submittedAt,
                    },
                    executor
                  );

              const evidence:
                CopyrightEvidenceReferenceRecord[] = [];

              const originalUrl =
                normalizeOriginalUrl(
                  input.originalUrl
                );

              if (
                originalUrl
              ) {
                evidence.push(
                  await dependencies
                    .appendEvidence(
                      {
                        caseId:
                          copyrightCase.id,

                        evidenceType:
                          "original_work_url",

                        label:
                          "Original publication URL",

                        referenceValue:
                          originalUrl,

                        storageObjectKey:
                          null,

                        sha256Digest:
                          null,

                        submittedAt,
                      },
                      executor
                    )
                );
              }

              for (
                const [
                  index,
                  item,
                ] of bulk.items.entries()
              ) {
                evidence.push(
                  await dependencies
                    .appendEvidence(
                      {
                        caseId:
                          copyrightCase.id,

                        evidenceType:
                          /^CNT-\d+$/i.test(
                            item
                          )
                            ? "publisher_reference"
                            : "supporting_url",

                        label:
                          `Bulk affected item ${index + 1}`,

                        referenceValue:
                          item,

                        storageObjectKey:
                          null,

                        sha256Digest:
                          null,

                        submittedAt,
                      },
                      executor
                    )
                );
              }

              const supportingEvidence =
                normalizeOptionalString(
                  input.evidence
                );

              if (
                supportingEvidence
              ) {
                evidence.push(
                  await dependencies
                    .appendEvidence(
                      {
                        caseId:
                          copyrightCase.id,

                        evidenceType:
                          "supporting_url",

                        label:
                          "Bulk supporting evidence",

                        referenceValue:
                          supportingEvidence,

                        storageObjectKey:
                          null,

                        sha256Digest:
                          null,

                        submittedAt,
                      },
                      executor
                    )
                );
              }

              const audit =
                await dependencies
                  .appendAudit(
                    {
                      caseId:
                        copyrightCase.id,

                      action:
                        "Public bulk copyright request submitted",

                      actorUserId:
                        null,

                      actorLabel:
                        "Public copyright claimant",

                      previousStatus:
                        null,

                      resultingStatus:
                        copyrightCase.status,

                      metadata: {
                        requestType:
                          copyrightCase.requestType,

                        itemCount:
                          bulk.items.length,

                        primaryContentPublicId:
                          primaryContent.publicId,

                        claimantRelationship:
                          input.relationship,

                        claimantEmail:
                          normalizeEmail(
                            input.email
                          ),
                      },

                      occurredAt:
                        submittedAt,
                    },
                    executor
                  );

              return {
                case:
                  copyrightCase,

                primaryContent: {
                  id:
                    primaryContent.id,

                  publicId:
                    primaryContent.publicId,

                  title:
                    primaryContent.title,

                  publisherName:
                    primaryContent.publisherName,

                  originalUrl:
                    primaryContent.originalUrl,

                  status:
                    primaryContent.status,
                },

                itemCount:
                  bulk.items.length,

                evidence,

                audit,
              };
            }
          );
      },

    lookupContentMatches:
      async input =>
        await lookupPublicCopyrightContentMatches(
          input,
          dependencies
        ),

    lookupStatus:
      async input => {
        const lookup =
          validateStatusLookup(
            input
          );

        const copyrightCase =
          await dependencies
            .findCaseByPublicId(
              lookup.reference
            );

        if (
          !copyrightCase ||
          normalizeEmail(
            copyrightCase.claimantBusinessEmail ??
            ""
          ) !== lookup.email
        ) {
          throwStatusNotFound();
        }

        const content =
          await dependencies
            .findContentById(
              copyrightCase.contentId
            );

        if (!content) {
          throwStatusNotFound();
        }

        return {
          reference:
            copyrightCase.publicId,

          requestType:
            copyrightCase.requestType,

          status:
            copyrightCase.status,

          verificationStatus:
            copyrightCase.verificationStatus,

          actionTaken:
            copyrightCase.actionTaken,

          preventReimport:
            copyrightCase.preventReimport,

          receivedAt:
            copyrightCase.receivedAt,

          resolvedAt:
            copyrightCase.resolvedAt,

          affectedContent: {
            publicId:
              content.publicId,

            title:
              content.title,

            publisherName:
              content.publisherName,

            originalUrl:
              content.originalUrl,

            status:
              content.status,
          },
        };
      },
  };
}
