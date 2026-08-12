import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createMediaAssetRecord,
  findMediaAssetById,
  updateMediaAssetStatus,
} from "../src/domains/media/media-asset.repository.js";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001701";

const USER_ID =
  "00000000-0000-4000-8000-000000001702";

const CREATED_AT =
  new Date(
    "2026-08-12T12:00:00.000Z"
  );

const DATABASE_ROW = {
  id:
    ASSET_ID,

  purpose:
    "poster_promotion" as const,

  media_type:
    "image" as const,

  file_name:
    "poster-campaign.webp",

  mime_type:
    "image/webp",

  size_bytes:
    "2048",

  storage_provider:
    "gcs" as const,

  storage_bucket:
    "poster-media-production",

  storage_object_key:
    "poster/media-assets/poster-promotion/asset.webp",

  status:
    "pending_upload" as const,

  created_by_user_id:
    USER_ID,

  created_at:
    CREATED_AT,

  updated_at:
    CREATED_AT,

  row_version:
    "1",
};

function createExecutor(
  rowsByCall:
    readonly (
      readonly Record<
        string,
        unknown
      >[]
    )[]
) {
  const calls: {
    text:
      string;

    values:
      readonly unknown[];
  }[] =
    [];

  let index =
    0;

  const executor = {
    query:
      async (
        text:
          string,
        values?:
          readonly unknown[]
      ) => {
        calls.push({
          text,

          values:
            values ??
            [],
        });

        const rows =
          rowsByCall[
            index
          ] ??
          [];

        index +=
          1;

        return {
          command:
            "",

          rowCount:
            rows.length,

          oid:
            0,

          fields:
            [],

          rows:
            Array.from(
              rows
            ),
        };
      },
  } as unknown as
    DatabaseQueryExecutor;

  return {
    calls,
    executor,
  };
}

describe(
  "Media Asset repository",
  () => {
    it(
      "reads and maps an authoritative media asset",
      async () => {
        const mocks =
          createExecutor([
            [
              DATABASE_ROW,
            ],
          ]);

        const result =
          await findMediaAssetById(
            ASSET_ID,
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          assetId:
            ASSET_ID,

          purpose:
            "poster_promotion",

          mediaType:
            "image",

          fileName:
            "poster-campaign.webp",

          mimeType:
            "image/webp",

          sizeBytes:
            2048,

          storage: {
            provider:
              "gcs",

            bucket:
              "poster-media-production",

            objectKey:
              "poster/media-assets/poster-promotion/asset.webp",
          },

          status:
            "pending_upload",

          createdByUserId:
            USER_ID,

          createdAt:
            CREATED_AT,

          updatedAt:
            CREATED_AT,

          rowVersion:
            "1",
        });

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "FROM app.media_assets"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          ASSET_ID,
        ]);
      }
    );

    it(
      "creates a normalized authoritative media asset",
      async () => {
        const mocks =
          createExecutor([
            [
              DATABASE_ROW,
            ],
          ]);

        const result =
          await createMediaAssetRecord(
            {
              assetId:
                ASSET_ID,

              purpose:
                "poster_promotion",

              mediaType:
                "image",

              fileName:
                "  poster-campaign.webp  ",

              mimeType:
                "  IMAGE/WEBP  ",

              sizeBytes:
                2048,

              storage: {
                provider:
                  "gcs",

                bucket:
                  "  poster-media-production  ",

                objectKey:
                  "  poster/media-assets/poster-promotion/asset.webp  ",
              },

              status:
                "pending_upload",

              createdByUserId:
                USER_ID,

              createdAt:
                CREATED_AT,
            },
            mocks.executor
          );

        expect(
          result.assetId
        ).toBe(
          ASSET_ID
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "INSERT INTO app.media_assets"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          ASSET_ID,
          "poster_promotion",
          "image",
          "poster-campaign.webp",
          "image/webp",
          2048,
          "gcs",
          "poster-media-production",
          "poster/media-assets/poster-promotion/asset.webp",
          "pending_upload",
          USER_ID,
          CREATED_AT,
        ]);
      }
    );

    it(
      "updates lifecycle status using optimistic concurrency",
      async () => {
        const updatedRow = {
          ...DATABASE_ROW,

          status:
            "ready" as const,

          row_version:
            "2",
        };

        const mocks =
          createExecutor([
            [
              updatedRow,
            ],
          ]);

        const result =
          await updateMediaAssetStatus(
            {
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",

              status:
                "ready",
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "updated",

          asset:
            expect.objectContaining({
              assetId:
                ASSET_ID,

              status:
                "ready",

              rowVersion:
                "2",
            }),
        });

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "UPDATE app.media_assets"
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "AND row_version ="
        );

        expect(
          mocks.calls[0]?.text
        ).not.toContain(
          "row_version = row_version + 1"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          ASSET_ID,
          "1",
          "ready",
        ]);
      }
    );

    it(
      "returns conflict with the authoritative current asset",
      async () => {
        const currentRow = {
          ...DATABASE_ROW,

          status:
            "ready" as const,

          row_version:
            "4",
        };

        const mocks =
          createExecutor([
            [],
            [
              currentRow,
            ],
          ]);

        const result =
          await updateMediaAssetStatus(
            {
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",

              status:
                "failed",
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "conflict",

          current:
            expect.objectContaining({
              assetId:
                ASSET_ID,

              status:
                "ready",

              rowVersion:
                "4",
            }),
        });

        expect(
          mocks.calls
        ).toHaveLength(
          2
        );

        expect(
          mocks.calls[1]?.text
        ).toContain(
          "FROM app.media_assets"
        );
      }
    );

    it(
      "returns not found when the media asset no longer exists",
      async () => {
        const mocks =
          createExecutor([
            [],
            [],
          ]);

        const result =
          await updateMediaAssetStatus(
            {
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",

              status:
                "failed",
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "not_found",
        });

        expect(
          mocks.calls
        ).toHaveLength(
          2
        );
      }
    );
  }
);