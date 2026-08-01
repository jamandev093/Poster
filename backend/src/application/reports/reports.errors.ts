export type ReportsApplicationErrorCode =
  | "REPORT_NOT_FOUND"
  | "REPORT_VERSION_CONFLICT"
  | "REPORT_STATE_CONFLICT"
  | "REPORT_COPYRIGHT_TYPE_REQUIRED"
  | "REPORT_COPYRIGHT_CASE_NOT_FOUND"
  | "REPORT_COPYRIGHT_CONTENT_MISMATCH"
  | "REPORT_COPYRIGHT_ALREADY_ROUTED";

export class ReportsApplicationError
  extends Error {
  readonly code:
    ReportsApplicationErrorCode;

  constructor(
    code:
      ReportsApplicationErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "ReportsApplicationError";

    this.code =
      code;
  }
}