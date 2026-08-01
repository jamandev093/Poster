import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  ContentSourceMethod,
} from "./content-source.types.js";

import {
  normalizeOptionalContentText,
  normalizeOriginalContentUrl,
  normalizeRequiredContentText,
  type ContentRemovalReason,
  type CreateDiscoveryContentInput,
  type DiscoveryContentRecord,
  type DiscoveryContentStatus,
  type RemoveDiscoveryContentInput,
  type RestoreDiscoveryContentInput,
} from "./discovery-content.types.js";

interface DiscoveryContentDatabaseRow
  extends QueryResultRow {
  id: string;

  public_id: string;

  source_id: string;

  title: string;

  publisher_name: string;

  original_url: string;

  acquisition_method:
    ContentSourceMethod;

  status:
    DiscoveryContentStatus;

  published_at:
    Date |
    null;

  added_at: Date;

  removed_at:
    Date |
    null;

  removal_reason:
    ContentRemovalReason |
    null;

  removal_note:
    string |
    null;

  copyright_case_id:
    string |
    null;

  copyright_claimant:
    string |
    null;

  prevent_reimport: boolean;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const CONTENT_COLUMNS = `
  id,
  public_id,
  source_id,
  title,
  publisher_name,
  original_url,
  acquisition_method,
  status,
  published_at,
  added_at,
  removed_at,
  removal_reason,
  removal_note,
  copyright_case_id,
  copyright_claimant,
  prevent_reimport,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapContentRow(
  row:
    DiscoveryContentDatabaseRow
): DiscoveryContentRecord {
  return {
    id:
      row.id,

    publicId:
      row.public_id,

    sourceId:
      row.source_id,

    title:
      row.title,

    publisherName:
      row.publisher_name,

    originalUrl:
      row.original_url,

    acquisitionMethod:
      row.acquisition_method,

    status:
      row.status,

    publishedAt:
      row.published_at,

    addedAt:
      row.added_at,

    removedAt:
      row.removed_at,

    removalReason:
      row.removal_reason,

    removalNote:
      row.removal_note,

    copyrightCaseId:
      row.copyright_case_id,

    copyrightClaimant:
      row.copyright_claimant,

    preventReimport:
      row.prevent_reimport,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalContentRow(
  row:
    DiscoveryContentDatabaseRow |
    undefined
): DiscoveryContentRecord | null {
  return row
    ? mapContentRow(
        row
      )
    : null;
}

export async function createDiscoveryContent(
  input:
    CreateDiscoveryContentInput,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        INSERT INTO app.discovery_content (
          public_id,
          source_id,
          title,
          publisher_name,
          original_url,
          acquisition_method,
          published_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          ${CONTENT_COLUMNS}
      `,
      [
        normalizeRequiredContentText(
          input.publicId
        ),

        input.sourceId,

        normalizeRequiredContentText(
          input.title
        ),

        normalizeRequiredContentText(
          input.publisherName
        ),

        normalizeOriginalContentUrl(
          input.originalUrl
        ),

        input.acquisitionMethod,

        input.publishedAt ??
          null,
      ],
      executor
    );

  const content =
    mapOptionalContentRow(
      result.rows[0]
    );

  if (
    !content
  ) {
    throw new Error(
      "PostgreSQL did not return the created discovery content."
    );
  }

  return content;
}

export async function findDiscoveryContentById(
  contentId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord | null> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        SELECT
          ${CONTENT_COLUMNS}
        FROM app.discovery_content
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        contentId,
      ],
      executor
    );

  return mapOptionalContentRow(
    result.rows[0]
  );
}

export async function findDiscoveryContentByPublicId(
  publicId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord | null> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        SELECT
          ${CONTENT_COLUMNS}
        FROM app.discovery_content
        WHERE public_id = $1
        LIMIT 1
      `,
      [
        normalizeRequiredContentText(
          publicId
        ),
      ],
      executor
    );

  return mapOptionalContentRow(
    result.rows[0]
  );
}

export async function findDiscoveryContentByOriginalUrl(
  originalUrl: string,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord | null> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        SELECT
          ${CONTENT_COLUMNS}
        FROM app.discovery_content
        WHERE lower(original_url) =
          lower($1)
        LIMIT 1
      `,
      [
        normalizeOriginalContentUrl(
          originalUrl
        ),
      ],
      executor
    );

  return mapOptionalContentRow(
    result.rows[0]
  );
}

export async function listDiscoveryContent(
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord[]> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        SELECT
          ${CONTENT_COLUMNS}
        FROM app.discovery_content
        ORDER BY
          added_at DESC,
          id DESC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapContentRow
  );
}

export async function removeDiscoveryContent(
  input:
    RemoveDiscoveryContentInput,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord | null> {
  const copyrightCaseId =
    input.reason ===
      "copyright"
      ? normalizeOptionalContentText(
          input.copyrightCaseId
        )
      : null;

  const copyrightClaimant =
    input.reason ===
      "copyright"
      ? normalizeOptionalContentText(
          input.copyrightClaimant
        )
      : null;

  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        UPDATE app.discovery_content
        SET
          status = 'removed',
          removed_at = $3,
          removal_reason = $4,
          removal_note = $5,
          copyright_case_id = $6,
          copyright_claimant = $7,
          prevent_reimport = $8
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
          AND status = 'active'
        RETURNING
          ${CONTENT_COLUMNS}
      `,
      [
        input.contentId,
        input.expectedRowVersion,
        input.removedAt,
        input.reason,

        normalizeOptionalContentText(
          input.note
        ),

        copyrightCaseId,
        copyrightClaimant,
        input.preventReimport,
      ],
      executor
    );

  return mapOptionalContentRow(
    result.rows[0]
  );
}

export async function restoreDiscoveryContent(
  input:
    RestoreDiscoveryContentInput,
  executor?:
    DatabaseQueryExecutor
): Promise<DiscoveryContentRecord | null> {
  const result =
    await executeDatabaseQuery<
      DiscoveryContentDatabaseRow
    >(
      `
        UPDATE app.discovery_content
        SET
          status = 'active',
          removed_at = NULL,
          removal_reason = NULL,
          removal_note = NULL,
          copyright_case_id = NULL,
          copyright_claimant = NULL,
          prevent_reimport = false
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
          AND status = 'removed'
        RETURNING
          ${CONTENT_COLUMNS}
      `,
      [
        input.contentId,
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalContentRow(
    result.rows[0]
  );
}

export async function isOriginalUrlPreventedFromReimport(
  originalUrl: string,
  executor?:
    DatabaseQueryExecutor
): Promise<boolean> {
  const result =
    await executeDatabaseQuery<
      QueryResultRow
    >(
      `
        SELECT 1
        FROM app.discovery_content
        WHERE
          lower(original_url) =
            lower($1)
          AND prevent_reimport = true
        LIMIT 1
      `,
      [
        normalizeOriginalContentUrl(
          originalUrl
        ),
      ],
      executor
    );

  return result.rowCount ===
    1;
}