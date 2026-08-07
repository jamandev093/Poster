import * as SecureStore from "expo-secure-store";

declare const process: {
  env?: {
    EXPO_PUBLIC_POSTER_API_BASE_URL?: string;
  };
};

const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN:
    "poster.auth.access-token",

  ACCESS_TOKEN_EXPIRES_AT:
    "poster.auth.access-token-expires-at",

  REFRESH_TOKEN:
    "poster.auth.refresh-token",
} as const;

const DEFAULT_POSTER_API_BASE_URL =
  "http://localhost:4000";

const API_VERSION_PREFIX =
  "/api/v1";

const AUTHENTICATION_ACCESS_TOKEN_HEADER =
  "x-poster-access-token";

const AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER =
  "x-poster-access-token-expires-at";

export interface AuthTokens {
  accessToken: string;

  refreshToken: string;
}

export interface AccessSessionTokens {
  accessToken: string;

  accessTokenExpiresAt: string;
}

export interface LoginInput {
  email: string;

  password: string;
}

export interface AuthenticationSession {
  id: string;

  userId: string;

  organizationId: string | null;

  createdAt: string;

  expiresAt: string;
}

export interface LoginResponse {
  account:
    AuthenticationAccount;

  session:
    AuthenticationSession;

  accessToken: string;

  accessTokenExpiresAt: string;
}

export interface AuthenticationAccount {
  id: string;

  email: string;

  fullName: string;

  status: string;

  emailVerifiedAt: string | null;

  createdAt: string;
}

export interface SignupInput {
  fullName: string;

  email: string;

  password: string;
}

export interface SignupVerificationInput {
  email: string;

  code: string;
}

export interface SignupVerificationResendInput {
  email: string;
}

export interface SignupEmailVerificationDelivery {
  purpose: "signup";

  expiresAt: string;

  delivery: {
    provider: string;

    messageId: string;

    acceptedAt: string;
  };
}

export interface SignupResponse {
  account:
    AuthenticationAccount;

  emailVerification:
    SignupEmailVerificationDelivery;
}

export interface SignupVerificationResponse {
  account:
    AuthenticationAccount;

  verification: {
    purpose: "signup";

    verifiedAt: string;
  };
}

export type RefreshSessionResponse =
  LoginResponse;

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetResponse {
  status: "accepted";
}

export interface ConfirmPasswordResetInput {
  email: string;

  code: string;

  password: string;
}

export interface ConfirmPasswordResetResponse {
  status: "password_updated";
}

export class AuthenticationApiError extends Error {
  readonly statusCode:
    number;

  readonly code:
    string | null;

  constructor(
    message: string,
    statusCode: number,
    code: string | null = null
  ) {
    super(message);

    this.name =
      "AuthenticationApiError";

    this.statusCode =
      statusCode;

    this.code =
      code;
  }
}

function normalizeToken(
  value: string
): string {
  return value.trim();
}

function normalizeApiBaseUrl(
  value: string | undefined
): string {
  const normalized =
    (value ?? DEFAULT_POSTER_API_BASE_URL)
      .trim()
      .replace(/\/+$/, "");

  if (!normalized) {
    return DEFAULT_POSTER_API_BASE_URL;
  }

  return normalized;
}

