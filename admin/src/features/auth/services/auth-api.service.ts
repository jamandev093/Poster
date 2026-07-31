import type {
  AdminAccessResponse,
  AdminLoginInput,
  ApiErrorPayload,
  AuthenticationResponse,
} from "../contracts/auth.types";

const API_BASE_URL =
  process.env
    .NEXT_PUBLIC_POSTER_API_BASE_URL ??
  "http://localhost:4000/api/v1";

const ACCESS_TOKEN_HEADER =
  "x-poster-access-token";

const ACCESS_TOKEN_EXPIRES_HEADER =
  "x-poster-access-token-expires-at";

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      requestId?: string | null;
    }
  ) {
    super(message);

    this.name = "AdminApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId =
      options.requestId ?? null;
  }
}

interface AuthenticatedResponse {
  data: AuthenticationResponse;
  accessToken: string;
  accessTokenExpiresAt: string;
}

async function readError(
  response: Response
): Promise<AdminApiError> {
  let payload:
    | ApiErrorPayload
    | null = null;

  try {
    payload =
      (await response.json()) as
        ApiErrorPayload;
  } catch {
    payload = null;
  }

  return new AdminApiError(
    payload?.error.message ??
      "The request could not be completed.",
    {
      status: response.status,
      code:
        payload?.error.code ??
        "REQUEST_FAILED",
      requestId:
        payload?.error.requestId ??
        null,
    }
  );
}

function readAccessToken(
  response: Response
) {
  const accessToken =
    response.headers.get(
      ACCESS_TOKEN_HEADER
    );

  const accessTokenExpiresAt =
    response.headers.get(
      ACCESS_TOKEN_EXPIRES_HEADER
    );

  if (
    !accessToken ||
    !accessTokenExpiresAt
  ) {
    throw new AdminApiError(
      "The authentication response did not contain an access token.",
      {
        status: 500,
        code:
          "ACCESS_TOKEN_MISSING",
      }
    );
  }

  return {
    accessToken,
    accessTokenExpiresAt,
  };
}

async function authenticationRequest(
  path: "/auth/login" | "/auth/refresh",
  init: RequestInit
): Promise<AuthenticatedResponse> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(init.headers ?? {}),
      },
    }
  );

  if (!response.ok) {
    throw await readError(response);
  }

  const data =
    (await response.json()) as
      AuthenticationResponse;

  return {
    data,
    ...readAccessToken(response),
  };
}

export async function loginAdmin(
  input: AdminLoginInput
): Promise<AuthenticatedResponse> {
  return await authenticationRequest(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function refreshAdminSession():
  Promise<AuthenticatedResponse> {
  return await authenticationRequest(
    "/auth/refresh",
    {
      method: "POST",
    }
  );
}

export async function logoutAdmin():
  Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    }
  );

  if (
    !response.ok &&
    response.status !== 401
  ) {
    throw await readError(response);
  }
}

export async function loadAdminAccess(
  accessToken: string
): Promise<AdminAccessResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/access`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw await readError(response);
  }

  return await response.json() as
    AdminAccessResponse;
}
