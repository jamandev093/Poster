import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeRequiredCopyrightText,
} from "./copyright-case.types.js";

import type {
  CopyrightVerificationCheckKey,
  CopyrightVerificationCheckRecord,
  CopyrightVerificationCheckStatus,
  UpsertCopyrightVerificationCheckInput,
} from "./copyright-verification.types.js";

interface VerificationDatabaseRow
  extends QueryResultRow {
  id: string;

  case_id: string;

  check_key:
    CopyrightVerificationCheckKey;

  label: string;

  status:
    CopyrightVerificationCheckStatus;

  detail: string;

  verified_by_user_id:
    string |
    null;

  verified_at:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const VERIFICATION_COLUMNS = `
  id,
  case_id,
  check_key,
  label,
  status,
  detail,
  verified_by_user_id,
  verified_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapVerificationRow(
  row:
    VerificationDatabaseRow
): CopyrightVerificationCheckRecord {
  return {
    id:
      row.id,

    caseId:
      row.case_id,

    checkKey:
      row.check_key,

    label:
      row.label,

    status:
      row.status,

    detail:
      row.detail,

    verifiedByUserId:
      row.verified_by_user_id,

    verifiedAt:
      row.verified_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function listCopyrightVerificationChecks(
  caseId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightVerificationCheckRecord[]> {
  const result =
    await executeDatabaseQuery<
      VerificationDatabaseRow
    >(
      `
        SELECT
          ${VERIFICATION_COLUMNS}
        FROM app.copyright_verification_checks
        WHERE case_id = $1::uuid
        ORDER BY
          check_key ASC,
          id ASC
      `,
      [
        caseId,
      ],
      executor
    );

  return result.rows.map(
    mapVerificationRow
  );
}

export async function upsertCopyrightVerificationCheck(
  input:
    UpsertCopyrightVerificationCheckInput,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightVerificationCheckRecord> {
  const result =
    await executeDatabaseQuery<
      VerificationDatabaseRow
    >(
      `
        INSERT INTO app.copyright_verification_checks (
          case_id,
          check_key,
          label,
          status,
          detail,
          verified_by_user_id,
          verified_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6::uuid,
          $7
        )
        ON CONFLICT (
          case_id,
          check_key
        )
        DO UPDATE
        SET
          label =
            EXCLUDED.label,
          status =
            EXCLUDED.status,
          detail =
            EXCLUDED.detail,
          verified_by_user_id =
            EXCLUDED.verified_by_user_id,
          verified_at =
            EXCLUDED.verified_at
        RETURNING
          ${VERIFICATION_COLUMNS}
      `,
      [
        input.caseId,
        input.checkKey,

        normalizeRequiredCopyrightText(
          input.label
        ),

        input.status,

        normalizeRequiredCopyrightText(
          input.detail
        ),

        input.verifiedByUserId,
        input.verifiedAt,
      ],
      executor
    );

  const record =
    result.rows[0];

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the copyright verification check."
    );
  }

  return mapVerificationRow(
    record
  );
}