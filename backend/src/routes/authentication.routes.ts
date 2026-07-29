import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  z,
} from "zod";

import type {
  LoginSessionService,
} from "../application/authentication/login-session.service.js";

import type {
  PasswordResetService,
} from "../application/authentication/password-reset.service.js";

import type {
  AuthenticationSessionSummary,
} from "../application/authentication/login-session.types.js";

import type {
  SessionLifecycleService,
} from "../application/authentication/session-lifecycle.service.js";

import type {
  SignupRegistrationService,
} from "../application/authentication/signup-registration.service.js";

import {
  AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER,
  AUTHENTICATION_ACCESS_TOKEN_HEADER,
  type AuthenticationAccessTokenService,
  type IssuedAuthenticationAccessToken,
} from "../domains/authentication/access-token.service.js";

import {
  AuthenticationSessionInvalidError,
} from "../domains/authentication/authentication.errors.js";

import type {
  AuthenticationAccountSummary,
  VerifySignupEmailInput,
  VerifySignupEmailResult,
} from "../domains/authentication/authentication.service.types.js";

import {
  clearAuthenticationRefreshCookie,
  readAuthenticationRefreshToken,
  setAuthenticationRefreshCookie,
} from "../http/authentication-cookie.js";

import {
  parseHttpRequestBody,
} from "../http/request-validation.js";

const EMAIL_MAXIMUM_LENGTH =
  320;

const FULL_NAME_MAXIMUM_LENGTH =
  200;

const PASSWORD_MINIMUM_LENGTH =
  12;

const PASSWORD_MAXIMUM_LENGTH =
  1024;

const SignupRequestSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .min(
            1,
            "Email is required."
          )
          .max(
            EMAIL_MAXIMUM_LENGTH,
            "Email is too long."
          )
          .email(
            "Email must be valid."
          ),

      password:
        z
          .string()
          .min(
            PASSWORD_MINIMUM_LENGTH,
            `Password must contain at least ${PASSWORD_MINIMUM_LENGTH} characters.`
          )
          .max(
            PASSWORD_MAXIMUM_LENGTH,
            "Password is too long."
          ),

      fullName:
        z
          .string()
          .trim()
          .min(
            1,
            "Full name is required."
          )
          .max(
            FULL_NAME_MAXIMUM_LENGTH,
            "Full name is too long."
          ),
    })
    .strict();

const LoginRequestSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .min(
            1,
            "Email is required."
          )
          .max(
            EMAIL_MAXIMUM_LENGTH,
            "Email is too long."
          )
          .email(
            "Email must be valid."
          ),

      password:
        z
          .string()
          .min(
            1,
            "Password is required."
          )
          .max(
            PASSWORD_MAXIMUM_LENGTH,
            "Password is too long."
          ),
    })
    .strict();

const VerifySignupEmailRequestSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .min(
            1,
            "Email is required."
          )
          .max(
            EMAIL_MAXIMUM_LENGTH,
            "Email is too long."
          )
          .email(
            "Email must be valid."
          ),

      code:
        z
          .string()
          .trim()
          .regex(
            /^\d{6}$/,
            "Verification code must contain exactly six digits."
          ),
    })
    .strict();

const PasswordResetRequestSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .min(
            1,
            "Email is required."
          )
          .max(
            EMAIL_MAXIMUM_LENGTH,
            "Email is too long."
          )
          .email(
            "Email must be valid."
          ),
    })
    .strict();

const PasswordResetConfirmSchema =
  z
    .object({
      email:
        z
          .string()
          .trim()
          .min(
            1,
            "Email is required."
          )
          .max(
            EMAIL_MAXIMUM_LENGTH,
            "Email is too long."
          )
          .email(
            "Email must be valid."
          ),

      code:
        z
          .string()
          .trim()
          .regex(
            /^\d{6}$/,
            "Password-reset code must contain exactly six digits."
          ),

      password:
        z
          .string()
          .min(
            PASSWORD_MINIMUM_LENGTH,
            `Password must contain at least ${PASSWORD_MINIMUM_LENGTH} characters.`
          )
          .max(
            PASSWORD_MAXIMUM_LENGTH,
            "Password is too long."
          ),
    })
    .strict();

interface AuthenticationAccountResponse {
  id: string;

  email: string;

  fullName: string;

