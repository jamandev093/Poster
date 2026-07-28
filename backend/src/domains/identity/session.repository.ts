import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeOptionalIdentityText,
  normalizeRequiredIdentityText,
  type CreateUserSessionInput,
  type RevokeAllUserSessionsInput,
  type RevokeUserSessionInput,
  type TouchUserSessionInput,
  type UserSessionRecord,
} from "./identity.types.js";

interface UserSessionDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  organization_id:
    string |
    null;

  refresh_token_digest: string;

  ip_address:
    string |
    null;

  user_agent:
    string |
    null;

  created_at: Date;

  last_seen_at: Date;

  expires_at: Date;

  revoked_at:
    Date |
    null;

  revocation_reason:
    string |
    null;
}

const SESSION_RETURNING_COLUMNS = `
  id,
  user_id,
  organization_id,
  refresh_token_digest,
  ip_address::text
    AS ip_address,
  user_agent,
  created_at,
  last_seen_at,
  expires_at,
  revoked_at,
  revocation_reason
`;

function mapUserSessionDatabaseRow(
  row: UserSessionDatabaseRow
): UserSessionRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    organizationId:
      row.organization_id,

    refreshTokenDigest:
      row.refresh_token_digest,

    ipAddress:
      row.ip_address,

    userAgent:
      row.user_agent,

    createdAt:
      row.created_at,

    lastSeenAt:
      row.last_seen_at,

    expiresAt:
      row.expires_at,

    revokedAt:
      row.revoked_at,

    revocationReason:
      row.revocation_reason,
  };
}

function mapOptionalSessionRow(
  row:
    UserSessionDatabaseRow |
    undefined
): UserSessionRecord | null {
  return row
    ? mapUserSessionDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates a revocable authenticated session.
 *
 * Only a cryptographic refresh-token digest may be supplied.
 * Raw refresh tokens must never be stored in PostgreSQL.
 */
export async function createUserSession(
  input: CreateUserSessionInput,
  executor?: DatabaseQueryExecutor
): Promise<UserSessionRecord> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        INSERT INTO app.user_sessions (
          user_id,
          organization_id,
          refresh_token_digest,
          ip_address,
          user_agent,
          expires_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4::inet,
          $5,
          $6
        )
        RETURNING
          ${SESSION_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.organizationId ?? null,

        normalizeRequiredIdentityText(
          input.refreshTokenDigest
        ),

        normalizeOptionalIdentityText(
          input.ipAddress
        ),

        normalizeOptionalIdentityText(
          input.userAgent
        ),

        input.expiresAt,
      ],
      executor
    );

  const session =
    mapOptionalSessionRow(
      result.rows[0]
    );

  if (!session) {
    throw new Error(
      "PostgreSQL did not return the created user session."
    );
  }

  return session;
}

/**
 * Finds an unexpired and unrevoked session using its
 * refresh-token digest.
 */
export async function findActiveUserSessionByDigest(
  refreshTokenDigest: string,
  executor?: DatabaseQueryExecutor
): Promise<UserSessionRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        SELECT
          ${SESSION_RETURNING_COLUMNS}
        FROM app.user_sessions
        WHERE
          refresh_token_digest = $1
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `,
      [
        normalizeRequiredIdentityText(
          refreshTokenDigest
        ),
      ],
      executor
    );

  return mapOptionalSessionRow(
    result.rows[0]
  );
}

/**
 * Retrieves one session by immutable UUID.
 */
export async function findUserSessionById(
  sessionId: string,
  executor?: DatabaseQueryExecutor
): Promise<UserSessionRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        SELECT
          ${SESSION_RETURNING_COLUMNS}
        FROM app.user_sessions
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        sessionId,
      ],
      executor
    );

  return mapOptionalSessionRow(
    result.rows[0]
  );
}

/**
 * Updates session activity only while the session remains
 * unexpired and unrevoked.
 */
export async function touchUserSession(
  input: TouchUserSessionInput,
  executor?: DatabaseQueryExecutor
): Promise<UserSessionRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        UPDATE app.user_sessions
        SET last_seen_at = $2
        WHERE
          id = $1::uuid
          AND revoked_at IS NULL
          AND expires_at > $2
        RETURNING
          ${SESSION_RETURNING_COLUMNS}
      `,
      [
        input.sessionId,
        input.seenAt,
      ],
      executor
    );

  return mapOptionalSessionRow(
    result.rows[0]
  );
}

/**
 * Revokes one session. Repeated revocation requests do not
 * overwrite the original revocation time or reason.
 */
export async function revokeUserSession(
  input: RevokeUserSessionInput,
  executor?: DatabaseQueryExecutor
): Promise<UserSessionRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        UPDATE app.user_sessions
        SET
          revoked_at = $2,
          revocation_reason = $3
        WHERE
          id = $1::uuid
          AND revoked_at IS NULL
        RETURNING
          ${SESSION_RETURNING_COLUMNS}
      `,
      [
        input.sessionId,
        input.revokedAt,

        normalizeOptionalIdentityText(
          input.reason
        ),
      ],
      executor
    );

  return mapOptionalSessionRow(
    result.rows[0]
  );
}

/**
 * Revokes every active session for a user.
 *
 * This operation supports password changes, account security
 * events, suspensions, and explicit global logout.
 */
export async function revokeAllUserSessions(
  input: RevokeAllUserSessionsInput,
  executor?: DatabaseQueryExecutor
): Promise<number> {
  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        UPDATE app.user_sessions
        SET
          revoked_at = $2,
          revocation_reason = $3
        WHERE
          user_id = $1::uuid
          AND revoked_at IS NULL
        RETURNING
          ${SESSION_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.revokedAt,

        normalizeOptionalIdentityText(
          input.reason
        ),
      ],
      executor
    );

  return result.rowCount ?? 0;
}