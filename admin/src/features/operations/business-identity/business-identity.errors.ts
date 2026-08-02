import type {
  BusinessIdentityApiIssue,
} from "./business-identity.types";

export class BusinessIdentityRequestError
  extends Error {
  readonly code:
    string;

  readonly status:
    number;

  readonly requestId:
    string | null;

  readonly issues:
    readonly BusinessIdentityApiIssue[];

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
        readonly BusinessIdentityApiIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "BusinessIdentityRequestError";

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

export function getBusinessIdentityErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    BusinessIdentityRequestError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Business identity could not be loaded.";
}