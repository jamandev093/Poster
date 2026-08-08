import {
  createProductionClientAccountService,
  type ClientAccountService,
} from "./application/client-account/index.js";
import {
  createPublicBusinessIdentityService,
} from "./application/business-identity/index.js";

import {
  publicBusinessIdentityRoutes,
} from "./routes/public-business-identity.routes.js";
import {
  publicCopyrightRoutes,
} from "./routes/public-copyright.routes.js";
import {
  createAdminBusinessIdentityService,
} from "./application/business-identity/index.js";

import {
  adminBusinessIdentityRoutes,
} from "./routes/admin-business-identity.routes.js";
import {
  createAdminProgrammaticService,
} from "./application/monetization/index.js";

import {
  adminProgrammaticRoutes,
} from "./routes/admin-programmatic.routes.js";
import {
  adminAffiliateRoutes,
} from "./routes/admin-affiliate.routes.js";
import cookie
  from "@fastify/cookie";

import cors
  from "@fastify/cors";

import helmet
  from "@fastify/helmet";

import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
} from "fastify";

import {
  createAdminCopyrightService,
  createPublicCopyrightService,
  type AdminCopyrightService,
  type PublicCopyrightService,
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
  createAdminAffiliateService,
  createProductionAdminPosterPromotionService,
  type AdminAnalyticsService,
  type AdminCampaignService,
  type AdminAffiliateService,
  type AdminPosterPromotionService,
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
  createProductionClientWalletAllocationService,
  createProductionClientWalletReadService,
  createProductionWalletCreditingService,
  createProductionWalletFundingService,
  type ClientWalletAllocationService,
  type ClientWalletReadService,
  type WalletCreditingService,
  type WalletFundingService,
  createProductionAdminWalletOperationsService,
  type AdminWalletOperationsService,
} from "./application/payments/index.js";

import {
  createRazorpayPaymentSignatureVerifier,
  createRazorpayWebhookVerifier,
  RazorpayWebhookValidationError,
  type RazorpayPaymentSignatureVerifier,
  type RazorpayWebhookVerifier,
  type VerifyRazorpayPaymentSignatureInput,
  type VerifyRazorpayWebhookSignatureInput,
} from "./integrations/payments/index.js";
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
  createAccountDeletionService,
  type AccountDeletionService,
} from "./application/authentication/account-deletion.service.js";


import {
  createAccountProfileService,
  type AccountProfileService,
} from "./application/authentication/account-profile.service.js";

import {
  createProductionAccountSelectedInterestsService,
  type AccountSelectedInterestsService,
} from "./application/authentication/account-selected-interests.service.js";

import {
  createMobileDiscoveryService,
  type MobileDiscoveryService,
} from "./application/mobile-discovery/index.js";

import {
  createProductionMobileUserActionsService,
  type MobileUserActionsService,
} from "./application/mobile-actions/index.js";

import {
  createProductionMobileEngagementService,
  type MobileEngagementService,
} from "./application/mobile-engagement/index.js";

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
  accountSelectedInterestsRoutes,
  authenticationRoutes,
  clientCommercialRequestRoutes,
  healthRoutes,
  mobileDiscoveryRoutes,
  mobileUserActionsRoutes,
  mobileEngagementRoutes,
  type AuthenticationRoutesOptions,
} from "./routes/index.js";

import {
  createClientWalletReadRoutes,
} from "./routes/client-wallet-read.routes.js";

import {
  clientAccountRoutes,
} from "./routes/client-account.routes.js";
import {
  ClientWalletRouteAuthenticationError,
  createClientWalletRoutes,
  type ClientWalletRouteActor,
} from "./routes/client-wallet.routes.js";
import {
  ClientWalletPaymentRouteAuthenticationError,
  createClientWalletPaymentRoutes,
  type ClientWalletPaymentRouteActor,
} from "./routes/client-wallet-payment.routes.js";

import {
  createClientWalletAllocationRoutes,
} from "./routes/client-wallet-allocation.routes.js";

import {
  createRazorpayWebhookRoutes,
} from "./routes/razorpay-webhook.routes.js";
import {
  adminAudienceInsightsRoutes,
} from "./routes/admin-audience-insights.routes.js";

import {
  adminPosterPromotionRoutes,
} from "./routes/admin-poster-promotion.routes.js";

