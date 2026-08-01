import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeOptionalSourceText,
  normalizeRequiredSourceText,
  normalizeSourceWebsiteUrl,
  type ContentSourceHealth,
  type ContentSourceMethod,
  type ContentSourceRecord,
  type ContentSourceStatus,
  type CreateContentSourceInput,
  type UpdateContentSourceHealthInput,
  type UpdateContentSourceLifecycleInput,
} from "./content-source.types.js";

interface ContentSourceDatabaseRow
  extends QueryResultRow {
  id: string;

  public_id: string;

  name: string;

  website_url: string;

  acquisition_method:
    ContentSourceMethod;

  status:
    ContentSourceStatus;

  health:
    ContentSourceHealth;

  display_policy: string;

  operational_note:
    string |
    null;

  last_sync_at:
    Date |
    null;

  last_sync_error:
    string |
    null;

  created_at: Date;

  updated_at: Date;

  paused_at:
    Date |
    null;

  blocked_at:
    Date |
    null;

  row_version: string;
}

const SOURCE_COLUMNS = `
  id,
  public_id,
  name,
  website_url,
  acquisition_method,
  status,
  health,
  display_policy,
  operational_note,
  last_sync_at,
  last_sync_error,
  created_at,
  updated_at,
  paused_at,
  blocked_at,
  row_version::text
    AS row_version
`;

function mapSourceRow(
  row:
    ContentSourceDatabaseRow
): ContentSourceRecord {
  return {
    id:
      row.id,

    publicId:
      row.public_id,

    name:
      row.name,

    websiteUrl:
      row.website_url,

    acquisitionMethod:
      row.acquisition_method,

    status:
      row.status,

    health:
      row.health,

    displayPolicy:
      row.display_policy,

    operationalNote:
      row.operational_note,

    lastSyncAt:
      row.last_sync_at,

    lastSyncError:
      row.last_sync_error,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    pausedAt:
      row.paused_at,

    blockedAt:
      row.blocked_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalSourceRow(
  row:
    ContentSourceDatabaseRow |
    undefined
): ContentSourceRecord | null {
  return row
    ? mapSourceRow(
        row
      )
    : null;
}

export async function createContentSource(
  input:
    CreateContentSourceInput,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        INSERT INTO app.content_sources (
          public_id,
          name,
          website_url,
          acquisition_method,
          display_policy,
          operational_note
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING
          ${SOURCE_COLUMNS}
      `,
      [
        normalizeRequiredSourceText(
          input.publicId
        ),

        normalizeRequiredSourceText(
          input.name
        ),

        normalizeSourceWebsiteUrl(
          input.websiteUrl
        ),

        input.acquisitionMethod,

        normalizeRequiredSourceText(
          input.displayPolicy
        ),

        normalizeOptionalSourceText(
          input.operationalNote
        ),
      ],
      executor
    );

  const source =
    mapOptionalSourceRow(
      result.rows[0]
    );

  if (
    !source
  ) {
    throw new Error(
      "PostgreSQL did not return the created content source."
    );
  }

  return source;
}

export async function findContentSourceById(
  sourceId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord | null> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        SELECT
          ${SOURCE_COLUMNS}
        FROM app.content_sources
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        sourceId,
      ],
      executor
    );

  return mapOptionalSourceRow(
    result.rows[0]
  );
}

export async function findContentSourceByPublicId(
  publicId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord | null> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        SELECT
          ${SOURCE_COLUMNS}
        FROM app.content_sources
        WHERE public_id = $1
        LIMIT 1
      `,
      [
        normalizeRequiredSourceText(
          publicId
        ),
      ],
      executor
    );

  return mapOptionalSourceRow(
    result.rows[0]
  );
}

export async function listContentSources(
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord[]> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        SELECT
          ${SOURCE_COLUMNS}
        FROM app.content_sources
        ORDER BY
          name ASC,
          id ASC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapSourceRow
  );
}

export async function updateContentSourceLifecycle(
  input:
    UpdateContentSourceLifecycleInput,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord | null> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        UPDATE app.content_sources
        SET
          status = $3,

          paused_at =
            CASE
              WHEN $3 = 'paused'
                THEN $4
              ELSE NULL
            END,

          blocked_at =
            CASE
              WHEN $3 = 'blocked'
                THEN $4
              ELSE NULL
            END
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${SOURCE_COLUMNS}
      `,
      [
        input.sourceId,
        input.expectedRowVersion,
        input.status,
        input.changedAt,
      ],
      executor
    );

  return mapOptionalSourceRow(
    result.rows[0]
  );
}

export async function updateContentSourceHealth(
  input:
    UpdateContentSourceHealthInput,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceRecord | null> {
  const result =
    await executeDatabaseQuery<
      ContentSourceDatabaseRow
    >(
      `
        UPDATE app.content_sources
        SET
          health = $3,
          last_sync_at = $4,
          last_sync_error = $5,
          operational_note = $6
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${SOURCE_COLUMNS}
      `,
      [
        input.sourceId,
        input.expectedRowVersion,
        input.health,
        input.lastSyncAt ??
          null,

        normalizeOptionalSourceText(
          input.lastSyncError
        ),

        normalizeOptionalSourceText(
          input.operationalNote
        ),
      ],
      executor
    );

  return mapOptionalSourceRow(
    result.rows[0]
  );
}