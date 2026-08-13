import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createMediaAssetLifecycleService,
} from "../src/application/media/media-asset-lifecycle.service.js";

import type {
  CreateMediaAssetRecordInput,
  MediaAssetRecord,
  MediaAssetRepository,
  MediaAssetStatusUpdateResult,
  MediaAssetStorageLocator,
  UpdateMediaAssetStatusInput,
} from "../src/domains/media/media-asset.types.js";

import type {
  CreateSignedMediaReadInput,
  CreateSignedMediaUploadInput,
  DeleteStoredMediaObjectResult,
  MediaStorageAdapter,
  SignedMediaRead,
  SignedMediaUpload,
  StoredMediaObjectMetadata,
} from "../src/domains/media/media-storage-adapter.types.js";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001801";

const USER_ID =
  "00000000-0000-4000-8000-000000001802";

const NOW =
  new Date(
    "2026-08-13T05:30:00.000Z"
  );

const STORAGE:
  MediaAssetStorageLocator = {
  provider:
    "gcs",

  bucket:
    "poster-media",

  objectKey:
    "poster/media-assets/example.webp",
};

function createAsset(
  overrides:
    Partial<
      MediaAssetRecord
    > =
      {}
): MediaAssetRecord {
  return {
    assetId:
      ASSET_ID,

    purpose:
      "poster_promotion",

    mediaType:
      "image",

    fileName:
      "example.webp",

    mimeType:
      "image/webp",

    sizeBytes:
      2048,

    storage:
      STORAGE,

    status:
      "pending_upload",

    createdByUserId:
      USER_ID,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",

    ...overrides,
  };
}

function createHarness(
  initialAsset:
    MediaAssetRecord |
    null =
      null
) {
  let currentAsset =
    initialAsset;

  const operationOrder:
    string[] =
      [];

  const create =
    vi.fn(
      async (
        input:
          CreateMediaAssetRecordInput
      ): Promise<
        MediaAssetRecord
      > => {
        currentAsset =
          createAsset({
            assetId:
              input.assetId,

            purpose:
              input.purpose,

            mediaType:
              input.mediaType,

            fileName:
              input.fileName,

            mimeType:
              input.mimeType,

            sizeBytes:
              input.sizeBytes,

            storage:
              input.storage,

            status:
              input.status,

            createdByUserId:
              input.createdByUserId,

            createdAt:
              input.createdAt,

            updatedAt:
              input.createdAt,

            rowVersion:
              "1",
          });

        return currentAsset;
      }
    );

  const findById =
    vi.fn(
      async (
        _assetId:
          string
      ): Promise<
        MediaAssetRecord |
        null
      > =>
        currentAsset
    );

  const updateStatus =
    vi.fn(
      async (
        input:
          UpdateMediaAssetStatusInput
      ): Promise<
        MediaAssetStatusUpdateResult
      > => {
        operationOrder.push(
          "update-status"
        );

        if (!currentAsset) {
          return {
            status:
              "not_found",
          };
        }

        if (
          currentAsset.rowVersion !==
          input.expectedRowVersion
        ) {
          return {
            status:
              "conflict",

            current:
              currentAsset,
          };
        }

        currentAsset =
          createAsset({
            ...currentAsset,

            status:
              input.status,

            rowVersion:
              String(
                Number(
                  currentAsset.rowVersion
                ) +
                1
              ),
          });

        return {
          status:
            "updated",

          asset:
            currentAsset,
        };
      }
    );

  const repository:
    MediaAssetRepository = {
    create,
    findById,
    updateStatus,
  };

  const createSignedUpload =
    vi.fn(
      async (
        _input:
          CreateSignedMediaUploadInput
      ): Promise<
        SignedMediaUpload
      > => ({
        url:
          "https://signed.example/upload",

        method:
          "PUT",

        expiresAt:
          new Date(
            NOW.getTime() +
              600000
          ),

        requiredHeaders: {
          "Content-Type":
            "image/webp",
        },
      })
    );

  const createSignedRead =
    vi.fn(
      async (
        _input:
          CreateSignedMediaReadInput
      ): Promise<
        SignedMediaRead
      > => ({
        url:
          "https://signed.example/read",

        method:
          "GET",

        expiresAt:
          new Date(
            NOW.getTime() +
              300000
          ),
      })
    );

  const getObjectMetadata =
    vi.fn(
      async (
        _storage:
          MediaAssetStorageLocator
      ): Promise<
        StoredMediaObjectMetadata |
        null
      > => ({
        contentType:
          "image/webp",

        sizeBytes:
          2048,

        etag:
          "etag",

        updatedAt:
          NOW,
      })
    );

  const deleteObject =
    vi.fn(
      async (
        _storage:
          MediaAssetStorageLocator
      ): Promise<
        DeleteStoredMediaObjectResult
      > => {
        operationOrder.push(
          "delete-object"
        );

        return {
          status:
            "deleted",
        };
      }
    );

  const storageAdapter:
    MediaStorageAdapter = {
    provider:
      "gcs",

    createSignedUpload,
    createSignedRead,
    getObjectMetadata,
    deleteObject,
  };

  const service =
    createMediaAssetLifecycleService({
      repository,
      storageAdapter,

      createAssetId:
        () =>
          ASSET_ID,

      createStorageLocator:
        () =>
          STORAGE,

      now:
        () =>
          NOW,
    });

  return {
    service,
    create,
    findById,
    updateStatus,
    createSignedUpload,
    createSignedRead,
    getObjectMetadata,
    deleteObject,
    operationOrder,

    setAsset:
      (
        asset:
          MediaAssetRecord |
          null
      ) => {
        currentAsset =
          asset;
      },
  };
}

