import * as SecureStore from "expo-secure-store";

declare const process: {
  env?: {
    EXPO_PUBLIC_POSTER_API_BASE_URL?: string;
  };
};

const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN:
    "poster.auth.access-token",

  REFRESH_TOKEN:
    "poster.auth.refresh-token",
} as const;

const DEFAULT_POSTER_API_BASE_URL =
  "http://localhost:4000";

const API_VERSION_PREFIX =
  "/api/v1";

export interface AuthTokens {
  accessToken: string;

  refreshToken: string;
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
    const tokens =
      await this.getTokens();

    return tokens !== null;
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
            AUTH_STORAGE_KEYS.REFRESH_TOKEN
          ),
        ]);
      }
    );
  }
}

export default new AuthService();
