import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
} from "../../database/database.pool.js";

import {
  assertAuthenticationTokenLifetime,
  assertMaximumVerificationAttempts,
  assertValidAuthenticationDate,
  normalizeAuthenticationTokenDigest,
  runAuthenticationTokenTransaction,
} from "./authentication-token.repository.shared.js";

import type {
  ConsumeEmailVerificationTokenInput,
  CreateEmailVerificationTokenInput,
  EmailVerificationPurpose,
  EmailVerificationTokenRecord,
  InvalidateEmailVerificationTokensInput,
  RecordEmailVerificationAttemptInput,
} from "./authentication-token.types.js";

interface EmailVerificationTokenDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  token_digest: string;

  purpose: EmailVerificationPurpose;

  attempt_count: number;

  created_at: Date;

  expires_at: Date;

  consumed_at:
    | Date
    | null;

  invalidated_at:
    | Date
    | null;
}

const EMAIL_VERIFICATION_RETURNING_COLUMNS = `
  id,
  user_id,
  token_digest,
  purpose,
  attempt_count,
  created_at,
  expires_at,
  consumed_at,
  invalidated_at
`;

function mapEmailVerificationTokenDatabaseRow(
  row: EmailVerificationTokenDatabaseRow
): EmailVerificationTokenRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    tokenDigest:
      row.token_digest,

    purpose:
      row.purpose,

    attemptCount:
      row.attempt_count,

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

function mapOptionalEmailVerificationTokenRow(
  row:
    | EmailVerificationTokenDatabaseRow
    | undefined
): EmailVerificationTokenRecord | null {
  return row
    ? mapEmailVerificationTokenDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates a new email-verification token digest.
 *
 * A transaction-scoped advisory lock serializes token issuance
 * for the same user and purpose. Any older active token for the
 * same purpose is invalidated before the new token is inserted.
 */
export async function createEmailVerificationToken(
  input: CreateEmailVerificationTokenInput
): Promise<EmailVerificationTokenRecord> {
  assertAuthenticationTokenLifetime(
    input.createdAt,
    input.expiresAt
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  return await runAuthenticationTokenTransaction(
    async (
      client
    ) => {
      await client.query(
        `
          SELECT pg_advisory_xact_lock(
            hashtextextended(
              $1::text || ':' || $2::text,
              0::bigint
            )
          )
        `,
        [
          input.userId,
          input.purpose,
        ]
      );

      await client.query(
        `
          UPDATE app.email_verification_tokens
          SET
            invalidated_at = $3
          WHERE
            user_id = $1::uuid
            AND purpose = $2
            AND consumed_at IS NULL
            AND invalidated_at IS NULL
        `,
        [
          input.userId,
          input.purpose,
          input.createdAt,
        ]
      );

      const result =
        await client.query<
          EmailVerificationTokenDatabaseRow
        >(
          `
            INSERT INTO app.email_verification_tokens (
              user_id,
              token_digest,
              purpose,
              created_at,
              expires_at
            )
            VALUES (
              $1::uuid,
              $2,
              $3,
              $4,
              $5
            )
            RETURNING
              ${EMAIL_VERIFICATION_RETURNING_COLUMNS}
          `,
          [
            input.userId,
            tokenDigest,
            input.purpose,
            input.createdAt,
            input.expiresAt,
          ]
        );

      const createdToken =
        mapOptionalEmailVerificationTokenRow(
          result.rows[0]
        );

      if (!createdToken) {
        throw new Error(
          "PostgreSQL did not return the created email-verification token."
        );
      }

      return createdToken;
    }
  );
}

/**
 * Atomically records one failed verification attempt.
 *
 * The token is automatically invalidated when the new attempt
 * count reaches the supplied maximum.
 */
export async function recordEmailVerificationAttempt(
  input: RecordEmailVerificationAttemptInput
): Promise<EmailVerificationTokenRecord | null> {
  assertMaximumVerificationAttempts(
    input.maximumAttempts
  );

  assertValidAuthenticationDate(
    input.attemptedAt,
    "Email-verification attempt time"
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  const result =
    await executeDatabaseQuery<
      EmailVerificationTokenDatabaseRow
    >(
      `
        UPDATE app.email_verification_tokens
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
          ${EMAIL_VERIFICATION_RETURNING_COLUMNS}
      `,
      [
        tokenDigest,
        input.attemptedAt,
        input.maximumAttempts,
      ]
    );

  return mapOptionalEmailVerificationTokenRow(
    result.rows[0]
  );
}

/**
 * Consumes one usable email-verification token atomically.
 *
 * A second concurrent or later consumption attempt receives
 * null because consumed_at is no longer null.
 */
export async function consumeEmailVerificationToken(
  input: ConsumeEmailVerificationTokenInput
): Promise<EmailVerificationTokenRecord | null> {
  assertMaximumVerificationAttempts(
    input.maximumAttempts
  );

  assertValidAuthenticationDate(
    input.consumedAt,
    "Email-verification consumption time"
  );

  const tokenDigest =
    normalizeAuthenticationTokenDigest(
      input.tokenDigest
    );

  const result =
    await executeDatabaseQuery<
      EmailVerificationTokenDatabaseRow
    >(
      `
        UPDATE app.email_verification_tokens
        SET
          consumed_at = $2
        WHERE
          token_digest = $1
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > $2
          AND attempt_count < $3::integer
        RETURNING
          ${EMAIL_VERIFICATION_RETURNING_COLUMNS}
      `,
      [
        tokenDigest,
        input.consumedAt,
        input.maximumAttempts,
      ]
    );

  return mapOptionalEmailVerificationTokenRow(
    result.rows[0]
  );
}

/**
 * Invalidates all active email-verification tokens for a user.
 *
 * A purpose may be supplied to invalidate only signup or only
 * email-change tokens.
 */
export async function invalidateEmailVerificationTokens(
  input: InvalidateEmailVerificationTokensInput
): Promise<number> {
  assertValidAuthenticationDate(
    input.invalidatedAt,
    "Email-verification invalidation time"
  );

  const result =
    await executeDatabaseQuery(
      `
        UPDATE app.email_verification_tokens
        SET
          invalidated_at = $2
        WHERE
          user_id = $1::uuid
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND (
            $3::text IS NULL
            OR purpose = $3
          )
      `,
      [
        input.userId,
        input.invalidatedAt,
        input.purpose ?? null,
      ]
    );

  return result.rowCount ?? 0;
}