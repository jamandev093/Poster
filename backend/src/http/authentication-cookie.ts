import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

/**
 * Host-only refresh-token cookie.
 *
 * No Domain attribute is added. The browser therefore limits
 * the cookie to the API host that issued it.
 */
export const AUTHENTICATION_REFRESH_COOKIE_NAME =
  "poster_refresh";

/**
 * Restricts the refresh token to authentication endpoints.
 *
 * The cookie is not sent to content, analytics, campaign,
 * payment, copyright, or other unrelated API routes.
 */
export const AUTHENTICATION_REFRESH_COOKIE_PATH =
  "/api/v1/auth";

export interface SetAuthenticationRefreshCookieOptions {
  expiresAt: Date;

  /**
   * Production cookies require HTTPS.
   *
   * Local development remains usable over localhost HTTP.
   */
  isProduction: boolean;
}

function createAuthenticationRefreshCookieOptions(
  isProduction: boolean
) {
  return {
    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      "strict" as const,

    path:
      AUTHENTICATION_REFRESH_COOKIE_PATH,
  };
}

/**
 * Places one opaque refresh token into a protected browser
 * cookie.
 *
 * The raw token must never be logged or persisted directly.
 * PostgreSQL stores only the token digest through the existing
 * login and session service.
 */
export function setAuthenticationRefreshCookie(
  reply:
    FastifyReply,
  refreshToken:
    string,
  options:
    SetAuthenticationRefreshCookieOptions
): void {
  const normalizedRefreshToken =
    refreshToken.trim();

  if (
    normalizedRefreshToken.length ===
    0
  ) {
    throw new Error(
      "Authentication refresh token must not be empty."
    );
  }

  const expiryMilliseconds =
    options.expiresAt.getTime();

  if (
    !Number.isFinite(
      expiryMilliseconds
    ) ||
    expiryMilliseconds <=
      Date.now()
  ) {
    throw new Error(
      "Authentication refresh-cookie expiry must be a valid future date."
    );
  }

  reply.setCookie(
    AUTHENTICATION_REFRESH_COOKIE_NAME,
    normalizedRefreshToken,
    {
      ...createAuthenticationRefreshCookieOptions(
        options.isProduction
      ),

      expires:
        new Date(
          expiryMilliseconds
        ),
    }
  );
}

/**
 * Removes the browser refresh-token cookie.
 *
 * The same name, path, and security attributes used when
 * setting the cookie are supplied when clearing it.
 */
export function clearAuthenticationRefreshCookie(
  reply:
    FastifyReply,
  isProduction:
    boolean
): void {
  reply.clearCookie(
    AUTHENTICATION_REFRESH_COOKIE_NAME,
    createAuthenticationRefreshCookieOptions(
      isProduction
    )
  );
}

/**
 * Reads the opaque refresh token parsed by @fastify/cookie.
 *
 * Missing, non-string, and blank values are normalized to
 * null. No verification is performed here; the session
 * service remains authoritative.
 */
export function readAuthenticationRefreshToken(
  request:
    FastifyRequest
): string | null {
  const refreshToken =
    request.cookies[
      AUTHENTICATION_REFRESH_COOKIE_NAME
    ];

  if (
    typeof refreshToken !==
    "string"
  ) {
    return null;
  }

  const normalizedRefreshToken =
    refreshToken.trim();

  return normalizedRefreshToken.length >
    0
    ? normalizedRefreshToken
    : null;
}
