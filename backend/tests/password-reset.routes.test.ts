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
  PasswordResetService,
} from "../src/application/authentication/password-reset.service.js";

import {
  AuthenticationTokenInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import {
  AUTHENTICATION_REFRESH_COOKIE_NAME,
  AUTHENTICATION_REFRESH_COOKIE_PATH,
} from "../src/http/authentication-cookie.js";

function normalizeSetCookieHeader(
  value:
    | string
    | string[]
    | undefined
): string {
  return Array.isArray(
    value
  )
    ? value.join(
        "; "
      )
    : value ??
      "";
}

function createPasswordResetServiceMock() {
  const request =
    vi.fn<
      PasswordResetService[
        "request"
      ]
    >();

  request
    .mockResolvedValue({
      status:
        "accepted",
    });

  const confirm =
    vi.fn<
      PasswordResetService[
        "confirm"
      ]
    >();

  confirm
    .mockResolvedValue({
      status:
        "password_updated",
    });

  return {
    request,

    confirm,

    service: {
      request,

      confirm,
    } satisfies
      PasswordResetService,
  };
}

describe(
  "Poster password-reset HTTP routes",
  () => {
    let app:
      FastifyInstance |
      null =
        null;

    afterEach(
      async () => {
        if (
          app
        ) {
          await app.close();

          app =
            null;
        }
      }
    );

    it(
      "returns the same accepted response for every valid reset request",
      async () => {
        const passwordReset =
          createPasswordResetServiceMock();

        app =
          await buildApp({
            passwordResetService:
              passwordReset.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/password-reset/request",

            headers: {
              "user-agent":
                "Poster Route Test",
            },

            payload: {
              email:
                " PERSON@Example.COM ",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          202
        );

        expect(
          response.json()
        ).toEqual({
          status:
            "accepted",
        });

        expect(
          passwordReset.request
        ).toHaveBeenCalledWith({
          email:
            "PERSON@Example.COM",

          ipAddress:
            "127.0.0.1",

          userAgent:
            "Poster Route Test",
        });
      }
    );

    it(
      "confirms a reset, clears the refresh cookie, and returns no secret",
      async () => {
        const passwordReset =
          createPasswordResetServiceMock();

        app =
          await buildApp({
            passwordResetService:
              passwordReset.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/password-reset/confirm",

            headers: {
              cookie:
                `${AUTHENTICATION_REFRESH_COOKIE_NAME}=old-refresh-token`,
            },

            payload: {
              email:
                "person@example.com",

              code:
                "123456",

              password:
                "Poster-New-Password-2026!",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toEqual({
          status:
            "password_updated",
        });

        expect(
          passwordReset.confirm
        ).toHaveBeenCalledWith({
          email:
            "person@example.com",

          code:
            "123456",

          password:
            "Poster-New-Password-2026!",
        });

        const setCookieHeader =
          normalizeSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          );

        expect(
          setCookieHeader
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=`
        );

        expect(
          setCookieHeader
        ).toContain(
          `Path=${AUTHENTICATION_REFRESH_COOKIE_PATH}`
        );

        expect(
          response.body
        ).not.toContain(
          "123456"
        );

        expect(
          response.body
        ).not.toContain(
          "Poster-New-Password-2026!"
        );
      }
    );

    it(
      "rejects malformed reset requests before calling the service",
      async () => {
        const passwordReset =
          createPasswordResetServiceMock();

        app =
          await buildApp({
            passwordResetService:
              passwordReset.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/password-reset/confirm",

            payload: {
              email:
                "not-an-email",

              code:
                "12",

              password:
                "short",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "REQUEST_VALIDATION_FAILED",
          },
        });

        expect(
          passwordReset.confirm
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "maps invalid reset challenges to the safe authentication error",
      async () => {
        const passwordReset =
          createPasswordResetServiceMock();

        passwordReset.confirm
          .mockRejectedValue(
            new AuthenticationTokenInvalidError()
          );

        app =
          await buildApp({
            passwordResetService:
              passwordReset.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/password-reset/confirm",

            payload: {
              email:
                "person@example.com",

              code:
                "999999",

              password:
                "Poster-New-Password-2026!",
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
              "AUTH_TOKEN_INVALID",
          },
        });
      }
    );
  }
);