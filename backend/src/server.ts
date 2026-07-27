import {
  buildApp
} from "./app.js";

import {
  getEnvironment
} from "./config/environment.js";

const environment =
  getEnvironment();

const app =
  await buildApp();

let shuttingDown =
  false;

async function shutdown(
  signal: string
): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown =
    true;

  app.log.info(
    {
      signal
    },
    "Poster Backend is shutting down."
  );

  try {
    await app.close();

    process.exitCode =
      0;
  } catch (error) {
    app.log.error(
      {
        error
      },
      "Poster Backend shutdown failed."
    );

    process.exitCode =
      1;
  }
}

process.on(
  "SIGTERM",
  () => {
    void shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    void shutdown(
      "SIGINT"
    );
  }
);

try {
  const address =
    await app.listen({
      host:
        environment.HOST,

      port:
        environment.PORT
    });

  app.log.info(
    {
      address,
      environment:
        environment.NODE_ENV
    },
    "Poster Backend started."
  );
} catch (error) {
  app.log.fatal(
    {
      error
    },
    "Poster Backend failed to start."
  );

  process.exitCode =
    1;
}