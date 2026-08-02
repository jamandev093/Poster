import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  JsonObject,
} from "./commercial.types.js";

import type {
  AffiliateCommissionModel,
  AffiliateMetadataMutationOutcome,
  AffiliateMetadataRecord,
  AffiliatePayoutReadinessStatus,
  AffiliateTrackingStatus,
  CreateAffiliateMetadataInput,
  UpdateAffiliateMetadataInput,
} from "./affiliate.types.js";

interface AffiliateMetadataDatabaseRow
  extends QueryResultRow {
  campaign_id:
    string;

  partner_name:
    string;

  offer_name:
    string;

  destination_url:
    string;

  disclosure:
    "Affiliate · Poster may earn a commission";

  commission_model:
    AffiliateCommissionModel;

  commission_terms:
    JsonObject;

  tracking_status:
    AffiliateTrackingStatus;

  tracking_url:
    string | null;

  payout_readiness_status:
    AffiliatePayoutReadinessStatus;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const AFFILIATE_METADATA_COLUMNS = `
  campaign_id,
  partner_name,
  offer_name,
  destination_url,
  disclosure,
  commission_model,
  commission_terms,
  tracking_status,
  tracking_url,
  payout_readiness_status,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapAffiliateMetadataRow(
  row:
    AffiliateMetadataDatabaseRow
): AffiliateMetadataRecord {
  return {
    campaignId:
      row.campaign_id,

    partnerName:
      row.partner_name,

    offerName:
      row.offer_name,

    destinationUrl:
      row.destination_url,

    disclosure:
      row.disclosure,

    commissionModel:
      row.commission_model,

    commissionTerms:
      row.commission_terms,

    trackingStatus:
      row.tracking_status,

    trackingUrl:
      row.tracking_url,

    payoutReadinessStatus:
      row.payout_readiness_status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalAffiliateMetadataRow(
  row:
    AffiliateMetadataDatabaseRow |
    undefined
): AffiliateMetadataRecord | null {
  return row
    ? mapAffiliateMetadataRow(
        row
      )
    : null;
}

export async function findAffiliateMetadataByCampaignId(
  campaignId:
    string,
  executor?:
    DatabaseQueryExecutor
): Promise<
  AffiliateMetadataRecord | null
> {
  const result =
    await executeDatabaseQuery<
      AffiliateMetadataDatabaseRow
    >(
      `
        SELECT
          ${AFFILIATE_METADATA_COLUMNS}
        FROM app.affiliate_campaign_metadata
        WHERE campaign_id = $1::uuid
        LIMIT 1
      `,
      [
        campaignId,
      ],
      executor
    );

  return mapOptionalAffiliateMetadataRow(
    result.rows[0]
  );
}

export async function createAffiliateMetadata(
  input:
    CreateAffiliateMetadataInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  AffiliateMetadataRecord
> {
  const result =
    await executeDatabaseQuery<
      AffiliateMetadataDatabaseRow
    >(
      `
        INSERT INTO app.affiliate_campaign_metadata (
          campaign_id,
          partner_name,
          offer_name,
          destination_url,
          disclosure,
          commission_model,
          commission_terms,
          tracking_status,
          tracking_url,
          payout_readiness_status,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8,
          $9,
          $10,
          $11,
          $11
        )
        RETURNING
          ${AFFILIATE_METADATA_COLUMNS}
      `,
      [
        input.campaignId,
        input.partnerName.trim(),
        input.offerName.trim(),
        input.destinationUrl.trim(),
        input.disclosure,
        input.commissionModel,
        input.commissionTerms,
        input.trackingStatus,
        input.trackingUrl?.trim() ??
          null,
        input.payoutReadinessStatus,
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
      "Affiliate metadata was not returned after creation."
    );
  }

  return mapAffiliateMetadataRow(
    row
  );
}

export async function updateAffiliateMetadata(
  input:
    UpdateAffiliateMetadataInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  AffiliateMetadataMutationOutcome
> {
  const result =
    await executeDatabaseQuery<
      AffiliateMetadataDatabaseRow
    >(
      `
        UPDATE app.affiliate_campaign_metadata
        SET
          partner_name =
            $3,

          offer_name =
            $4,

          destination_url =
            $5,

          disclosure =
            $6,

          commission_model =
            $7,

          commission_terms =
            $8::jsonb,

          tracking_status =
            $9,

          tracking_url =
            $10,

          payout_readiness_status =
            $11,

          updated_at =
            $12,

          row_version =
            row_version + 1
        WHERE campaign_id =
          $1::uuid

          AND row_version =
            $2::bigint
        RETURNING
          ${AFFILIATE_METADATA_COLUMNS}
      `,
      [
        input.campaignId,
        input.expectedRowVersion,
        input.partnerName.trim(),
        input.offerName.trim(),
        input.destinationUrl.trim(),
        input.disclosure,
        input.commissionModel,
        input.commissionTerms,
        input.trackingStatus,
        input.trackingUrl?.trim() ??
          null,
        input.payoutReadinessStatus,
        input.updatedAt,
      ],
      executor
    );

  const updated =
    mapOptionalAffiliateMetadataRow(
      result.rows[0]
    );

  if (
    updated
  ) {
    return {
      status:
        "updated",

      metadata:
        updated,
    };
  }

  const current =
    await findAffiliateMetadataByCampaignId(
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

    metadata:
      current,
  };
}