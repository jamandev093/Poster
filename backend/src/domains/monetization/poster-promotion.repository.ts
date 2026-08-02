import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  POSTER_PROMOTION_DISCLOSURE,
} from "./poster-promotion.types.js";

import type {
  CreatePosterPromotionCreativeInput,
  PosterPromotionCreativeRecord,
  PosterPromotionCreativeUpdateResult,
  PosterPromotionRepository,
  UpdatePosterPromotionCreativeInput,
} from "./poster-promotion.types.js";

interface PosterPromotionCreativeDatabaseRow
  extends QueryResultRow {
  campaign_id:
    string;

  purpose:
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
    typeof POSTER_PROMOTION_DISCLOSURE;

  media_asset_id:
    string |
    null;

  media_type:
    "image" |
    "video" |
    null;

  media_file_name:
    string |
    null;

  media_mime_type:
    string |
    null;

  media_size_bytes:
    string |
    null;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const POSTER_PROMOTION_CREATIVE_COLUMNS = `
  campaign_id,
  purpose,
  headline,
  body,
  call_to_action,
  destination_url,
  disclosure,
  media_asset_id,
  media_type,
  media_file_name,
  media_mime_type,
  media_size_bytes::text
    AS media_size_bytes,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapPosterPromotionCreativeRow(
  row:
    PosterPromotionCreativeDatabaseRow
): PosterPromotionCreativeRecord {
  const hasMedia =
    row.media_asset_id !==
      null &&
    row.media_type !==
      null &&
    row.media_file_name !==
      null &&
    row.media_mime_type !==
      null &&
    row.media_size_bytes !==
      null;

  return {
    campaignId:
      row.campaign_id,

    purpose:
      row.purpose,

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

    media:
      hasMedia
        ? {
            assetId:
              row.media_asset_id as
                string,

            type:
              row.media_type as
                "image" |
                "video",

            fileName:
              row.media_file_name as
                string,

            mimeType:
              row.media_mime_type as
                string,

            sizeBytes:
              Number(
                row.media_size_bytes
              ),
          }
        : null,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalPosterPromotionCreativeRow(
  row:
    PosterPromotionCreativeDatabaseRow |
    undefined
): PosterPromotionCreativeRecord | null {
  return row
    ? mapPosterPromotionCreativeRow(
        row
      )
    : null;
}

export async function findPosterPromotionCreativeByCampaignId(
  campaignId:
    string,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PosterPromotionCreativeRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      PosterPromotionCreativeDatabaseRow
    >(
      `
        SELECT
          ${POSTER_PROMOTION_CREATIVE_COLUMNS}
        FROM app.poster_promotion_creatives
        WHERE campaign_id =
          $1::uuid
        LIMIT 1
      `,
      [
        campaignId,
      ],
      executor
    );

  return mapOptionalPosterPromotionCreativeRow(
    result.rows[0]
  );
}

export async function createPosterPromotionCreative(
  input:
    CreatePosterPromotionCreativeInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PosterPromotionCreativeRecord
> {
  const result =
    await executeDatabaseQuery<
      PosterPromotionCreativeDatabaseRow
    >(
      `
        INSERT INTO app.poster_promotion_creatives (
          campaign_id,
          purpose,
          headline,
          body,
          call_to_action,
          destination_url,
          disclosure,
          media_asset_id,
          media_type,
          media_file_name,
          media_mime_type,
          media_size_bytes
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8::uuid,
          $9,
          $10,
          $11,
          $12::bigint
        )
        RETURNING
          ${POSTER_PROMOTION_CREATIVE_COLUMNS}
      `,
      [
        input.campaignId,
        input.purpose.trim(),
        input.headline.trim(),
        input.body.trim(),
        input.callToAction.trim(),
        input.destinationUrl.trim(),
        POSTER_PROMOTION_DISCLOSURE,

        input.media?.assetId ??
          null,

        input.media?.type ??
          null,

        input.media?.fileName.trim() ??
          null,

        input.media?.mimeType
          .trim()
          .toLowerCase() ??
          null,

        input.media?.sizeBytes ??
          null,
      ],
      executor
    );

  const created =
    mapOptionalPosterPromotionCreativeRow(
      result.rows[0]
    );

  if (
    !created
  ) {
    throw new Error(
      "Poster Promotion creative was not returned after creation."
    );
  }

  return created;
}

async function resolvePosterPromotionCreativeUpdateResult(
  campaignId:
    string,
  updatedRow:
    PosterPromotionCreativeDatabaseRow |
    undefined,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PosterPromotionCreativeUpdateResult
> {
  const updated =
    mapOptionalPosterPromotionCreativeRow(
      updatedRow
    );

  if (
    updated
  ) {
    return {
      status:
        "updated",

      creative:
        updated,
    };
  }

  const current =
    await findPosterPromotionCreativeByCampaignId(
      campaignId,
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

    current,
  };
}

export async function updatePosterPromotionCreative(
  input:
    UpdatePosterPromotionCreativeInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  PosterPromotionCreativeUpdateResult
> {
  const result =
    await executeDatabaseQuery<
      PosterPromotionCreativeDatabaseRow
    >(
      `
        UPDATE app.poster_promotion_creatives
        SET
          purpose =
            $3,

          headline =
            $4,

          body =
            $5,

          call_to_action =
            $6,

          destination_url =
            $7,

          disclosure =
            $8,

          media_asset_id =
            $9::uuid,

          media_type =
            $10,

          media_file_name =
            $11,

          media_mime_type =
            $12,

          media_size_bytes =
            $13::bigint,

          updated_at =
            CURRENT_TIMESTAMP,

          row_version =
            row_version + 1
        WHERE campaign_id =
          $1::uuid

          AND row_version =
            $2::bigint
        RETURNING
          ${POSTER_PROMOTION_CREATIVE_COLUMNS}
      `,
      [
        input.campaignId,
        input.expectedRowVersion,
        input.purpose.trim(),
        input.headline.trim(),
        input.body.trim(),
        input.callToAction.trim(),
        input.destinationUrl.trim(),
        POSTER_PROMOTION_DISCLOSURE,

        input.media?.assetId ??
          null,

        input.media?.type ??
          null,

        input.media?.fileName.trim() ??
          null,

        input.media?.mimeType
          .trim()
          .toLowerCase() ??
          null,

        input.media?.sizeBytes ??
          null,
      ],
      executor
    );

  return await resolvePosterPromotionCreativeUpdateResult(
    input.campaignId,
    result.rows[0],
    executor
  );
}

export const posterPromotionRepository:
  PosterPromotionRepository = {
  findCreativeByCampaignId:
    findPosterPromotionCreativeByCampaignId,

  createCreative:
    createPosterPromotionCreative,

  updateCreative:
    updatePosterPromotionCreative,
};