import type {
  AffiliateApiIssue,
} from "./affiliate.types";

export class AffiliateRequestError
  extends Error {
  readonly code:
    string;

  readonly status:
    number;

  readonly requestId:
    string | null;

  readonly issues:
    readonly AffiliateApiIssue[];

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
        readonly AffiliateApiIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "AffiliateRequestError";

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

export function getAffiliateErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    AffiliateRequestError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Affiliate campaigns could not be loaded.";
}