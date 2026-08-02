import type {
  PosterPromotionValidationIssue,
} from "../../domains/monetization/index.js";

export type PosterPromotionErrorCode =
  | "POSTER_PROMOTION_VALIDATION_FAILED"
  | "POSTER_PROMOTION_NOT_FOUND"
  | "POSTER_PROMOTION_CAMPAIGN_TYPE_MISMATCH"
  | "POSTER_PROMOTION_TERMINAL"
  | "POSTER_PROMOTION_CAMPAIGN_CONFLICT"
  | "POSTER_PROMOTION_CREATIVE_CONFLICT";

export class PosterPromotionError
  extends Error {
  readonly code:
    PosterPromotionErrorCode;

  readonly statusCode:
    number;

  readonly issues:
    readonly PosterPromotionValidationIssue[];

  constructor(
    input: {
      code:
        PosterPromotionErrorCode;

      message:
        string;

      statusCode:
        number;

      issues?:
        readonly PosterPromotionValidationIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "PosterPromotionError";

    this.code =
      input.code;

    this.statusCode =
      input.statusCode;

    this.issues =
      input.issues ??
      [];
  }
}

export function createPosterPromotionValidationError(
  issues:
    readonly PosterPromotionValidationIssue[]
): PosterPromotionError {
  return new PosterPromotionError({
    code:
      "POSTER_PROMOTION_VALIDATION_FAILED",

    message:
      "Poster Promotion validation failed.",

    statusCode:
      400,

    issues,
  });
}