import {
  randomUUID,
} from "node:crypto";

import type {
  MediaAssetMediaType,
  MediaAssetPurpose,
  MediaAssetRecord,
  MediaAssetRepository,
  MediaAssetStorageLocator,
} from "../../domains/media/media-asset.types.js";

import {
  MEDIA_SIGNED_READ_DEFAULT_TTL_SECONDS,
  MEDIA_SIGNED_UPLOAD_DEFAULT_TTL_SECONDS,
  type MediaStorageAdapter,
  type SignedMediaRead,
  type SignedMediaUpload,
} from "../../domains/media/media-storage-adapter.types.js";

export interface CreateMediaAssetUploadInput {
  purpose:
    MediaAssetPurpose;

  mediaType:
    MediaAssetMediaType;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;

  createdByUserId:
    string;
}

export interface CreateMediaAssetUploadResult {
  asset:
    MediaAssetRecord;

  upload:
    SignedMediaUpload;
}

export interface VerifyUploadedMediaAssetInput {
  assetId:
    string;

  expectedRowVersion:
    string;
}

export type VerifyUploadedMediaAssetResult =
  | {
      status:
        "ready";

      asset:
        MediaAssetRecord;
    }
  | {
      status:
        "not_uploaded";

      asset:
        MediaAssetRecord;
    }
  | {
      status:
        "invalid_upload";

      asset:
        MediaAssetRecord;
    }
  | {
      status:
        "conflict";

      current:
        MediaAssetRecord;
    }
  | {
      status:
        "not_found";
    }
  | {
      status:
        "invalid_state";

      asset:
        MediaAssetRecord;
    };

export type CreateMediaAssetReadResult =
  | {
      status:
        "ready";

      asset:
        MediaAssetRecord;

      read:
        SignedMediaRead;
    }
  | {
      status:
        "not_found";
    }
  | {
      status:
        "not_ready";

      asset:
        MediaAssetRecord;
    };

export interface DeleteMediaAssetInput {
  assetId:
    string;

  expectedRowVersion:
    string;
}

export type DeleteMediaAssetResult =
  | {
      status:
        "deleted";

      asset:
        MediaAssetRecord;
    }
  | {
      status:
        "conflict";

      current:
        MediaAssetRecord;
    }
  | {
      status:
        "not_found";
    };

export interface MediaAssetStorageLocatorFactoryInput {
  assetId:
    string;

  purpose:
    MediaAssetPurpose;

  mediaType:
    MediaAssetMediaType;

  fileName:
    string;

  mimeType:
    string;
}

export type MediaAssetStorageLocatorFactory =
  (
    input:
      MediaAssetStorageLocatorFactoryInput
  ) =>
    MediaAssetStorageLocator;

export interface MediaAssetLifecycleServiceDependencies {
  repository:
    MediaAssetRepository;

  storageAdapter:
    MediaStorageAdapter;

  createStorageLocator:
    MediaAssetStorageLocatorFactory;

  createAssetId?:
    () =>
      string;

  now?:
    () =>
      Date;
}

function normalizeFileName(
  fileName:
    string
): string {
  const normalized =
    fileName.trim();

  if (normalized.length === 0) {
    throw new Error(
      "Media asset file name must not be blank."
    );
  }

  return normalized;
}

function normalizeMimeType(
  mediaType:
    MediaAssetMediaType,
  mimeType:
    string
): string {
  const normalized =
    mimeType
      .trim()
      .toLowerCase();

  if (normalized.length === 0) {
    throw new Error(
      "Media asset MIME type must not be blank."
    );
  }

  const expectedPrefix =
    mediaType === "image"
      ? "image/"
      : "video/";

  if (
    !normalized.startsWith(
      expectedPrefix
    )
  ) {
    throw new Error(
      `Media asset MIME type must match ${mediaType} media type.`
    );
  }

  return normalized;
}

