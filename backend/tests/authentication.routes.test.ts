import type {
  FastifyInstance,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  LoginSessionService,
} from "../src/application/authentication/login-session.service.js";

import type {
  SignupRegistrationService,
} from "../src/application/authentication/signup-registration.service.js";

import {
  AuthenticationConflictError,
  AuthenticationTokenExpiredError,
  InvalidCredentialsError,
} from "../src/domains/authentication/authentication.errors.js";

import {
  AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER,
  AUTHENTICATION_ACCESS_TOKEN_HEADER,
} from "../src/domains/authentication/access-token.service.js";

import {
  AUTHENTICATION_REFRESH_COOKIE_NAME,
  AUTHENTICATION_REFRESH_COOKIE_PATH,
} from "../src/http/authentication-cookie.js";

import type {
  VerifySignupEmailOperation,
} from "../src/routes/authentication.routes.js";

const CREATED_AT =
  new Date(
    "2026-07-28T18:00:00.000Z"
  );

const EXPIRES_AT =
  new Date(
    "2026-07-28T18:10:00.000Z"
  );

const ACCEPTED_AT =
  new Date(
    "2026-07-28T18:00:01.000Z"
  );

const VERIFIED_AT =
  new Date(
    "2026-07-28T18:05:00.000Z"
  );

const SESSION_CREATED_AT =
  new Date(
    "2026-07-29T03:30:00.000Z"
  );

const SESSION_EXPIRES_AT =
  new Date(
    "2099-07-29T03:30:00.000Z"
  );

function createRouteTestContext() {
  const registerMock =
    vi.fn<
      SignupRegistrationService[
        "register"
      ]
    >();

  const verifySignupEmailMock =
    vi.fn<
      VerifySignupEmailOperation
    >();

  const loginMock =
    vi.fn<
      LoginSessionService[
        "login"
      ]
    >();

  const signupRegistrationService:
    SignupRegistrationService = {
    register:
      registerMock,
  };

  const loginSessionService:
    LoginSessionService = {
    login:
      loginMock,
  };

  return {
    registerMock,

    verifySignupEmailMock,

    loginMock,

    signupRegistrationService,

    loginSessionService,
  };
}

