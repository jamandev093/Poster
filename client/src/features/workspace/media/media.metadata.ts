import type {
  CreativeFrameProfile,
  CreativeId,
  CreativeMediaRole,
  CreativeMediaType,
  CreativeVersionId,
  MediaDimensions,
  MediaUploadId,
  MediaUploadPreparation,
  SlidingCardSlot,
} from "./media.types";

import type {
  AdvertisingRequestId,
  OrganizationId,
} from "../advertising/advertising.types";

/**
 * Browser-readable metadata is preliminary only.
 *
 * The Backend must independently verify:
 *
 * - true MIME type;
 * - dimensions;
 * - duration;
 * - frame rate;
 * - codecs;
 * - checksum;
 * - malware/file integrity;
 * - creative-rule compliance.
 */

export interface BrowserMediaMetadataInput {
  fileName: string;

  declaredMimeType?: string;

  sizeBytes: number;

  width?: number;

  height?: number;

  durationSeconds?: number;

  /**
   * Browser APIs do not reliably expose true FPS.
   *
   * This value should normally remain undefined until
   * Backend inspection has completed.
   */
  framesPerSecond?: number;

  localPreviewUrl?: string;
}

export interface NormalizedBrowserMediaMetadata {
  originalFileName: string;

  declaredMimeType?: string;

  extension?: string;

  mediaType:
    CreativeMediaType;

  sizeBytes: number;

  dimensions?: MediaDimensions;

  durationMilliseconds?: number;

  framesPerSecond?: number;

  /**
   * Temporary browser-only preview reference.
   *
   * Never persist this value in Backend, database,
   * campaign, or permanent creative records.
   */
  localPreviewUrl?: string;
}

export interface CreateMediaUploadPreparationInput {
  uploadId:
    MediaUploadId;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  creativeId:
    CreativeId;

  creativeVersionId:
    CreativeVersionId;

  role:
    CreativeMediaRole;

  frameProfile:
    CreativeFrameProfile;

  slidingCardSlot?:
    SlidingCardSlot;

  browserMetadata:
    BrowserMediaMetadataInput;
}

const IMAGE_MIME_PREFIX =
  "image/";

const VIDEO_MIME_PREFIX =
  "video/";

const IMAGE_EXTENSIONS =
  new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
  ]);

const VIDEO_EXTENSIONS =
  new Set([
    "mp4",
    "webm",
  ]);

function normalizeOptionalText(
  value:
    string |
    undefined
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

export function normalizeMimeType(
  mimeType:
    string |
    undefined
): string | undefined {
  const normalized =
    normalizeOptionalText(
      mimeType
    );

  return normalized
    ?.toLowerCase();
}

export function getFileExtension(
  fileName:
    string
): string | undefined {
  const trimmed =
    fileName.trim();

  const lastDotIndex =
    trimmed.lastIndexOf(
      "."
    );

  if (
    lastDotIndex <= 0 ||
    lastDotIndex ===
      trimmed.length - 1
  ) {
    return undefined;
  }

  return trimmed
    .slice(
      lastDotIndex + 1
    )
    .toLowerCase();
}

export function inferMediaType(
  fileName:
    string,
  declaredMimeType?:
    string
): CreativeMediaType {
  const normalizedMimeType =
    normalizeMimeType(
      declaredMimeType
    );

  if (
    normalizedMimeType
      ?.startsWith(
        VIDEO_MIME_PREFIX
      )
  ) {
    return "video";
  }

  if (
    normalizedMimeType
      ?.startsWith(
        IMAGE_MIME_PREFIX
      )
  ) {
    return "image";
  }

  const extension =
    getFileExtension(
      fileName
    );

  if (
    extension &&
    VIDEO_EXTENSIONS.has(
      extension
    )
  ) {
    return "video";
  }

  if (
    extension &&
    IMAGE_EXTENSIONS.has(
      extension
    )
  ) {
    return "image";
  }

  /**
   * Unknown browser metadata defaults to image only as a
   * temporary UI classification.
   *
   * Backend MIME inspection remains authoritative and may
   * reject or reclassify the upload.
   */
  return "image";
}

function normalizePositiveInteger(
  value:
    number |
    undefined
): number | undefined {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return undefined;
  }

  return Math.round(
    value
  );
}