function buildAuthenticationUrl(
  path: string
): string {
  const baseUrl =
    normalizeApiBaseUrl(
      process.env?.EXPO_PUBLIC_POSTER_API_BASE_URL
    );

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${baseUrl}${API_VERSION_PREFIX}/auth${normalizedPath}`;
}

function normalizeEmail(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizeRequiredText(
  value: string
): string {
  return value.trim();
}

function getRecordString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value =
    record[key];

  return typeof value === "string"
    ? value
    : null;
}

function getErrorMessageFromBody(
  body: unknown
): {
  message: string | null;
  code: string | null;
} {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      message:
        null,

      code:
        null,
    };
  }

  const record =
    body as Record<string, unknown>;

  const directMessage =
    getRecordString(
      record,
      "message"
    );

  const directCode =
    getRecordString(
      record,
      "code"
    );

  if (directMessage || directCode) {
    return {
      message:
        directMessage,

      code:
        directCode,
    };
  }

  const error =
    record.error;

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const errorRecord =
      error as Record<string, unknown>;

    return {
      message:
        getRecordString(
          errorRecord,
          "message"
        ),

      code:
        getRecordString(
          errorRecord,
          "code"
        ),
    };
  }

  return {
    message:
      null,

    code:
      null,
  };
}

async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as unknown;
  } catch {
    return text;
  }
}

async function postAuthenticationJson<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const response =
    await fetch(
      buildAuthenticationUrl(
        path
      ),
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        credentials:
          "include",

        body:
          JSON.stringify(
            body
          ),
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getErrorMessageFromBody(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Authentication request failed. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  return responseBody as TResponse;
}

async function postAuthenticationLogin(
  body: Record<string, unknown>
): Promise<LoginResponse> {
  const response =
    await fetch(
      buildAuthenticationUrl(
        "/login"
      ),
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        credentials:
          "include",

        body:
          JSON.stringify(
            body
          ),
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getErrorMessageFromBody(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Authentication request failed. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  const accessToken =
    response.headers.get(
      AUTHENTICATION_ACCESS_TOKEN_HEADER
    );

  const accessTokenExpiresAt =
    response.headers.get(
      AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER
    );

  if (
    !accessToken ||
    !accessTokenExpiresAt
  ) {
    throw new AuthenticationApiError(
      "The authentication response did not include an access token.",
      response.status,
      null
    );
  }

  return {
    ...(responseBody as Omit<
      LoginResponse,
      | "accessToken"
      | "accessTokenExpiresAt"
    >),

    accessToken,

    accessTokenExpiresAt,
  };
}

async function postAuthenticationRefreshSession(): Promise<RefreshSessionResponse> {
  const response =
    await fetch(
      buildAuthenticationUrl(
        "/refresh"
      ),
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",
        },

        credentials:
          "include",
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getErrorMessageFromBody(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Authentication session refresh failed. Please sign in again.",
      response.status,
      errorDetails.code
    );
  }

  const accessToken =
    response.headers.get(
      AUTHENTICATION_ACCESS_TOKEN_HEADER
    );

  const accessTokenExpiresAt =
    response.headers.get(
      AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER
    );

  if (
    !accessToken ||
    !accessTokenExpiresAt
  ) {
    throw new AuthenticationApiError(
      "The refresh response did not include an access token.",
      response.status,
      null
    );
  }

  return {
    ...(responseBody as Omit<
      RefreshSessionResponse,
      | "accessToken"
      | "accessTokenExpiresAt"
    >),

    accessToken,

    accessTokenExpiresAt,
  };
}

async function postAuthenticationLogout(): Promise<void> {
  const response =
    await fetch(
      buildAuthenticationUrl(
        "/logout"
      ),
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",
        },

        credentials:
          "include",
      }
    );

  if (response.ok) {
    return;
  }

  const responseBody =
    await readJsonResponse(
      response
    );

  const errorDetails =
    getErrorMessageFromBody(
      responseBody
    );

  throw new AuthenticationApiError(
    errorDetails.message ??
      "Poster could not complete logout. Your local session was cleared.",
    response.status,
    errorDetails.code
  );
}


async function deleteAuthenticationAccount(
  accessToken: string | null
): Promise<void> {
  const normalizedAccessToken =
    accessToken?.trim() ?? "";

  if (
    !normalizedAccessToken
  ) {
    throw new AuthenticationApiError(
      "Sign in again to delete your account.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  const response =
    await fetch(
      buildAuthenticationUrl(
        "/account"
      ),
      {
        method:
          "DELETE",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${normalizedAccessToken}`,
        },

        credentials:
          "include",
      }
    );

  if (
    response.ok
  ) {
    return;
  }

  const responseBody =
    await readJsonResponse(
      response
    );

  const errorDetails =
    getErrorMessageFromBody(
      responseBody
    );

  throw new AuthenticationApiError(
    errorDetails.message ??
      "Poster could not delete your account. Please try again.",
    response.status,
    errorDetails.code
  );
}

async function ensureSecureStorageAvailable(): Promise<void> {
  const available =
    await SecureStore.isAvailableAsync();

  if (!available) {
    throw new Error(
      "Secure authentication storage is unavailable on this platform."
    );
  }
}

class AuthService {
  private mutationQueue:
    Promise<void> =
    Promise.resolve();

  private runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      this.mutationQueue.then(
        mutation
      );

    this.mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  async refreshSession(): Promise<RefreshSessionResponse> {
    const result =
      await postAuthenticationRefreshSession();

    await this.saveAccessSession({
      accessToken:
        result.accessToken,

      accessTokenExpiresAt:
        result.accessTokenExpiresAt,
    });

    return result;
  }

  async logout(): Promise<void> {
    try {
      await postAuthenticationLogout();
    } finally {
      await this.clearSession();
    }
  }

  async deleteAccount(): Promise<void> {
    const accessToken =
      await this.getAccessToken();

    try {
      await deleteAuthenticationAccount(
        accessToken
      );
    } finally {
      await this.clearSession();
    }
  }

  async requestPasswordReset(
    input: RequestPasswordResetInput
  ): Promise<RequestPasswordResetResponse> {
    return postAuthenticationJson<RequestPasswordResetResponse>(
      "/password-reset/request",
      {
        email:
          normalizeEmail(
            input.email
          ),
      }
    );
  }

