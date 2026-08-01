import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  aggregateMonetizationDailyMetric,
  findMonetizationCampaignById,
  type MonetizationDailyMetricRecord,
  type MonetizationEventPlacement,
} from "../../domains/monetization/index.js";

export interface AggregateCampaignDayInput {
  campaignId: string;

  metricDate: string;

  finalize?: boolean;
}

export interface AnalyticsAggregationService {
  aggregateCampaignDay:
    (
      input:
        AggregateCampaignDayInput
    ) => Promise<
      MonetizationDailyMetricRecord[]
    >;
}

export interface AnalyticsAggregationServiceDependencies {
  findCampaign:
    typeof findMonetizationCampaignById;

  aggregateDailyMetric:
    typeof aggregateMonetizationDailyMetric;

  now:
    () => Date;
}

export interface CreateAnalyticsAggregationServiceOptions {
  dependencies?:
    Partial<
      AnalyticsAggregationServiceDependencies
    >;
}

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

function assertMetricDate(
  metricDate: string
): void {
  if (
    !ISO_DATE_PATTERN.test(
      metricDate
    )
  ) {
    throw new TypeError(
      "Analytics metric date must use YYYY-MM-DD."
    );
  }

  const parsed =
    new Date(
      `${metricDate}T00:00:00.000Z`
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
      metricDate
  ) {
    throw new TypeError(
      "Analytics metric date is invalid."
    );
  }
}

export function createAnalyticsAggregationService(
  options:
    CreateAnalyticsAggregationServiceOptions =
    {}
): AnalyticsAggregationService {
  const dependencies:
    AnalyticsAggregationServiceDependencies = {
    findCampaign:
      findMonetizationCampaignById,

    aggregateDailyMetric:
      aggregateMonetizationDailyMetric,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    aggregateCampaignDay:
      async input => {
        assertMetricDate(
          input.metricDate
        );

        return await runDatabaseTransaction(
          async executor => {
            const campaign =
              await dependencies
                .findCampaign(
                  input.campaignId,
                  executor
                );

            if (
              !campaign
            ) {
              throw new Error(
                "The campaign selected for Analytics aggregation was not found."
              );
            }

            const finalizedAt =
              input.finalize ===
              true
                ? dependencies.now()
                : null;

            const results:
              MonetizationDailyMetricRecord[] =
                [];

            for (
              const placement
              of campaign.placements as
                MonetizationEventPlacement[]
            ) {
              results.push(
                await dependencies
                  .aggregateDailyMetric(
                    {
                      campaignId:
                        campaign.id,

                      metricDate:
                        input.metricDate,

                      placement,

                      finalizedAt,
                    },
                    executor
                  )
              );
            }

            return results;
          }
        );
      },
  };
}