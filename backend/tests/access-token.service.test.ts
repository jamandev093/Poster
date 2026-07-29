import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AuthenticationAccessTokenExpiredError,
  AuthenticationAccessTokenInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import {
  createAuthenticationAccessTokenService,
} from "../src/domains/authentication/access-token.service.js";

const TOKEN_SECRET =
  "poster-access-token-test-secret-2026-very-long-value";

const ISSUED_AT =
  new Date(
    "2026-07-29T05:00:00.000Z"
  );

describe(
  "Poster authentication access tokens",
  () => {
    it(
      "issues and verifies a short-lived signed access token",
      () => {
        const service =
          createAuthenticationAccessTokenService({
            secret:
              TOKEN_SECRET,

            lifetimeSeconds:
              900,

            now:
              () => ISSUED_AT,
          });

        const issued =
          service.issue({
            userId:
              "00000000-0000-4000-8000-000000000101",

            sessionId:
              "00000000-0000-4000-8000-000000000201",
          });

        expect(
          issued.expiresAt
        ).toEqual(
          new Date(
            "2026-07-29T05:15:00.000Z"
          )
        );

        expect(
          service.verify(
            issued.token
          )
        ).toEqual({
          userId:
            "00000000-0000-4000-8000-000000000101",

          sessionId:
            "00000000-0000-4000-8000-000000000201",

          issuedAt:
            ISSUED_AT,

          expiresAt:
            new Date(
              "2026-07-29T05:15:00.000Z"
            ),
        });
      }
    );

    it(
      "rejects a modified access-token payload",
      () => {
        const service =
          createAuthenticationAccessTokenService({
            secret:
              TOKEN_SECRET,

            now:
              () => ISSUED_AT,
          });

        const issued =
          service.issue({
            userId:
              "00000000-0000-4000-8000-000000000101",

            sessionId:
              "00000000-0000-4000-8000-000000000201",
          });

        const [
          payload,
          signature,
        ] =
          issued.token.split(
            "."
          );

        const modifiedPayload =
          Buffer
            .from(
              JSON.stringify({
                version:
                  1,

                subject:
                  "00000000-0000-4000-8000-000000000999",

                sessionId:
                  "00000000-0000-4000-8000-000000000201",

                issuedAt:
                  1785301200,

                expiresAt:
                  1785302100,
              }),
              "utf8"
            )
            .toString(
              "base64url"
            );

        expect(
          () =>
            service.verify(
              `${modifiedPayload}.${signature ?? payload}`
            )
        ).toThrow(
          AuthenticationAccessTokenInvalidError
        );
      }
    );

    it(
      "rejects an expired access token",
      () => {
        const issuingService =
          createAuthenticationAccessTokenService({
            secret:
              TOKEN_SECRET,

            lifetimeSeconds:
              60,

            now:
              () => ISSUED_AT,
          });

        const issued =
          issuingService.issue({
            userId:
              "00000000-0000-4000-8000-000000000101",

            sessionId:
              "00000000-0000-4000-8000-000000000201",
          });

        const verifyingService =
          createAuthenticationAccessTokenService({
            secret:
              TOKEN_SECRET,

            lifetimeSeconds:
              60,

            now:
              () =>
                new Date(
                  "2026-07-29T05:01:00.000Z"
                ),
          });

        expect(
          () =>
            verifyingService.verify(
              issued.token
            )
        ).toThrow(
          AuthenticationAccessTokenExpiredError
        );
      }
    );

    it(
      "rejects malformed access-token values",
      () => {
        const service =
          createAuthenticationAccessTokenService({
            secret:
              TOKEN_SECRET,

            now:
              () => ISSUED_AT,
          });

        expect(
          () =>
            service.verify(
              "not-a-valid-token"
            )
        ).toThrow(
          AuthenticationAccessTokenInvalidError
        );
      }
    );
  }
);