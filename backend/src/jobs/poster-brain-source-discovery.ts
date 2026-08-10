import {
  createPosterBrainSourceDiscoveryRuntimeComposition,
} from "../application/poster-brain/index.js";

import {
  closeDatabasePool,
  getDatabasePool,
} from "../database/database.pool.js";

async function main():
  Promise<void> {
  const composition =
    createPosterBrainSourceDiscoveryRuntimeComposition({
      database:
        getDatabasePool(),

      environment:
        process.env,

      now:
        () =>
          new Date()
            .toISOString(),
    });

  const result =
    await composition
      .runtimeService
      .runDueSourceDiscovery();

  process.stdout.write(
    `${JSON.stringify({
      service:
        "poster-brain-source-discovery",

      providerKeys:
        composition.providerKeys,

      ...result,
    })}\n`
  );

  /*
   * Partial root failures already receive persistent bounded
   * retry scheduling. Only an all-root failure marks the
   * process invocation unsuccessful.
   */
  if (
    result.status ===
    "failed"
  ) {
    process.exitCode =
      1;
  }
}

try {
  await main();
}
catch (
  error
) {
  process.stderr.write(
    `${JSON.stringify({
      service:
        "poster-brain-source-discovery",

      status:
        "failed",

      errorCode:
        error instanceof Error
          ? error.name
          : "UnknownError",
    })}\n`
  );

  process.exitCode =
    1;
}
finally {
  await closeDatabasePool();
}