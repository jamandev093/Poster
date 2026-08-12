import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  CreateMediaAssetRecordInput,
  MediaAssetMediaType,
  MediaAssetPurpose,
  MediaAssetRecord,
  MediaAssetRepository,
  MediaAssetStatus,
  MediaAssetStatusUpdateResult,
  MediaAssetStorageProvider,
  UpdateMediaAssetStatusInput,
} from "./media-asset.types.js";

interface MediaAssetDatabaseRow
  extends QueryResultRow {
  id:
    string;

  purpose:
    MediaAssetPurpose;

  media_type:
    MediaAssetMediaType;

  file_name:
    string;

  mime_type:
    string;

  size_bytes:
    string;

  storage_provider:
    MediaAssetStorageProvider;

  storage_bucket:
    string;

  storage_object_key:
    string;

  status:
    MediaAssetStatus;

  created_by_user_id:
    string;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const MEDIA_ASSET_COLUMNS = `
  id,
  purpose,
  media_type,
  file_name,
  mime_type,
  size_bytes::text
    AS size_bytes,
  storage_provider,
  storage_bucket,
  storage_object_key,
  status,
  created_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapMediaAssetRow(
  row:
    MediaAssetDatabaseRow
): MediaAssetRecord {
  return {
    assetId:
      row.id,

    purpose:
      row.purpose,

    mediaType:
      row.media_type,

    fileName:
      row.file_name,

    mimeType:
      row.mime_type,

    sizeBytes:
      Number(
        row.size_bytes
      ),

    storage: {
      provider:
        row.storage_provider,

      bucket:
        row.storage_bucket,

      objectKey:
        row.storage_object_key,
    },

    status:
      row.status,

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

function mapOptionalMediaAssetRow(
  row:
    MediaAssetDatabaseRow |
    undefined
): MediaAssetRecord | null {
  return row
    ? mapMediaAssetRow(
        row
      )
    : null;
}

export async function findMediaAssetById(
  assetId:
    string,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MediaAssetRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      MediaAssetDatabaseRow
    >(
      `
        SELECT
          ${MEDIA_ASSET_COLUMNS}
        FROM app.media_assets
        WHERE id =
          $1::uuid
        LIMIT 1
      `,
      [
        assetId,
      ],
      executor
    );

  return mapOptionalMediaAssetRow(
    result.rows[0]
  );
}

export async function createMediaAssetRecord(
  input:
    CreateMediaAssetRecordInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MediaAssetRecord
> {
  const result =
    await executeDatabaseQuery<
      MediaAssetDatabaseRow
    >(
      `
        INSERT INTO app.media_assets (
          id,
          purpose,
          media_type,
          file_name,
          mime_type,
          size_bytes,
          storage_provider,
          storage_bucket,
          storage_object_key,
          status,
          created_by_user_id,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6::bigint,
          $7,
          $8,
          $9,
          $10,
          $11::uuid,
          $12,
          $12
        )
        RETURNING
          ${MEDIA_ASSET_COLUMNS}
      `,
      [
        input.assetId,
        input.purpose,
        input.mediaType,
        input.fileName.trim(),
        input.mimeType
          .trim()
          .toLowerCase(),
        input.sizeBytes,
        input.storage.provider,
        input.storage.bucket.trim(),
        input.storage.objectKey.trim(),
        input.status,
        input.createdByUserId,
        input.createdAt,
      ],
      executor
    );

  const created =
    mapOptionalMediaAssetRow(
      result.rows[0]
    );

  if (!created) {
    throw new Error(
      "Media asset was not returned after creation."
    );
  }

  return created;
}

async function resolveMediaAssetStatusUpdateResult(
  assetId:
    string,
  updatedRow:
    MediaAssetDatabaseRow |
    undefined,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MediaAssetStatusUpdateResult
> {
  const updated =
    mapOptionalMediaAssetRow(
      updatedRow
    );

  if (updated) {
    return {
      status:
        "updated",

      asset:
        updated,
    };
  }

  const current =
    await findMediaAssetById(
      assetId,
      executor
    );

  if (!current) {
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

export async function updateMediaAssetStatus(
  input:
    UpdateMediaAssetStatusInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  MediaAssetStatusUpdateResult
> {
  const result =
    await executeDatabaseQuery<
      MediaAssetDatabaseRow
    >(
      `
        UPDATE app.media_assets
        SET
          status =
            $3
        WHERE id =
          $1::uuid

          AND row_version =
            $2::bigint
        RETURNING
          ${MEDIA_ASSET_COLUMNS}
      `,
      [
        input.assetId,
        input.expectedRowVersion,
        input.status,
      ],
      executor
    );

  /*
   * app.set_updated_at_and_version() owns both
   * updated_at and row_version advancement.
   *
   * The repository intentionally does not increment
   * row_version itself.
   */
  return await resolveMediaAssetStatusUpdateResult(
    input.assetId,
    result.rows[0],
    executor
  );
}

export const mediaAssetRepository:
  MediaAssetRepository = {
  findById:
    findMediaAssetById,

  create:
    createMediaAssetRecord,

  updateStatus:
    updateMediaAssetStatus,
};