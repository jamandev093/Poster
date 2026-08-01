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
  AggregateMonetizationDailyMetricInput,
  MonetizationDailyMetricRecord,
} from "./analytics-daily-metrics.types.js";

interface DailyMetricDatabaseRow
  extends QueryResultRow {
  campaign_id: string;

  metric_date: string;

  placement:
    MonetizationEventPlacement;

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

  source_event_watermark:
    Date |
    null;

  finalized_at:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const DAILY_METRIC_COLUMNS = `
  campaign_id,
  metric_date::text
    AS metric_date,
  placement,
  valid_impressions::text
    AS valid_impressions,
  invalid_impressions::text
    AS invalid_impressions,
  duplicate_impressions::text
    AS duplicate_impressions,
  valid_clicks::text
    AS valid_clicks,
  invalid_clicks::text
    AS invalid_clicks,
  duplicate_clicks::text
    AS duplicate_clicks,
  valid_conversions::text
    AS valid_conversions,
  invalid_conversions::text
    AS invalid_conversions,
  duplicate_conversions::text
    AS duplicate_conversions,
  unattributed_conversions::text
    AS unattributed_conversions,
  source_event_watermark,
  finalized_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapDailyMetricRow(
  row:
    DailyMetricDatabaseRow
): MonetizationDailyMetricRecord {
  return {
    campaignId:
      row.campaign_id,

    metricDate:
      row.metric_date,

    placement:
      row.placement,

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

    sourceEventWatermark:
      row.source_event_watermark,

    finalizedAt:
      row.finalized_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalDailyMetricRow(
  row:
    DailyMetricDatabaseRow |
    undefined
): MonetizationDailyMetricRecord | null {
  return row
    ? mapDailyMetricRow(
        row
      )
    : null;
}

export async function aggregateMonetizationDailyMetric(
  input:
    AggregateMonetizationDailyMetricInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationDailyMetricRecord> {
  const result =
    await executeDatabaseQuery<
      DailyMetricDatabaseRow
    >(
      `
        WITH event_totals AS (
          SELECT
            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'impression'
                AND validation.validation_status =
                  'valid'
            )::bigint
              AS valid_impressions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'impression'
                AND validation.validation_status =
                  'invalid'
            )::bigint
              AS invalid_impressions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'impression'
                AND validation.validation_status =
                  'duplicate'
            )::bigint
              AS duplicate_impressions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'click'
                AND validation.validation_status =
                  'valid'
            )::bigint
              AS valid_clicks,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'click'
                AND validation.validation_status =
                  'invalid'
            )::bigint
              AS invalid_clicks,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'click'
                AND validation.validation_status =
                  'duplicate'
            )::bigint
              AS duplicate_clicks,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'conversion'
                AND validation.validation_status =
                  'valid'
            )::bigint
              AS valid_conversions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'conversion'
                AND validation.validation_status =
                  'invalid'
            )::bigint
              AS invalid_conversions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'conversion'
                AND validation.validation_status =
                  'duplicate'
            )::bigint
              AS duplicate_conversions,

            COUNT(*) FILTER (
              WHERE
                event.event_type =
                  'conversion'
                AND validation.validation_status =
                  'valid'
                AND attribution.id IS NULL
            )::bigint
              AS unattributed_conversions,

            MAX(
              event.received_at
            )
              AS source_event_watermark
          FROM app.monetization_campaign_events
            AS event
          INNER JOIN app.monetization_campaign_event_validations
            AS validation
            ON validation.event_id =
              event.id
          LEFT JOIN app.monetization_campaign_attributions
            AS attribution
            ON attribution.conversion_event_id =
              event.id
          WHERE
            event.campaign_id =
              $1::uuid
            AND (
              event.occurred_at
                AT TIME ZONE 'UTC'
            )::date =
              $2::date
            AND event.placement =
              $3
        ),
        upserted AS (
          INSERT INTO app.monetization_campaign_daily_metrics (
            campaign_id,
            metric_date,
            placement,
            valid_impressions,
            invalid_impressions,
            duplicate_impressions,
            valid_clicks,
            invalid_clicks,
            duplicate_clicks,
            valid_conversions,
            invalid_conversions,
            duplicate_conversions,
            unattributed_conversions,
            source_event_watermark,
            finalized_at
          )
          SELECT
            $1::uuid,
            $2::date,
            $3,
            valid_impressions,
            invalid_impressions,
            duplicate_impressions,
            valid_clicks,
            invalid_clicks,
            duplicate_clicks,
            valid_conversions,
            invalid_conversions,
            duplicate_conversions,
            unattributed_conversions,
            source_event_watermark,
            $4
          FROM event_totals
          ON CONFLICT (
            campaign_id,
            metric_date,
            placement
          )
          DO UPDATE
          SET
            valid_impressions =
              EXCLUDED.valid_impressions,

            invalid_impressions =
              EXCLUDED.invalid_impressions,

            duplicate_impressions =
              EXCLUDED.duplicate_impressions,

            valid_clicks =
              EXCLUDED.valid_clicks,

            invalid_clicks =
              EXCLUDED.invalid_clicks,

            duplicate_clicks =
              EXCLUDED.duplicate_clicks,

            valid_conversions =
              EXCLUDED.valid_conversions,

            invalid_conversions =
              EXCLUDED.invalid_conversions,

            duplicate_conversions =
              EXCLUDED.duplicate_conversions,

            unattributed_conversions =
              EXCLUDED.unattributed_conversions,

            source_event_watermark =
              EXCLUDED.source_event_watermark,

            finalized_at =
              EXCLUDED.finalized_at
          RETURNING
            ${DAILY_METRIC_COLUMNS}
        )
        SELECT
          *
        FROM upserted
      `,
      [
        input.campaignId,
        input.metricDate,
        input.placement,
        input.finalizedAt ??
        null,
      ],
      executor
    );

  const record =
    result.rows[0];

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the aggregated monetization daily metric."
    );
  }

  return mapDailyMetricRow(
    record
  );
}

export async function findMonetizationDailyMetric(
  input: {
    campaignId: string;

    metricDate: string;

    placement:
      MonetizationEventPlacement;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationDailyMetricRecord | null> {
  const result =
    await executeDatabaseQuery<
      DailyMetricDatabaseRow
    >(
      `
        SELECT
          ${DAILY_METRIC_COLUMNS}
        FROM app.monetization_campaign_daily_metrics
        WHERE
          campaign_id =
            $1::uuid
          AND metric_date =
            $2::date
          AND placement =
            $3
        LIMIT 1
      `,
      [
        input.campaignId,
        input.metricDate,
        input.placement,
      ],
      executor
    );

  return mapOptionalDailyMetricRow(
    result.rows[0]
  );
}

export async function listMonetizationDailyMetrics(
  input: {
    campaignId?:
      string |
      null;

    startDate: string;

    endDate: string;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationDailyMetricRecord[]> {
  const result =
    await executeDatabaseQuery<
      DailyMetricDatabaseRow
    >(
      `
        SELECT
          ${DAILY_METRIC_COLUMNS}
        FROM app.monetization_campaign_daily_metrics
        WHERE
          (
            $1::uuid IS NULL
            OR campaign_id =
              $1::uuid
          )
          AND metric_date >=
            $2::date
          AND metric_date <=
            $3::date
        ORDER BY
          metric_date DESC,
          campaign_id,
          placement
      `,
      [
        input.campaignId ??
        null,

        input.startDate,
        input.endDate,
      ],
      executor
    );

  return result.rows.map(
    mapDailyMetricRow
  );
}