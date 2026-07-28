import type {
  PoolClient,
} from "pg";

import type {
  AppliedDatabaseMigration,
  DatabaseMigration,
} from "./migration.types.js";

interface AppliedMigrationRow {
  version: string;
  filename: string;
  checksum: string;
  applied_at: Date;
  execution_milliseconds: number;
}

export async function ensureMigrationRepository(
  client: PoolClient
): Promise<void> {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS app;

    CREATE TABLE IF NOT EXISTS app.schema_migrations (
      version text PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      execution_milliseconds integer NOT NULL
        CHECK (execution_milliseconds >= 0)
    );
  `);
}

export async function getAppliedMigrations(
  client: PoolClient
): Promise<AppliedDatabaseMigration[]> {
  const result =
    await client.query<AppliedMigrationRow>(`
      SELECT
        version,
        filename,
        checksum,
        applied_at,
        execution_milliseconds
      FROM app.schema_migrations
      ORDER BY version ASC;
    `);

  return result.rows.map(
    (
      row
    ) => ({
      version:
        row.version,
      filename:
        row.filename,
      checksum:
        row.checksum,
      appliedAt:
        row.applied_at,
      executionMilliseconds:
        row.execution_milliseconds,
    })
  );
}

export async function recordAppliedMigration(
  client: PoolClient,
  migration: DatabaseMigration,
  executionMilliseconds: number
): Promise<void> {
  await client.query(
    `
      INSERT INTO app.schema_migrations (
        version,
        filename,
        checksum,
        execution_milliseconds
      )
      VALUES (
        $1,
        $2,
        $3,
        $4
      );
    `,
    [
      migration.version,
      migration.filename,
      migration.checksum,
      executionMilliseconds,
    ]
  );
}