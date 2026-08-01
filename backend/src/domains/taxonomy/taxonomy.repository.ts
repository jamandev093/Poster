import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  assertValidTaxonomySortOrder,
  normalizeOptionalTaxonomyText,
  normalizeTaxonomyName,
  normalizeTaxonomySlug,
  type CreateTaxonomyTopicInput,
  type TaxonomyTopicRecord,
  type TaxonomyTopicStatus,
  type UpdateTaxonomyTopicInput,
} from "./taxonomy.types.js";

interface TaxonomyTopicDatabaseRow
  extends QueryResultRow {
  id: string;

  slug: string;

  name: string;

  description:
    string |
    null;

  parent_topic_id:
    string |
    null;

  status:
    TaxonomyTopicStatus;

  sort_order: number;

  created_at: Date;

  updated_at: Date;

  archived_at:
    Date |
    null;

  row_version: string;
}

const TAXONOMY_TOPIC_COLUMNS = `
  id,
  slug,
  name,
  description,
  parent_topic_id,
  status,
  sort_order,
  created_at,
  updated_at,
  archived_at,
  row_version::text
    AS row_version
`;

function mapTaxonomyTopicRow(
  row:
    TaxonomyTopicDatabaseRow
): TaxonomyTopicRecord {
  return {
    id:
      row.id,

    slug:
      row.slug,

    name:
      row.name,

    description:
      row.description,

    parentTopicId:
      row.parent_topic_id,

    status:
      row.status,

    sortOrder:
      row.sort_order,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    archivedAt:
      row.archived_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalTaxonomyTopicRow(
  row:
    TaxonomyTopicDatabaseRow |
    undefined
): TaxonomyTopicRecord | null {
  return row
    ? mapTaxonomyTopicRow(
        row
      )
    : null;
}

export async function createTaxonomyTopic(
  input:
    CreateTaxonomyTopicInput,
  executor?:
    DatabaseQueryExecutor
): Promise<TaxonomyTopicRecord> {
  const status =
    input.status ??
    "active";

  const archivedAt =
    status === "archived"
      ? new Date()
      : null;

  const result =
    await executeDatabaseQuery<
      TaxonomyTopicDatabaseRow
    >(
      `
        INSERT INTO app.taxonomy_topics (
          slug,
          name,
          description,
          parent_topic_id,
          status,
          sort_order,
          archived_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4::uuid,
          $5,
          $6,
          $7
        )
        RETURNING
          ${TAXONOMY_TOPIC_COLUMNS}
      `,
      [
        normalizeTaxonomySlug(
          input.slug
        ),

        normalizeTaxonomyName(
          input.name
        ),

        normalizeOptionalTaxonomyText(
          input.description
        ),

        input.parentTopicId ??
          null,

        status,

        assertValidTaxonomySortOrder(
          input.sortOrder ??
            0
        ),

        archivedAt,
      ],
      executor
    );

  const topic =
    mapOptionalTaxonomyTopicRow(
      result.rows[0]
    );

  if (
    !topic
  ) {
    throw new Error(
      "PostgreSQL did not return the created taxonomy topic."
    );
  }

  return topic;
}

export async function findTaxonomyTopicById(
  topicId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<TaxonomyTopicRecord | null> {
  const result =
    await executeDatabaseQuery<
      TaxonomyTopicDatabaseRow
    >(
      `
        SELECT
          ${TAXONOMY_TOPIC_COLUMNS}
        FROM app.taxonomy_topics
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        topicId,
      ],
      executor
    );

  return mapOptionalTaxonomyTopicRow(
    result.rows[0]
  );
}

export async function findTaxonomyTopicBySlug(
  slug: string,
  executor?:
    DatabaseQueryExecutor
): Promise<TaxonomyTopicRecord | null> {
  const result =
    await executeDatabaseQuery<
      TaxonomyTopicDatabaseRow
    >(
      `
        SELECT
          ${TAXONOMY_TOPIC_COLUMNS}
        FROM app.taxonomy_topics
        WHERE slug = $1
        LIMIT 1
      `,
      [
        normalizeTaxonomySlug(
          slug
        ),
      ],
      executor
    );

  return mapOptionalTaxonomyTopicRow(
    result.rows[0]
  );
}

export async function listActiveTaxonomyTopics(
  executor?:
    DatabaseQueryExecutor
): Promise<TaxonomyTopicRecord[]> {
  const result =
    await executeDatabaseQuery<
      TaxonomyTopicDatabaseRow
    >(
      `
        SELECT
          ${TAXONOMY_TOPIC_COLUMNS}
        FROM app.taxonomy_topics
        WHERE status = 'active'
        ORDER BY
          sort_order ASC,
          name ASC,
          id ASC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapTaxonomyTopicRow
  );
}

export async function updateTaxonomyTopic(
  input:
    UpdateTaxonomyTopicInput,
  executor?:
    DatabaseQueryExecutor
): Promise<TaxonomyTopicRecord | null> {
  const result =
    await executeDatabaseQuery<
      TaxonomyTopicDatabaseRow
    >(
      `
        UPDATE app.taxonomy_topics
        SET
          slug = $3,
          name = $4,
          description = $5,
          parent_topic_id = $6::uuid,
          status = $7,
          sort_order = $8,
          archived_at =
            CASE
              WHEN $7 = 'archived'
                THEN COALESCE(
                  archived_at,
                  $9
                )
              ELSE NULL
            END
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${TAXONOMY_TOPIC_COLUMNS}
      `,
      [
        input.topicId,
        input.expectedRowVersion,

        normalizeTaxonomySlug(
          input.slug
        ),

        normalizeTaxonomyName(
          input.name
        ),

        normalizeOptionalTaxonomyText(
          input.description
        ),

        input.parentTopicId ??
          null,

        input.status,

        assertValidTaxonomySortOrder(
          input.sortOrder
        ),

        input.changedAt,
      ],
      executor
    );

  return mapOptionalTaxonomyTopicRow(
    result.rows[0]
  );
}