function normalizePositiveNumber(
  value:
    number |
    undefined,
  decimalPlaces:
    number
): number | undefined {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return undefined;
  }

  const factor =
    10 **
    decimalPlaces;

  return (
    Math.round(
      value *
        factor
    ) /
    factor
  );
}

export function createMediaDimensions(
  width:
    number |
    undefined,
  height:
    number |
    undefined
): MediaDimensions | undefined {
  const normalizedWidth =
    normalizePositiveInteger(
      width
    );

  const normalizedHeight =
    normalizePositiveInteger(
      height
    );

  if (
    normalizedWidth ===
      undefined ||
    normalizedHeight ===
      undefined
  ) {
    return undefined;
  }

  return {
    width:
      normalizedWidth,

    height:
      normalizedHeight,

    aspectRatio:
      normalizedWidth /
      normalizedHeight,
  };
}

export function convertDurationToMilliseconds(
  durationSeconds:
    number |
    undefined
): number | undefined {
  if (
    durationSeconds ===
      undefined ||
    !Number.isFinite(
      durationSeconds
    ) ||
    durationSeconds <= 0
  ) {
    return undefined;
  }

  return Math.round(
    durationSeconds *
      1000
  );
}

export function normalizeBrowserMediaMetadata(
  input:
    BrowserMediaMetadataInput
): NormalizedBrowserMediaMetadata {
  const originalFileName =
    input.fileName.trim();

  const declaredMimeType =
    normalizeMimeType(
      input.declaredMimeType
    );

  const sizeBytes =
    normalizePositiveInteger(
      input.sizeBytes
    ) ??
    0;

  const mediaType =
    inferMediaType(
      originalFileName,
      declaredMimeType
    );

  const durationMilliseconds =
    mediaType ===
      "video"
      ? convertDurationToMilliseconds(
          input.durationSeconds
        )
      : undefined;

  const framesPerSecond =
    mediaType ===
      "video"
      ? normalizePositiveNumber(
          input.framesPerSecond,
          3
        )
      : undefined;

  return {
    originalFileName,

    declaredMimeType,

    extension:
      getFileExtension(
        originalFileName
      ),

    mediaType,

    sizeBytes,

    dimensions:
      createMediaDimensions(
        input.width,
        input.height
      ),

    durationMilliseconds,

    framesPerSecond,

    localPreviewUrl:
      normalizeOptionalText(
        input.localPreviewUrl
      ),
  };
}

export function createMediaUploadPreparation(
  input:
    CreateMediaUploadPreparationInput
): MediaUploadPreparation {
  const metadata =
    normalizeBrowserMediaMetadata(
      input.browserMetadata
    );

  return {
    uploadId:
      input.uploadId,

    organizationId:
      input.organizationId,

    requestId:
      input.requestId,

    creativeId:
      input.creativeId,

    creativeVersionId:
      input.creativeVersionId,

    role:
      input.role,

    mediaType:
      metadata.mediaType,

    frameProfile:
      input.frameProfile,

    slidingCardSlot:
      input.slidingCardSlot,

    originalFileName:
      metadata.originalFileName,

    declaredMimeType:
      metadata.declaredMimeType ??
      "application/octet-stream",

    sizeBytes:
      metadata.sizeBytes,
  };
}

export function isBrowserPreviewUrl(
  value:
    string |
    undefined
): boolean {
  return Boolean(
    value?.startsWith(
      "blob:"
    )
  );
}

export function removeBrowserPreviewReference(
  metadata:
    NormalizedBrowserMediaMetadata
): Omit<
  NormalizedBrowserMediaMetadata,
  "localPreviewUrl"
> {
  const persistableMetadata = {
    ...metadata,
  };

  delete persistableMetadata.localPreviewUrl;

  return persistableMetadata;
}

