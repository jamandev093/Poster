import Fastify from "fastify";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  authenticationRoutes,
} from "../src/routes/authentication.routes.js";

const ACCOUNT = {
  id:
    "11111111-1111-4111-8111-111111111111",

  email:
    "pending@example.com",

  fullName:
    "Pending User",

  status:
    "pending_verification" as const,

  emailVerifiedAt:
    null,

  createdAt:
    new Date("2026-01-01T00:00:00.000Z"),
};

function createUnusedService() {
  return new Proxy(
    {},
    {
      get() {
        return vi.fn();
      },
    }
  );
}

describe(
  "Poster signup verification resend route",
  () => {
    it(
      "resends a signup verification challenge without returning the raw code",
      async () => {
        const app =
          Fastify();

        const resend =
          vi
            .fn()
            .mockResolvedValue({
              account:
                ACCOUNT,

              emailVerification: {
                purpose:
                  "signup",

                expiresAt:
                  new Date("2026-01-01T00:10:00.000Z"),

                delivery: {
                  provider:
                    "development",

                  messageId:
                    "dev-message-id",

                  acceptedAt:
                    new Date("2026-01-01T00:00:01.000Z"),
                },
              },
            });

        await app.register(
          authenticationRoutes,
          {
            prefix:
              "/api/v1/auth",

            accessTokenService:
              createUnusedService() as never,

            signupRegistrationService:
              {
                register:
                  vi.fn(),

                resend,
              },

            verifySignupEmail:
              vi.fn(),

            loginSessionService:
              createUnusedService() as never,

            sessionLifecycleService:
              createUnusedService() as never,

            passwordResetService:
              createUnusedService() as never,

            isProduction:
              false,
          }
        );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup/resend",

            payload: {
              email:
                " pending@example.com ",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          resend
        ).toHaveBeenCalledWith({
          email:
            "pending@example.com",
        });

        const body =
          response.json();

        expect(
          body
        ).toEqual({
          account: {
            id:
              ACCOUNT.id,

            email:
              ACCOUNT.email,

            fullName:
              ACCOUNT.fullName,

            status:
              "pending_verification",

            emailVerifiedAt:
              null,

            createdAt:
              "2026-01-01T00:00:00.000Z",
          },

          emailVerification: {
            purpose:
              "signup",

            expiresAt:
              "2026-01-01T00:10:00.000Z",

            delivery: {
              provider:
                "development",

              messageId:
                "dev-message-id",

              acceptedAt:
                "2026-01-01T00:00:01.000Z",
            },
          },
        });

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "123456"
        );

        await app.close();
      }
    );

    it(
      "rejects malformed resend email before application service execution",
      async () => {
        const app =
          Fastify();

        const resend =
          vi.fn();

        await app.register(
          authenticationRoutes,
          {
            prefix:
              "/api/v1/auth",

            accessTokenService:
              createUnusedService() as never,

            signupRegistrationService:
              {
                register:
                  vi.fn(),

                resend,
              },

            verifySignupEmail:
              vi.fn(),

            loginSessionService:
              createUnusedService() as never,

            sessionLifecycleService:
              createUnusedService() as never,

            passwordResetService:
              createUnusedService() as never,

            isProduction:
              false,
          }
        );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/signup/resend",

            payload: {
              email:
                "not-an-email",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          resend
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);
