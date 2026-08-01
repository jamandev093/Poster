import type {
  ApiErrorEnvelope,
} from "./content-sources.types";

export function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

export function isNullableString(
  value: unknown
): value is string | null {
  return (
    value === null ||
    typeof value === "string"
  );
}

export function isIsoTimestamp(
  value: unknown
): value is string {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  return Number.isFinite(
    new Date(
      value
    ).getTime()
  );
}

export function isNullableIsoTimestamp(
  value: unknown
): value is string | null {
  return (
    value === null ||
    isIsoTimestamp(
      value
    )
  );
}

export function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(
      value
    ) &&
    value >= 0
  );
}

export async function readApiErrorMessage(
  response: Response,
  fallbackLabel: string
): Promise<string> {
  try {
    const body =
      await response.json() as ApiErrorEnvelope;

    if (
      body.error?.message
    ) {
      return body.error.message;
    }

    if (
      body.error?.code
    ) {
      return `Request failed: ${body.error.code}.`;
    }
  } catch {
    // Use status fallback.
  }

  if (
    response.status === 401
  ) {
    return "Your Admin session has expired. Sign in again.";
  }

  if (
    response.status === 403
  ) {
    return `You do not have permission to ${fallbackLabel}.`;
  }

  if (
    response.status === 409
  ) {
    return "This record changed before the action completed. Refresh and retry.";
  }

  return `${fallbackLabel} failed (${response.status}).`;
}