import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  assertAuthenticationTokenLifetime,
  assertMaximumVerificationAttempts,
  assertValidAuthenticationDate,
  normalizeAuthenticationTokenDigest,
  normalizeOptionalAuthenticationRequestText,
  runAuthenticationTokenTransaction,
} from "./authentication-token.repository.shared.js";

import type {
  ConsumePasswordResetTokenInput,
  CreatePasswordResetTokenInput,
  FindPendingPasswordResetTokenInput,
  InvalidatePasswordResetTokensInput,
  PasswordResetTokenRecord,
  RecordPasswordResetAttemptInput,
} from "./authentication-token.types.js";

interface PasswordResetTokenDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  token_digest: string;

  attempt_count: number;

  requested_ip_address:
    | string
    | null;

  requested_user_agent:
    | string
    | null;

  created_at: Date;

  expires_at: Date;

  consumed_at:
    | Date
    | null;

  invalidated_at:
    | Date
    | null;
}

const PASSWORD_RESET_DEFAULT_MAXIMUM_ATTEMPTS =
  5;

const PASSWORD_RESET_RETURNING_COLUMNS = `
  id,
  user_id,
  token_digest,
  attempt_count,
  host(requested_ip_address)
    AS requested_ip_address,
  requested_user_agent,
  created_at,
  expires_at,
  consumed_at,
  invalidated_at
`;

function mapPasswordResetTokenDatabaseRow(
  row:
    PasswordResetTokenDatabaseRow
): PasswordResetTokenRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    tokenDigest:
      row.token_digest,

    attemptCount:
      row.attempt_count,

    requestedIpAddress:
      row.requested_ip_address,

    requestedUserAgent:
      row.requested_user_agent,

    createdAt:
      row.created_at,

    expiresAt:
      row.expires_at,

    consumedAt:
      row.consumed_at,

    invalidatedAt:
      row.invalidated_at,
  };
}

