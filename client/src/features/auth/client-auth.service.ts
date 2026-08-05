import {
  getPosterApiBaseUrl,
  PosterApiRequestError,
  type PosterApiErrorPayload,
} from "@/features/workspace/services/client-api.service";

import {
  clearStoredAuthenticationSession,
  storeAuthenticationAccessToken,
} from "./auth-session.storage";

const ACCESS_TOKEN_HEADER =
  "x-poster-access-token";

const ACCESS_TOKEN_EXPIRES_HEADER =
  "x-poster-access-token-expires-at";

export interface ClientAuthenticationAccount {
  id:
    string;

  email:
    string;

  fullName:
    string;

  status:
    string;

  emailVerifiedAt?:
    string |
    null;

  createdAt?:
    string;
}

export interface ClientAuthenticationSession {
  id:
    string;

  userId:
    string;

  organizationId:
    string |
    null;

  createdAt:
    string;

  expiresAt:
    string;
}

export interface ClientAuthenticationResult {
  account:
    ClientAuthenticationAccount;

  session:
    ClientAuthenticationSession;
}

export interface ClientSignupResult {
  account:
    ClientAuthenticationAccount;

  messageId?:
    string;
}

export interface ClientSignupVerificationResult {
  account:
    ClientAuthenticationAccount;
}

export interface ClientPasswordResetRequestResult {
  accepted:
    boolean;

  messageId?:
    string;
}

export interface ClientPasswordResetConfirmResult {
  accepted:
    boolean;
}

export interface LoginClientInput {
  email:
    string;

  password:
    string;
}

export interface SignupClientInput {
  fullName:
    string;

  email:
    string;

  password:
    string;
}

export interface VerifyClientSignupEmailInput {
  email:
    string;

  token:
    string;
}

export interface RequestClientPasswordResetInput {
  email:
    string;
}

export interface ConfirmClientPasswordResetInput {
  token:
    string;

  password:
    string;
}

function createAuthApiUrl(
  path:
    string
): string {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${getPosterApiBaseUrl()}${normalizedPath}`;
}

async function readPosterAuthApiError(
  response:
    Response
): Promise<string> {
  try {
    const payload =
      await response.json() as PosterApiErrorPayload;

    if (
      typeof payload.error === "object" &&
      payload.error?.message
    ) {
      return payload.error.message;
    }

    if (typeof payload.error === "string") {
      return payload.error;
    }

    return (
      payload.message ??
      "The Poster authentication request could not be completed."
    );
  } catch {
    return "The Poster authentication request could not be completed.";
  }
}

async function requestAuthJson<ResponseBody>(
  path:
    string,
  init:
    RequestInit
): Promise<ResponseBody> {
  const headers =
    new Headers(
      init.headers
    );

  if (
    init.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response =
    await fetch(
      createAuthApiUrl(
        path
      ),
      {
        ...init,
        headers,
        credentials:
          init.credentials ??
          "include",
      }
    );

  if (!response.ok) {
    throw new PosterApiRequestError(
      await readPosterAuthApiError(
        response
      ),
      response.status
    );
  }

  const accessToken =
    response.headers.get(
      ACCESS_TOKEN_HEADER
    );

  const accessTokenExpiresAt =
    response.headers.get(
      ACCESS_TOKEN_EXPIRES_HEADER
    );

  if (accessToken) {
    storeAuthenticationAccessToken(
      accessToken,
      accessTokenExpiresAt
    );
  }

  return await response.json() as ResponseBody;
}

export async function loginClient(
  input:
    LoginClientInput
): Promise<ClientAuthenticationResult> {
  return await requestAuthJson<ClientAuthenticationResult>(
    "/api/v1/auth/login",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          email:
            input.email,
          password:
            input.password,
        }),
    }
  );
}

export async function refreshClientSession():
  Promise<ClientAuthenticationResult> {
  return await requestAuthJson<ClientAuthenticationResult>(
    "/api/v1/auth/refresh",
    {
      method:
        "POST",
    }
  );
}

export async function logoutClient():
  Promise<void> {
  try {
    await requestAuthJson<Record<string, never>>(
      "/api/v1/auth/logout",
      {
        method:
          "POST",
      }
    );
  } finally {
    clearStoredAuthenticationSession();
  }
}

export async function signupClient(
  input:
    SignupClientInput
): Promise<ClientSignupResult> {
  return await requestAuthJson<ClientSignupResult>(
    "/api/v1/auth/signup",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          fullName:
            input.fullName,
          email:
            input.email,
          password:
            input.password,
        }),
    }
  );
}

export async function verifyClientSignupEmail(
  input:
    VerifyClientSignupEmailInput
): Promise<ClientSignupVerificationResult> {
  return await requestAuthJson<ClientSignupVerificationResult>(
    "/api/v1/auth/signup/verify",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          email:
            input.email,
          token:
            input.token,
        }),
    }
  );
}

export async function requestClientPasswordReset(
  input:
    RequestClientPasswordResetInput
): Promise<ClientPasswordResetRequestResult> {
  return await requestAuthJson<ClientPasswordResetRequestResult>(
    "/api/v1/auth/password-reset/request",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          email:
            input.email,
        }),
    }
  );
}

export async function confirmClientPasswordReset(
  input:
    ConfirmClientPasswordResetInput
): Promise<ClientPasswordResetConfirmResult> {
  return await requestAuthJson<ClientPasswordResetConfirmResult>(
    "/api/v1/auth/password-reset/confirm",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          token:
            input.token,
          password:
            input.password,
        }),
    }
  );
}