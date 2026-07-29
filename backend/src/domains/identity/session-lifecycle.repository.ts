import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import type {
  UserSessionRecord,
} from "./identity.types.js";

interface UserSessionDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  organization_id:
    | string
    | null;

  refresh_token_digest: string;

  ip_address:
    | string
    | null;

  user_agent:
    | string
    | null;

  created_at: Date;

  last_seen_at: Date;

  expires_at: Date;

  revoked_at:
    | Date
    | null;

  revocation_reason:
    | string
    | null;
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

const QUALIFIED_SESSION_SELECT_COLUMNS = `
  sessions.id,
  sessions.user_id,
  sessions.organization_id,
  sessions.refresh_token_digest,
  sessions.ip_address::text
    AS ip_address,
  sessions.user_agent,
  sessions.created_at,
  sessions.last_seen_at,
  sessions.expires_at,
  sessions.revoked_at,
  sessions.revocation_reason
`;

const REFRESH_TOKEN_DIGEST_PATTERN =
  /^[a-f0-9]{64}$/;

export interface RotateUserSessionRefreshTokenInput {
  currentRefreshTokenDigest: string;

  replacementRefreshTokenDigest: string;

  rotatedAt: Date;
}

export type RotateUserSessionRefreshTokenResult =
  | {
      status: "rotated";

      session:
        UserSessionRecord;
    }
  | {
      status: "replayed";

      sessionId: string;

      userId: string;
    }
  | {
      status: "invalid";
    };

export interface RevokeUserSessionByRefreshTokenDigestInput {
  refreshTokenDigest: string;

  revokedAt: Date;

  reason: string;
}

function assertValidDate(
  value: Date,
  label: string
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      `${label} must be a valid date.`
    );
  }
}

function normalizeRefreshTokenDigest(
  value: string
): string {
  const normalizedValue =
    value
      .trim()
      .toLowerCase();

  if (
    !REFRESH_TOKEN_DIGEST_PATTERN.test(
      normalizedValue
    )
  ) {
    throw new RangeError(
      "Refresh-token digest must be a lowercase SHA-256 digest."
    );
  }

  return normalizedValue;
}

function normalizeRevocationReason(
  value: string
): string {
  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length === 0 ||
    normalizedValue.length > 200
  ) {
    throw new RangeError(
      "Session revocation reason must contain between 1 and 200 characters."
    );
  }

  return normalizedValue;
}

