import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import type {
  SignupRegistrationService,
} from "../application/authentication/signup-registration.service.js";

import type {
  AuthenticationAccountSummary,
  VerifySignupEmailInput,
  VerifySignupEmailResult,
} from "../domains/authentication/authentication.service.types.js";

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

interface AuthenticationAccountResponse {
  id: string;

  email: string;

  fullName: string;

  status:
    AuthenticationAccountSummary[
      "status"
    ];

  emailVerifiedAt:
    string |
    null;

  createdAt: string;
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
  signupRegistrationService:
    SignupRegistrationService;

  verifySignupEmail:
    VerifySignupEmailOperation;
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

/**
 * Poster authentication HTTP routes.
 *
 * Route handlers validate and serialize HTTP data while
 * delegating all authoritative business behavior to the
 * application and domain service layers.
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