function mapOptionalPasswordResetTokenRow(
  row:
    | PasswordResetTokenDatabaseRow
    | undefined
): PasswordResetTokenRecord | null {
  return row
    ? mapPasswordResetTokenDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates a new password-reset token digest.
 *
 * Issuance is serialized per user, and any older active
 * password-reset token is invalidated before insertion.
 */
export async function createPasswordResetToken(
  input:
    CreatePasswordResetTokenInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PasswordResetTokenRecord
> {
  assertAuthenticationTokenLifetime(
    input.createdAt,
    input.expiresAt
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  const requestedIpAddress =
    normalizeOptionalAuthenticationRequestText(
      input.requestedIpAddress
    );

  const requestedUserAgent =
    normalizeOptionalAuthenticationRequestText(
      input.requestedUserAgent
    );

  return await runAuthenticationTokenTransaction(
    async (
      client
    ) => {
      await client.query(
        `
          SELECT pg_advisory_xact_lock(
            hashtextextended(
              'password-reset:' || $1::text,
              0::bigint
            )
          )
        `,
        [
          input.userId,
        ]
      );

      await client.query(
        `
          UPDATE app.password_reset_tokens
          SET
            invalidated_at = $2
          WHERE
            user_id = $1::uuid
            AND consumed_at IS NULL
            AND invalidated_at IS NULL
        `,
        [
          input.userId,
          input.createdAt,
        ]
      );

      const result =
        await client.query<
          PasswordResetTokenDatabaseRow
        >(
          `
            INSERT INTO app.password_reset_tokens (
              user_id,
              token_digest,
              attempt_count,
              requested_ip_address,
              requested_user_agent,
              created_at,
              expires_at
            )
            VALUES (
              $1::uuid,
              $2,
              0,
              $3::inet,
              $4,
              $5,
              $6
            )
            RETURNING
              ${PASSWORD_RESET_RETURNING_COLUMNS}
          `,
          [
            input.userId,
            tokenDigest,
            requestedIpAddress,
            requestedUserAgent,
            input.createdAt,
            input.expiresAt,
          ]
        );

      const createdToken =
        mapOptionalPasswordResetTokenRow(
          result.rows[0]
        );

      if (
        !createdToken
      ) {
        throw new Error(
          "PostgreSQL did not return the created password-reset token."
        );
      }

      return createdToken;
    },
    executor
  );
}

/**
 * Finds the newest pending password-reset token for one user.
 *
 * Expired tokens remain visible so the application service can
 * return the correct domain error. FOR UPDATE serializes
 * confirmation attempts inside the service transaction.
 */
export async function findPendingPasswordResetToken(
  input:
    FindPendingPasswordResetTokenInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PasswordResetTokenRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      PasswordResetTokenDatabaseRow
    >(
      `
        SELECT
          ${PASSWORD_RESET_RETURNING_COLUMNS}
        FROM app.password_reset_tokens
        WHERE
          user_id = $1::uuid
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
        ORDER BY
          created_at DESC,
          id DESC
        LIMIT 1
        FOR UPDATE
      `,
      [
        input.userId,
      ],
      executor
    );

  return mapOptionalPasswordResetTokenRow(
    result.rows[0]
  );
}

/**
 * Atomically records one failed password-reset attempt.
 *
 * The token is invalidated when the new attempt count reaches
 * the configured maximum.
 */
export async function recordPasswordResetAttempt(
  input:
    RecordPasswordResetAttemptInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PasswordResetTokenRecord |
  null
> {
  assertMaximumVerificationAttempts(
    input.maximumAttempts
  );

  assertValidAuthenticationDate(
    input.attemptedAt,
    "Password-reset attempt time"
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  const result =
    await executeDatabaseQuery<
      PasswordResetTokenDatabaseRow
    >(
      `
        UPDATE app.password_reset_tokens
        SET
          attempt_count =
            attempt_count + 1,

          invalidated_at =
            CASE
              WHEN
                attempt_count + 1 >= $3::integer
                THEN $2
              ELSE invalidated_at
            END
        WHERE
          token_digest = $1
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > $2
          AND attempt_count < $3::integer
        RETURNING
          ${PASSWORD_RESET_RETURNING_COLUMNS}
      `,
      [
        tokenDigest,
        input.attemptedAt,
        input.maximumAttempts,
      ],
      executor
    );

  return mapOptionalPasswordResetTokenRow(
    result.rows[0]
  );
}

/**
 * Consumes one usable password-reset token atomically.
 */
export async function consumePasswordResetToken(
  input:
    ConsumePasswordResetTokenInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PasswordResetTokenRecord |
  null
> {
  assertValidAuthenticationDate(
    input.consumedAt,
    "Password-reset consumption time"
  );

  const maximumAttempts =
    input.maximumAttempts ??
    PASSWORD_RESET_DEFAULT_MAXIMUM_ATTEMPTS;

  assertMaximumVerificationAttempts(
    maximumAttempts
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  const result =
    await executeDatabaseQuery<
      PasswordResetTokenDatabaseRow
    >(
      `
        UPDATE app.password_reset_tokens
        SET
          consumed_at = $2
        WHERE
          token_digest = $1
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > $2
          AND attempt_count < $3::integer
        RETURNING
          ${PASSWORD_RESET_RETURNING_COLUMNS}
      `,
      [
        tokenDigest,
        input.consumedAt,
        maximumAttempts,
      ],
      executor
    );

  return mapOptionalPasswordResetTokenRow(
    result.rows[0]
  );
}

/**
 * Invalidates all active password-reset tokens for a user.
 */
export async function invalidatePasswordResetTokens(
  input:
    InvalidatePasswordResetTokensInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  number
> {
  assertValidAuthenticationDate(
    input.invalidatedAt,
    "Password-reset invalidation time"
  );

  const result =
    await executeDatabaseQuery(
      `
        UPDATE app.password_reset_tokens
        SET
          invalidated_at = $2
        WHERE
          user_id = $1::uuid
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
      `,
      [
        input.userId,
        input.invalidatedAt,
      ],
      executor
    );

  return result.rowCount ??
    0;
}