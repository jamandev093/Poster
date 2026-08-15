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

import {
  AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER,
  AUTHENTICATION_ACCESS_TOKEN_HEADER,
} from "../src/domains/authentication/access-token.service.js";

const NOW =
  new Date(
    "2026-08-15T16:45:00.000Z"
  );

let app:
  Awaited<
    ReturnType<
      typeof buildApp
    >
  > |
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

describe(
  "Google authentication route",
  () => {
    it(
      "converts a verified Google identity into the normal Poster access-token and refresh-cookie session",
      async () => {
        const authenticate =
          vi.fn(
            async () => ({
              account: {
                id:
                  "00000000-0000-4000-8000-000000004001",

                email:
                  "person@gmail.com",

                fullName:
                  "Example Person",

                status:
                  "active" as const,

                emailVerifiedAt:
                  NOW,

                createdAt:
                  NOW,
              },

              session: {
                id:
                  "00000000-0000-4000-8000-000000004003",

                userId:
                  "00000000-0000-4000-8000-000000004001",

                organizationId:
                  null,

                createdAt:
                  NOW,

                expiresAt:
                  new Date(
                    NOW.getTime() +
                      30 *
                        24 *
                        60 *
                        60 *
                        1000
                  ),
              },

              refreshToken:
                "raw-google-refresh-token",

              isNewAccount:
                true,
            })
          );

        app =
          await buildApp({
            googleAuthenticationService: {
              authenticate,
            },
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/auth/google",

            headers: {
              "user-agent":
                "Poster-Google-Route-Test/1.0",
            },

            payload: {
              idToken:
                "verified-google-id-token",

              mode:
                "signup",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          authenticate
        ).toHaveBeenCalledWith({
          idToken:
            "verified-google-id-token",

          mode:
            "signup",

          ipAddress:
            expect.any(
              String
            ),

          userAgent:
            "Poster-Google-Route-Test/1.0",
        });

        expect(
          response.json()
        ).toMatchObject({
          account: {
            id:
              "00000000-0000-4000-8000-000000004001",

            email:
              "person@gmail.com",
          },

          session: {
            id:
              "00000000-0000-4000-8000-000000004003",
          },

          isNewAccount:
            true,
        });

        expect(
          response.body
        ).not.toContain(
          "raw-google-refresh-token"
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
            "set-cookie"
          ]
        ).toBeDefined();

        expect(
          response.headers[
            "cache-control"
          ]
        ).toBe(
          "no-store"
        );
      }
    );
  }
);