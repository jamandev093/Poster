interface ApiErrorBody {
  error?: {
    code?: unknown;

    message?: unknown;
  };
}

export class CopyrightApiError
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
      "CopyrightApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

export async function createCopyrightApiError(
  response: Response
): Promise<CopyrightApiError> {
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
        "You do not have permission to access this Copyright workflow.";
    } else if (
      response.status ===
      404
    ) {
      message =
        "The Copyright case could not be found.";
    } else if (
      response.status ===
      409
    ) {
      message =
        "The Copyright case changed. Refresh and retry.";
    } else if (
      response.status ===
      422
    ) {
      message =
        "This Copyright action is not currently allowed.";
    } else {
      message =
        `The Copyright request failed (${response.status}).`;
    }
  }

  return new CopyrightApiError(
    message,
    response.status,
    code
  );
}