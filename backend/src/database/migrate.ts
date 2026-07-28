import {
  runDatabaseMigrations,
} from "./migrations/migration.runner.js";

import type {
  MigrationCommand,
} from "./migrations/migration.types.js";

function getCommand(): MigrationCommand {
  return process.argv.includes(
    "--status"
  )
    ? "status"
    : "apply";
}

async function main(): Promise<void> {
  await runDatabaseMigrations(
    getCommand()
  );
}

main().catch(
  (
    error: unknown
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown database migration error.";

    console.error(
      `Poster database migration failed: ${message}`
    );

    process.exitCode =
      1;
  }
);