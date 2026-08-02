import type {
  PublicBusinessIdentity,
  PublicBusinessIdentityResponse,
} from "./public-business-identity.types";

const API_BASE_URL =
  (
    process.env.POSTER_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_POSTER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).trim();

function createPublicBusinessIdentityUrl(): string | null {
  if (
    API_BASE_URL.length ===
    0
  ) {
    return null;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/public/business-identity`;
}

export async function getPublicBusinessIdentity(): Promise<
  PublicBusinessIdentity | null
> {
  const url =
    createPublicBusinessIdentityUrl();

  if (
    !url
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        url,
        {
          cache:
            "no-store",

          headers: {
            accept:
              "application/json",
          },
        }
      );

    if (
      !response.ok
    ) {
      return null;
    }

    const body =
      await response.json() as
        PublicBusinessIdentityResponse;

    return body.identity;
  } catch {
    return null;
  }
}