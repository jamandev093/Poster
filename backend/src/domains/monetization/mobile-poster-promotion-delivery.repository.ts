import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  MonetizationPlacement,
} from "./commercial.types.js";

export interface MobilePosterPromotionDeliverySourceRecord {
  campaignId:
    string;

  campaignName:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  disclosure:
    string;

  assetId:
    string;

  mediaType:
    "image" |
    "video";

  mediaFileName:
    string;

  mediaMimeType:
    string;

  mediaSizeBytes:
    number;
}

interface MobilePosterPromotionDeliveryDatabaseRow
  extends QueryResultRow {
  campaign_id:
    string;

  campaign_name:
    string;

  placements:
    MonetizationPlacement[];

  scheduled_start_date:
    string;

  scheduled_end_date:
    string;

  headline:
    string;

  body:
    string;

  call_to_action:
    string;

  destination_url:
    string;

  disclosure:
    string;

  media_asset_id:
    string;

  media_type:
    "image" |
    "video";

  media_file_name:
    string;

  media_mime_type:
    string;

  media_size_bytes:
    string;
}

export interface ListMobilePosterPromotionDeliverySourcesInput {
  placement:
    MonetizationPlacement;

  limit?:
    number;
}

function normalizeLimit(
  value:
    number |
    undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return 8;
  }

  return Math.min(
    20,
    Math.max(
      1,
      Math.floor(
        value
      )
    )
  );
}

function mapDeliveryRow(
  row:
    MobilePosterPromotionDeliveryDatabaseRow
): MobilePosterPromotionDeliverySourceRecord {
  const mediaSizeBytes =
    Number(
      row.media_size_bytes
    );

  if (
    !Number.isSafeInteger(
      mediaSizeBytes
    ) ||
    mediaSizeBytes <= 0
  ) {
    throw new Error(
      "Poster Promotion delivery media size is invalid."
    );
  }

  return {
    campaignId:
      row.campaign_id,

    campaignName:
      row.campaign_name,

    placements:
      row.placements,

    scheduledStartDate:
      row.scheduled_start_date,

    scheduledEndDate:
      row.scheduled_end_date,

    headline:
      row.headline,

    body:
      row.body,

    callToAction:
      row.call_to_action,

    destinationUrl:
      row.destination_url,

    disclosure:
      row.disclosure,

    assetId:
      row.media_asset_id,

    mediaType:
      row.media_type,

    mediaFileName:
      row.media_file_name,

    mediaMimeType:
      row.media_mime_type,

    mediaSizeBytes,
  };
}

export async function listMobilePosterPromotionDeliverySources(
  input:
    ListMobilePosterPromotionDeliverySourcesInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MobilePosterPromotionDeliverySourceRecord[]
> {
  const limit =
    normalizeLimit(
      input.limit
    );

  const result =
    await executeDatabaseQuery<
      MobilePosterPromotionDeliveryDatabaseRow
    >(
      `
        SELECT
          campaign.id
            AS campaign_id,

          campaign.name
            AS campaign_name,

          campaign.placements,

          campaign.scheduled_start_date::text
            AS scheduled_start_date,

          campaign.scheduled_end_date::text
            AS scheduled_end_date,

          creative.headline,

          creative.body,

          creative.call_to_action,

          creative.destination_url,

          creative.disclosure,

          creative.media_asset_id,

          creative.media_type,

          creative.media_file_name,

          creative.media_mime_type,

          creative.media_size_bytes::text
            AS media_size_bytes

        FROM app.monetization_campaigns
          AS campaign

        INNER JOIN app.poster_promotion_creatives
          AS creative
          ON creative.campaign_id =
            campaign.id

        INNER JOIN app.media_assets
          AS media_asset
          ON media_asset.id =
            creative.media_asset_id

        WHERE campaign.campaign_type =
          'poster_promotion'

          AND campaign.origin =
            'admin_internal'

          AND campaign.delivery_eligible =
            TRUE

          AND campaign.status =
            'active'

          AND campaign.readiness_status =
            'ready'

          AND campaign.commercial_status
            IN (
              'approved',
              'funded'
            )

          AND CURRENT_DATE
            BETWEEN campaign.scheduled_start_date
            AND campaign.scheduled_end_date

          AND $1::text =
            ANY(
              campaign.placements
            )

          AND creative.disclosure =
            'Promoted by Poster'

          AND creative.media_asset_id
            IS NOT NULL

          AND creative.media_type
            IS NOT NULL

          AND creative.media_file_name
            IS NOT NULL

          AND creative.media_mime_type
            IS NOT NULL

          AND creative.media_size_bytes
            IS NOT NULL

          AND media_asset.purpose =
            'poster_promotion'

          AND media_asset.status =
            'ready'

          AND media_asset.media_type =
            creative.media_type

          AND media_asset.file_name =
            creative.media_file_name

          AND media_asset.mime_type =
            creative.media_mime_type

          AND media_asset.size_bytes =
            creative.media_size_bytes

        ORDER BY
          campaign.updated_at DESC,
          campaign.id ASC

        LIMIT $2::integer
      `,
      [
        input.placement,
        limit,
      ],
      executor
    );

  return result.rows.map(
    mapDeliveryRow
  );
}