import type {
  PublicBusinessIdentity,
  PublicBusinessIdentityResponse,
} from "./public-business-identity.types";

const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_POSTER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).trim();

function createPublicBusinessIdentityUrl(): string {
  const path =
    "/api/v1/public/business-identity";

  if (
    API_BASE_URL.length ===
    0
  ) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

export async function getPublicBusinessIdentity(): Promise<
  PublicBusinessIdentity | null
> {
  try {
    const response =
      await fetch(
        createPublicBusinessIdentityUrl(),
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