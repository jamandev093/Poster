import {
  createAnalyticsApiError,
} from "./analytics-api.errors";

import {
  parseAdminAnalyticsOverview,
} from "./analytics-api.validation";

import type {
  AdminAnalyticsOverview,
  AdminAnalyticsQuery,
} from "./analytics-api.types";

const ANALYTICS_ENDPOINT =
  "/api/v1/admin/monetization/analytics";

function appendOptionalFilter(
  parameters:
    URLSearchParams,
  key: string,
  value:
    string |
    null |
    undefined
): void {
  const normalized =
    value?.trim();

  if (
    normalized
  ) {
    parameters.set(
      key,
      normalized
    );
  }
}

export async function fetchAdminAnalytics(
  query:
    AdminAnalyticsQuery
): Promise<
  AdminAnalyticsOverview
> {
  const parameters =
    new URLSearchParams({
      startDate:
        query.startDate,

      endDate:
        query.endDate,
    });

  appendOptionalFilter(
    parameters,
    "campaignId",
    query.campaignId
  );

  appendOptionalFilter(
    parameters,
    "organizationId",
    query.organizationId
  );

  const response =
    await fetch(
      `${ANALYTICS_ENDPOINT}?${parameters.toString()}`,
      {
        method:
          "GET",

        credentials:
          "include",

        headers: {
          accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    throw await createAnalyticsApiError(
      response
    );
  }

  return parseAdminAnalyticsOverview(
    await response.json()
  );
}