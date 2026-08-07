import {
  registerAuthenticationAccount,
  resendSignupEmail,
} from "../../domains/authentication/authentication.service.js";

import {
  createSignupVerificationEmailMessage,
} from "../../services/email/email-delivery.templates.js";

import type {
  EmailDeliveryProvider,
} from "../../services/email/email-delivery.types.js";

import type {
  RegisterAuthenticationAccountResult,
  ResendSignupEmailResult,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  SignupRegistrationInput,
  SignupRegistrationResult,
  SignupVerificationResendInput,
  SignupVerificationResendResult,
} from "./signup-registration.types.js";

export interface CreateSignupRegistrationServiceOptions {
  emailDeliveryProvider:
    EmailDeliveryProvider;

  registerAuthenticationAccount?:
    typeof registerAuthenticationAccount;

  resendSignupEmail?:
    typeof resendSignupEmail;

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

  resend?:
    (
      input:
        SignupVerificationResendInput
    ) => Promise<
      SignupVerificationResendResult
    >;
}

async function deliverSignupVerification(
  input:
    | RegisterAuthenticationAccountResult
    | ResendSignupEmailResult,
  options:
    Pick<
      CreateSignupRegistrationServiceOptions,
      | "emailDeliveryProvider"
      | "createSignupVerificationEmailMessage"
    >
): Promise<SignupRegistrationResult> {
  const createVerificationMessage =
    options.createSignupVerificationEmailMessage ??
    createSignupVerificationEmailMessage;

  const message =
    createVerificationMessage({
      recipientEmail:
        input.account.email,

      recipientName:
        input.account.fullName,

      verificationCode:
        input
          .emailVerification
          .code,

      expiresAt:
        input
          .emailVerification
          .expiresAt,

      idempotencyKey:
        input
          .emailVerification
          .tokenId,
    });

  const delivery =
    await options
      .emailDeliveryProvider
      .sendEmail(
        message
      );

  return {
    account:
      input.account,

    emailVerification: {
      purpose:
        "signup",

      expiresAt:
        new Date(
          input
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
 * available for the resend workflow.
 */
export function createSignupRegistrationService(
  options:
    CreateSignupRegistrationServiceOptions
): SignupRegistrationService {
  const registerAccount =
    options.registerAuthenticationAccount ??
    registerAuthenticationAccount;

  const resendVerification =
    options.resendSignupEmail ??
    resendSignupEmail;

  return {
    async register(
      input
    ) {
      const registration =
        await registerAccount(
          input
        );

      return await deliverSignupVerification(
        registration,
        options
      );
    },

    async resend(
      input
    ) {
      const resend =
        await resendVerification(
          input
        );

      return await deliverSignupVerification(
        resend,
        options
      );
    },
  };
}
