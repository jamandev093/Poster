import type {
  PoolClient,
} from "pg";

import {
  withDatabaseClient,
} from "../../database/database.pool.js";

import {
  AuthenticationTokenInvalidError,
} from "./authentication.errors.js";

const AUTHENTICATION_TOKEN_DIGEST_PATTERN =
  /^[a-f0-9]{64}$/;

export function normalizeAuthenticationTokenDigest(
  tokenDigest: string
): string {
  const normalizedDigest =
    tokenDigest
      .trim()
      .toLowerCase();

  if (
    !AUTHENTICATION_TOKEN_DIGEST_PATTERN.test(
      normalizedDigest
    )
  ) {
    throw new AuthenticationTokenInvalidError();
  }

  return normalizedDigest;
}

export function normalizeOptionalAuthenticationRequestText(
  value:
    | string
    | null
    | undefined
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

export function assertValidAuthenticationDate(
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

export function assertAuthenticationTokenLifetime(
  createdAt: Date,
  expiresAt: Date
): void {
  assertValidAuthenticationDate(
    createdAt,
    "Authentication token creation time"
  );

  assertValidAuthenticationDate(
    expiresAt,
    "Authentication token expiry time"
  );

  if (
    expiresAt.getTime() <=
    createdAt.getTime()
  ) {
    throw new RangeError(
      "Authentication token expiry must be later than its creation time."
    );
  }
}

export function assertMaximumVerificationAttempts(
  maximumAttempts: number
): void {
  if (
    !Number.isSafeInteger(
      maximumAttempts
    ) ||
    maximumAttempts < 1 ||
    maximumAttempts > 100
  ) {
    throw new RangeError(
      "Maximum verification attempts must be an integer between 1 and 100."
    );
  }
}

export async function runAuthenticationTokenTransaction<T>(
  operation:
    (
      client: PoolClient
    ) => Promise<T>
): Promise<T> {
  return await withDatabaseClient(
    async (
      client
    ) => {
      await client.query(
        "BEGIN"
      );

      try {
        const result =
          await operation(
            client
          );

        await client.query(
          "COMMIT"
        );

        return result;
      } catch (error) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch (rollbackError) {
          void rollbackError;
        }

        throw error;
      }
    }
  );
}