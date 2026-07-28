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