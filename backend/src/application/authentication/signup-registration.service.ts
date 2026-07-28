import {
  registerAuthenticationAccount,
} from "../../domains/authentication/authentication.service.js";

import {
  createSignupVerificationEmailMessage,
} from "../../services/email/email-delivery.templates.js";

import type {
  EmailDeliveryProvider,
} from "../../services/email/email-delivery.types.js";

import type {
  SignupRegistrationInput,
  SignupRegistrationResult,
} from "./signup-registration.types.js";

export interface CreateSignupRegistrationServiceOptions {
  emailDeliveryProvider:
    EmailDeliveryProvider;

  registerAuthenticationAccount?:
    typeof registerAuthenticationAccount;

  createSignupVerificationEmailMessage?:
    typeof createSignupVerificationEmailMessage;
}

export interface SignupRegistrationService {
  register:
    (
      input:
        SignupRegistrationInput
    ) => Promise<
      SignupRegistrationResult
    >;
}

/**
 * Creates the application-level Poster signup workflow.
 *
 * Database registration is completed before the external email
 * provider is called. This prevents network delivery latency
 * from holding an open PostgreSQL transaction.
 *
 * A delivery failure is propagated to the caller. The account
 * remains pending verification and the persisted token remains
 * available for the future resend workflow.
 */
export function createSignupRegistrationService(
  options:
    CreateSignupRegistrationServiceOptions
): SignupRegistrationService {
  const registerAccount =
    options.registerAuthenticationAccount ??
    registerAuthenticationAccount;

  const createVerificationMessage =
    options.createSignupVerificationEmailMessage ??
    createSignupVerificationEmailMessage;

  return {
    async register(
      input
    ) {
      /*
       * This call owns the authoritative atomic PostgreSQL
       * registration transaction.
       */
      const registration =
        await registerAccount(
          input
        );

      /*
       * External provider delivery begins only after the
       * registration transaction has committed.
       */
      const message =
        createVerificationMessage({
          recipientEmail:
            registration.account.email,

          recipientName:
            registration.account.fullName,

          verificationCode:
            registration
              .emailVerification
              .code,

          expiresAt:
            registration
              .emailVerification
              .expiresAt,

          idempotencyKey:
            registration
              .emailVerification
              .tokenId,
        });

      const delivery =
        await options
          .emailDeliveryProvider
          .sendEmail(
            message
          );

      /*
       * Return only safe account, expiry, and provider receipt
       * data. The raw code must not escape this orchestration
       * boundary.
       */
      return {
        account:
          registration.account,

        emailVerification: {
          purpose:
            "signup",

          expiresAt:
            new Date(
              registration
                .emailVerification
                .expiresAt
                .getTime()
            ),

          delivery: {
            provider:
              delivery.provider,

            messageId:
              delivery.messageId,

            acceptedAt:
              new Date(
                delivery
                  .acceptedAt
                  .getTime()
              ),
          },
        },
      };
    },
  };
}