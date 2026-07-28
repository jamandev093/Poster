import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
} from "../../database/database.pool.js";

import {
  type CreateOrganizationMembershipInput,
  type MembershipStatus,
  type OrganizationMembershipRecord,
  type OrganizationRole,
  type UpdateOrganizationMembershipRoleInput,
  type UpdateOrganizationMembershipStatusInput,
} from "./identity.types.js";

interface OrganizationMembershipDatabaseRow
  extends QueryResultRow {
  id: string;

  organization_id: string;

  user_id: string;

  role: OrganizationRole;

  status: MembershipStatus;

  is_primary_contact: boolean;

  invited_by_user_id:
    string |
    null;

  invited_at:
    Date |
    null;

  joined_at:
    Date |
    null;

  suspended_at:
    Date |
    null;

  revoked_at:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const MEMBERSHIP_RETURNING_COLUMNS = `
  id,
  organization_id,
  user_id,
  role,
  status,
  is_primary_contact,
  invited_by_user_id,
  invited_at,
  joined_at,
  suspended_at,
  revoked_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapOrganizationMembershipDatabaseRow(
  row: OrganizationMembershipDatabaseRow
): OrganizationMembershipRecord {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    userId:
      row.user_id,

    role:
      row.role,

    status:
      row.status,

    isPrimaryContact:
      row.is_primary_contact,

    invitedByUserId:
      row.invited_by_user_id,

    invitedAt:
      row.invited_at,

    joinedAt:
      row.joined_at,

    suspendedAt:
      row.suspended_at,

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

function mapOptionalMembershipRow(
  row:
    OrganizationMembershipDatabaseRow |
    undefined
): OrganizationMembershipRecord | null {
  return row
    ? mapOrganizationMembershipDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates a user membership inside an organization.
 *
 * The database enforces one membership per organization/user
 * pair and one active primary contact per organization.
 */
export async function createOrganizationMembership(
  input: CreateOrganizationMembershipInput
): Promise<OrganizationMembershipRecord> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        INSERT INTO app.organization_memberships (
          organization_id,
          user_id,
          role,
          status,
          is_primary_contact,
          invited_by_user_id,
          invited_at,
          joined_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5,
          $6::uuid,
          $7,
          $8
        )
        RETURNING
          ${MEMBERSHIP_RETURNING_COLUMNS}
      `,
      [
        input.organizationId,
        input.userId,
        input.role,
        input.status ?? "invited",
        input.isPrimaryContact ?? false,
        input.invitedByUserId ?? null,
        input.invitedAt ?? null,
        input.joinedAt ?? null,
      ]
    );

  const membership =
    mapOptionalMembershipRow(
      result.rows[0]
    );

  if (!membership) {
    throw new Error(
      "PostgreSQL did not return the created organization membership."
    );
  }

  return membership;
}

/**
 * Retrieves one organization membership by immutable UUID.
 */
export async function findOrganizationMembershipById(
  membershipId: string
): Promise<OrganizationMembershipRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        SELECT
          ${MEMBERSHIP_RETURNING_COLUMNS}
        FROM app.organization_memberships
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        membershipId,
      ]
    );

  return mapOptionalMembershipRow(
    result.rows[0]
  );
}

/**
 * Retrieves the unique membership for one user and
 * organization pair.
 */
export async function findOrganizationMembership(
  organizationId: string,
  userId: string
): Promise<OrganizationMembershipRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        SELECT
          ${MEMBERSHIP_RETURNING_COLUMNS}
        FROM app.organization_memberships
        WHERE
          organization_id = $1::uuid
          AND user_id = $2::uuid
        LIMIT 1
      `,
      [
        organizationId,
        userId,
      ]
    );

  return mapOptionalMembershipRow(
    result.rows[0]
  );
}

/**
 * Lists active organization memberships for a user.
 *
 * This is the repository boundary used to determine which
 * organizations an authenticated user can enter.
 */
export async function listActiveMembershipsForUser(
  userId: string
): Promise<OrganizationMembershipRecord[]> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        SELECT
          ${MEMBERSHIP_RETURNING_COLUMNS}
        FROM app.organization_memberships
        WHERE
          user_id = $1::uuid
          AND status = 'active'
        ORDER BY
          created_at ASC,
          id ASC
      `,
      [
        userId,
      ]
    );

  return result.rows.map(
    mapOrganizationMembershipDatabaseRow
  );
}

/**
 * Updates a membership role using optimistic concurrency.
 */
export async function updateOrganizationMembershipRole(
  input: UpdateOrganizationMembershipRoleInput
): Promise<OrganizationMembershipRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        UPDATE app.organization_memberships
        SET role = $3
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
        RETURNING
          ${MEMBERSHIP_RETURNING_COLUMNS}
      `,
      [
        input.membershipId,
        input.expectedRowVersion,
        input.role,
      ]
    );

  return mapOptionalMembershipRow(
    result.rows[0]
  );
}

/**
 * Updates membership status and records the corresponding
 * lifecycle timestamp.
 */
export async function updateOrganizationMembershipStatus(
  input: UpdateOrganizationMembershipStatusInput
): Promise<OrganizationMembershipRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationMembershipDatabaseRow
    >(
      `
        UPDATE app.organization_memberships
        SET
          status = $3,

          joined_at =
            CASE
              WHEN
                $3 = 'active'
                AND joined_at IS NULL
              THEN $4
              ELSE joined_at
            END,

          suspended_at =
            CASE
              WHEN $3 = 'suspended'
                THEN $4
              ELSE suspended_at
            END,

          revoked_at =
            CASE
              WHEN $3 = 'revoked'
                THEN $4
              ELSE revoked_at
            END
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
        RETURNING
          ${MEMBERSHIP_RETURNING_COLUMNS}
      `,
      [
        input.membershipId,
        input.expectedRowVersion,
        input.status,
        input.changedAt,
      ]
    );

  return mapOptionalMembershipRow(
    result.rows[0]
  );
}