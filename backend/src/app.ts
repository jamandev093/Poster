import cookie
  from "@fastify/cookie";

import cors
  from "@fastify/cors";

import helmet
  from "@fastify/helmet";

import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  createAdminUserMetricsService,
  type AdminUserMetricsService,
} from "./application/admin-metrics/admin-user-metrics.service.js";

import {
  createAdminCommercialRequestService,
  type AdminCommercialRequestService,
} from "./application/monetization/admin-commercial-request.service.js";

import {
  createClientCommercialRequestService,
  type ClientCommercialRequestService,
} from "./application/monetization/client-commercial-request.service.js";

import {
  createAuthorizationContextService,
  type AuthorizationContextService,
} from "./application/authorization/authorization-context.service.js";

import {
  createLoginSessionService,
  type LoginSessionService,
} from "./application/authentication/login-session.service.js";

import {
  createPasswordResetService,
  type PasswordResetService,
} from "./application/authentication/password-reset.service.js";

import {
  createSessionLifecycleService,
  type SessionLifecycleService,
} from "./application/authentication/session-lifecycle.service.js";

import {
  createSignupRegistrationService,
  type SignupRegistrationService,
} from "./application/authentication/signup-registration.service.js";

import {
  getEnvironment,
} from "./config/environment.js";

import {
  createAuthenticationAccessTokenService,
  type AuthenticationAccessTokenService,
} from "./domains/authentication/access-token.service.js";

import {
  verifySignupEmail,
} from "./domains/authentication/authentication.service.js";

import {
  registerAuthorizationContext,
} from "./http/authorization-context.js";

import {
  registerErrorHandler,
} from "./plugins/error-handler.js";

import {
  adminAccessRoutes,
  adminCommercialRequestRoutes,
  adminMetricsRoutes,
  authenticationRoutes,
  clientCommercialRequestRoutes,
  healthRoutes,
  type AuthenticationRoutesOptions,
} from "./routes/index.js";

import {
  createDevelopmentEmailDeliveryProvider,
  type EmailDeliveryProvider,
} from "./services/email/index.js";

export interface BuildAppOptions {
  adminCommercialRequestService?:
    AdminCommercialRequestService;

  clientCommercialRequestService?:
    ClientCommercialRequestService;

  adminUserMetricsService?:
    AdminUserMetricsService;

  accessTokenService?:
    AuthenticationAccessTokenService;

  authorizationContextService?:
    AuthorizationContextService;

  emailDeliveryProvider?:
    EmailDeliveryProvider;

  signupRegistrationService?:
    SignupRegistrationService;

  verifySignupEmail?:
    AuthenticationRoutesOptions[
      "verifySignupEmail"
    ];

  loginSessionService?:
    LoginSessionService;

  sessionLifecycleService?:
    SessionLifecycleService;

  passwordResetService?:
    PasswordResetService;
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

  const sessionSecret =
    environment.SESSION_SECRET ??
    (
      environment.NODE_ENV ===
        "test"
        ? "poster-test-access-token-secret-2026-never-use-in-production"
        : undefined
    );

  if (
    !sessionSecret
  ) {
    throw new Error(
      "SESSION_SECRET is required to issue authentication access tokens."
    );
  }

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
    cookie
  );

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

      exposedHeaders: [
        "x-poster-access-token",
        "x-poster-access-token-expires-at",
      ],

      origin: (
        origin,
        callback
      ) => {
        if (
          !origin
        ) {
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

  const accessTokenService =
    options
      .accessTokenService ??
    createAuthenticationAccessTokenService({
      secret:
        sessionSecret,
    });

  const authorizationContextService =
    options
      .authorizationContextService ??
    createAuthorizationContextService({
      accessTokenService,
    });

  registerAuthorizationContext(
    app,
    {
      authorizationContextService,
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

  const emailDeliveryProvider =
    options
      .emailDeliveryProvider ??
    createDevelopmentEmailDeliveryProvider({
      nodeEnvironment:
        environment.NODE_ENV,
    });

  const signupRegistrationService =
    options
      .signupRegistrationService ??
    createSignupRegistrationService({
      emailDeliveryProvider,
    });

  const passwordResetService =
    options
      .passwordResetService ??
    createPasswordResetService({
      emailDeliveryProvider,
    });

  await app.register(
    authenticationRoutes,
    {
      prefix:
        "/api/v1/auth",

      accessTokenService,

      signupRegistrationService,

      verifySignupEmail:
        options
          .verifySignupEmail ??
        verifySignupEmail,

      loginSessionService:
        options
          .loginSessionService ??
        createLoginSessionService(),

      sessionLifecycleService:
        options
          .sessionLifecycleService ??
        createSessionLifecycleService(),

      passwordResetService,

      isProduction:
        environment.NODE_ENV ===
        "production",
    }
  );

  await app.register(
    adminAccessRoutes,
    {
      prefix:
        "/api/v1/admin",
    }
  );

  await app.register(
    adminMetricsRoutes,
    {
      prefix:
        "/api/v1/admin",

      userMetricsService:
        options
          .adminUserMetricsService ??
        createAdminUserMetricsService(),
    }
  );

  await app.register(
    clientCommercialRequestRoutes,
    {
      prefix:
        "/api/v1/client",

      service:
        options
          .clientCommercialRequestService ??
        createClientCommercialRequestService(),
    }
  );

  await app.register(
    adminCommercialRequestRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminCommercialRequestService ??
        createAdminCommercialRequestService(),
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
