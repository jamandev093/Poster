import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createSignupRegistrationService,
} from "../src/application/authentication/signup-registration.service.js";

import type {
  RegisterAuthenticationAccountInput,
  RegisterAuthenticationAccountResult,
} from "../src/domains/authentication/authentication.service.types.js";

import type {
  EmailDeliveryProvider,
  EmailDeliveryReceipt,
} from "../src/services/email/email-delivery.types.js";

const REGISTERED_AT =
  new Date(
    "2026-07-28T17:00:00.000Z"
  );

const EXPIRES_AT =
  new Date(
    "2026-07-28T17:10:00.000Z"
  );

const ACCEPTED_AT =
  new Date(
    "2026-07-28T17:00:01.000Z"
  );

const TOKEN_ID =
  "00000000-0000-4000-8000-000000000401";

const REGISTRATION_INPUT:
  RegisterAuthenticationAccountInput = {
    email:
      "person@example.com",

    password:
      "correct horse battery staple",

    fullName:
      "Example Person",
  };

const REGISTRATION_RESULT:
  RegisterAuthenticationAccountResult = {
    account: {
      id:
        "00000000-0000-4000-8000-000000000402",

      email:
        "person@example.com",

      fullName:
        "Example Person",

      status:
        "pending_verification",

      emailVerifiedAt:
        null,

      createdAt:
        REGISTERED_AT,
    },

    emailVerification: {
      purpose:
        "signup",

      tokenId:
        TOKEN_ID,

      code:
        "123456",

      expiresAt:
        EXPIRES_AT,
    },
  };

const DELIVERY_RECEIPT:
  EmailDeliveryReceipt = {
    provider:
      "poster-test-provider",

    messageId:
      "provider-message-001",

    acceptedAt:
      ACCEPTED_AT,
  };

function createTestContext() {
  const registerAuthenticationAccountMock =
    vi.fn<
      (
        input:
          RegisterAuthenticationAccountInput
      ) => Promise<
        RegisterAuthenticationAccountResult
      >
    >();

  const sendEmailMock =
    vi.fn<
      EmailDeliveryProvider[
        "sendEmail"
      ]
    >();

  registerAuthenticationAccountMock
    .mockResolvedValue(
      REGISTRATION_RESULT
    );

  sendEmailMock
    .mockResolvedValue(
      DELIVERY_RECEIPT
    );

  const emailDeliveryProvider:
    EmailDeliveryProvider = {
    providerName:
      "poster-test-provider",

    sendEmail:
      sendEmailMock,
  };

  const service =
    createSignupRegistrationService({
      emailDeliveryProvider,

      registerAuthenticationAccount:
        registerAuthenticationAccountMock,
    });

  return {
    service,

    registerAuthenticationAccountMock,

    sendEmailMock,
  };
}

describe(
  "Poster signup registration application service",
  () => {
    it(
      "registers first, sends the signup verification email, and returns no raw code",
      async () => {
        const context =
          createTestContext();

        const result =
          await context.service
            .register(
              REGISTRATION_INPUT
            );

        expect(
          context
            .registerAuthenticationAccountMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context
            .registerAuthenticationAccountMock
        ).toHaveBeenCalledWith(
          REGISTRATION_INPUT
        );

        expect(
          context.sendEmailMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.sendEmailMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            category:
              "signup_verification",

            to:
              "person@example.com",

            idempotencyKey:
              TOKEN_ID,
          })
        );

        const deliveredMessage =
          context
            .sendEmailMock
            .mock
            .calls[0]?.[0];

        expect(
          deliveredMessage?.text
        ).toContain(
          "123456"
        );

        expect(
          deliveredMessage?.html
        ).toContain(
          "123456"
        );

        expect(
          deliveredMessage
            ?.idempotencyKey
        ).not.toContain(
          "123456"
        );

        expect(
          result
        ).toEqual({
          account:
            REGISTRATION_RESULT.account,

          emailVerification: {
            purpose:
              "signup",

            expiresAt:
              EXPIRES_AT,

            delivery:
              DELIVERY_RECEIPT,
          },
        });

        expect(
          Object.hasOwn(
            result.emailVerification,
            "code"
          )
        ).toBe(
          false
        );

        expect(
          JSON.stringify(
            result
          )
        ).not.toContain(
          "123456"
        );
      }
    );

    it(
      "does not call the email provider when account registration fails",
      async () => {
        const context =
          createTestContext();

        const registrationError =
          new Error(
            "Registration failed."
          );

        context
          .registerAuthenticationAccountMock
          .mockRejectedValue(
            registrationError
          );

        await expect(
          context.service
            .register(
              REGISTRATION_INPUT
            )
        ).rejects.toBe(
          registrationError
        );

        expect(
          context.sendEmailMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "propagates provider failure after registration has completed",
      async () => {
        const context =
          createTestContext();

        const deliveryError =
          new Error(
            "Email provider unavailable."
          );

        context
          .sendEmailMock
          .mockRejectedValue(
            deliveryError
          );

        await expect(
          context.service
            .register(
              REGISTRATION_INPUT
            )
        ).rejects.toBe(
          deliveryError
        );

        expect(
          context
            .registerAuthenticationAccountMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.sendEmailMock
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);