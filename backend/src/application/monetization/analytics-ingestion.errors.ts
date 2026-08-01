export type AnalyticsIngestionErrorCode =
  | "ANALYTICS_CAMPAIGN_NOT_FOUND"
  | "ANALYTICS_CAMPAIGN_NOT_ELIGIBLE"
  | "ANALYTICS_PLACEMENT_NOT_ALLOWED"
  | "ANALYTICS_EVENT_TIME_INVALID"
  | "ANALYTICS_EVENT_KEY_CONFLICT"
  | "ANALYTICS_EVENT_CREATION_FAILED";

export class AnalyticsIngestionError
  extends Error {
  readonly code:
    AnalyticsIngestionErrorCode;

  constructor(
    code:
      AnalyticsIngestionErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "AnalyticsIngestionError";

    this.code =
      code;
  }
}