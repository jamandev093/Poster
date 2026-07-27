import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify, {
  type FastifyInstance
} from "fastify";

import {
  getEnvironment
} from "./config/environment.js";

import {
  registerErrorHandler
} from "./plugins/error-handler.js";

import {
  healthRoutes
} from "./routes/health.routes.js";

export async function buildApp():
  Promise<FastifyInstance> {
  const environment =
    getEnvironment();

  const app =
    Fastify({
      logger:
        environment.NODE_ENV ===
        "test"
          ? false
          : {
              level:
                environment.LOG_LEVEL
            },

      trustProxy: true,

      requestIdHeader:
        "x-request-id"
    });

  await app.register(
    helmet,
    {
      global: true
    }
  );

  const allowedOrigins =
    new Set([
      environment.CLIENT_WEB_ORIGIN,
      environment.ADMIN_WEB_ORIGIN
    ]);

  await app.register(
    cors,
    {
      credentials: true,

      origin: (
        origin,
        callback
      ) => {
        if (!origin) {
          callback(
            null,
            true
          );

          return;
        }

        callback(
          null,
          allowedOrigins.has(
            origin
          )
        );
      }
    }
  );

  registerErrorHandler(
    app
  );

  await app.register(
    healthRoutes,
    {
      prefix:
        "/api/v1"
    }
  );

  app.get(
    "/",
    async () => ({
      service:
        "Poster Backend",

      status:
        "running",

      apiVersion:
        "v1"
    })
  );

  return app;
}