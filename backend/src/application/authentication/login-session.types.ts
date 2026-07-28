import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

export interface LoginAuthenticationSessionInput {
  email: string;

  /**
   * Passwords must never be trimmed or normalized.
   */
  password: string;

  ipAddress?:
    | string
    | null;

  userAgent?:
    | string
    | null;
}

/**
 * Safe session metadata.
 *
 * Refresh-token digests and other internal authentication
 * values are intentionally excluded.
 */
export interface AuthenticationSessionSummary {
  id: string;

  userId: string;

  organizationId:
    | string
    | null;

  createdAt: Date;

  expiresAt: Date;
}

/**
 * Successful login result.
 *
 * refreshToken is returned exactly once so the transport
 * boundary can deliver it securely. It must never be logged
 * or persisted in raw form.
 */
export interface LoginAuthenticationSessionResult {
  account:
    AuthenticationAccountSummary;

  session:
    AuthenticationSessionSummary;

  refreshToken: string;
}