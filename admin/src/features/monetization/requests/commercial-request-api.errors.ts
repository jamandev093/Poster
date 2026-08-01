interface ApiErrorBody {
  error?: {
    code?: unknown;

    message?: unknown;

    currentStatus?: unknown;
  };
}

export class CommercialRequestApiError
  extends Error {
  readonly status: number;

  readonly code:
    string |
    null;

  readonly currentStatus:
    string |
    null;

  constructor(
    input: {
      message: string;

      status: number;

      code:
        string |
        null;

      currentStatus?:
        string |
        null;
    }
  ) {
    super(
      input.message
    );

    this.name =
      "CommercialRequestApiError";

    this.status =
      input.status;

    this.code =
      input.code;

    this.currentStatus =
      input.currentStatus ??
      null;
  }
}

export async function createCommercialRequestApiError(
  response: Response
): Promise<CommercialRequestApiError> {
  let code:
    string |
    null =
      null;

  let message:
    string |
    null =
      null;

  let currentStatus:
    string |
    null =
      null;

  try {
    const body =
      await response.json() as
        ApiErrorBody;

    if (
      typeof body.error
        ?.code ===
      "string"
    ) {
      code =
        body.error.code;
    }

    if (
      typeof body.error
        ?.message ===
      "string"
    ) {
      message =
        body.error.message;
    }

    if (
      typeof body.error
        ?.currentStatus ===
      "string"
    ) {
      currentStatus =
        body.error.currentStatus;
    }
  } catch {
    // Use safe status-based fallbacks.
  }

  if (
    !message
  ) {
    switch (
      response.status
    ) {
      case 401:
        message =
          "Your Admin session has expired. Sign in again.";
        break;

      case 403:
        message =
          "You do not have permission to review advertising requests.";
        break;

      case 404:
        message =
          "The advertising request was not found.";
        break;

      case 409:
        message =
          "The advertising request changed or cannot be reviewed in its current state.";
        break;

      default:
        message =
          `The advertising-request operation failed (${response.status}).`;
    }
  }

  return new CommercialRequestApiError({
    message,
    status:
      response.status,
    code,
    currentStatus,
  });
}

export function getCommercialRequestErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
      Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "The advertising-request operation could not be completed.";
}