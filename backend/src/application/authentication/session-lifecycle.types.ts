import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  AuthenticationSessionSummary,
} from "./login-session.types.js";

export interface RefreshAuthenticationSessionInput {
  refreshToken: string;

  ipAddress?:
    | string
    | null;

  userAgent?:
    | string
    | null;
}

export interface RefreshAuthenticationSessionResult {
  account:
    AuthenticationAccountSummary;

  session:
    AuthenticationSessionSummary;

  /**
   * Returned once for immediate protected-cookie replacement.
   * It must never be logged or serialized in a response body.
   */
  refreshToken: string;
}

export interface LogoutAuthenticationSessionInput {
  refreshToken: string;
}

export interface LogoutAuthenticationSessionResult {
  revoked: boolean;
}