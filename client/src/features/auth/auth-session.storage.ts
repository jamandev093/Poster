const ACCESS_TOKEN_STORAGE_KEY =
  "poster-client-access-token";

const ACCESS_TOKEN_EXPIRES_STORAGE_KEY =
  "poster-client-access-token-expires-at";

function canUseBrowserStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function getStoredAuthenticationAccessToken():
  string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const token =
    window.localStorage
      .getItem(
        ACCESS_TOKEN_STORAGE_KEY
      )
      ?.trim();

  return token || null;
}

export function storeAuthenticationAccessToken(
  accessToken:
    string | null,
  expiresAt?:
    string | null
): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (!accessToken?.trim()) {
    clearStoredAuthenticationSession();
    return;
  }

  window.localStorage.setItem(
    ACCESS_TOKEN_STORAGE_KEY,
    accessToken.trim()
  );

  if (expiresAt?.trim()) {
    window.localStorage.setItem(
      ACCESS_TOKEN_EXPIRES_STORAGE_KEY,
      expiresAt.trim()
    );
  } else {
    window.localStorage.removeItem(
      ACCESS_TOKEN_EXPIRES_STORAGE_KEY
    );
  }
}

export function clearStoredAuthenticationSession():
  void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(
    ACCESS_TOKEN_STORAGE_KEY
  );

  window.localStorage.removeItem(
    ACCESS_TOKEN_EXPIRES_STORAGE_KEY
  );
}