import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
} from "./database.pool.js";

interface DatabaseHealthRow
  extends QueryResultRow {
  database_name: string;

  user_name: string;

  schema_name:
    string |
    null;

  server_version: string;
}

export interface DatabaseHealthResult {
  status: "ok";

  databaseName: string;

  authenticatedUser: string;

  currentSchema:
    string |
    null;

  serverVersion: string;

  latencyMilliseconds: number;

  checkedAt: string;
}

/**
 * Performs a read-only database connectivity check.
 *
 * It does not expose credentials, connection strings,
 * passwords, or sensitive application records.
 */
export async function checkDatabaseHealth():
  Promise<DatabaseHealthResult> {
  const startedAt =
    Date.now();

  const result =
    await executeDatabaseQuery<
      DatabaseHealthRow
    >(
      `
        SELECT
          current_database()::text
            AS database_name,
          current_user::text
            AS user_name,
          current_schema()::text
            AS schema_name,
          current_setting(
            'server_version'
          )::text
            AS server_version
      `
    );

  const row =
    result.rows[0];

  if (!row) {
    throw new Error(
      "PostgreSQL health query returned no result."
    );
  }

  return {
    status:
      "ok",

    databaseName:
      row.database_name,

    authenticatedUser:
      row.user_name,

    currentSchema:
      row.schema_name,

    serverVersion:
      row.server_version,

    latencyMilliseconds:
      Date.now() -
      startedAt,

    checkedAt:
      new Date()
        .toISOString(),
  };
}