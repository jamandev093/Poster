import type {
  AffiliateValidationIssue,
} from "../../domains/monetization/index.js";

export type AffiliateErrorCode =
  | "AFFILIATE_METADATA_INVALID"
  | "AFFILIATE_CAMPAIGN_NOT_FOUND"
  | "AFFILIATE_METADATA_NOT_FOUND"
  | "AFFILIATE_CAMPAIGN_TYPE_MISMATCH"
  | "AFFILIATE_METADATA_EXISTS"
  | "AFFILIATE_METADATA_VERSION_CONFLICT";

export class AffiliateError
  extends Error {
  readonly code:
    AffiliateErrorCode;

  readonly statusCode:
    number;

  readonly issues:
    readonly AffiliateValidationIssue[];

  constructor(
    code:
      AffiliateErrorCode,
    message:
      string,
    issues:
      readonly AffiliateValidationIssue[] =
      []
  ) {
    super(
      message
    );

    this.name =
      "AffiliateError";

    this.code =
      code;

    this.issues =
      issues;

    this.statusCode =
      code ===
        "AFFILIATE_METADATA_INVALID"
        ? 400
        : code ===
          "AFFILIATE_CAMPAIGN_NOT_FOUND" ||
          code ===
          "AFFILIATE_METADATA_NOT_FOUND"
        ? 404
        : 409;
  }
}