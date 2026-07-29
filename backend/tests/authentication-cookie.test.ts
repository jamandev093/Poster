import cookie
  from "@fastify/cookie";

import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  AUTHENTICATION_REFRESH_COOKIE_NAME,
  AUTHENTICATION_REFRESH_COOKIE_PATH,
  clearAuthenticationRefreshCookie,
  readAuthenticationRefreshToken,
  setAuthenticationRefreshCookie,
} from "../src/http/authentication-cookie.js";

function normalizeSetCookieHeader(
  header:
    | string
    | string[]
    | undefined
): string {
  if (
    Array.isArray(
      header
    )
  ) {
    return header.join(
      "\n"
    );
  }

  return header ??
    "";
}

async function createCookieTestApp():
  Promise<FastifyInstance> {
  const app =
    Fastify({
      logger:
        false,
    });

  await app.register(
    cookie
  );

  return app;
}

describe(
  "Poster authentication refresh-cookie transport",
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
      "sets a protected production refresh-token cookie",
      async () => {
        app =
          await createCookieTestApp();

        const expiresAt =
          new Date(
            Date.now() +
              5 *
                60 *
                1000
          );

        app.get(
          "/issue-production-cookie",
          async (
            _request,
            reply
          ) => {
            setAuthenticationRefreshCookie(
              reply,
              "opaque-production-refresh-token",
              {
                expiresAt,

                isProduction:
                  true,
              }
            );

            return {
              status:
                "issued",
            };
          }
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/issue-production-cookie",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const setCookieHeader =
          normalizeSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          );

        expect(
          setCookieHeader
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=opaque-production-refresh-token`
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
          "Secure"
        );

        expect(
          setCookieHeader
        ).toContain(
          "SameSite=Strict"
        );

        expect(
          setCookieHeader
        ).toContain(
          `Expires=${expiresAt.toUTCString()}`
        );

        expect(
          setCookieHeader
        ).not.toContain(
          "Domain="
        );
      }
    );

    it(
      "does not require HTTPS for the local-development cookie",
      async () => {
        app =
          await createCookieTestApp();

        app.get(
          "/issue-development-cookie",
          async (
            _request,
            reply
          ) => {
            setAuthenticationRefreshCookie(
              reply,
              "opaque-development-refresh-token",
              {
                expiresAt:
                  new Date(
                    Date.now() +
                      5 *
                        60 *
                        1000
                  ),

                isProduction:
                  false,
              }
            );

            return {
              status:
                "issued",
            };
          }
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/issue-development-cookie",
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
          "HttpOnly"
        );

        expect(
          setCookieHeader
        ).toContain(
          "SameSite=Strict"
        );

        expect(
          setCookieHeader
        ).not.toContain(
          "Secure"
        );
      }
    );

    it(
      "reads the refresh token from the parsed request cookies",
      async () => {
        app =
          await createCookieTestApp();

        app.get(
          "/api/v1/auth/read-cookie",
          async (
            request
          ) => ({
            refreshToken:
              readAuthenticationRefreshToken(
                request
              ),
          })
        );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/auth/read-cookie",

            headers: {
              cookie:
                `${AUTHENTICATION_REFRESH_COOKIE_NAME}=opaque-incoming-refresh-token`,
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
          refreshToken:
            "opaque-incoming-refresh-token",
        });
      }
    );

    it(
      "clears the refresh cookie using the same protected path",
      async () => {
        app =
          await createCookieTestApp();

        app.post(
          "/api/v1/auth/logout",
          async (
            _request,
            reply
          ) => {
            clearAuthenticationRefreshCookie(
              reply,
              true
            );

            return {
              status:
                "logged_out",
            };
          }
        );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/logout",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

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
          setCookieHeader
        ).toContain(
          "HttpOnly"
        );

        expect(
          setCookieHeader
        ).toContain(
          "Secure"
        );

        expect(
          setCookieHeader
        ).toContain(
          "SameSite=Strict"
        );

        expect(
          setCookieHeader
        ).toMatch(
          /Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT/
        );
      }
    );
  }
);
