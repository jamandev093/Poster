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
  createAdminCopyrightService,
  type AdminCopyrightService,
} from "./application/copyright/index.js";

import {
  createAdminReportsService,
  type AdminReportsService,
} from "./application/reports/index.js";

import {
  createAdminSystemStatusService,
  type AdminSystemStatusService,
} from "./application/system-status/index.js";

import {
  createAdminUserMetricsService,
  type AdminUserMetricsService,
} from "./application/admin-metrics/admin-user-metrics.service.js";

import {
  createAdminContentService,
  createAdminSourceService,
  type AdminContentService,
  type AdminSourceService,
} from "./application/content-sources/index.js";

import {
  createAdminAudienceInsightsService,
  type AdminAudienceInsightsService,
} from "./application/audience-insights/admin-audience-insights.service.js";

import {
  createAdminProfileService,
  type AdminProfileService,
} from "./application/admin-profile/admin-profile.service.js";

import {
  createAdminAnalyticsService,
  createAdminCampaignService,
  type AdminAnalyticsService,
  type AdminCampaignService,
} from "./application/monetization/index.js";

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
  adminAnalyticsRoutes,
  adminCampaignRoutes,
  adminCommercialRequestRoutes,
  adminCopyrightRoutes,
  adminContentRoutes,
  adminMetricsRoutes,
  adminProfileRoutes,
  adminReportsRoutes,
  adminSourceRoutes,
  adminSystemStatusRoutes,
  authenticationRoutes,
  clientCommercialRequestRoutes,
  healthRoutes,
  type AuthenticationRoutesOptions,
} from "./routes/index.js";

import {
  adminAudienceInsightsRoutes,
} from "./routes/admin-audience-insights.routes.js";

import {
  createDevelopmentEmailDeliveryProvider,
  type EmailDeliveryProvider,
} from "./services/email/index.js";
export interface BuildAppOptions {
  adminAnalyticsService?:
    AdminAnalyticsService;
  adminCampaignService?:
    AdminCampaignService;

  adminCommercialRequestService?:
    AdminCommercialRequestService;

  clientCommercialRequestService?:
    ClientCommercialRequestService;

  adminUserMetricsService?:
    AdminUserMetricsService;

  adminAudienceInsightsService?:
    AdminAudienceInsightsService;

  adminContentService?:
    AdminContentService;

  adminSourceService?:
    AdminSourceService;

  adminProfileService?:
    AdminProfileService;

  adminCopyrightService?:
    AdminCopyrightService;

  adminReportsService?:
    AdminReportsService;

  adminSystemStatusService?:
    AdminSystemStatusService;

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
    adminSystemStatusRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminSystemStatusService ??
        createAdminSystemStatusService(),
    }
  );

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

      methods: [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "accept",
        "authorization",
        "content-type",
        "x-request-id",
      ],

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
    adminProfileRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminProfileService ??
        createAdminProfileService(),
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
    adminAudienceInsightsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminAudienceInsightsService ??
        createAdminAudienceInsightsService(),
    }
  );

  await app.register(
    adminContentRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminContentService ??
        createAdminContentService(),
    }
  );

  await app.register(
    adminSourceRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminSourceService ??
        createAdminSourceService(),
    }
  );

  await app.register(
    adminCopyrightRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminCopyrightService ??
        createAdminCopyrightService(),
    }
  );

  await app.register(
    adminReportsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminReportsService ??
        createAdminReportsService(),
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
    adminAnalyticsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminAnalyticsService ??
        createAdminAnalyticsService(),
    }
  );
  await app.register(
    adminCampaignRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminCampaignService ??
        createAdminCampaignService(),
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
