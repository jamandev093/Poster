import {
  config as loadEnvironmentFile,
} from "dotenv";

import {
  dirname,
  resolve,
} from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  Pool,
  type PoolClient,
} from "pg";

import {
  loadDatabaseMigrations,
} from "./migration.files.js";

import {
  ensureMigrationRepository,
  getAppliedMigrations,
  recordAppliedMigration,
} from "./migration.repository.js";

import type {
  DatabaseMigration,
  MigrationCommand,
  MigrationRunSummary,
} from "./migration.types.js";

const MIGRATION_ADVISORY_LOCK =
  807202601;

function getBackendRoot(): string {
  return resolve(
    dirname(
      fileURLToPath(
        import.meta.url
      )
    ),
    "../../.."
  );
}

function loadMigrationEnvironment(
  backendRoot: string
): void {
  loadEnvironmentFile({
    path:
      resolve(
        backendRoot,
        ".env.local"
      ),
    override: false,
    quiet: true,
  });

  loadEnvironmentFile({
    path:
      resolve(
        backendRoot,
        ".env"
      ),
    override: false,
    quiet: true,
  });
}

function getMigrationDatabaseUrl(): string {
  const databaseUrl =
    process.env
      .DATABASE_MIGRATION_URL
      ?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_MIGRATION_URL is not configured."
    );
  }

  return databaseUrl;
}

function useDatabaseSsl(): boolean {
  const configuredValue =
    process.env
      .DATABASE_SSL
      ?.trim()
      .toLowerCase();

  return (
    configuredValue ===
      "true" ||
    configuredValue ===
      "1" ||
    configuredValue ===
      "yes"
  );
}

function validateAppliedMigrationHistory(
  migrations: DatabaseMigration[],
  appliedMigrations: Awaited<
    ReturnType<
      typeof getAppliedMigrations
    >
  >
): void {
  const availableByVersion =
    new Map(
      migrations.map(
        (
          migration
        ) => [
          migration.version,
          migration,
        ]
      )
    );

  for (
    const appliedMigration
    of appliedMigrations
  ) {
    const availableMigration =
      availableByVersion.get(
        appliedMigration.version
      );

    if (!availableMigration) {
      throw new Error(
        [
          "Applied migration",
          appliedMigration.version,
          "does not exist in the migration directory.",
        ].join(
          " "
        )
      );
    }

    if (
      availableMigration.filename !==
      appliedMigration.filename
    ) {
      throw new Error(
        [
          `Migration ${appliedMigration.version}`,
          "has a filename mismatch.",
          `Database: ${appliedMigration.filename}.`,
          `Filesystem: ${availableMigration.filename}.`,
        ].join(
          " "
        )
      );
    }

    if (
      availableMigration.checksum !==
      appliedMigration.checksum
    ) {
      throw new Error(
        [
          `Migration ${appliedMigration.filename}`,
          "was modified after it was applied.",
          "Applied migrations must remain immutable.",
        ].join(
          " "
        )
      );
    }
  }
}

async function applyMigration(
  client: PoolClient,
  migration: DatabaseMigration
): Promise<number> {
  const startedAt =
    Date.now();

  await client.query(
    "BEGIN"
  );

  try {
    await client.query(
      migration.sql
    );

    const executionMilliseconds =
      Math.max(
        0,
        Date.now() -
          startedAt
      );

    await recordAppliedMigration(
      client,
      migration,
      executionMilliseconds
    );

    await client.query(
      "COMMIT"
    );

    return executionMilliseconds;
  } catch (
    error
  ) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  }
}

export async function runDatabaseMigrations(
  command: MigrationCommand
): Promise<MigrationRunSummary> {
  const backendRoot =
    getBackendRoot();

  loadMigrationEnvironment(
    backendRoot
  );

  const migrationsDirectory =
    resolve(
      backendRoot,
      "database",
      "migrations"
    );

  const migrations =
    await loadDatabaseMigrations(
      migrationsDirectory
    );

  const pool =
    new Pool({
      connectionString:
        getMigrationDatabaseUrl(),

      max: 1,

      application_name:
        "poster-database-migrator",

      ssl:
        useDatabaseSsl()
          ? {
              rejectUnauthorized:
                true,
            }
          : false,
    });

  let client:
    PoolClient |
    null =
      null;

  let lockAcquired =
    false;

  try {
    client =
      await pool.connect();

    const lockResult =
      await client.query<{
        locked: boolean;
      }>(
        `
          SELECT
            pg_try_advisory_lock($1)
              AS locked;
        `,
        [
          MIGRATION_ADVISORY_LOCK,
        ]
      );

    lockAcquired =
      lockResult.rows[0]
        ?.locked ===
      true;

    if (!lockAcquired) {
      throw new Error(
        "Another Poster database migration process is already running."
      );
    }

    await ensureMigrationRepository(
      client
    );

    const appliedMigrations =
      await getAppliedMigrations(
        client
      );

    validateAppliedMigrationHistory(
      migrations,
      appliedMigrations
    );

    const appliedVersions =
      new Set(
        appliedMigrations.map(
          (
            migration
          ) =>
            migration.version
        )
      );

    const pendingMigrations =
      migrations.filter(
        (
          migration
        ) =>
          !appliedVersions.has(
            migration.version
          )
      );

    if (
      command ===
      "status"
    ) {
      console.log(
        "Poster database migration status"
      );

      console.log(
        JSON.stringify(
          {
            available:
              migrations.length,
            applied:
              appliedMigrations.length,
            pending:
              pendingMigrations.length,
            pendingMigrations:
              pendingMigrations.map(
                (
                  migration
                ) =>
                  migration.filename
              ),
          },
          null,
          2
        )
      );

      return {
        command,
        availableCount:
          migrations.length,
        appliedCount:
          appliedMigrations.length,
        pendingCount:
          pendingMigrations.length,
        newlyAppliedCount:
          0,
      };
    }

    let newlyAppliedCount =
      0;

    for (
      const migration
      of pendingMigrations
    ) {
      console.log(
        `Applying ${migration.filename}...`
      );

      const executionMilliseconds =
        await applyMigration(
          client,
          migration
        );

      newlyAppliedCount +=
        1;

      console.log(
        [
          "Applied",
          migration.filename,
          `in ${executionMilliseconds}ms.`,
        ].join(
          " "
        )
      );
    }

    console.log(
      JSON.stringify(
        {
          status:
            "ok",
          available:
            migrations.length,
          previouslyApplied:
            appliedMigrations.length,
          newlyApplied:
            newlyAppliedCount,
          pending:
            pendingMigrations.length -
            newlyAppliedCount,
        },
        null,
        2
      )
    );

    return {
      command,
      availableCount:
        migrations.length,
      appliedCount:
        appliedMigrations.length +
        newlyAppliedCount,
      pendingCount:
        pendingMigrations.length -
        newlyAppliedCount,
      newlyAppliedCount,
    };
  } finally {
    if (
      client &&
      lockAcquired
    ) {
      await client.query(
        `
          SELECT
            pg_advisory_unlock($1);
        `,
        [
          MIGRATION_ADVISORY_LOCK,
        ]
      );
    }

    client?.release();

    await pool.end();
  }
}