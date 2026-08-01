export type CopyrightApplicationErrorCode =
  | "COPYRIGHT_CASE_NOT_FOUND"
  | "COPYRIGHT_CASE_VERSION_CONFLICT"
  | "COPYRIGHT_CASE_STATE_CONFLICT"
  | "COPYRIGHT_CONTENT_NOT_FOUND"
  | "COPYRIGHT_CONTENT_VERSION_CONFLICT"
  | "COPYRIGHT_VERIFICATION_INCOMPLETE"
  | "COPYRIGHT_RESTORE_BLOCKED";

export class CopyrightApplicationError
  extends Error {
  readonly code:
    CopyrightApplicationErrorCode;

  constructor(
    code:
      CopyrightApplicationErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "CopyrightApplicationError";

    this.code =
      code;
  }
}