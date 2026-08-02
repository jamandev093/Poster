import type {
  ProgrammaticApiIssue,
} from "./programmatic.types";

export class ProgrammaticRequestError
  extends Error {
  readonly code:
    string;

  readonly status:
    number;

  readonly requestId:
    string | null;

  readonly issues:
    readonly ProgrammaticApiIssue[];

  constructor(
    input: {
      code:
        string;

      message:
        string;

      status:
        number;

      requestId?:
        string | null;

      issues?:
        readonly ProgrammaticApiIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "ProgrammaticRequestError";

    this.code =
      input.code;

    this.status =
      input.status;

    this.requestId =
      input.requestId ??
      null;

    this.issues =
      input.issues ??
      [];
  }
}

export function getProgrammaticErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    ProgrammaticRequestError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Programmatic controls could not be loaded.";
}