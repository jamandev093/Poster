import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  MonetizationEventPlacement,
} from "./analytics-event.types.js";

import type {
  MonetizationAnalyticsCampaignRecord,
  MonetizationAnalyticsMetricTotals,
  MonetizationAnalyticsOverviewRecord,
  MonetizationAnalyticsPlacementRecord,
  ReadMonetizationAnalyticsInput,
} from "./analytics-query.types.js";

interface TotalsDatabaseRow
  extends QueryResultRow {
  valid_impressions: string;

  invalid_impressions: string;

  duplicate_impressions: string;

  valid_clicks: string;

  invalid_clicks: string;

  duplicate_clicks: string;

  valid_conversions: string;

  invalid_conversions: string;

  duplicate_conversions: string;

  unattributed_conversions: string;

  latest_source_event_watermark:
    Date |
    null;

  finalized_metric_rows: string;

  total_metric_rows: string;
}

interface PlacementDatabaseRow
  extends QueryResultRow,
    TotalsDatabaseRow {
  placement:
    MonetizationEventPlacement;
}

interface CampaignDatabaseRow
  extends QueryResultRow,
    TotalsDatabaseRow {
  campaign_id: string;

  campaign_reference: string;

  campaign_name: string;

  campaign_type: string;

  campaign_status: string;
}

function calculateCtr(
  validImpressions: string,
  validClicks: string
): number {
  const impressions =
    Number(
      validImpressions
    );

  const clicks =
    Number(
      validClicks
    );

  if (
    !Number.isFinite(
      impressions
    ) ||
    !Number.isFinite(
      clicks
    ) ||
    impressions <= 0
  ) {
    return 0;
  }

  return Number(
    (
      clicks /
      impressions
    ).toFixed(
      6
    )
  );
}

function mapMetricTotals(
  row:
    TotalsDatabaseRow
): MonetizationAnalyticsMetricTotals {
  return {
    validImpressions:
      row.valid_impressions,

    invalidImpressions:
      row.invalid_impressions,

    duplicateImpressions:
      row.duplicate_impressions,

    validClicks:
      row.valid_clicks,

    invalidClicks:
      row.invalid_clicks,

    duplicateClicks:
      row.duplicate_clicks,

    validConversions:
      row.valid_conversions,

    invalidConversions:
      row.invalid_conversions,

    duplicateConversions:
      row.duplicate_conversions,

    unattributedConversions:
      row.unattributed_conversions,
  };
}

function mapPlacementRow(
  row:
    PlacementDatabaseRow
): MonetizationAnalyticsPlacementRecord {
  return {
    placement:
      row.placement,

    ...mapMetricTotals(
      row
    ),

    ctr:
      calculateCtr(
        row.valid_impressions,
        row.valid_clicks
      ),
  };
}

function mapCampaignRow(
  row:
    CampaignDatabaseRow
): MonetizationAnalyticsCampaignRecord {
  return {
    campaignId:
      row.campaign_id,

    campaignReference:
      row.campaign_reference,

    campaignName:
      row.campaign_name,

    campaignType:
      row.campaign_type,

    campaignStatus:
      row.campaign_status,

    ...mapMetricTotals(
      row
    ),

    ctr:
      calculateCtr(
        row.valid_impressions,
        row.valid_clicks
      ),

    latestSourceEventWatermark:
      row.latest_source_event_watermark,

    finalizedMetricRows:
      Number(
        row.finalized_metric_rows
      ),

    totalMetricRows:
      Number(
        row.total_metric_rows
      ),
  };
}

const FILTER_SQL = `
  metric.metric_date >=
    $1::date
  AND metric.metric_date <=
    $2::date
  AND (
    $3::uuid IS NULL
    OR metric.campaign_id =
      $3::uuid
  )
  AND (
    $4::uuid IS NULL
    OR campaign.organization_id =
      $4::uuid
  )
`;

