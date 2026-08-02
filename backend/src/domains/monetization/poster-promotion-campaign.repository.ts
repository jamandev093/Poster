import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  CampaignCommercialStatus,
  CampaignReadinessStatus,
  CampaignStatus,
  MonetizationCampaignRecord,
  MonetizationPlacement,
} from "./commercial.types.js";

import {
  findMonetizationCampaignById,
} from "./campaign.repository.js";

interface PosterPromotionCampaignDatabaseRow
  extends QueryResultRow {
  id:
    string;

  campaign_reference:
    string;

  source_request_id:
    string |
    null;

  organization_id:
    string;

  name:
    string;

  campaign_type:
    "poster_promotion";

  origin:
    "admin_internal";

  status:
    CampaignStatus;

  placements:
    MonetizationPlacement[];

  scheduled_start_date:
    string;

  scheduled_end_date:
    string;

  readiness_status:
    CampaignReadinessStatus;

  commercial_status:
    CampaignCommercialStatus;

  delivery_eligible:
    boolean;

  created_by_user_id:
    string;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const POSTER_PROMOTION_CAMPAIGN_COLUMNS = `
  id,
  campaign_reference,
  source_request_id,
  organization_id,
  name,
  campaign_type,
  origin,
  status,
  placements,
  scheduled_start_date::text
    AS scheduled_start_date,
  scheduled_end_date::text
    AS scheduled_end_date,
  readiness_status,
  commercial_status,
  delivery_eligible,
  created_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

export interface CreateInternalPosterPromotionCampaignInput {
  actorUserId:
    string;

  organizationId:
    string;

  campaignReference:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  status:
    Extract<
      CampaignStatus,
      "draft" |
      "scheduled"
    >;

  readinessStatus:
    CampaignReadinessStatus;

  commercialStatus:
    CampaignCommercialStatus;

  createdAt:
    Date;
}

export interface UpdateInternalPosterPromotionCampaignInput {
  campaignId:
    string;

  expectedRowVersion:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  status:
    Extract<
      CampaignStatus,
      "draft" |
      "scheduled"
    >;

  updatedAt:
    Date;
}

export type InternalPosterPromotionCampaignUpdateResult =
  | {
      status:
        "updated";

      campaign:
        MonetizationCampaignRecord;
    }
  | {
      status:
        "conflict";

      campaign:
        MonetizationCampaignRecord;
    }
  | {
      status:
        "not_found";
    };

function mapPosterPromotionCampaignRow(
  row:
    PosterPromotionCampaignDatabaseRow
): MonetizationCampaignRecord {
  return {
    id:
      row.id,

    campaignReference:
      row.campaign_reference,

    sourceRequestId:
      row.source_request_id,

    organizationId:
      row.organization_id,

    name:
      row.name,

    campaignType:
      row.campaign_type,

    origin:
      row.origin,

    status:
      row.status,

    placements:
      row.placements,

    scheduledStartDate:
      row.scheduled_start_date,

    scheduledEndDate:
      row.scheduled_end_date,

    readinessStatus:
      row.readiness_status,

    commercialStatus:
      row.commercial_status,

    deliveryEligible:
      row.delivery_eligible,

    createdByUserId:
      row.created_by_user_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function createInternalPosterPromotionCampaign(
  input:
    CreateInternalPosterPromotionCampaignInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  MonetizationCampaignRecord
> {
  const result =
    await executeDatabaseQuery<
      PosterPromotionCampaignDatabaseRow
    >(
      `
        INSERT INTO app.monetization_campaigns (
          campaign_reference,
          source_request_id,
          organization_id,
          name,
          campaign_type,
          origin,
          status,
          placements,
          scheduled_start_date,
          scheduled_end_date,
          readiness_status,
          commercial_status,
          delivery_eligible,
          created_by_user_id,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          NULL,
          $2::uuid,
          $3,
          'poster_promotion',
          'admin_internal',
          $4,
          $5::text[],
          $6::date,
          $7::date,
          $8,
          $9,
          false,
          $10::uuid,
          $11,
          $11
        )
        RETURNING
          ${POSTER_PROMOTION_CAMPAIGN_COLUMNS}
      `,
      [
        input.campaignReference.trim(),
        input.organizationId,
        input.name.trim(),
        [...input.placements],
        input.scheduledStartDate,
        input.scheduledEndDate,
        input.readinessStatus,
        input.commercialStatus,
        input.actorUserId,
        input.createdAt,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "Poster Promotion campaign was not returned after creation."
    );
  }

  return mapPosterPromotionCampaignRow(
    row
  );
}

export async function updateInternalPosterPromotionCampaign(
  input:
    UpdateInternalPosterPromotionCampaignInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  InternalPosterPromotionCampaignUpdateResult
> {
  const result =
    await executeDatabaseQuery<
      PosterPromotionCampaignDatabaseRow
    >(
      `
        UPDATE app.monetization_campaigns
        SET
          name =
            $3,

          placements =
            $4::text[],

          scheduled_start_date =
            $5::date,

          scheduled_end_date =
            $6::date,

          status =
            $7,

          readiness_status =
            CASE
              WHEN $7 = 'scheduled'
                THEN 'ready'
              ELSE 'pending_setup'
            END,

          commercial_status =
            'approved',

          delivery_eligible =
            false,

          updated_at =
            $8,

          row_version =
            row_version + 1
        WHERE id =
          $1::uuid

          AND row_version =
            $2::bigint

          AND campaign_type =
            'poster_promotion'

          AND origin =
            'admin_internal'

          AND status NOT IN (
            'ended',
            'disabled'
          )
        RETURNING
          ${POSTER_PROMOTION_CAMPAIGN_COLUMNS}
      `,
      [
        input.campaignId,
        input.expectedRowVersion,
        input.name.trim(),
        [...input.placements],
        input.scheduledStartDate,
        input.scheduledEndDate,
        input.status,
        input.updatedAt,
      ],
      executor
    );

  const updatedRow =
    result.rows[0];

  if (
    updatedRow
  ) {
    return {
      status:
        "updated",

      campaign:
        mapPosterPromotionCampaignRow(
          updatedRow
        ),
    };
  }

  const current =
    await findMonetizationCampaignById(
      input.campaignId,
      executor
    );

  if (
    !current
  ) {
    return {
      status:
        "not_found",
    };
  }

  return {
    status:
      "conflict",

    campaign:
      current,
  };
}