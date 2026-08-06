import type {
  LookupPublicCopyrightContentMatchesInput,
  LookupPublicCopyrightStatusInput,
  PublicCopyrightBulkRequest,
  PublicCopyrightBulkRequestResponse,
  PublicCopyrightClaim,
  PublicCopyrightClaimResponse,
  PublicCopyrightContentMatchLookup,
  PublicCopyrightContentMatchResponse,
  PublicCopyrightErrorBody,
  PublicCopyrightStatus,
  PublicCopyrightStatusResponse,
  SubmitPublicBulkCopyrightRequestInput,
  SubmitPublicCopyrightClaimInput,
} from "./public-copyright.types";

const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_POSTER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).trim();

function createApiUrl(
  path: string
): string {
  if (
    API_BASE_URL.length ===
    0
  ) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

export class PublicCopyrightClaimError
  extends Error {
  readonly code:
    string;

  readonly issues:
    string[];

  readonly requestId:
    string |
    null;

  constructor(
    message: string,
    code:
      string = "COPYRIGHT_REQUEST_FAILED",
    issues:
      string[] = [],
    requestId:
      string |
      null = null
  ) {
    super(message);

    this.name =
      "PublicCopyrightClaimError";

    this.code =
      code;

    this.issues =
      issues;

    this.requestId =
      requestId;
  }
}

async function readJsonBody(
  response:
    Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readErrorMessage(
  body: unknown,
  fallback: string
): PublicCopyrightClaimError {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return new PublicCopyrightClaimError(
      fallback
    );
  }

  const parsed =
    body as PublicCopyrightErrorBody;

  const message =
    parsed.error?.message ??
    fallback;

  return new PublicCopyrightClaimError(
    message,
    parsed.error?.code,
    parsed.error?.issues ?? [],
    parsed.error?.requestId ?? null
  );
}

export async function submitPublicCopyrightClaim(
  input:
    SubmitPublicCopyrightClaimInput
): Promise<
  PublicCopyrightClaim
> {
  const response =
    await fetch(
      createApiUrl(
        "/api/v1/public/copyright/claims"
      ),
      {
        method:
          "POST",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  const body =
    await readJsonBody(
      response
    );

  if (
    !response.ok
  ) {
    throw readErrorMessage(
      body,
      "The copyright claim could not be submitted. Please review the form and try again."
    );
  }

  const parsed =
    body as PublicCopyrightClaimResponse;

  if (
    !parsed.claim ||
    typeof parsed.claim.reference !==
      "string"
  ) {
    throw new PublicCopyrightClaimError(
      "Poster returned an invalid copyright claim response."
    );
  }

  return parsed.claim;
}

export async function submitPublicBulkRemoval(
  input:
    SubmitPublicBulkCopyrightRequestInput
): Promise<
  PublicCopyrightBulkRequest
> {
  const response =
    await fetch(
      createApiUrl(
        "/api/v1/public/copyright/bulk-removal"
      ),
      {
        method:
          "POST",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  const body =
    await readJsonBody(
      response
    );

  if (
    !response.ok
  ) {
    throw readErrorMessage(
      body,
      "The bulk copyright request could not be submitted. Please review the form and try again."
    );
  }

  const parsed =
    body as PublicCopyrightBulkRequestResponse;

  if (
    !parsed.bulkRequest ||
    typeof parsed.bulkRequest.reference !==
      "string"
  ) {
    throw new PublicCopyrightClaimError(
      "Poster returned an invalid bulk copyright response."
    );
  }

  return parsed.bulkRequest;
}

export async function lookupPublicCopyrightStatus(
  input:
    LookupPublicCopyrightStatusInput
): Promise<
  PublicCopyrightStatus
> {
  const response =
    await fetch(
      createApiUrl(
        "/api/v1/public/copyright/status"
      ),
      {
        method:
          "POST",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  const body =
    await readJsonBody(
      response
    );

  if (
    !response.ok
  ) {
    throw readErrorMessage(
      body,
      "No matching copyright request was found with those details."
    );
  }

  const parsed =
    body as PublicCopyrightStatusResponse;

  if (
    !parsed.status ||
    typeof parsed.status.reference !==
      "string"
  ) {
    throw new PublicCopyrightClaimError(
      "Poster returned an invalid copyright status response."
    );
  }

  return parsed.status;
}

export async function lookupPublicCopyrightContentMatches(
  input:
    LookupPublicCopyrightContentMatchesInput
): Promise<
  PublicCopyrightContentMatchLookup
> {
  const response =
    await fetch(
      createApiUrl(
        "/api/v1/public/copyright/content-match"
      ),
      {
        method:
          "POST",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify(
            input
          ),
      }
    );

  const body =
    await readJsonBody(
      response
    );

  if (
    !response.ok
  ) {
    throw readErrorMessage(
      body,
      "The content match lookup could not be completed. Please review the identifiers and try again."
    );
  }

  const parsed =
    body as PublicCopyrightContentMatchResponse;

  if (
    !parsed.match ||
    !Array.isArray(
      parsed.match.results
    ) ||
    !parsed.match.counts
  ) {
    throw new PublicCopyrightClaimError(
      "Poster returned an invalid content match response."
    );
  }

  return parsed.match;
}