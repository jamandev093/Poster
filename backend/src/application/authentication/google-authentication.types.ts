import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

import type {
  AuthenticationSessionSummary,
} from "./login-session.types.js";

export type GoogleAuthenticationMode =
  | "login"
  | "signup";

export interface GoogleAuthenticationInput {
  idToken: string;

  mode:
    GoogleAuthenticationMode;

  ipAddress?:
    | string
    | null;

  userAgent?:
    | string
    | null;
}

export interface GoogleAuthenticationResult {
  account:
    AuthenticationAccountSummary;

  session:
    AuthenticationSessionSummary;

  /**
   * Returned exactly once to the HTTP transport so it can be
   * placed in the existing protected Poster refresh cookie.
   */
  refreshToken: string;

  isNewAccount: boolean;
}