describe(
  "Poster authentication HTTP routes",
  () => {
    let app:
      FastifyInstance |
      null =
        null;

    afterEach(
      async () => {
        if (app) {
          await app.close();

          app =
            null;
        }
      }
    );

    it(
      "creates a login session, sets the protected refresh cookie, and returns no raw token",
      async () => {
        const context =
          createRouteTestContext();

        const accountId =
          "00000000-0000-4000-8000-000000000601";

        context
          .loginMock
          .mockResolvedValue({
            account: {
              id:
                accountId,

              email:
                "person@example.com",

              fullName:
                "Example Person",

              status:
                "active",

              emailVerifiedAt:
                VERIFIED_AT,

              createdAt:
                CREATED_AT,
            },

            session: {
              id:
                "00000000-0000-4000-8000-000000000701",

              userId:
                accountId,

              organizationId:
                null,

              createdAt:
                SESSION_CREATED_AT,

              expiresAt:
                SESSION_EXPIRES_AT,
            },

            refreshToken:
              "opaque-login-refresh-token",
          });

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,

            loginSessionService:
              context
                .loginSessionService,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/login",

            headers: {
              "user-agent":
                "Poster-Route-Test/1.0",
            },

            payload: {
              email:
                " PERSON@EXAMPLE.COM ",

              password:
                "  Poster-Secure-Password-2026!  ",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          context.loginMock
        ).toHaveBeenCalledWith({
          email:
            "PERSON@EXAMPLE.COM",

          password:
            "  Poster-Secure-Password-2026!  ",

          ipAddress:
            expect.any(
              String
            ),

          userAgent:
            "Poster-Route-Test/1.0",
        });

        expect(
          response.json()
        ).toEqual({
          account: {
            id:
              accountId,

            email:
              "person@example.com",

            fullName:
              "Example Person",

            status:
              "active",

            emailVerifiedAt:
              VERIFIED_AT.toISOString(),

            createdAt:
              CREATED_AT.toISOString(),
          },

          session: {
            id:
              "00000000-0000-4000-8000-000000000701",

            userId:
              accountId,

            organizationId:
              null,

            createdAt:
              SESSION_CREATED_AT.toISOString(),

            expiresAt:
              SESSION_EXPIRES_AT.toISOString(),
          },
        });

        expect(
          response.body
        ).not.toContain(
          "opaque-login-refresh-token"
        );

        expect(
          response.body
        ).not.toContain(
          "refreshToken"
        );

        expect(
          response.headers[
            AUTHENTICATION_ACCESS_TOKEN_HEADER
          ]
        ).toEqual(
          expect.any(
            String
          )
        );

        expect(
          response.headers[
            AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER
          ]
        ).toEqual(
          expect.any(
            String
          )
        );

        expect(
          response.headers[
            "cache-control"
          ]
        ).toBe(
          "no-store"
        );

        const setCookieHeaderValue =
          response.headers[
            "set-cookie"
          ];

        const setCookieHeader =
          Array.isArray(
            setCookieHeaderValue
          )
            ? setCookieHeaderValue.join(
                "; "
              )
            : setCookieHeaderValue ??
              "";

        expect(
          setCookieHeader
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=opaque-login-refresh-token`
        );

        expect(
          setCookieHeader
        ).toContain(
          `Path=${AUTHENTICATION_REFRESH_COOKIE_PATH}`
        );

        expect(
          setCookieHeader
        ).toContain(
          "HttpOnly"
        );

        expect(
          setCookieHeader
        ).toContain(
          "SameSite=Strict"
        );

        expect(
          setCookieHeader
        ).toContain(
          `Expires=${SESSION_EXPIRES_AT.toUTCString()}`
        );

        expect(
          setCookieHeader
        ).not.toContain(
          "Domain="
        );
      }
    );

    it(
      "rejects an invalid login body before creating a session",
      async () => {
        const context =
          createRouteTestContext();

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,

            loginSessionService:
              context
                .loginSessionService,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/login",

            payload: {
              email:
                "not-an-email",

              password:
                "",

              unexpected:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          context.loginMock
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "REQUEST_VALIDATION_FAILED",

            message:
              "The request contains invalid or missing fields.",
          },
        });
      }
    );

    it(
      "maps invalid login credentials to the safe public authentication error",
      async () => {
        const context =
          createRouteTestContext();

        context
          .loginMock
          .mockRejectedValue(
            new InvalidCredentialsError()
          );

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,

            loginSessionService:
              context
                .loginSessionService,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/login",

            payload: {
              email:
                "person@example.com",

              password:
                "Incorrect-Password-2026!",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_INVALID_CREDENTIALS",

            message:
              "The email or password is incorrect.",
          },
        });

        expect(
          response.headers[
            "set-cookie"
          ]
        ).toBeUndefined();
      }
    );

    it(
      "registers an account and returns only a safe signup response",
      async () => {
        const context =
          createRouteTestContext();

        context
          .registerMock
          .mockResolvedValue({
            account: {
              id:
                "00000000-0000-4000-8000-000000000501",

              email:
                "person@example.com",

              fullName:
                "Example Person",

              status:
                "pending_verification",

              emailVerifiedAt:
                null,

              createdAt:
                CREATED_AT,
            },

            emailVerification: {
              purpose:
                "signup",

              expiresAt:
                EXPIRES_AT,

              delivery: {
                provider:
                  "poster-test-provider",

                messageId:
                  "provider-message-501",

                acceptedAt:
                  ACCEPTED_AT,
              },
            },
          });

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup",

            payload: {
              email:
                " person@example.com ",

              password:
                "Poster-Secure-Password-2026!",

              fullName:
                " Example Person ",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          context.registerMock
        ).toHaveBeenCalledWith({
          email:
            "person@example.com",

          password:
            "Poster-Secure-Password-2026!",

          fullName:
            "Example Person",
        });

        expect(
          response.json()
        ).toEqual({
          account: {
            id:
              "00000000-0000-4000-8000-000000000501",

            email:
              "person@example.com",

            fullName:
              "Example Person",

            status:
              "pending_verification",

            emailVerifiedAt:
              null,

            createdAt:
              CREATED_AT.toISOString(),
          },

          emailVerification: {
            purpose:
              "signup",

            expiresAt:
              EXPIRES_AT.toISOString(),

            delivery: {
              provider:
                "poster-test-provider",

              messageId:
                "provider-message-501",

              acceptedAt:
                ACCEPTED_AT.toISOString(),
            },
          },
        });

        expect(
          response.body
        ).not.toContain(
          "123456"
        );

        expect(
          response.body
        ).not.toContain(
          "password"
        );
      }
    );

    it(
      "rejects an invalid signup body before calling the service",
      async () => {
        const context =
          createRouteTestContext();

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup",

            payload: {
              email:
                "not-an-email",

              password:
                "short",

              fullName:
                "",

              unexpected:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          context.registerMock
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "REQUEST_VALIDATION_FAILED",

            message:
              "The request contains invalid or missing fields.",
          },
        });
      }
    );

    it(
      "verifies a signup email and serializes the activated account",
      async () => {
        const context =
          createRouteTestContext();

        context
          .verifySignupEmailMock
          .mockResolvedValue({
            account: {
              id:
                "00000000-0000-4000-8000-000000000502",

              email:
                "person@example.com",

              fullName:
                "Example Person",

              status:
                "active",

              emailVerifiedAt:
                VERIFIED_AT,

              createdAt:
                CREATED_AT,
            },

            verifiedAt:
              VERIFIED_AT,
          });

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup/verify",

            payload: {
              email:
                " PERSON@EXAMPLE.COM ",

              code:
                "123456",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          context
            .verifySignupEmailMock
        ).toHaveBeenCalledWith({
          email:
            "PERSON@EXAMPLE.COM",

          code:
            "123456",
        });

        expect(
          response.json()
        ).toEqual({
          account: {
            id:
              "00000000-0000-4000-8000-000000000502",

            email:
              "person@example.com",

            fullName:
              "Example Person",

            status:
              "active",

            emailVerifiedAt:
              VERIFIED_AT.toISOString(),

            createdAt:
              CREATED_AT.toISOString(),
          },

          verifiedAt:
            VERIFIED_AT.toISOString(),
        });
      }
    );

    it(
      "maps authentication-domain failures to safe public API errors",
      async () => {
        const context =
          createRouteTestContext();

        context
          .registerMock
          .mockRejectedValue(
            new AuthenticationConflictError(
              "Internal duplicate-email diagnostic."
            )
          );

        context
          .verifySignupEmailMock
          .mockRejectedValue(
            new AuthenticationTokenExpiredError()
          );

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,
          });

        const signupResponse =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup",

            payload: {
              email:
                "person@example.com",

              password:
                "Poster-Secure-Password-2026!",

              fullName:
                "Example Person",
            },
          });

        expect(
          signupResponse.statusCode
        ).toBe(
          409
        );

        expect(
          signupResponse.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_CONFLICT",

            message:
              "The authentication request conflicts with an existing record.",
          },
        });

        expect(
          signupResponse.body
        ).not.toContain(
          "Internal duplicate-email diagnostic."
        );

        const verificationResponse =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup/verify",

            payload: {
              email:
                "person@example.com",

              code:
                "123456",
            },
          });

        expect(
          verificationResponse.statusCode
        ).toBe(
          401
        );

        expect(
          verificationResponse.json()
        ).toMatchObject({
          error: {
            code:
              "AUTH_TOKEN_EXPIRED",

            message:
              "The verification link or code has expired.",
          },
        });
      }
    );

    it(
      "rejects malformed verification codes before domain execution",
      async () => {
        const context =
          createRouteTestContext();

        app =
          await buildApp({
            signupRegistrationService:
              context
                .signupRegistrationService,

            verifySignupEmail:
              context
                .verifySignupEmailMock,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup/verify",

            payload: {
              email:
                "person@example.com",

              code:
                "12AB",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          context
            .verifySignupEmailMock
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "REQUEST_VALIDATION_FAILED",
          },
        });
      }
    );
  }
);