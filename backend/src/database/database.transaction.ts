import type {
  PoolClient,
} from "pg";

import {
  withDatabaseClient,
} from "./database.pool.js";

export const DATABASE_TRANSACTION_ISOLATION_LEVELS = [
  "read_committed",
  "repeatable_read",
  "serializable",
] as const;

export type DatabaseTransactionIsolationLevel =
  (typeof DATABASE_TRANSACTION_ISOLATION_LEVELS)[number];

export interface DatabaseTransactionOptions {
  /**
   * PostgreSQL transaction isolation level.
   *
   * READ COMMITTED remains the default for normal application
   * workflows. Stronger isolation must be selected explicitly.
   */
  isolationLevel?:
    DatabaseTransactionIsolationLevel;

  /**
   * Marks the transaction as read-only when no mutation should
   * be permitted.
   */
  readOnly?:
    boolean;
}

const DATABASE_TRANSACTION_ISOLATION_SQL: Readonly<
  Record<
    DatabaseTransactionIsolationLevel,
    string
  >
> = {
  read_committed:
    "READ COMMITTED",

  repeatable_read:
    "REPEATABLE READ",

  serializable:
    "SERIALIZABLE",
};

function createBeginTransactionStatement(
  options:
    DatabaseTransactionOptions
): string {
  const isolationLevel =
    options.isolationLevel ??
    "read_committed";

  const accessMode =
    options.readOnly === true
      ? "READ ONLY"
      : "READ WRITE";

  return [
    "BEGIN",
    "ISOLATION LEVEL",
    DATABASE_TRANSACTION_ISOLATION_SQL[
      isolationLevel
    ],
    accessMode,
  ].join(
    " "
  );
}

/**
 * Executes one database workflow inside a PostgreSQL
 * transaction using a dedicated checked-out client.
 *
 * The operation receives the same PoolClient for every query,
 * allowing multi-repository workflows to become atomic.
 *
 * Successful operations commit.
 * Failed operations roll back and rethrow the original error.
 */
export async function runDatabaseTransaction<T>(
  operation:
    (
      client:
        PoolClient
    ) => Promise<T>,
  options:
    DatabaseTransactionOptions =
    {}
): Promise<T> {
  return await withDatabaseClient(
    async (
      client
    ) => {
      await client.query(
        createBeginTransactionStatement(
          options
        )
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
      } catch (
        operationError
      ) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch (
          rollbackError
        ) {
          throw new AggregateError(
            [
              operationError,
              rollbackError,
            ],
            "The database operation failed and PostgreSQL rollback also failed.",
            {
              cause:
                rollbackError,
            }
          );
        }

        throw operationError;
      }
    }
  );
}