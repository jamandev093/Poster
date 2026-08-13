import fs from "node:fs";
import path from "node:path";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  clearStoredAuthenticationSession,
  getStoredAuthenticationAccessToken,
  storeAuthenticationAccessToken,
} from "./auth-session.storage";

import {
  confirmClientPasswordReset,
  loginClient,
  refreshClientSession,
  requestClientPasswordReset,
  signupClient,
  verifyClientSignupEmail,
} from "./client-auth.service";

import {
  PosterApiRequestError,
  requestPosterApiJson,
} from "@/features/workspace/services/client-api.service";

type FetchCall = [
  RequestInfo | URL,
  RequestInit | undefined,
];

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function createMemoryStorage(): Storage {
  const values =
    new Map<string, string>();

  return {
    get length() {
      return values.size;
    },

    clear() {
      values.clear();
    },

    getItem(
      key:
        string
    ) {
      return values.get(
        key
      ) ?? null;
    },

    key(
      index:
        number
    ) {
      return Array.from(
        values.keys()
      )[index] ?? null;
    },

    removeItem(
      key:
        string
    ) {
      values.delete(
        key
      );
    },

    setItem(
      key:
        string,
      value:
        string
    ) {
      values.set(
        key,
        String(
          value
        )
      );
    },
  };
}

function createJsonResponse(
  body:
    unknown,
  status =
    200,
  headers:
    Record<string, string> =
      {}
): Response {
  return {
    ok:
      status >= 200 &&
      status < 300,

    status,

    headers:
      new Headers({
        "Content-Type":
          "application/json",

        ...headers,
      }),

    json:
      async () =>
        body,
  } as Response;
}

function readAuthHeaderConstants() {
  const source =
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "src/features/auth/client-auth.service.ts"
      ),
      "utf8"
    );

  function readConstant(
    name:
      string
  ): string {
    const match =
      source.match(
        new RegExp(
          `const\\s+${name}\\s*=\\s*["']([^"']+)["']`,
          "m"
        )
      );

    if (!match?.[1]) {
      throw new Error(
        `Could not resolve ${name}.`
      );
    }

    return match[1];
  }

  return {
    accessToken:
      readConstant(
        "ACCESS_TOKEN_HEADER"
      ),

    expiresAt:
      readConstant(
        "ACCESS_TOKEN_EXPIRES_HEADER"
      ),
  };
}