function assertSizeBytes(
  sizeBytes:
    number
): void {
  if (
    !Number.isSafeInteger(
      sizeBytes
    ) ||
    sizeBytes <= 0
  ) {
    throw new Error(
      "Media asset size must be a positive safe integer."
    );
  }
}

function assertProviderMatches(
  asset:
    MediaAssetRecord,
  adapter:
    MediaStorageAdapter
): void {
  if (
    asset.storage.provider !==
    adapter.provider
  ) {
    throw new Error(
      "Media asset storage provider does not match the configured storage adapter."
    );
  }
}

function normalizeStoredContentType(
  contentType:
    string | null
): string | null {
  if (contentType === null) {
    return null;
  }

  return contentType
    .trim()
    .toLowerCase();
}

export function createMediaAssetLifecycleService(
  dependencies:
    MediaAssetLifecycleServiceDependencies
) {
  const createAssetId =
    dependencies.createAssetId ??
    (() =>
      randomUUID());

  const now =
    dependencies.now ??
    (() =>
      new Date());

  async function createUpload(
    input:
      CreateMediaAssetUploadInput
  ): Promise<
    CreateMediaAssetUploadResult
  > {
    const fileName =
      normalizeFileName(
        input.fileName
      );

    const mimeType =
      normalizeMimeType(
        input.mediaType,
        input.mimeType
      );

    assertSizeBytes(
      input.sizeBytes
    );

    const assetId =
      createAssetId();

    const createdAt =
      now();

    if (
      !Number.isFinite(
        createdAt.getTime()
      )
    ) {
      throw new Error(
        "Media lifecycle clock returned an invalid date."
      );
    }

    const storage =
      dependencies
        .createStorageLocator({
          assetId,
          purpose:
            input.purpose,
          mediaType:
            input.mediaType,
          fileName,
          mimeType,
        });

    if (
      storage.provider !==
      dependencies
        .storageAdapter
        .provider
    ) {
      throw new Error(
        "Generated media storage locator does not match the configured adapter."
      );
    }

    const asset =
      await dependencies
        .repository
        .create({
          assetId,
          purpose:
            input.purpose,
          mediaType:
            input.mediaType,
          fileName,
          mimeType,
          sizeBytes:
            input.sizeBytes,
          storage,
          status:
            "pending_upload",
          createdByUserId:
            input.createdByUserId,
          createdAt,
        });

    const upload =
      await dependencies
        .storageAdapter
        .createSignedUpload({
          storage:
            asset.storage,

          contentType:
            asset.mimeType,

          ttlSeconds:
            MEDIA_SIGNED_UPLOAD_DEFAULT_TTL_SECONDS,
        });

    return {
      asset,
      upload,
    };
  }

  async function createUploadForExistingAsset(
    assetId:
      string
  ): Promise<
    CreateMediaAssetUploadResult |
    null
  > {
    const asset =
      await dependencies
        .repository
        .findById(
          assetId
        );

    if (!asset) {
      return null;
    }

    if (
      asset.status !==
      "pending_upload"
    ) {
      throw new Error(
        "Only pending media assets can receive an upload URL."
      );
    }

    assertProviderMatches(
      asset,
      dependencies.storageAdapter
    );

    const upload =
      await dependencies
        .storageAdapter
        .createSignedUpload({
          storage:
            asset.storage,

          contentType:
            asset.mimeType,

          ttlSeconds:
            MEDIA_SIGNED_UPLOAD_DEFAULT_TTL_SECONDS,
        });

    return {
      asset,
      upload,
    };
  }

  async function verifyUpload(
    input:
      VerifyUploadedMediaAssetInput
  ): Promise<
    VerifyUploadedMediaAssetResult
  > {
    const asset =
      await dependencies
        .repository
        .findById(
          input.assetId
        );

    if (!asset) {
      return {
        status:
          "not_found",
      };
    }

    if (
      asset.status !==
      "pending_upload"
    ) {
      return {
        status:
          "invalid_state",

        asset,
      };
    }

    assertProviderMatches(
      asset,
      dependencies.storageAdapter
    );

    const metadata =
      await dependencies
        .storageAdapter
        .getObjectMetadata(
          asset.storage
        );

    if (!metadata) {
      return {
        status:
          "not_uploaded",

        asset,
      };
    }

    const contentMatches =
      normalizeStoredContentType(
        metadata.contentType
      ) ===
      asset.mimeType
        .trim()
        .toLowerCase();

    const sizeMatches =
      metadata.sizeBytes ===
      asset.sizeBytes;

    const nextStatus =
      contentMatches &&
      sizeMatches
        ? "ready"
        : "failed";

    const update =
      await dependencies
        .repository
        .updateStatus({
          assetId:
            asset.assetId,

          expectedRowVersion:
            input.expectedRowVersion,

          status:
            nextStatus,
        });

    if (
      update.status ===
      "conflict"
    ) {
      return {
        status:
          "conflict",

        current:
          update.current,
      };
    }

    if (
      update.status ===
      "not_found"
    ) {
      return {
        status:
          "not_found",
      };
    }

    if (
      nextStatus ===
      "ready"
    ) {
      return {
        status:
          "ready",

        asset:
          update.asset,
      };
    }

    return {
      status:
        "invalid_upload",

      asset:
        update.asset,
    };
  }

  async function createRead(
    assetId:
      string
  ): Promise<
    CreateMediaAssetReadResult
  > {
    const asset =
      await dependencies
        .repository
        .findById(
          assetId
        );

    if (!asset) {
      return {
        status:
          "not_found",
      };
    }

    if (
      asset.status !==
      "ready"
    ) {
      return {
        status:
          "not_ready",

        asset,
      };
    }

    assertProviderMatches(
      asset,
      dependencies.storageAdapter
    );

    const read =
      await dependencies
        .storageAdapter
        .createSignedRead({
          storage:
            asset.storage,

          ttlSeconds:
            MEDIA_SIGNED_READ_DEFAULT_TTL_SECONDS,
        });

    return {
      status:
        "ready",

      asset,
      read,
    };
  }

  async function deleteAsset(
    input:
      DeleteMediaAssetInput
  ): Promise<
    DeleteMediaAssetResult
  > {
    const asset =
      await dependencies
        .repository
        .findById(
          input.assetId
        );

    if (!asset) {
      return {
        status:
          "not_found",
      };
    }

    if (
      asset.rowVersion !==
      input.expectedRowVersion
    ) {
      return {
        status:
          "conflict",

        current:
          asset,
      };
    }

    assertProviderMatches(
      asset,
      dependencies.storageAdapter
    );

    if (
      asset.status ===
      "deleted"
    ) {
      await dependencies
        .storageAdapter
        .deleteObject(
          asset.storage
        );

      return {
        status:
          "deleted",

        asset,
      };
    }

    const update =
      await dependencies
        .repository
        .updateStatus({
          assetId:
            asset.assetId,

          expectedRowVersion:
            input.expectedRowVersion,

          status:
            "deleted",
        });

    if (
      update.status ===
      "conflict"
    ) {
      return {
        status:
          "conflict",

        current:
          update.current,
      };
    }

    if (
      update.status ===
      "not_found"
    ) {
      return {
        status:
          "not_found",
      };
    }

    /*
     * Logical deletion occurs before physical deletion so
     * a stale caller can never delete an object after losing
     * optimistic concurrency.
     *
     * If physical deletion fails, the already-deleted asset
     * can safely retry cleanup on a later delete request.
     */
    await dependencies
      .storageAdapter
      .deleteObject(
        update.asset.storage
      );

    return {
      status:
        "deleted",

      asset:
        update.asset,
    };
  }

  return {
    createUpload,
    createUploadForExistingAsset,
    verifyUpload,
    createRead,
    deleteAsset,
  };
}

export type MediaAssetLifecycleService =
  ReturnType<
    typeof createMediaAssetLifecycleService
  >;