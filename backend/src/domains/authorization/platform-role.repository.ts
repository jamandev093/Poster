import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  GrantPlatformRoleInput,
  PlatformRole,
  PlatformRoleAssignmentRecord,
  PlatformRoleAssignmentStatus,
  RevokePlatformRoleInput,
} from "./authorization.types.js";

interface PlatformRoleAssignmentDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  role:
    PlatformRole;

  status:
    PlatformRoleAssignmentStatus;

  granted_by_user_id:
    | string
    | null;

  granted_at: Date;

  revoked_at:
    | Date
    | null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const PLATFORM_ROLE_ASSIGNMENT_RETURNING_COLUMNS = `
  id,
  user_id,
  role,
  status,
  granted_by_user_id,
  granted_at,
  revoked_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapPlatformRoleAssignmentRow(
  row:
    PlatformRoleAssignmentDatabaseRow
): PlatformRoleAssignmentRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    role:
      row.role,

    status:
      row.status,

    grantedByUserId:
      row.granted_by_user_id,

    grantedAt:
      row.granted_at,

    revokedAt:
      row.revoked_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalPlatformRoleAssignmentRow(
  row:
    | PlatformRoleAssignmentDatabaseRow
    | undefined
): PlatformRoleAssignmentRecord | null {
  return row
    ? mapPlatformRoleAssignmentRow(
        row
      )
    : null;
}

export async function listActivePlatformRoleAssignmentsForUser(
  userId:
    string,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PlatformRoleAssignmentRecord[]
> {
  const result =
    await executeDatabaseQuery<
      PlatformRoleAssignmentDatabaseRow
    >(
      `
        SELECT
          ${PLATFORM_ROLE_ASSIGNMENT_RETURNING_COLUMNS}
        FROM app.platform_role_assignments
        WHERE
          user_id = $1::uuid
          AND status = 'active'
          AND revoked_at IS NULL
        ORDER BY
          granted_at ASC,
          id ASC
      `,
      [
        userId,
      ],
      executor
    );

  return result.rows.map(
    mapPlatformRoleAssignmentRow
  );
}

export async function grantPlatformRole(
  input:
    GrantPlatformRoleInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PlatformRoleAssignmentRecord
> {
  const result =
    await executeDatabaseQuery<
      PlatformRoleAssignmentDatabaseRow
    >(
      `
        INSERT INTO app.platform_role_assignments (
          user_id,
          role,
          status,
          granted_by_user_id,
          granted_at
        )
        VALUES (
          $1::uuid,
          $2,
          'active',
          $3::uuid,
          $4
        )
        RETURNING
          ${PLATFORM_ROLE_ASSIGNMENT_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.role,
        input.grantedByUserId ??
          null,
        input.grantedAt,
      ],
      executor
    );

  const assignment =
    mapOptionalPlatformRoleAssignmentRow(
      result.rows[0]
    );

  if (
    !assignment
  ) {
    throw new Error(
      "PostgreSQL did not return the granted platform role."
    );
  }

  return assignment;
}

export async function revokePlatformRole(
  input:
    RevokePlatformRoleInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PlatformRoleAssignmentRecord | null
> {
  const result =
    await executeDatabaseQuery<
      PlatformRoleAssignmentDatabaseRow
    >(
      `
        UPDATE app.platform_role_assignments
        SET
          status = 'revoked',
          revoked_at = $3
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND status = 'active'
          AND revoked_at IS NULL
        RETURNING
          ${PLATFORM_ROLE_ASSIGNMENT_RETURNING_COLUMNS}
      `,
      [
        input.assignmentId,
        input.expectedRowVersion,
        input.revokedAt,
      ],
      executor
    );

  return mapOptionalPlatformRoleAssignmentRow(
    result.rows[0]
  );
}