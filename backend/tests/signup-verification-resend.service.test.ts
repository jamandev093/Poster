import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createSignupRegistrationService,
} from "../src/application/authentication/signup-registration.service.js";

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

describe(
  "Poster signup verification resend application service",
  () => {
    it(
      "issues a new challenge, sends it, and returns no raw code",
      async () => {
        const sendEmail =
          vi
            .fn()
            .mockResolvedValue({
              provider:
                "development",

              messageId:
                "dev-message-id",

              acceptedAt:
                new Date("2026-01-01T00:00:02.000Z"),
            });

        const resendSignupEmail =
          vi
            .fn()
            .mockResolvedValue({
              account:
                ACCOUNT,

              emailVerification: {
                purpose:
                  "signup",

                tokenId:
                  "22222222-2222-4222-8222-222222222222",

                code:
                  "123456",

                expiresAt:
                  new Date("2026-01-01T00:10:00.000Z"),
              },
            });

        const service =
          createSignupRegistrationService({
            emailDeliveryProvider: {
              providerName:
                "development",

              sendEmail,
            },

            registerAuthenticationAccount:
              vi.fn() as never,

            resendSignupEmail,
          });

        const result =
          await service.resend!({
            email:
              "pending@example.com",
          });

        expect(
          resendSignupEmail
        ).toHaveBeenCalledWith({
          email:
            "pending@example.com",
        });

        expect(
          sendEmail
        ).toHaveBeenCalledTimes(
          1
        );

        const message =
          sendEmail.mock.calls[0]?.[0];

        expect(
          message.to
        ).toBe(
          "pending@example.com"
        );

        expect(
          message.idempotencyKey
        ).toBe(
          "22222222-2222-4222-8222-222222222222"
        );

        expect(
          message.idempotencyKey
        ).toBe(
          "22222222-2222-4222-8222-222222222222"
        );

        expect(
          message.idempotencyKey
        ).not.toBe(
          "123456"
        );

        expect(
          result
        ).toEqual({
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
                new Date("2026-01-01T00:00:02.000Z"),
            },
          },
        });

        expect(
          JSON.stringify(
            result
          )
        ).not.toContain(
          "123456"
        );
      }
    );
  }
);