describe(
  "Client auth/session/API behavior",
  () => {
    beforeEach(
      () => {
        process.env
          .NEXT_PUBLIC_POSTER_API_BASE_URL =
            "https://api.example.test";

        process.env
          .NEXT_PUBLIC_API_BASE_URL =
            "https://api.example.test";

        vi.stubGlobal(
          "window",
          {
            localStorage:
              createMemoryStorage(),
          }
        );
      }
    );

    afterEach(
      () => {
        clearStoredAuthenticationSession();

        vi.restoreAllMocks();
        vi.unstubAllGlobals();
      }
    );

    it(
      "stores reads and clears Client authentication",
      () => {
        expect(
          getStoredAuthenticationAccessToken()
        ).toBeNull();

        storeAuthenticationAccessToken(
          "access-token-1",
          "2099-01-01T00:00:00.000Z"
        );

        expect(
          getStoredAuthenticationAccessToken()
        ).toBe(
          "access-token-1"
        );

        clearStoredAuthenticationSession();

        expect(
          getStoredAuthenticationAccessToken()
        ).toBeNull();
      }
    );

    it(
      "is safe outside browser storage runtime",
      () => {
        vi.stubGlobal(
          "window",
          undefined
        );

        expect(
          getStoredAuthenticationAccessToken()
        ).toBeNull();

        expect(
          () =>
            storeAuthenticationAccessToken(
              "unused",
              null
            )
        ).not.toThrow();

        expect(
          () =>
            clearStoredAuthenticationSession()
        ).not.toThrow();
      }
    );

    it(
      "injects bearer authorization query and request defaults",
      async () => {
        storeAuthenticationAccessToken(
          "stored-token",
          "2099-01-01T00:00:00.000Z"
        );

        const fetchMock =
          vi.fn<FetchFunction>(async () =>
              createJsonResponse({
                ok:
                  true,
              })
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await requestPosterApiJson(
          "/api/v1/client/example",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                value:
                  1,
              }),
          },
          {
            limit:
              10,

            active:
              true,
          }
        );

        const call =
          fetchMock.mock.calls[0] as unknown as
            FetchCall;

        const [
          requestUrl,
          init,
        ] =
          call;

        expect(
          String(
            requestUrl
          )
        ).toContain(
          "/api/v1/client/example"
        );

        expect(
          String(
            requestUrl
          )
        ).toContain(
          "limit=10"
        );

        expect(
          String(
            requestUrl
          )
        ).toContain(
          "active=true"
        );

        const headers =
          new Headers(
            init?.headers
          );

        expect(
          headers.get(
            "Authorization"
          )
        ).toBe(
          "Bearer stored-token"
        );

        expect(
          headers.get(
            "Content-Type"
          )
        ).toBe(
          "application/json"
        );

        expect(
          init?.credentials
        ).toBe(
          "include"
        );
      }
    );

    it(
      "preserves explicitly supplied Authorization",
      async () => {
        storeAuthenticationAccessToken(
          "stored-token",
          "2099-01-01T00:00:00.000Z"
        );

        const fetchMock =
          vi.fn<FetchFunction>(async () =>
              createJsonResponse({
                ok:
                  true,
              })
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await requestPosterApiJson(
          "/api/v1/client/example",
          {
            method:
              "GET",

            headers: {
              Authorization:
                "Bearer explicit-token",
            },
          }
        );

        const call =
          fetchMock.mock.calls[0] as unknown as
            FetchCall;

        const init =
          call[1];

        expect(
          new Headers(
            init?.headers
          ).get(
            "Authorization"
          )
        ).toBe(
          "Bearer explicit-token"
        );
      }
    );

    it(
      "converts non-OK API response to PosterApiRequestError",
      async () => {
        const fetchMock =
          vi.fn<FetchFunction>(async () =>
              createJsonResponse(
                {
                  message:
                    "Access denied",
                },
                401
              )
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await expect(
          requestPosterApiJson(
            "/api/v1/client/protected",
            {
              method:
                "GET",
            }
          )
        ).rejects.toBeInstanceOf(
          PosterApiRequestError
        );
      }
    );

    it(
      "stores token from actual Client auth response headers",
      async () => {
        const authHeaders =
          readAuthHeaderConstants();

        const fetchMock =
          vi.fn<FetchFunction>(async () =>
              createJsonResponse(
                {
                  authenticated:
                    true,
                },
                200,
                {
                  [authHeaders.accessToken]:
                    "issued-token",

                  [authHeaders.expiresAt]:
                    "2099-01-01T00:00:00.000Z",
                }
              )
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await loginClient({
          email:
            "client@example.com",

          password:
            "Password123!",
        });

        expect(
          getStoredAuthenticationAccessToken()
        ).toBe(
          "issued-token"
        );
      }
    );

    it(
      "uses exact Backend auth routes payloads and credentials",
      async () => {
        const fetchMock =
          vi.fn<FetchFunction>(async () =>
              createJsonResponse({
                ok:
                  true,
              })
          );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await loginClient({
          email:
            "login@example.com",

          password:
            "LoginPassword123!",
        });

        await refreshClientSession();

        await signupClient({
          fullName:
            "Poster Client",

          email:
            "signup@example.com",

          password:
            "SignupPassword123!",
        });

        await verifyClientSignupEmail({
          email:
            "signup@example.com",

          token:
            "123456",
        });

        await requestClientPasswordReset({
          email:
            "reset@example.com",
        });

        await confirmClientPasswordReset({
          token:
            "654321",

          password:
            "ResetPassword123!",
        });

        const expected = [
          {
            route:
              "/api/v1/auth/login",

            body: {
              email:
                "login@example.com",

              password:
                "LoginPassword123!",
            },
          },
          {
            route:
              "/api/v1/auth/refresh",

            body:
              undefined,
          },
          {
            route:
              "/api/v1/auth/signup",

            body: {
              fullName:
                "Poster Client",

              email:
                "signup@example.com",

              password:
                "SignupPassword123!",
            },
          },
          {
            route:
              "/api/v1/auth/signup/verify",

            body: {
              email:
                "signup@example.com",

              token:
                "123456",
            },
          },
          {
            route:
              "/api/v1/auth/password-reset/request",

            body: {
              email:
                "reset@example.com",
            },
          },
          {
            route:
              "/api/v1/auth/password-reset/confirm",

            body: {
              token:
                "654321",

              password:
                "ResetPassword123!",
            },
          },
        ];

        expect(
          fetchMock
        ).toHaveBeenCalledTimes(
          expected.length
        );

        expected.forEach(
          (
            contract,
            index
          ) => {
            const call =
              fetchMock.mock.calls[index] as unknown as
                FetchCall;

            const [
              url,
              init,
            ] =
              call;

            expect(
              String(
                url
              ).endsWith(
                contract.route
              )
            ).toBe(
              true
            );

            expect(
              init?.method
            ).toBe(
              "POST"
            );

            expect(
              init?.credentials
            ).toBe(
              "include"
            );

            if (
              contract.body ===
              undefined
            ) {
              expect(
                init?.body
              ).toBeUndefined();
            } else {
              expect(
                JSON.parse(
                  String(
                    init?.body
                  )
                )
              ).toEqual(
                contract.body
              );
            }
          }
        );
      }
    );
  }
);