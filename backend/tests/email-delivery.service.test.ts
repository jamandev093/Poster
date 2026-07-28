import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EmailDeliveryConfigurationError,
  createDevelopmentEmailDeliveryProvider,
  createSignupVerificationEmailMessage,
} from "../src/services/email/index.js";

describe(
  "Poster email delivery boundary",
  () => {
    it(
      "creates a normalized signup-verification email without exposing the code in metadata",
      () => {
        const message =
          createSignupVerificationEmailMessage({
            recipientEmail:
              "  USER@Example.COM  ",

            recipientName:
              "  Poster User  ",

            verificationCode:
              "123456",

            expiresAt:
              new Date(
                "2026-07-28T17:00:00.000Z"
              ),

            idempotencyKey:
              "email-token-record-001",
          });

        expect(
          message.to
        ).toBe(
          "user@example.com"
        );

        expect(
          message.category
        ).toBe(
          "signup_verification"
        );

        expect(
          message.subject
        ).toBe(
          "Verify your Poster account"
        );

        expect(
          message.text
        ).toContain(
          "123456"
        );

        expect(
          message.html
        ).toContain(
          "123456"
        );

        expect(
          message.idempotencyKey
        ).toBe(
          "email-token-record-001"
        );

        expect(
          message.idempotencyKey
        ).not.toContain(
          "123456"
        );
      }
    );

    it(
      "rejects malformed recipients, verification codes, expiry dates, and idempotency keys",
      () => {
        const validInput = {
          recipientEmail:
            "user@example.com",

          recipientName:
            "Poster User",

          verificationCode:
            "123456",

          expiresAt:
            new Date(
              "2026-07-28T17:00:00.000Z"
            ),

          idempotencyKey:
            "email-token-record-001",
        };

        expect(
          () =>
            createSignupVerificationEmailMessage({
              ...validInput,

              recipientEmail:
                "not-an-email",
            })
        ).toThrow(
          TypeError
        );

        expect(
          () =>
            createSignupVerificationEmailMessage({
              ...validInput,

              verificationCode:
                "12345",
            })
        ).toThrow(
          TypeError
        );

        expect(
          () =>
            createSignupVerificationEmailMessage({
              ...validInput,

              expiresAt:
                new Date(
                  Number.NaN
                ),
            })
        ).toThrow(
          RangeError
        );

        expect(
          () =>
            createSignupVerificationEmailMessage({
              ...validInput,

              idempotencyKey:
                "   ",
            })
        ).toThrow(
          TypeError
        );
      }
    );

    it(
      "captures development messages only in memory and returns a provider receipt",
      async () => {
        const acceptedAt =
          new Date(
            "2026-07-28T16:45:00.000Z"
          );

        const provider =
          createDevelopmentEmailDeliveryProvider({
            nodeEnvironment:
              "test",

            now:
              () =>
                new Date(
                  acceptedAt.getTime()
                ),

            createMessageId:
              () =>
                "development-message-001",
          });

        const message =
          createSignupVerificationEmailMessage({
            recipientEmail:
              "user@example.com",

            recipientName:
              "Poster User",

            verificationCode:
              "654321",

            expiresAt:
              new Date(
                "2026-07-28T17:00:00.000Z"
              ),

            idempotencyKey:
              "email-token-record-002",
          });

        const receipt =
          await provider.sendEmail(
            message
          );

        expect(
          receipt
        ).toEqual({
          provider:
            "poster-development-capture",

          messageId:
            "development-message-001",

          acceptedAt,
        });

        const capturedEmails =
          provider.getCapturedEmails();

        expect(
          capturedEmails
        ).toHaveLength(
          1
        );

        expect(
          capturedEmails[0]
        ).toMatchObject({
          to:
            "user@example.com",

          category:
            "signup_verification",

          messageId:
            "development-message-001",

          provider:
            "poster-development-capture",
        });

        expect(
          capturedEmails[0]?.text
        ).toContain(
          "654321"
        );

        provider.clearCapturedEmails();

        expect(
          provider.getCapturedEmails()
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "refuses to initialize the development provider in production",
      () => {
        expect(
          () =>
            createDevelopmentEmailDeliveryProvider({
              nodeEnvironment:
                "production",
            })
        ).toThrow(
          EmailDeliveryConfigurationError
        );
      }
    );
  }
);