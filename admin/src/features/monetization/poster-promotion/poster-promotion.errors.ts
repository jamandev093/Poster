import type {
  PosterPromotionApiIssue,
} from "./poster-promotion.api-types";

export class PosterPromotionRequestError
  extends Error {
  readonly code:
    string;

  readonly status:
    number;

  readonly requestId:
    string | null;

  readonly issues:
    readonly PosterPromotionApiIssue[];

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
        readonly PosterPromotionApiIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "PosterPromotionRequestError";

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

export function getPosterPromotionErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    PosterPromotionRequestError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "The Poster Promotion request could not be completed.";
}