  status:
    AuthenticationAccountSummary[
      "status"
    ];

  emailVerifiedAt:
    | string
    | null;

  createdAt: string;
}

interface AuthenticationSessionResponse {
  id: string;

  userId: string;

  organizationId:
    | string
    | null;

  createdAt: string;

  expiresAt: string;
}

interface LoginHttpResponse {
  account:
    AuthenticationAccountResponse;

  session:
    AuthenticationSessionResponse;
}

interface SignupHttpResponse {
  account:
    AuthenticationAccountResponse;

  emailVerification: {
    purpose: "signup";

    expiresAt: string;

    delivery: {
      provider: string;

      messageId: string;

      acceptedAt: string;
    };
  };
}

interface VerifySignupEmailHttpResponse {
  account:
    AuthenticationAccountResponse;

  verifiedAt: string;
}

export type VerifySignupEmailOperation =
  (
    input:
      VerifySignupEmailInput
  ) => Promise<
    VerifySignupEmailResult
  >;

export interface AuthenticationRoutesOptions {
  accessTokenService:
    AuthenticationAccessTokenService;

  signupRegistrationService:
    SignupRegistrationService;

  verifySignupEmail:
    VerifySignupEmailOperation;

  loginSessionService:
    LoginSessionService;

  sessionLifecycleService:
    SessionLifecycleService;

  passwordResetService:
    PasswordResetService;

  isProduction: boolean;
}

function mapAuthenticationAccount(
  account:
    AuthenticationAccountSummary
): AuthenticationAccountResponse {
  return {
    id:
      account.id,

    email:
      account.email,

    fullName:
      account.fullName,

    status:
      account.status,

    emailVerifiedAt:
      account.emailVerifiedAt
        ? account
            .emailVerifiedAt
            .toISOString()
        : null,

    createdAt:
      account
        .createdAt
        .toISOString(),
  };
}

function mapAuthenticationSession(
  session:
    AuthenticationSessionSummary
): AuthenticationSessionResponse {
  return {
    id:
      session.id,

    userId:
      session.userId,

    organizationId:
      session.organizationId,

    createdAt:
      session
        .createdAt
        .toISOString(),

    expiresAt:
      session
        .expiresAt
        .toISOString(),
  };
}

function mapVerificationResult(
  result:
    VerifySignupEmailResult
): VerifySignupEmailHttpResponse {
  return {
    account:
      mapAuthenticationAccount(
        result.account
      ),

    verifiedAt:
      result
        .verifiedAt
        .toISOString(),
  };
}

function writeAccessTokenHeaders(
  reply:
    FastifyReply,
  accessToken:
    IssuedAuthenticationAccessToken
): void {
  reply
    .header(
      "cache-control",
      "no-store"
    )
    .header(
      AUTHENTICATION_ACCESS_TOKEN_HEADER,
      accessToken.token
    )
    .header(
      AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER,
      accessToken
        .expiresAt
        .toISOString()
    );
}

/**
 * Poster authentication HTTP routes.
 *
 * Route handlers validate and serialize HTTP data while
 * delegating authoritative session behavior to application
 * services and PostgreSQL repositories.
 */
