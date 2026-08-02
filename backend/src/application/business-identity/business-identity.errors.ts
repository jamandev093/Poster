import type {
  BusinessIdentityValidationIssue,
} from "../../domains/business-identity/index.js";

export type BusinessIdentityErrorCode =
  | "BUSINESS_IDENTITY_NOT_FOUND"
  | "BUSINESS_IDENTITY_INVALID"
  | "BUSINESS_IDENTITY_VERSION_CONFLICT";

export class BusinessIdentityError
  extends Error {
  readonly code:
    BusinessIdentityErrorCode;

  readonly statusCode:
    number;

  readonly issues:
    readonly BusinessIdentityValidationIssue[];

  constructor(
    input: {
      code:
        BusinessIdentityErrorCode;

      message:
        string;

      statusCode:
        number;

      issues?:
        readonly BusinessIdentityValidationIssue[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "BusinessIdentityError";

    this.code =
      input.code;

    this.statusCode =
      input.statusCode;

    this.issues =
      input.issues ??
      [];
  }
}