const TOTAL_COLUMNS = `
  COALESCE(
    SUM(
      metric.valid_impressions
    ),
    0
  )::text
    AS valid_impressions,

  COALESCE(
    SUM(
      metric.invalid_impressions
    ),
    0
  )::text
    AS invalid_impressions,

  COALESCE(
    SUM(
      metric.duplicate_impressions
    ),
    0
  )::text
    AS duplicate_impressions,

  COALESCE(
    SUM(
      metric.valid_clicks
    ),
    0
  )::text
    AS valid_clicks,

  COALESCE(
    SUM(
      metric.invalid_clicks
    ),
    0
  )::text
    AS invalid_clicks,

  COALESCE(
    SUM(
      metric.duplicate_clicks
    ),
    0
  )::text
    AS duplicate_clicks,

  COALESCE(
    SUM(
      metric.valid_conversions
    ),
    0
  )::text
    AS valid_conversions,

  COALESCE(
    SUM(
      metric.invalid_conversions
    ),
    0
  )::text
    AS invalid_conversions,

  COALESCE(
    SUM(
      metric.duplicate_conversions
    ),
    0
  )::text
    AS duplicate_conversions,

  COALESCE(
    SUM(
      metric.unattributed_conversions
    ),
    0
  )::text
    AS unattributed_conversions,

  MAX(
    metric.source_event_watermark
  )
    AS latest_source_event_watermark,

  COUNT(*) FILTER (
    WHERE
      metric.finalized_at IS NOT NULL
  )::text
    AS finalized_metric_rows,

  COUNT(*)::text
    AS total_metric_rows
`;

function buildParameters(
  input:
    ReadMonetizationAnalyticsInput
): readonly unknown[] {
  return [
    input.startDate,
    input.endDate,
    input.campaignId ??
      null,
    input.organizationId ??
      null,
  ];
}

export async function readMonetizationAnalyticsOverview(
  input:
    ReadMonetizationAnalyticsInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationAnalyticsOverviewRecord> {
  const parameters =
    buildParameters(
      input
    );

  const [
    totalsResult,
    placementResult,
    campaignResult,
  ] =
    await Promise.all([
      executeDatabaseQuery<
        TotalsDatabaseRow
      >(
        `
          SELECT
            ${TOTAL_COLUMNS}
          FROM app.monetization_campaign_daily_metrics
            AS metric
          INNER JOIN app.monetization_campaigns
            AS campaign
            ON campaign.id =
              metric.campaign_id
          WHERE
            ${FILTER_SQL}
        `,
        parameters,
        executor
      ),

      executeDatabaseQuery<
        PlacementDatabaseRow
      >(
        `
          SELECT
            metric.placement,
            ${TOTAL_COLUMNS}
          FROM app.monetization_campaign_daily_metrics
            AS metric
          INNER JOIN app.monetization_campaigns
            AS campaign
            ON campaign.id =
              metric.campaign_id
          WHERE
            ${FILTER_SQL}
          GROUP BY
            metric.placement
          ORDER BY
            CASE metric.placement
              WHEN 'home'
                THEN 0
              WHEN 'search'
                THEN 1
              WHEN 'trending'
                THEN 2
              ELSE 3
            END
        `,
        parameters,
        executor
      ),

      executeDatabaseQuery<
        CampaignDatabaseRow
      >(
        `
          SELECT
            campaign.id
              AS campaign_id,

            campaign.campaign_reference,

            campaign.name
              AS campaign_name,

            campaign.campaign_type,

            campaign.status
              AS campaign_status,

            ${TOTAL_COLUMNS}
          FROM app.monetization_campaign_daily_metrics
            AS metric
          INNER JOIN app.monetization_campaigns
            AS campaign
            ON campaign.id =
              metric.campaign_id
          WHERE
            ${FILTER_SQL}
          GROUP BY
            campaign.id,
            campaign.campaign_reference,
            campaign.name,
            campaign.campaign_type,
            campaign.status
          ORDER BY
            SUM(
              metric.valid_impressions
            ) DESC,
            campaign.campaign_reference ASC
        `,
        parameters,
        executor
      ),
    ]);

  const totals =
    totalsResult.rows[0];

  if (
    !totals
  ) {
    throw new Error(
      "PostgreSQL did not return the monetization Analytics overview."
    );
  }

  return {
    startDate:
      input.startDate,

    endDate:
      input.endDate,

    ...mapMetricTotals(
      totals
    ),

    ctr:
      calculateCtr(
        totals.valid_impressions,
        totals.valid_clicks
      ),

    latestSourceEventWatermark:
      totals.latest_source_event_watermark,

    finalizedMetricRows:
      Number(
        totals.finalized_metric_rows
      ),

    totalMetricRows:
      Number(
        totals.total_metric_rows
      ),

    placements:
      placementResult.rows.map(
        mapPlacementRow
      ),

    campaigns:
      campaignResult.rows.map(
        mapCampaignRow
      ),
  };
}