  async confirmPasswordReset(
    input: ConfirmPasswordResetInput
  ): Promise<ConfirmPasswordResetResponse> {
    return postAuthenticationJson<ConfirmPasswordResetResponse>(
      "/password-reset/confirm",
      {
        email:
          normalizeEmail(
            input.email
          ),

        code:
          normalizeRequiredText(
            input.code
          ),

        password:
          input.password,
      }
    );
  }

  async login(
    input: LoginInput
  ): Promise<LoginResponse> {
    const result =
      await postAuthenticationLogin({
        email:
          normalizeEmail(
            input.email
          ),

        password:
          input.password,
      });

    await this.saveAccessSession({
      accessToken:
        result.accessToken,

      accessTokenExpiresAt:
        result.accessTokenExpiresAt,
    });

    return result;
  }

  async signup(
    input: SignupInput
  ): Promise<SignupResponse> {
    return postAuthenticationJson<SignupResponse>(
      "/signup",
      {
        fullName:
          normalizeRequiredText(
            input.fullName
          ),

        email:
          normalizeEmail(
            input.email
          ),

        password:
          input.password,
      }
    );
  }

  async verifySignupEmail(
    input: SignupVerificationInput
  ): Promise<SignupVerificationResponse> {
    return postAuthenticationJson<SignupVerificationResponse>(
      "/signup/verify",
      {
        email:
          normalizeEmail(
            input.email
          ),

        code:
          normalizeRequiredText(
            input.code
          ),
      }
    );
  }

  async resendSignupVerification(
    input: SignupVerificationResendInput
  ): Promise<SignupResponse> {
    return postAuthenticationJson<SignupResponse>(
      "/signup/resend",
      {
        email:
          normalizeEmail(
            input.email
          ),
      }
    );
  }

  private async saveAccessSession(
    tokens: AccessSessionTokens
  ): Promise<void> {
    const accessToken =
      normalizeToken(
        tokens.accessToken
      );

    const accessTokenExpiresAt =
      normalizeRequiredText(
        tokens.accessTokenExpiresAt
      );

    if (
      !accessToken ||
      !accessTokenExpiresAt
    ) {
      throw new Error(
        "A valid access token and expiry are required."
      );
    }

    await this.runMutation(
      async () => {
        await ensureSecureStorageAvailable();

        try {
          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN,
            accessToken,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );

          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
            accessTokenExpiresAt,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );

          await SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.REFRESH_TOKEN
          );
        } catch (error) {
          await Promise.allSettled([
            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.ACCESS_TOKEN
            ),

            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT
            ),
          ]);

          throw error;
        }
      }
    );
  }

  async saveTokens(
    tokens: AuthTokens
  ): Promise<void> {
    const accessToken =
      normalizeToken(
        tokens.accessToken
      );

    const refreshToken =
      normalizeToken(
        tokens.refreshToken
      );

    if (
      !accessToken ||
      !refreshToken
    ) {
      throw new Error(
        "Valid access and refresh tokens are required."
      );
    }

    await this.runMutation(
      async () => {
        await ensureSecureStorageAvailable();

        try {
          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN,
            accessToken,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );

          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.REFRESH_TOKEN,
            refreshToken,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );
        } catch (error) {
          await Promise.allSettled([
            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.ACCESS_TOKEN
            ),

            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.REFRESH_TOKEN
            ),
          ]);

          throw error;
        }
      }
    );
  }

  async getAccessToken(): Promise<
    string | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    return SecureStore.getItemAsync(
      AUTH_STORAGE_KEYS.ACCESS_TOKEN
    );
  }

  async getAccessTokenExpiresAt(): Promise<
    string | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    return SecureStore.getItemAsync(
      AUTH_STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT
    );
  }

  async getRefreshToken(): Promise<
    string | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    return SecureStore.getItemAsync(
      AUTH_STORAGE_KEYS.REFRESH_TOKEN
    );
  }

  async getTokens(): Promise<
    AuthTokens | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    const [
      accessToken,
      refreshToken,
    ] = await Promise.all([
      SecureStore.getItemAsync(
        AUTH_STORAGE_KEYS.ACCESS_TOKEN
      ),

      SecureStore.getItemAsync(
        AUTH_STORAGE_KEYS.REFRESH_TOKEN
      ),
    ]);

    if (
      !accessToken ||
      !refreshToken
    ) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async hasSession(): Promise<boolean> {
    const accessToken =
      await this.getAccessToken();

    return accessToken !== null;
  }

  async clearSession(): Promise<void> {
    await this.runMutation(
      async () => {
        await ensureSecureStorageAvailable();

        await Promise.all([
          SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN
          ),

          SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT
          ),

          SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.REFRESH_TOKEN
          ),
        ]);
      }
    );
  }
}

export default new AuthService();
