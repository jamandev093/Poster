import type {
  AuthenticationAccountSummary,
  RegisterAuthenticationAccountInput,
  ResendSignupEmailInput,
} from "../../domains/authentication/authentication.service.types.js";

export type SignupRegistrationInput =
  RegisterAuthenticationAccountInput;

export type SignupVerificationResendInput =
  ResendSignupEmailInput;

export interface SignupVerificationDeliveryResult {
  purpose: "signup";

  expiresAt: Date;

  delivery: {
    provider: string;

    messageId: string;

    acceptedAt: Date;
  };
}

export interface SignupRegistrationResult {
  account:
    AuthenticationAccountSummary;

  emailVerification:
    SignupVerificationDeliveryResult;
}

export type SignupVerificationResendResult =
  SignupRegistrationResult;
