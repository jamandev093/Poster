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

export type MobileCommercialDeliveryCampaignType =
  | "direct_sponsorship"
  | "affiliate";

export interface MobileCommercialDeliverySourceRecord {
  campaignId: string;

  campaignType:
    MobileCommercialDeliveryCampaignType;

  campaignName: string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate: string;

  scheduledEndDate: string;

  sourceRequestId:
    | string
    | null;

  requestTitle:
    | string
    | null;

  requestObjective:
    | string
    | null;

  requestDestinationUrl:
    | string
    | null;

  requestCreativeSpec:
    | Record<string, unknown>
    | null;

  affiliatePartnerName:
    | string
    | null;

  affiliateOfferName:
    | string
    | null;

  affiliateDestinationUrl:
    | string
    | null;

  affiliateDisclosure:
    | string
    | null;

  affiliateTrackingStatus:
    | string
    | null;

  affiliateTrackingUrl:
    | string
    | null;

  affiliatePayoutReadinessStatus:
    | string
    | null;
}

interface MobileCommercialDeliveryDatabaseRow
  extends QueryResultRow {
  campaign_id:
    string;

  campaign_type:
    MobileCommercialDeliveryCampaignType;

  campaign_name:
    string;

  placements:
    MonetizationPlacement[];

  scheduled_start_date:
    string;

  scheduled_end_date:
    string;

  source_request_id:
    string | null;

  request_title:
    string | null;

  request_objective:
    string | null;

  request_destination_url:
    string | null;

  request_creative_spec:
    Record<string, unknown> | null;

  affiliate_partner_name:
    string | null;

  affiliate_offer_name:
    string | null;

  affiliate_destination_url:
    string | null;

  affiliate_disclosure:
    string | null;

  affiliate_tracking_status:
    string | null;

  affiliate_tracking_url:
    string | null;

  affiliate_payout_readiness_status:
    string | null;
}

function normalizeLimit(
  value:
    | number
    | undefined
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 12;
  }

  return Math.min(
    50,
    Math.max(
      1,
      Math.floor(value)
    )
  );
}

function mapDeliveryDatabaseRow(
  row:
    MobileCommercialDeliveryDatabaseRow
): MobileCommercialDeliverySourceRecord {
  return {
    campaignId:
      row.campaign_id,

    campaignType:
      row.campaign_type,

    campaignName:
      row.campaign_name,

    placements:
      row.placements,

    scheduledStartDate:
      row.scheduled_start_date,

    scheduledEndDate:
      row.scheduled_end_date,

    sourceRequestId:
      row.source_request_id,

    requestTitle:
      row.request_title,

    requestObjective:
      row.request_objective,

    requestDestinationUrl:
      row.request_destination_url,

    requestCreativeSpec:
      row.request_creative_spec,

    affiliatePartnerName:
      row.affiliate_partner_name,

    affiliateOfferName:
      row.affiliate_offer_name,

    affiliateDestinationUrl:
      row.affiliate_destination_url,

    affiliateDisclosure:
      row.affiliate_disclosure,

    affiliateTrackingStatus:
      row.affiliate_tracking_status,

    affiliateTrackingUrl:
      row.affiliate_tracking_url,

    affiliatePayoutReadinessStatus:
      row.affiliate_payout_readiness_status,
  };
}

export interface ListMobileCommercialDeliverySourcesInput {
  placement:
    MonetizationPlacement;

  limit?:
    number;
}

/**
 * Returns only campaign rows that the authoritative
 * campaign lifecycle already considers delivery-eligible.
 *
 * Direct Sponsorship creative text/destination data is
 * resolved from the approved commercial request that
 * created the campaign.
 *
 * Affiliate campaigns resolve their approved operational
 * metadata from affiliate_campaign_metadata.
 *
 * This repository intentionally does not manufacture
 * media URLs from asset IDs or storage references.
 */
export async function listMobileCommercialDeliverySources(
  input:
    ListMobileCommercialDeliverySourcesInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MobileCommercialDeliverySourceRecord[]
> {
  const limit =
    normalizeLimit(
      input.limit
    );

  const result =
    await executeDatabaseQuery<
      MobileCommercialDeliveryDatabaseRow
    >(
      `
        SELECT
          campaign.id
            AS campaign_id,

          campaign.campaign_type,

          campaign.name
            AS campaign_name,

          campaign.placements,

          campaign.scheduled_start_date::text
            AS scheduled_start_date,

          campaign.scheduled_end_date::text
            AS scheduled_end_date,

          campaign.source_request_id,

          request.title
            AS request_title,

          request.objective
            AS request_objective,

          request.destination_url
            AS request_destination_url,

          request.creative_spec
            AS request_creative_spec,

          affiliate.partner_name
            AS affiliate_partner_name,

          affiliate.offer_name
            AS affiliate_offer_name,

          affiliate.destination_url
            AS affiliate_destination_url,

          affiliate.disclosure
            AS affiliate_disclosure,

          affiliate.tracking_status
            AS affiliate_tracking_status,

          affiliate.tracking_url
            AS affiliate_tracking_url,

          affiliate.payout_readiness_status
            AS affiliate_payout_readiness_status

        FROM app.monetization_campaigns
          AS campaign

        LEFT JOIN app.commercial_requests
          AS request
          ON
            request.id =
              campaign.source_request_id
            AND request.status =
              'approved'

        LEFT JOIN app.affiliate_campaign_metadata
          AS affiliate
          ON
            affiliate.campaign_id =
              campaign.id

        WHERE
          campaign.delivery_eligible =
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

          AND CURRENT_DATE BETWEEN
            campaign.scheduled_start_date
            AND campaign.scheduled_end_date

          AND $1::text =
            ANY(campaign.placements)

          AND campaign.campaign_type
            IN (
              'direct_sponsorship',
              'affiliate'
            )

          AND (
            (
              campaign.campaign_type =
                'direct_sponsorship'

              AND request.id
                IS NOT NULL

              AND request.request_type =
                'direct_sponsorship'
            )

            OR

            (
              campaign.campaign_type =
                'affiliate'

              AND affiliate.campaign_id
                IS NOT NULL
            )
          )

        ORDER BY
          campaign.updated_at DESC,
          campaign.id DESC

        LIMIT $2::integer
      `,
      [
        input.placement,
        limit,
      ],
      executor
    );

  return result.rows.map(
    mapDeliveryDatabaseRow
  );
}