import {
  checkDatabaseHealth,
} from "./database.health.js";

import {
  closeDatabasePool,
} from "./database.pool.js";

let exitCode =
  0;

try {
  const health =
    await checkDatabaseHealth();

  process.stdout.write(
    [
      "",
      "Poster PostgreSQL connection verified.",
      JSON.stringify(
        health,
        null,
        2
      ),
      "",
    ].join("\n")
  );
} catch (
  error:
    unknown
) {
  exitCode =
    1;

  const message =
    error instanceof Error
      ? error.message
      : "Unknown PostgreSQL connection error.";

  process.stderr.write(
    [
      "",
      "Poster PostgreSQL connection verification failed.",
      message,
      "",
    ].join("\n")
  );
} finally {
  await closeDatabasePool();
}

process.exitCode =
  exitCode;