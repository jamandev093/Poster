import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  CommercialRequestRevisionRecord,
  CreateCommercialRequestRevisionInput,
} from "./commercial.types.js";

interface CommercialRequestRevisionDatabaseRow
  extends QueryResultRow {
  id: string;
  request_id: string;
  revision_number: number;
  submitted_by_user_id: string;
  payload: Record<string, unknown>;
  created_at: Date;
}

function mapCommercialRequestRevisionRow(
  row: CommercialRequestRevisionDatabaseRow
): CommercialRequestRevisionRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    revisionNumber: row.revision_number,
    submittedByUserId: row.submitted_by_user_id,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

export async function createCommercialRequestRevision(
  input: CreateCommercialRequestRevisionInput,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRevisionRecord> {
  const result =
    await executeDatabaseQuery<CommercialRequestRevisionDatabaseRow>(
      `
        INSERT INTO app.commercial_request_revisions (
          request_id,
          revision_number,
          submitted_by_user_id,
          payload,
          created_at
        )
        SELECT
          $1::uuid,
          COALESCE(
            max(revision_number),
            0
          ) + 1,
          $2::uuid,
          $3::jsonb,
          $4
        FROM app.commercial_request_revisions
        WHERE request_id = $1::uuid
        RETURNING
          id,
          request_id,
          revision_number,
          submitted_by_user_id,
          payload,
          created_at
      `,
      [
        input.requestId,
        input.submittedByUserId,
        input.payload,
        input.createdAt,
      ],
      executor
    );

  const revision = result.rows[0];

  if (!revision) {
    throw new Error(
      "PostgreSQL did not return the created commercial-request revision."
    );
  }

  return mapCommercialRequestRevisionRow(revision);
}

export async function listCommercialRequestRevisions(
  requestId: string,
  executor?: DatabaseQueryExecutor
): Promise<CommercialRequestRevisionRecord[]> {
  const result =
    await executeDatabaseQuery<CommercialRequestRevisionDatabaseRow>(
      `
        SELECT
          id,
          request_id,
          revision_number,
          submitted_by_user_id,
          payload,
          created_at
        FROM app.commercial_request_revisions
        WHERE request_id = $1::uuid
        ORDER BY
          revision_number ASC
      `,
      [
        requestId,
      ],
      executor
    );

  return result.rows.map(
    mapCommercialRequestRevisionRow
  );
}
