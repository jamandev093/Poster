import type {
  AuthenticationAccountSummary,
  RegisterAuthenticationAccountInput,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  EmailDeliveryReceipt,
} from "../../services/email/email-delivery.types.js";

export type SignupRegistrationInput =
  RegisterAuthenticationAccountInput;

/**
 * Safe signup result returned after the verification email has
 * been accepted by the configured delivery provider.
 *
 * The raw verification code is intentionally excluded.
 */
export interface SignupRegistrationResult {
  account:
    AuthenticationAccountSummary;

  emailVerification: {
    purpose: "signup";

    expiresAt: Date;

    delivery:
      EmailDeliveryReceipt;
  };
}