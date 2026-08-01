interface ApiErrorBody {
  error?: {
    code?: unknown;

    message?: unknown;
  };
}

export class ReportsApiError
  extends Error {
  readonly status: number;

  readonly code:
    string |
    null;

  constructor(
    message: string,
    status: number,
    code:
      string |
      null
  ) {
    super(
      message
    );

    this.name =
      "ReportsApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

export async function createReportsApiError(
  response: Response
): Promise<ReportsApiError> {
  let code:
    string |
    null =
      null;

  let message:
    string |
    null =
      null;

  try {
    const body =
      await response.json() as
        ApiErrorBody;

    if (
      typeof body
        .error
        ?.code ===
      "string"
    ) {
      code =
        body.error.code;
    }

    if (
      typeof body
        .error
        ?.message ===
      "string"
    ) {
      message =
        body.error.message;
    }
  } catch {
    // Use safe status-based fallbacks.
  }

  if (
    !message
  ) {
    if (
      response.status ===
      401
    ) {
      message =
        "Your Admin session has expired. Sign in again.";
    } else if (
      response.status ===
      403
    ) {
      message =
        "You do not have permission to access Reports.";
    } else if (
      response.status ===
      404
    ) {
      message =
        "The report or linked Copyright case could not be found.";
    } else if (
      response.status ===
      409
    ) {
      message =
        "The report changed. Refresh and retry.";
    } else if (
      response.status ===
      422
    ) {
      message =
        "This report action is not currently allowed.";
    } else {
      message =
        `The Reports request failed (${response.status}).`;
    }
  }

  return new ReportsApiError(
    message,
    response.status,
    code
  );
}

export function getReportsErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
      ReportsApiError
  ) {
    return error.message;
  }

  if (
    error instanceof
      Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return "The Reports request could not be completed.";
}