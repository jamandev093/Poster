import type {
  UserStatus,
} from "../identity/identity.types.js";

export interface RegisterAuthenticationAccountInput {
  email: string;

  password: string;

  fullName: string;
}

/**
 * Safe account representation returned by authentication
 * services.
 *
 * Password hashes and internal optimistic-concurrency values
 * are intentionally excluded.
 */
export interface AuthenticationAccountSummary {
  id: string;

  email: string;

  fullName: string;

  status: UserStatus;

  emailVerifiedAt:
    | Date
    | null;

  createdAt: Date;
}

export interface SignupEmailVerificationChallenge {
  purpose: "signup";

  /**
   * Non-secret identifier of the persisted verification-token
   * record.
   *
   * This value may be used as the email-provider idempotency
   * key. It must not be treated as the verification secret.
   */
  tokenId: string;

  /**
   * Raw verification code that must be passed directly to the
   * email-delivery boundary.
   *
   * It must never be persisted or written to application logs.
   */
  code: string;

  expiresAt: Date;
}

export interface RegisterAuthenticationAccountResult {
  account:
    AuthenticationAccountSummary;

  emailVerification:
    SignupEmailVerificationChallenge;
}

export interface ResendSignupEmailInput {
  email: string;
}

export interface ResendSignupEmailResult {
  account:
    AuthenticationAccountSummary;

  emailVerification: {
    purpose: "signup";

    tokenId: string;

    /**
     * Raw verification code that must be passed directly to the
     * email-delivery boundary.
     */
    code: string;

    expiresAt: Date;
  };
}
export interface VerifySignupEmailInput {
  email: string;

  code: string;
}

export interface VerifySignupEmailResult {
  account:
    AuthenticationAccountSummary;

  verifiedAt: Date;
}