describe(
  "Media Asset lifecycle service",
  () => {
    it(
      "creates pending asset and signed upload session",
      async () => {
        const harness =
          createHarness();

        const result =
          await harness.service
            .createUpload({
              purpose:
                "poster_promotion",

              mediaType:
                "image",

              fileName:
                " example.webp ",

              mimeType:
                " IMAGE/WEBP ",

              sizeBytes:
                2048,

              createdByUserId:
                USER_ID,
            });

        expect(
          result.asset.status
        ).toBe(
          "pending_upload"
        );

        expect(
          result.asset.assetId
        ).toBe(
          ASSET_ID
        );

        expect(
          result.asset.fileName
        ).toBe(
          "example.webp"
        );

        expect(
          result.asset.mimeType
        ).toBe(
          "image/webp"
        );

        expect(
          result.upload.method
        ).toBe(
          "PUT"
        );

        expect(
          harness.createSignedUpload
        ).toHaveBeenCalledWith({
          storage:
            STORAGE,

          contentType:
            "image/webp",

          ttlSeconds:
            600,
        });
      }
    );

    it(
      "reissues upload only while asset remains pending",
      async () => {
        const harness =
          createHarness(
            createAsset()
          );

        const result =
          await harness.service
            .createUploadForExistingAsset(
              ASSET_ID
            );

        expect(
          result?.upload.method
        ).toBe(
          "PUT"
        );

        harness.setAsset(
          createAsset({
            status:
              "ready",
          })
        );

        await expect(
          harness.service
            .createUploadForExistingAsset(
              ASSET_ID
            )
        ).rejects.toThrow(
          "Only pending media assets"
        );
      }
    );

    it(
      "promotes matching uploaded object to ready",
      async () => {
        const harness =
          createHarness(
            createAsset()
          );

        const result =
          await harness.service
            .verifyUpload({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "ready"
        );

        expect(
          harness.updateStatus
        ).toHaveBeenCalledWith({
          assetId:
            ASSET_ID,

          expectedRowVersion:
            "1",

          status:
            "ready",
        });
      }
    );

    it(
      "keeps asset pending when object does not yet exist",
      async () => {
        const harness =
          createHarness(
            createAsset()
          );

        harness
          .getObjectMetadata
          .mockResolvedValueOnce(
            null
          );

        const result =
          await harness.service
            .verifyUpload({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "not_uploaded"
        );

        expect(
          harness.updateStatus
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "marks mismatched uploaded object failed",
      async () => {
        const harness =
          createHarness(
            createAsset()
          );

        harness
          .getObjectMetadata
          .mockResolvedValueOnce({
            contentType:
              "image/png",

            sizeBytes:
              999,

            etag:
              null,

            updatedAt:
              NOW,
          });

        const result =
          await harness.service
            .verifyUpload({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "invalid_upload"
        );

        expect(
          harness.updateStatus
        ).toHaveBeenCalledWith({
          assetId:
            ASSET_ID,

          expectedRowVersion:
            "1",

          status:
            "failed",
        });
      }
    );

    it(
      "creates signed read only for ready assets",
      async () => {
        const harness =
          createHarness(
            createAsset({
              status:
                "ready",
            })
          );

        const result =
          await harness.service
            .createRead(
              ASSET_ID
            );

        expect(
          result.status
        ).toBe(
          "ready"
        );

        expect(
          harness.createSignedRead
        ).toHaveBeenCalledWith({
          storage:
            STORAGE,

          ttlSeconds:
            300,
        });

        harness.setAsset(
          createAsset()
        );

        const pending =
          await harness.service
            .createRead(
              ASSET_ID
            );

        expect(
          pending.status
        ).toBe(
          "not_ready"
        );
      }
    );

    it(
      "propagates optimistic verification conflict",
      async () => {
        const harness =
          createHarness(
            createAsset({
              rowVersion:
                "5",
            })
          );

        const result =
          await harness.service
            .verifyUpload({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "conflict"
        );
      }
    );

    it(
      "checks and updates deletion state before deleting storage",
      async () => {
        const harness =
          createHarness(
            createAsset({
              status:
                "ready",
            })
          );

        const result =
          await harness.service
            .deleteAsset({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "deleted"
        );

        expect(
          harness.operationOrder
        ).toEqual([
          "update-status",
          "delete-object",
        ]);

        expect(
          harness.updateStatus
        ).toHaveBeenCalledWith({
          assetId:
            ASSET_ID,

          expectedRowVersion:
            "1",

          status:
            "deleted",
        });

        expect(
          harness.deleteObject
        ).toHaveBeenCalledWith(
          STORAGE
        );
      }
    );

    it(
      "never deletes storage for a stale deletion request",
      async () => {
        const harness =
          createHarness(
            createAsset({
              status:
                "ready",

              rowVersion:
                "9",
            })
          );

        const result =
          await harness.service
            .deleteAsset({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "1",
            });

        expect(
          result.status
        ).toBe(
          "conflict"
        );

        expect(
          harness.deleteObject
        ).not.toHaveBeenCalled();

        expect(
          harness.updateStatus
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "retries physical cleanup for an already deleted asset",
      async () => {
        const harness =
          createHarness(
            createAsset({
              status:
                "deleted",

              rowVersion:
                "4",
            })
          );

        const result =
          await harness.service
            .deleteAsset({
              assetId:
                ASSET_ID,

              expectedRowVersion:
                "4",
            });

        expect(
          result.status
        ).toBe(
          "deleted"
        );

        expect(
          harness.deleteObject
        ).toHaveBeenCalledWith(
          STORAGE
        );

        expect(
          harness.updateStatus
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects MIME type inconsistent with media type",
      async () => {
        const harness =
          createHarness();

        await expect(
          harness.service
            .createUpload({
              purpose:
                "poster_promotion",

              mediaType:
                "image",

              fileName:
                "bad.mp4",

              mimeType:
                "video/mp4",

              sizeBytes:
                100,

              createdByUserId:
                USER_ID,
            })
        ).rejects.toThrow(
          "must match image media type"
        );

        expect(
          harness.create
        ).not.toHaveBeenCalled();
      }
    );
  }
);