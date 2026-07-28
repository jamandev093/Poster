import cors
  from "@fastify/cors";

import helmet
  from "@fastify/helmet";

import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  createSignupRegistrationService,
  type SignupRegistrationService,
} from "./application/authentication/signup-registration.service.js";

import {
  getEnvironment,
} from "./config/environment.js";

import {
  verifySignupEmail,
} from "./domains/authentication/authentication.service.js";

import {
  registerErrorHandler,
} from "./plugins/error-handler.js";

import {
  authenticationRoutes,
  healthRoutes,
  type AuthenticationRoutesOptions,
} from "./routes/index.js";

import {
  createDevelopmentEmailDeliveryProvider,
  type EmailDeliveryProvider,
} from "./services/email/index.js";

export interface BuildAppOptions {
  emailDeliveryProvider?:
    EmailDeliveryProvider;

  signupRegistrationService?:
    SignupRegistrationService;

  verifySignupEmail?:
    AuthenticationRoutesOptions[
      "verifySignupEmail"
    ];
}

export async function buildApp(
  options:
    BuildAppOptions =
    {}
): Promise<
  FastifyInstance
> {
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
                environment.LOG_LEVEL,
            },

      trustProxy:
        true,

      requestIdHeader:
        "x-request-id",
    });

  await app.register(
    helmet,
    {
      global:
        true,
    }
  );

  const allowedOrigins =
    new Set([
      environment.CLIENT_WEB_ORIGIN,
      environment.ADMIN_WEB_ORIGIN,
    ]);

  await app.register(
    cors,
    {
      credentials:
        true,

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
      },
    }
  );

  registerErrorHandler(
    app
  );

  await app.register(
    healthRoutes,
    {
      prefix:
        "/api/v1",
    }
  );

  const signupRegistrationService =
    options
      .signupRegistrationService ??
    createSignupRegistrationService({
      emailDeliveryProvider:
        options
          .emailDeliveryProvider ??
        createDevelopmentEmailDeliveryProvider({
          nodeEnvironment:
            environment.NODE_ENV,
        }),
    });

  await app.register(
    authenticationRoutes,
    {
      prefix:
        "/api/v1/auth",

      signupRegistrationService,

      verifySignupEmail:
        options
          .verifySignupEmail ??
        verifySignupEmail,
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
        "v1",
    })
  );

  return app;
}