import {
  readMonetizationAnalyticsOverview,
  type MonetizationAnalyticsOverviewRecord,
} from "../../domains/monetization/index.js";

import {
  AdminAnalyticsError,
} from "./admin-analytics.errors.js";

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const MAX_ANALYTICS_RANGE_DAYS =
  366;

export interface AdminAnalyticsQuery {
  startDate: string;

  endDate: string;

  campaignId?:
    string |
    null;

  organizationId?:
    string |
    null;
}

export interface AdminAnalyticsService {
  getOverview:
    (
      query:
        AdminAnalyticsQuery
    ) => Promise<
      MonetizationAnalyticsOverviewRecord
    >;
}

export interface AdminAnalyticsServiceDependencies {
  readOverview:
    typeof readMonetizationAnalyticsOverview;
}

export interface CreateAdminAnalyticsServiceOptions {
  dependencies?:
    Partial<
      AdminAnalyticsServiceDependencies
    >;
}

function parseIsoDate(
  value: string,
  fieldLabel: string
): Date {
  if (
    !ISO_DATE_PATTERN.test(
      value
    )
  ) {
    throw new AdminAnalyticsError(
      "ANALYTICS_DATE_RANGE_INVALID",
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
    throw new AdminAnalyticsError(
      "ANALYTICS_DATE_RANGE_INVALID",
      `${fieldLabel} is not a valid calendar date.`
    );
  }

  return parsed;
}

function assertDateRange(
  startDate: string,
  endDate: string
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
    throw new AdminAnalyticsError(
      "ANALYTICS_DATE_RANGE_INVALID",
      "Analytics start date cannot be after the end date."
    );
  }

  const inclusiveRangeDays =
    Math.floor(
      (
        end.getTime() -
        start.getTime()
      ) /
        (
          24 *
          60 *
          60 *
          1000
        )
    ) +
    1;

  if (
    inclusiveRangeDays >
    MAX_ANALYTICS_RANGE_DAYS
  ) {
    throw new AdminAnalyticsError(
      "ANALYTICS_DATE_RANGE_TOO_LARGE",
      `Analytics date ranges cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} days.`
    );
  }
}

export function createAdminAnalyticsService(
  options:
    CreateAdminAnalyticsServiceOptions =
    {}
): AdminAnalyticsService {
  const dependencies:
    AdminAnalyticsServiceDependencies = {
    readOverview:
      readMonetizationAnalyticsOverview,

    ...options.dependencies,
  };

  return {
    getOverview:
      async query => {
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
              query.organizationId ??
              null,
          });
      },
  };
}