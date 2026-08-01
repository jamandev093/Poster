export type AdminAnalyticsErrorCode =
  | "ANALYTICS_DATE_RANGE_INVALID"
  | "ANALYTICS_DATE_RANGE_TOO_LARGE";

export class AdminAnalyticsError
  extends Error {
  readonly code:
    AdminAnalyticsErrorCode;

  constructor(
    code:
      AdminAnalyticsErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "AdminAnalyticsError";

    this.code =
      code;
  }
}