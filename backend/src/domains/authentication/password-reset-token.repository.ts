import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  assertAuthenticationTokenLifetime,
  assertValidAuthenticationDate,
  normalizeAuthenticationTokenDigest,
  normalizeOptionalAuthenticationRequestText,
  runAuthenticationTokenTransaction,
} from "./authentication-token.repository.shared.js";

import type {
  ConsumePasswordResetTokenInput,
  CreatePasswordResetTokenInput,
  InvalidatePasswordResetTokensInput,
  PasswordResetTokenRecord,
} from "./authentication-token.types.js";

interface PasswordResetTokenDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  token_digest: string;

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

const PASSWORD_RESET_RETURNING_COLUMNS = `
  id,
  user_id,
  token_digest,
  host(requested_ip_address)
    AS requested_ip_address,
  requested_user_agent,
  created_at,
  expires_at,
  consumed_at,
  invalidated_at
`;

function mapPasswordResetTokenDatabaseRow(
  row: PasswordResetTokenDatabaseRow
): PasswordResetTokenRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    tokenDigest:
      row.token_digest,

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
  input: CreatePasswordResetTokenInput,
  executor?: DatabaseQueryExecutor
): Promise<PasswordResetTokenRecord> {
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
              requested_ip_address,
              requested_user_agent,
              created_at,
              expires_at
            )
            VALUES (
              $1::uuid,
              $2,
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

      if (!createdToken) {
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
 * Consumes one usable password-reset token atomically.
 */
export async function consumePasswordResetToken(
  input: ConsumePasswordResetTokenInput,
  executor?: DatabaseQueryExecutor
): Promise<PasswordResetTokenRecord | null> {
  assertValidAuthenticationDate(
    input.consumedAt,
    "Password-reset consumption time"
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
        RETURNING
          ${PASSWORD_RESET_RETURNING_COLUMNS}
      `,
      [
        tokenDigest,
        input.consumedAt,
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
  input: InvalidatePasswordResetTokensInput,
  executor?: DatabaseQueryExecutor
): Promise<number> {
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

  return result.rowCount ?? 0;
}