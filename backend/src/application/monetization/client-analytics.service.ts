import {
  readMonetizationAnalyticsOverview,
  type MonetizationAnalyticsOverviewRecord,
} from "../../domains/monetization/index.js";

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const MAX_ANALYTICS_RANGE_DAYS =
  366;

export type ClientAnalyticsErrorCode =
  | "CLIENT_ANALYTICS_DATE_RANGE_INVALID"
  | "CLIENT_ANALYTICS_DATE_RANGE_TOO_LARGE";

export class ClientAnalyticsError
  extends Error {
  constructor(
    readonly code:
      ClientAnalyticsErrorCode,
    message:
      string
  ) {
    super(message);

    this.name =
      "ClientAnalyticsError";
  }
}

export interface ClientAnalyticsQuery {
  organizationId:
    string;

  startDate:
    string;

  endDate:
    string;

  campaignId?:
    string |
    null;
}

export interface ClientAnalyticsService {
  getOverview:
    (
      query:
        ClientAnalyticsQuery
    ) => Promise<
      MonetizationAnalyticsOverviewRecord
    >;
}

export interface ClientAnalyticsServiceDependencies {
  readOverview:
    typeof readMonetizationAnalyticsOverview;
}

export interface CreateClientAnalyticsServiceOptions {
  dependencies?:
    Partial<
      ClientAnalyticsServiceDependencies
    >;
}

function parseIsoDate(
  value:
    string,
  fieldLabel:
    string
): Date {
  if (
    !ISO_DATE_PATTERN.test(
      value
    )
  ) {
    throw new ClientAnalyticsError(
      "CLIENT_ANALYTICS_DATE_RANGE_INVALID",
      `${fieldLabel} must use YYYY-MM-DD.`
    );
  }

  const parsed =
    new Date(
      `${value}T00:00:00.000Z`
    );

  if (
    !Number.isFinite(
      parsed.getTime()
    ) ||
    parsed
      .toISOString()
      .slice(
        0,
        10
      ) !==
      value
  ) {
    throw new ClientAnalyticsError(
      "CLIENT_ANALYTICS_DATE_RANGE_INVALID",
      `${fieldLabel} is not a valid calendar date.`
    );
  }

  return parsed;
}

function assertDateRange(
  startDate:
    string,
  endDate:
    string
): void {
  const start =
    parseIsoDate(
      startDate,
      "Analytics start date"
    );

  const end =
    parseIsoDate(
      endDate,
      "Analytics end date"
    );

  if (
    start.getTime() >
    end.getTime()
  ) {
    throw new ClientAnalyticsError(
      "CLIENT_ANALYTICS_DATE_RANGE_INVALID",
      "Analytics start date cannot be after the end date."
    );
  }

  const inclusiveDays =
    Math.floor(
      (
        end.getTime() -
        start.getTime()
      ) /
        86_400_000
    ) +
    1;

  if (
    inclusiveDays >
    MAX_ANALYTICS_RANGE_DAYS
  ) {
    throw new ClientAnalyticsError(
      "CLIENT_ANALYTICS_DATE_RANGE_TOO_LARGE",
      `Analytics date ranges cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} days.`
    );
  }
}

export function createClientAnalyticsService(
  options:
    CreateClientAnalyticsServiceOptions =
    {}
): ClientAnalyticsService {
  const dependencies:
    ClientAnalyticsServiceDependencies = {
    readOverview:
      readMonetizationAnalyticsOverview,

    ...options.dependencies,
  };

  return {
    getOverview:
      async query => {
        if (
          query.organizationId
            .trim()
            .length ===
          0
        ) {
          throw new ClientAnalyticsError(
            "CLIENT_ANALYTICS_DATE_RANGE_INVALID",
            "Client organization is required."
          );
        }

        assertDateRange(
          query.startDate,
          query.endDate
        );

        return await dependencies
          .readOverview({
            startDate:
              query.startDate,

            endDate:
              query.endDate,

            campaignId:
              query.campaignId ??
              null,

            organizationId:
              query.organizationId,
          });
      },
  };
}