function mapUserSessionDatabaseRow(
  row:
    UserSessionDatabaseRow
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

async function executeRefreshTokenRotation(
  input:
    RotateUserSessionRefreshTokenInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  RotateUserSessionRefreshTokenResult
> {
  assertValidDate(
    input.rotatedAt,
    "Refresh-token rotation time"
  );

  const currentDigest =
    normalizeRefreshTokenDigest(
      input.currentRefreshTokenDigest
    );

  const replacementDigest =
    normalizeRefreshTokenDigest(
      input.replacementRefreshTokenDigest
    );

  if (
    currentDigest ===
    replacementDigest
  ) {
    throw new RangeError(
      "Replacement refresh-token digest must differ from the current digest."
    );
  }

  const currentSessionResult =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        SELECT
          ${SESSION_RETURNING_COLUMNS}
        FROM app.user_sessions
        WHERE
          refresh_token_digest = $1
        LIMIT 1
        FOR UPDATE
      `,
      [
        currentDigest,
      ],
      executor
    );

  const currentSession =
    currentSessionResult
      .rows[0];

  if (
    currentSession
  ) {
    if (
      currentSession.revoked_at !==
        null ||
      currentSession
        .expires_at
        .getTime() <=
        input
          .rotatedAt
          .getTime()
    ) {
      return {
        status:
          "invalid",
      };
    }

    await executeDatabaseQuery(
      `
        INSERT INTO app.user_session_refresh_token_history (
          session_id,
          refresh_token_digest,
          rotated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3
        )
      `,
      [
        currentSession.id,
        currentDigest,
        input.rotatedAt,
      ],
      executor
    );

    const updatedSessionResult =
      await executeDatabaseQuery<
        UserSessionDatabaseRow
      >(
        `
          UPDATE app.user_sessions
          SET
            refresh_token_digest = $2,
            last_seen_at = $3
          WHERE
            id = $1::uuid
            AND refresh_token_digest = $4
            AND revoked_at IS NULL
            AND expires_at > $3
          RETURNING
            ${SESSION_RETURNING_COLUMNS}
        `,
        [
          currentSession.id,
          replacementDigest,
          input.rotatedAt,
          currentDigest,
        ],
        executor
      );

    const updatedSession =
      updatedSessionResult
        .rows[0];

    if (
      !updatedSession
    ) {
      throw new Error(
        "PostgreSQL did not return the rotated user session."
      );
    }

    return {
      status:
        "rotated",

      session:
        mapUserSessionDatabaseRow(
          updatedSession
        ),
    };
  }

  const replayResult =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        SELECT
          ${QUALIFIED_SESSION_SELECT_COLUMNS}
        FROM app.user_session_refresh_token_history
          AS history
        INNER JOIN app.user_sessions
          AS sessions
          ON sessions.id =
            history.session_id
        WHERE
          history.refresh_token_digest = $1
        LIMIT 1
        FOR UPDATE OF
          history,
          sessions
      `,
      [
        currentDigest,
      ],
      executor
    );

  const replayedSession =
    replayResult
      .rows[0];

  if (
    !replayedSession
  ) {
    return {
      status:
        "invalid",
    };
  }

  await executeDatabaseQuery(
    `
      UPDATE app.user_session_refresh_token_history
      SET
        replay_detected_at =
          COALESCE(
            replay_detected_at,
            $2
          )
      WHERE
        refresh_token_digest = $1
    `,
    [
      currentDigest,
      input.rotatedAt,
    ],
    executor
  );

  await executeDatabaseQuery(
    `
      UPDATE app.user_sessions
      SET
        revoked_at =
          COALESCE(
            revoked_at,
            $2
          ),

        revocation_reason =
          COALESCE(
            revocation_reason,
            'refresh_token_replay_detected'
          )
      WHERE
        id = $1::uuid
    `,
    [
      replayedSession.id,
      input.rotatedAt,
    ],
    executor
  );

  return {
    status:
      "replayed",

    sessionId:
      replayedSession.id,

    userId:
      replayedSession.user_id,
  };
}

/**
 * Atomically replaces the active refresh-token digest.
 *
 * A previously rotated digest is treated as a replay attempt.
 * Replay detection revokes the corresponding session before
 * the result is returned to the application service.
 */
export async function rotateUserSessionRefreshToken(
  input:
    RotateUserSessionRefreshTokenInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  RotateUserSessionRefreshTokenResult
> {
  if (
    executor
  ) {
    return await executeRefreshTokenRotation(
      input,
      executor
    );
  }

  return await runDatabaseTransaction(
    async (
      client
    ) => {
      return await executeRefreshTokenRotation(
        input,
        client
      );
    }
  );
}

/**
 * Revokes the session represented by either its current
 * refresh-token digest or any rotated digest in its history.
 *
 * Unknown tokens remain an idempotent no-op for logout.
 */
export async function revokeUserSessionByRefreshTokenDigest(
  input:
    RevokeUserSessionByRefreshTokenDigestInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  UserSessionRecord |
  null
> {
  assertValidDate(
    input.revokedAt,
    "Session revocation time"
  );

  const refreshTokenDigest =
    normalizeRefreshTokenDigest(
      input.refreshTokenDigest
    );

  const reason =
    normalizeRevocationReason(
      input.reason
    );

  const result =
    await executeDatabaseQuery<
      UserSessionDatabaseRow
    >(
      `
        WITH target_session AS (
          SELECT
            sessions.id
          FROM app.user_sessions
            AS sessions
          WHERE
            sessions.refresh_token_digest = $1

          UNION ALL

          SELECT
            history.session_id
          FROM app.user_session_refresh_token_history
            AS history
          WHERE
            history.refresh_token_digest = $1

          LIMIT 1
        )
        UPDATE app.user_sessions
        SET
          revoked_at =
            COALESCE(
              revoked_at,
              $2
            ),

          revocation_reason =
            COALESCE(
              revocation_reason,
              $3
            )
        WHERE
          id = (
            SELECT
              id
            FROM target_session
          )
        RETURNING
          ${SESSION_RETURNING_COLUMNS}
      `,
      [
        refreshTokenDigest,
        input.revokedAt,
        reason,
      ],
      executor
    );

  const session =
    result.rows[0];

  return session
    ? mapUserSessionDatabaseRow(
        session
      )
    : null;
}