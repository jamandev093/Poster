import type {
  ProgrammaticValidationIssue,
} from "../../domains/monetization/index.js";

export type ProgrammaticErrorCode =
  | "PROGRAMMATIC_PROVIDER_INVALID"
  | "PROGRAMMATIC_SLOT_MAPPING_INVALID";

export class ProgrammaticError
  extends Error {
  readonly code:
    ProgrammaticErrorCode;

  readonly statusCode:
    number;

  readonly issues:
    readonly ProgrammaticValidationIssue[];

  constructor(
    code:
      ProgrammaticErrorCode,
    message:
      string,
    issues:
      readonly ProgrammaticValidationIssue[]
  ) {
    super(
      message
    );

    this.name =
      "ProgrammaticError";

    this.code =
      code;

    this.statusCode =
      400;

    this.issues =
      issues;
  }
}