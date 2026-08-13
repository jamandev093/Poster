import {
  mediaAssetRepository,
} from "../../domains/media/index.js";

import type {
  CreateMediaAssetUploadResult,
  MediaAssetLifecycleService,
  VerifyUploadedMediaAssetResult,
} from "./media-asset-lifecycle.service.js";

import {
  createProductionMediaStorageRuntime,
} from "./media-storage.production.js";

export type AdminPosterPromotionMediaType =
  | "image"
  | "video";

export interface CreateAdminPosterPromotionMediaUploadInput {
  actorUserId:
    string;

  type:
    AdminPosterPromotionMediaType;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;
}

export interface VerifyAdminPosterPromotionMediaUploadInput {
  assetId:
    string;

  expectedRowVersion:
    string;
}

export interface AdminPosterPromotionMediaService {
  createUpload:
    (
      input:
        CreateAdminPosterPromotionMediaUploadInput
    ) =>
      Promise<
        CreateMediaAssetUploadResult
      >;

  verifyUpload:
    (
      input:
        VerifyAdminPosterPromotionMediaUploadInput
    ) =>
      Promise<
        VerifyUploadedMediaAssetResult
      >;
}

export interface CreateAdminPosterPromotionMediaServiceOptions {
  lifecycleService:
    MediaAssetLifecycleService;
}

const IMAGE_MAX_BYTES =
  10 *
  1024 *
  1024;

const VIDEO_MAX_BYTES =
  20 *
  1024 *
  1024;

const IMAGE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const VIDEO_MIME_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);

function normalizeFileName(
  value:
    string
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
      0 ||
    normalized.length >
      255
  ) {
    throw new Error(
      "Poster Promotion media file name is invalid."
    );
  }

  return normalized;
}

function normalizeMimeType(
  type:
    AdminPosterPromotionMediaType,
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toLowerCase();

  const allowed =
    type ===
      "image"
      ? IMAGE_MIME_TYPES
      : VIDEO_MIME_TYPES;

  if (
    !allowed.has(
      normalized
    )
  ) {
    throw new Error(
      "Poster Promotion media MIME type is not supported."
    );
  }

  return normalized;
}

function assertSize(
  type:
    AdminPosterPromotionMediaType,
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
      "Poster Promotion media size is invalid."
    );
  }

  const maximum =
    type ===
      "image"
      ? IMAGE_MAX_BYTES
      : VIDEO_MAX_BYTES;

  if (
    sizeBytes >
    maximum
  ) {
    throw new Error(
      type ===
        "image"
        ? "Poster Promotion images must not exceed 10 MB."
        : "Poster Promotion videos must not exceed 20 MB."
    );
  }
}

export function createAdminPosterPromotionMediaService(
  options:
    CreateAdminPosterPromotionMediaServiceOptions
): AdminPosterPromotionMediaService {
  return {
    async createUpload(
      input
    ) {
      const fileName =
        normalizeFileName(
          input.fileName
        );

      const mimeType =
        normalizeMimeType(
          input.type,
          input.mimeType
        );

      assertSize(
        input.type,
        input.sizeBytes
      );

      return await options
        .lifecycleService
        .createUpload({
          purpose:
            "poster_promotion",

          mediaType:
            input.type,

          fileName,

          mimeType,

          sizeBytes:
            input.sizeBytes,

          createdByUserId:
            input.actorUserId,
        });
    },

    async verifyUpload(
      input
    ) {
      return await options
        .lifecycleService
        .verifyUpload({
          assetId:
            input.assetId,

          expectedRowVersion:
            input.expectedRowVersion,
        });
    },
  };
}

/*
 * This wrapper is lazy by design.
 *
 * Backend boot and unrelated Admin routes do not require
 * POSTER_MEDIA_GCS_BUCKET or Google credentials.
 *
 * The real production media runtime is created only when
 * an Admin actually starts a media operation.
 */
export function createProductionAdminPosterPromotionMediaService():
  AdminPosterPromotionMediaService {
  let lifecycleService:
    MediaAssetLifecycleService |
    null =
      null;

  function getLifecycleService():
    MediaAssetLifecycleService {
    if (
      lifecycleService
    ) {
      return lifecycleService;
    }

    lifecycleService =
      createProductionMediaStorageRuntime({
        repository:
          mediaAssetRepository,
      })
        .lifecycleService;

    return lifecycleService;
  }

  return {
    async createUpload(
      input
    ) {
      const service =
        createAdminPosterPromotionMediaService({
          lifecycleService:
            getLifecycleService(),
        });

      return await service
        .createUpload(
          input
        );
    },

    async verifyUpload(
      input
    ) {
      const service =
        createAdminPosterPromotionMediaService({
          lifecycleService:
            getLifecycleService(),
        });

      return await service
        .verifyUpload(
          input
        );
    },
  };
}