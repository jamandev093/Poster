import {
  getStoredAuthenticationAccessToken,
} from "@/features/auth/auth-session.storage";
export interface PosterApiErrorPayload {
  message?:
    string;

  error?:
    string |
    {
      code?:
        string;

      message?:
        string;
    };
}

export class PosterApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "PosterApiRequestError";
  }
}

export function getPosterApiBaseUrl():
  string {
  const configuredBaseUrl =
    process.env
      .NEXT_PUBLIC_POSTER_API_BASE_URL
      ?.trim();

  if (!configuredBaseUrl) {
    throw new Error(
      "Poster API is not configured. Set NEXT_PUBLIC_POSTER_API_BASE_URL."
    );
  }

  return configuredBaseUrl.replace(
    /\/+$/,
    ""
  );
}

function createPosterApiUrl(
  path: string,
  query?:
    Record<
      string,
      string | number | boolean | null | undefined
    >
): string {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url =
    new URL(
      `${getPosterApiBaseUrl()}${normalizedPath}`
    );

  if (query) {
    for (const [
      key,
      value,
    ] of Object.entries(query)) {
      if (
        value !== undefined &&
        value !== null
      ) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }
  }

  return url.toString();
}

async function readPosterApiError(
  response: Response
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
      "The Poster API request could not be completed."
    );
  } catch {
    return "The Poster API request could not be completed.";
  }
}

export async function requestPosterApiJson<ResponseBody>(
  path: string,
  init: RequestInit = {},
  query?:
    Record<
      string,
      string | number | boolean | null | undefined
    >
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

  if (!headers.has("Authorization")) {
    const accessToken =
      getStoredAuthenticationAccessToken();

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }
  }

  const response =
    await fetch(
      createPosterApiUrl(
        path,
        query
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
      await readPosterApiError(
        response
      ),
      response.status
    );
  }

  return await response.json() as ResponseBody;
}