export const authenticationRoutes:
  FastifyPluginAsync<
    AuthenticationRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.post(
      "/login",
      async (
        request,
        reply
      ) => {
        const credentials =
          parseHttpRequestBody(
            LoginRequestSchema,
            request.body
          );

        const result =
          await options
            .loginSessionService
            .login({
              email:
                credentials.email,

              password:
                credentials.password,

              ipAddress:
                request.ip,

              userAgent:
                request.headers[
                  "user-agent"
                ] ??
                null,
            });

        const accessToken =
          options
            .accessTokenService
            .issue({
              userId:
                result.account.id,

              sessionId:
                result.session.id,
            });

        writeAccessTokenHeaders(
          reply,
          accessToken
        );

        setAuthenticationRefreshCookie(
          reply,
          result.refreshToken,
          {
            expiresAt:
              result
                .session
                .expiresAt,

            isProduction:
              options.isProduction,
          }
        );

        const response:
          LoginHttpResponse = {
            account:
              mapAuthenticationAccount(
                result.account
              ),

            session:
              mapAuthenticationSession(
                result.session
              ),
          };

        return reply
          .status(
            200
          )
          .send(
            response
          );
      }
    );

    app.post(
      "/refresh",
      async (
        request,
        reply
      ) => {
        const refreshToken =
          readAuthenticationRefreshToken(
            request
          );

        if (
          !refreshToken
        ) {
          clearAuthenticationRefreshCookie(
            reply,
            options.isProduction
          );

          throw new AuthenticationSessionInvalidError(
            "The refresh-token cookie was missing or blank."
          );
        }

        try {
          const result =
            await options
              .sessionLifecycleService
              .refresh({
                refreshToken,

                ipAddress:
                  request.ip,

                userAgent:
                  request.headers[
                    "user-agent"
                  ] ??
                  null,
              });

          const accessToken =
            options
              .accessTokenService
              .issue({
                userId:
                  result.account.id,

                sessionId:
                  result.session.id,
              });

          writeAccessTokenHeaders(
            reply,
            accessToken
          );

          setAuthenticationRefreshCookie(
            reply,
            result.refreshToken,
            {
              expiresAt:
                result
                  .session
                  .expiresAt,

              isProduction:
                options.isProduction,
            }
          );

          const response:
            LoginHttpResponse = {
              account:
                mapAuthenticationAccount(
                  result.account
                ),

              session:
                mapAuthenticationSession(
                  result.session
                ),
            };

          return reply
            .status(
              200
            )
            .send(
              response
            );
        } catch (
          error
        ) {
          if (
            error instanceof
            AuthenticationSessionInvalidError
          ) {
            clearAuthenticationRefreshCookie(
              reply,
              options.isProduction
            );
          }

          throw error;
        }
      }
    );

    app.post(
      "/logout",
      async (
        request,
        reply
      ) => {
        const refreshToken =
          readAuthenticationRefreshToken(
            request
          );

        clearAuthenticationRefreshCookie(
          reply,
          options.isProduction
        );

        if (
          refreshToken
        ) {
          await options
            .sessionLifecycleService
            .logout({
              refreshToken,
            });
        }

        return reply
          .status(
            204
          )
          .send();
      }
    );

    app.post(
      "/password-reset/request",
      async (
        request,
        reply
      ) => {
        const input =
          parseHttpRequestBody(
            PasswordResetRequestSchema,
            request.body
          );

        await options
          .passwordResetService
          .request({
            email:
              input.email,

            ipAddress:
              request.ip,

            userAgent:
              request.headers[
                "user-agent"
              ] ??
              null,
          });

        return reply
          .status(
            202
          )
          .send({
            status:
              "accepted",
          });
      }
    );

    app.post(
      "/password-reset/confirm",
      async (
        request,
        reply
      ) => {
        const input =
          parseHttpRequestBody(
            PasswordResetConfirmSchema,
            request.body
          );

        const result =
          await options
            .passwordResetService
            .confirm({
              email:
                input.email,

              code:
                input.code,

              password:
                input.password,
            });

        clearAuthenticationRefreshCookie(
          reply,
          options.isProduction
        );

        return reply
          .status(
            200
          )
          .send(
            result
          );
      }
    );

    app.post(
      "/signup",
      async (
        request,
        reply
      ) => {
        const input =
          parseHttpRequestBody(
            SignupRequestSchema,
            request.body
          );

        const result =
          await options
            .signupRegistrationService
            .register(
              input
            );

        const response:
          SignupHttpResponse = {
            account:
              mapAuthenticationAccount(
                result.account
              ),

            emailVerification: {
              purpose:
                "signup",

              expiresAt:
                result
                  .emailVerification
                  .expiresAt
                  .toISOString(),

              delivery: {
                provider:
                  result
                    .emailVerification
                    .delivery
                    .provider,

                messageId:
                  result
                    .emailVerification
                    .delivery
                    .messageId,

                acceptedAt:
                  result
                    .emailVerification
                    .delivery
                    .acceptedAt
                    .toISOString(),
              },
            },
          };

        return reply
          .status(
            201
          )
          .send(
            response
          );
      }
    );

    app.post(
      "/signup/verify",
      async (
        request,
        reply
      ) => {
        const input =
          parseHttpRequestBody(
            VerifySignupEmailRequestSchema,
            request.body
          );

        const result =
          await options
            .verifySignupEmail(
              input
            );

        return reply
          .status(
            200
          )
          .send(
            mapVerificationResult(
              result
            )
          );
      }
    );
  };