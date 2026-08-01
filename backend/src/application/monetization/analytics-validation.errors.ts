export type AnalyticsValidationErrorCode =
  | "ANALYTICS_EVENT_NOT_FOUND"
  | "ANALYTICS_VALIDATION_NOT_FOUND"
  | "ANALYTICS_VALIDATION_ALREADY_COMPLETED"
  | "ANALYTICS_VALIDATION_VERSION_CONFLICT";

export class AnalyticsValidationError
  extends Error {
  readonly code:
    AnalyticsValidationErrorCode;

  constructor(
    code:
      AnalyticsValidationErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "AnalyticsValidationError";

    this.code =
      code;
  }
}