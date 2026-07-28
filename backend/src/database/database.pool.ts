import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";

import {
  getDatabaseConfiguration,
} from "./database.config.js";

let databasePool:
  Pool |
  null =
  null;

/**
 * Returns the shared PostgreSQL connection pool.
 *
 * The Backend remains stateless while database connections
 * are reused efficiently inside each running service instance.
 */
export function getDatabasePool():
  Pool {
  if (
    databasePool
  ) {
    return databasePool;
  }

  const configuration =
    getDatabaseConfiguration();

  const createdPool =
    new Pool({
      connectionString:
        configuration.connectionString,

      ssl:
        configuration.ssl,

      max:
        configuration.maximumConnections,

      idleTimeoutMillis:
        configuration
          .idleTimeoutMilliseconds,

      connectionTimeoutMillis:
        configuration
          .connectionTimeoutMilliseconds,

      statement_timeout:
        configuration
          .statementTimeoutMilliseconds,

      application_name:
        "poster-backend",
    });

  createdPool.on(
    "error",
    (
      error:
        Error
    ) => {
      process.stderr.write(
        [
          "Unexpected PostgreSQL idle-client error.",
          `Name: ${error.name}`,
          `Message: ${error.message}`,
          "",
        ].join("\n")
      );
    }
  );

  databasePool =
    createdPool;

  return createdPool;
}

/**
 * Executes work using a checked-out database client.
 *
 * The client is always released, including after failures.
 */
export async function withDatabaseClient<T>(
  operation:
    (
      client:
        PoolClient
    ) => Promise<T>
): Promise<T> {
  const client =
    await getDatabasePool()
      .connect();

  try {
    return await operation(
      client
    );
  } finally {
    client.release();
  }
}

/**
 * Executes a parameterized PostgreSQL query.
 *
 * Callers must pass user-provided values through the values
 * array rather than interpolating them into SQL strings.
 */
export async function executeDatabaseQuery<
  TRow extends QueryResultRow
>(
  text: string,
  values:
    readonly unknown[] =
    []
): Promise<
  QueryResult<TRow>
> {
  return await getDatabasePool()
    .query<TRow>(
      text,
      Array.from(
        values
      )
    );
}

/**
 * Closes the shared pool during graceful service shutdown.
 */
export async function closeDatabasePool():
  Promise<void> {
  const activePool =
    databasePool;

  databasePool =
    null;

  if (
    activePool
  ) {
    await activePool.end();
  }
}