import {
  createDevelopmentEmailDeliveryProvider,
  type EmailDeliveryProvider,
} from "./services/email/index.js";
import {
  adminWalletOperationsRoutes,
} from "./routes/admin-wallet-operations.routes.js";
import {
  createPosterBrainRankedDiscoveryQueryRepository,
  createPosterBrainRankedFeedRouteAdapterService,
  createPosterBrainContentSourcesRouteAdapterService,
} from "./application/poster-brain/index.js";

import {
  getDatabasePool,
} from "./database/database.pool.js";

import {
  posterBrainRankedFeedRoutes,
  type PosterBrainRankedFeedRouteService,
} from "./routes/poster-brain-ranked-feed.routes.js";

import {
  posterBrainContentSourcesRoutes,
  type PosterBrainContentSourcesRouteService,
} from "./routes/poster-brain-content-sources.routes.js";
export interface BuildAppOptions {
  posterBrainRankedFeedService?:
    PosterBrainRankedFeedRouteService;

  posterBrainContentSourcesService?:
    PosterBrainContentSourcesRouteService;

  adminAnalyticsService?:
    AdminAnalyticsService;
  adminCampaignService?:
    AdminCampaignService;

  adminAffiliateService?:
    AdminAffiliateService;

  adminPosterPromotionService?:
    AdminPosterPromotionService;

  adminCommercialRequestService?:
    AdminCommercialRequestService;

  clientCommercialRequestService?:
    ClientCommercialRequestService;

  clientAccountService?:
    ClientAccountService;

  walletReadService?:
    ClientWalletReadService;
  walletFundingService?:
    WalletFundingService;
  walletAllocationService?:
    ClientWalletAllocationService;
  walletCreditingService?:
    WalletCreditingService;

  razorpayPaymentSignatureVerifier?:
    RazorpayPaymentSignatureVerifier;

  razorpayWebhookVerifier?:
    RazorpayWebhookVerifier;

  paymentWebhookSystemActorUserId?:
    string;

  adminWalletOperationsService?:
    AdminWalletOperationsService;
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

  publicCopyrightService?:
    PublicCopyrightService;

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

  accountDeletionService?:
    AccountDeletionService;


  accountProfileService?:
    AccountProfileService;

  accountSelectedInterestsService?:
    AccountSelectedInterestsService;

  mobileDiscoveryService?:
    MobileDiscoveryService;

  mobileUserActionsService?:
    MobileUserActionsService;

  mobileEngagementService?:
    MobileEngagementService;
}

const CLIENT_WALLET_ORGANIZATION_ROLES =
  new Set<string>([
    "owner",
    "admin",
    "finance",
  ]);

async function authenticateClientWalletRequest(
  request: FastifyRequest
): Promise<ClientWalletRouteActor> {
  const context =
    request.authorizationContext;

  if (!context) {
    throw new ClientWalletRouteAuthenticationError();
  }

  const membership =
    context.organizationMemberships.find(
      candidate =>
        CLIENT_WALLET_ORGANIZATION_ROLES.has(
          candidate.role
        )
    );

  if (!membership) {
    throw new ClientWalletRouteAuthenticationError();
  }

  return {
    userId:
      context.userId,

    organizationId:
      membership.organizationId,
  };
}
async function authenticateClientWalletPaymentRequest(
  request: FastifyRequest
): Promise<ClientWalletPaymentRouteActor> {
  const context =
    request.authorizationContext;

  if (!context) {
    throw new ClientWalletPaymentRouteAuthenticationError();
  }

  const membership =
    context.organizationMemberships.find(
      candidate =>
        CLIENT_WALLET_ORGANIZATION_ROLES.has(
          candidate.role
        )
    );

  if (!membership) {
    throw new ClientWalletPaymentRouteAuthenticationError();
  }

  return {
    userId:
      context.userId,

    organizationId:
      membership.organizationId,
  };
}

function createRuntimeRazorpayPaymentSignatureVerifier(
  keySecret:
    string | undefined
): RazorpayPaymentSignatureVerifier {
  const createVerifier =
    () =>
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          keySecret ?? "",
      });

  return {
    verifyPaymentSignature(
      input:
        VerifyRazorpayPaymentSignatureInput
    ) {
      return createVerifier()
        .verifyPaymentSignature(
          input
        );
    },

    assertPaymentSignature(
      input:
        VerifyRazorpayPaymentSignatureInput
    ) {
      return createVerifier()
        .assertPaymentSignature(
          input
        );
    },
  };
}
const CAPTURED_JSON_RAW_BODY =
  Symbol("capturedJsonRawBody");

