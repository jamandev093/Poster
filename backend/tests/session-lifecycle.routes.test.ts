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
  SessionLifecycleService,
} from "../src/application/authentication/session-lifecycle.service.js";

import type {
  AuthenticationAccessTokenService,
} from "../src/domains/authentication/access-token.service.js";

import {
  AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER,
  AUTHENTICATION_ACCESS_TOKEN_HEADER,
} from "../src/domains/authentication/access-token.service.js";

import {
  AUTHENTICATION_REFRESH_COOKIE_NAME,
  AUTHENTICATION_REFRESH_COOKIE_PATH,
} from "../src/http/authentication-cookie.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000201";

const SESSION_CREATED_AT =
  new Date(
    "2026-07-29T07:00:00.000Z"
  );

const SESSION_EXPIRES_AT =
  new Date(
    "2030-08-28T07:00:00.000Z"
  );

const ACCESS_TOKEN_EXPIRES_AT =
  new Date(
    "2030-07-29T07:15:00.000Z"
  );

function createAccessTokenService():
  AuthenticationAccessTokenService {
  return {
    issue:
      vi.fn()
        .mockReturnValue({
          token:
            "replacement-access-token",

          expiresAt:
            ACCESS_TOKEN_EXPIRES_AT,
        }),

    verify:
      vi.fn(),
  };
}

function createLifecycleService() {
  const refresh =
    vi.fn<
      SessionLifecycleService[
        "refresh"
      ]
    >();

  refresh
    .mockResolvedValue({
      account: {
        id:
          USER_ID,

        email:
          "person@example.com",

        fullName:
          "Example Person",

        status:
          "active",

        emailVerifiedAt:
          new Date(
            "2026-07-28T07:00:00.000Z"
          ),

        createdAt:
          new Date(
            "2026-07-28T06:00:00.000Z"
          ),
      },

      session: {
        id:
          SESSION_ID,

        userId:
          USER_ID,

        organizationId:
          null,

        createdAt:
          SESSION_CREATED_AT,

        expiresAt:
          SESSION_EXPIRES_AT,
      },

      refreshToken:
        "replacement-refresh-token",
    });

  const logout =
    vi.fn<
      SessionLifecycleService[
        "logout"
      ]
    >();

  logout
    .mockResolvedValue({
      revoked:
        true,
    });

  return {
    refresh,

    logout,

    service: {
      refresh,

      logout,
    } satisfies
      SessionLifecycleService,
  };
}

function getSetCookieHeader(
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

describe(
  "Poster authentication refresh and logout HTTP routes",
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
      "rotates the protected refresh cookie and issues a new access token",
      async () => {
        const lifecycle =
          createLifecycleService();

        app =
          await buildApp({
            accessTokenService:
              createAccessTokenService(),

            sessionLifecycleService:
              lifecycle.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/refresh",

            headers: {
              cookie:
                `${AUTHENTICATION_REFRESH_COOKIE_NAME}=current-refresh-token`,

              "user-agent":
                "Poster Route Test",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          lifecycle.refresh
        ).toHaveBeenCalledWith({
          refreshToken:
            "current-refresh-token",

          ipAddress:
            "127.0.0.1",

          userAgent:
            "Poster Route Test",
        });

        expect(
          response.headers[
            AUTHENTICATION_ACCESS_TOKEN_HEADER
          ]
        ).toBe(
          "replacement-access-token"
        );

        expect(
          response.headers[
            AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER
          ]
        ).toBe(
          ACCESS_TOKEN_EXPIRES_AT
            .toISOString()
        );

        expect(
          response.headers[
            "cache-control"
          ]
        ).toBe(
          "no-store"
        );

        expect(
          response.json()
        ).toEqual({
          account: {
            id:
              USER_ID,

            email:
              "person@example.com",

            fullName:
              "Example Person",

            status:
              "active",

            emailVerifiedAt:
              "2026-07-28T07:00:00.000Z",

            createdAt:
              "2026-07-28T06:00:00.000Z",
          },

          session: {
            id:
              SESSION_ID,

            userId:
              USER_ID,

            organizationId:
              null,

            createdAt:
              SESSION_CREATED_AT
                .toISOString(),

            expiresAt:
              SESSION_EXPIRES_AT
                .toISOString(),
          },
        });

        expect(
          response.body
        ).not.toContain(
          "replacement-refresh-token"
        );

        expect(
          response.body
        ).not.toContain(
          "refreshToken"
        );

        const setCookieHeader =
          getSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          );

        expect(
          setCookieHeader
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=replacement-refresh-token`
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
      }
    );

    it(
      "rejects a missing refresh cookie and clears the browser cookie",
      async () => {
        const lifecycle =
          createLifecycleService();

        app =
          await buildApp({
            accessTokenService:
              createAccessTokenService(),

            sessionLifecycleService:
              lifecycle.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/refresh",
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
              "AUTH_SESSION_INVALID",
          },
        });

        expect(
          lifecycle.refresh
        ).not.toHaveBeenCalled();

        expect(
          getSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          )
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=`
        );
      }
    );

    it(
      "revokes the current session and clears the cookie during logout",
      async () => {
        const lifecycle =
          createLifecycleService();

        app =
          await buildApp({
            sessionLifecycleService:
              lifecycle.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/logout",

            headers: {
              cookie:
                `${AUTHENTICATION_REFRESH_COOKIE_NAME}=logout-refresh-token`,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          204
        );

        expect(
          lifecycle.logout
        ).toHaveBeenCalledWith({
          refreshToken:
            "logout-refresh-token",
        });

        const setCookieHeader =
          getSetCookieHeader(
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
      }
    );

    it(
      "keeps logout idempotent when the refresh cookie is absent",
      async () => {
        const lifecycle =
          createLifecycleService();

        app =
          await buildApp({
            sessionLifecycleService:
              lifecycle.service,
          });

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
          204
        );

        expect(
          lifecycle.logout
        ).not.toHaveBeenCalled();

        expect(
          getSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          )
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=`
        );
      }
    );
  }
);