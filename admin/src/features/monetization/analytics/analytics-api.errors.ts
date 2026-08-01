export class AnalyticsApiError
  extends Error {
  readonly status:
    number |
    null;

  readonly code:
    string |
    null;

  constructor(
    message: string,
    status:
      number |
      null =
      null,
    code:
      string |
      null =
      null
  ) {
    super(
      message
    );

    this.name =
      "AnalyticsApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

function readErrorCode(
  value: unknown
): string |
  null {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return null;
  }

  const error =
    "error" in value
      ? value.error
      : null;

  if (
    typeof error !==
      "object" ||
    error ===
      null ||
    !(
      "code" in error
    ) ||
    typeof error.code !==
      "string"
  ) {
    return null;
  }

  return error.code;
}

export async function createAnalyticsApiError(
  response:
    Response
): Promise<AnalyticsApiError> {
  let body:
    unknown =
    null;

  try {
    body =
      await response.json();
  } catch {
    body =
      null;
  }

  const code =
    readErrorCode(
      body
    );

  let message =
    `The Analytics request failed (${response.status}).`;

  switch (
    response.status
  ) {
    case 400:
      message =
        "The Analytics filters are invalid.";
      break;

    case 401:
      message =
        "Your Admin session has expired. Sign in again.";
      break;

    case 403:
      message =
        "You do not have permission to view Monetization Analytics.";
      break;

    case 422:
      message =
        code ===
          "ANALYTICS_DATE_RANGE_TOO_LARGE"
          ? "The Analytics date range cannot exceed 366 days."
          : "The selected Analytics date range is not valid.";
      break;

    case 500:
      message =
        "Monetization Analytics are temporarily unavailable.";
      break;
  }

  return new AnalyticsApiError(
    message,
    response.status,
    code
  );
}

export function getAnalyticsErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
      AnalyticsApiError ||
    error instanceof
      TypeError
  ) {
    return error.message;
  }

  if (
    error instanceof
      Error &&
    error.message
  ) {
    return error.message;
  }

  return "Monetization Analytics could not be loaded.";
}