type RequestWithCapturedJsonRawBody =
  FastifyRequest & {
    [CAPTURED_JSON_RAW_BODY]?:
      string | Buffer;
  };

function registerJsonBodyRawCapture(
  app: FastifyInstance
): void {
  app.removeContentTypeParser(
    "application/json"
  );

  app.addContentTypeParser(
    "application/json",
    {
      parseAs:
        "buffer",
    },
    (
      request,
      body,
      done
    ) => {
      (
        request as RequestWithCapturedJsonRawBody
      )[CAPTURED_JSON_RAW_BODY] =
        body;

      try {
        done(
          null,
          JSON.parse(
            body.toString("utf8")
          ) as unknown
        );
      } catch (error) {
        done(
          error as Error,
          undefined
        );
      }
    }
  );
}

async function readCapturedJsonRawBody(
  request: FastifyRequest
): Promise<string | Buffer> {
  const rawBody =
    (
      request as RequestWithCapturedJsonRawBody
    )[CAPTURED_JSON_RAW_BODY];

  if (rawBody === undefined) {
    throw new RazorpayWebhookValidationError(
      "Raw Razorpay webhook body was not captured."
    );
  }

  return rawBody;
}

function createRuntimeRazorpayWebhookVerifier(
  webhookSecret:
    string | undefined
): RazorpayWebhookVerifier {
  const createVerifier =
    () =>
      createRazorpayWebhookVerifier({
        webhookSecret:
          webhookSecret ?? "",
      });

  return {
    verifyWebhookSignature(
      input:
        VerifyRazorpayWebhookSignatureInput
    ) {
      return createVerifier()
        .verifyWebhookSignature(
          input
        );
    },

    assertWebhookSignature(
      input:
        VerifyRazorpayWebhookSignatureInput
    ) {
      return createVerifier()
        .assertWebhookSignature(
          input
        );
    },
  };
}
function createPosterBrainRankedFeedService():
  PosterBrainRankedFeedRouteService {
  let service:
    PosterBrainRankedFeedRouteService |
    null =
    null;

  return {
    readRankedFeed(input) {
      service ??=
        createPosterBrainRankedFeedRouteAdapterService({
          rankedDiscoveryQueryRepository:
            createPosterBrainRankedDiscoveryQueryRepository(
              getDatabasePool()
            ),

          now:
            () =>
              new Date()
                .toISOString(),
        });

      return service
        .readRankedFeed(
          input
        );
    },
  };
}
function createPosterBrainContentSourcesService():
  PosterBrainContentSourcesRouteService {
  let service:
    PosterBrainContentSourcesRouteService |
    null =
    null;

  return {
    listSources(input) {
      service ??=
        createPosterBrainContentSourcesRouteAdapterService({
          rankedDiscoveryQueryRepository:
            createPosterBrainRankedDiscoveryQueryRepository(
              getDatabasePool()
            ),
        });

      return service.listSources(
        input
      );
    },
  };
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


  registerJsonBodyRawCapture(app);
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
      environment.COPYRIGHT_WEB_ORIGIN,
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
  const posterBrainRankedFeedService =
    options
      .posterBrainRankedFeedService ??
    createPosterBrainRankedFeedService();
  await app.register(
    posterBrainRankedFeedRoutes,
    {
      prefix:
        "/api/v1/poster-brain",

      service:
        posterBrainRankedFeedService,
    }
  );

  const posterBrainContentSourcesService =
    options
      .posterBrainContentSourcesService ??
    createPosterBrainContentSourcesService();

  await app.register(
    posterBrainContentSourcesRoutes,
    {
      prefix:
        "/api/v1/poster-brain",

      service:
        posterBrainContentSourcesService,
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

  const accountDeletionService =
    options
      .accountDeletionService ??
    createAccountDeletionService();


  const accountProfileService =
    options
      .accountProfileService ??
    createAccountProfileService();

  const accountSelectedInterestsService =
    options
      .accountSelectedInterestsService ??
    createProductionAccountSelectedInterestsService();

  const mobileDiscoveryService =
    options
      .mobileDiscoveryService ??
    createMobileDiscoveryService();

  const mobileUserActionsService =
    options
      .mobileUserActionsService ??
    createProductionMobileUserActionsService();

  const mobileEngagementService =
    options
      .mobileEngagementService ??
    createProductionMobileEngagementService();

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

      accountDeletionService,
      accountProfileService,

      isProduction:
        environment.NODE_ENV ===
        "production",
    }
  );

  await app.register(
    mobileDiscoveryRoutes,
    {
      prefix:
        "/api/v1/mobile",

      service:
        mobileDiscoveryService,
    }
  );

  await app.register(
    mobileUserActionsRoutes,
    {
      prefix:
        "/api/v1/mobile",

      service:
        mobileUserActionsService,
    }
  );

  await app.register(
    mobileEngagementRoutes,
    {
      prefix:
        "/api/v1/mobile",

      service:
        mobileEngagementService,
    }
  );

  await app.register(
    accountSelectedInterestsRoutes,
    {
      prefix:
        "/api/v1/auth",

      service:
        accountSelectedInterestsService,
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
    clientAccountRoutes({
      authenticateClientRequest:
        authenticateClientWalletRequest,
      clientAccountService:
        options.clientAccountService ??
        createProductionClientAccountService(),
    }),
    {
      prefix:
        "/api/v1/client",
    }
  );

  await app.register(
    createClientWalletReadRoutes({
      authenticateClientRequest:
        authenticateClientWalletRequest,

      walletReadService:
        options
          .walletReadService ??
        createProductionClientWalletReadService(),
    })
  );

  await app.register(
    createClientWalletRoutes({
      authenticateClientRequest:
        authenticateClientWalletRequest,

      walletFundingService:
        options
          .walletFundingService ??
        createProductionWalletFundingService(),
    })
  );
  await app.register(
    createClientWalletAllocationRoutes({
      authenticateClientRequest:
        authenticateClientWalletRequest,

      walletAllocationService:
        options
          .walletAllocationService ??
        createProductionClientWalletAllocationService(),
    })
  );

  await app.register(
    createClientWalletPaymentRoutes({
      authenticateClientRequest:
        authenticateClientWalletPaymentRequest,

      signatureVerifier:
        options
          .razorpayPaymentSignatureVerifier ??
        createRuntimeRazorpayPaymentSignatureVerifier(
          environment.RAZORPAY_KEY_SECRET
        ),

      walletCreditingService:
        options
          .walletCreditingService ??
        createProductionWalletCreditingService(),
    })
  );
  await app.register(
    createRazorpayWebhookRoutes({
      webhookVerifier:
        options
          .razorpayWebhookVerifier ??
        createRuntimeRazorpayWebhookVerifier(
          process.env.RAZORPAY_WEBHOOK_SECRET
        ),

      walletCreditingService:
        options
          .walletCreditingService ??
        createProductionWalletCreditingService(),

      readRawBody:
        readCapturedJsonRawBody,

      systemActorUserId:
        options
          .paymentWebhookSystemActorUserId ??
        process.env.POSTER_SYSTEM_USER_ID ??
        "",
    })
  );




  await app.register(
    adminWalletOperationsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminWalletOperationsService ??
        createProductionAdminWalletOperationsService(),
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
    adminAffiliateRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminAffiliateService ??
        createAdminAffiliateService(),
    }
  );

  await app.register(
    adminPosterPromotionRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        options
          .adminPosterPromotionService ??
        createProductionAdminPosterPromotionService(),
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
  await app.register(
    publicCopyrightRoutes,
    {
      prefix:
        "/api/v1",

      service:
        options
          .publicCopyrightService ??
        createPublicCopyrightService(),
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


  await app.register(
    adminProgrammaticRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        createAdminProgrammaticService(),
    }
  );


  await app.register(
    adminBusinessIdentityRoutes,
    {
      prefix:
        "/api/v1/admin",

      service:
        createAdminBusinessIdentityService(),
    }
  );


  await app.register(
    publicBusinessIdentityRoutes,
    {
      prefix:
        "/api/v1",

      service:
        createPublicBusinessIdentityService(),
    }
  );

  return app;
}
