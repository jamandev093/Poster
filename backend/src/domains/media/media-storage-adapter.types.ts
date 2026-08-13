import type {
  MediaAssetStorageLocator,
  MediaAssetStorageProvider,
} from "./media-asset.types.js";

/*
 * Poster signed-media URL policy.
 *
 * Signed URLs are short-lived bearer credentials.
 * They must never become persistent media identity,
 * database state, analytics payloads, or log fields.
 */
export const MEDIA_SIGNED_URL_MIN_TTL_SECONDS =
  60;

export const MEDIA_SIGNED_UPLOAD_DEFAULT_TTL_SECONDS =
  600;

export const MEDIA_SIGNED_READ_DEFAULT_TTL_SECONDS =
  300;

export const MEDIA_SIGNED_URL_MAX_TTL_SECONDS =
  900;

/*
 * A signed upload is bound to the expected content type.
 *
 * Callers must send every returned required header
 * exactly as supplied by the Backend storage adapter.
 */
export interface CreateSignedMediaUploadInput {
  storage:
    MediaAssetStorageLocator;

  contentType:
    string;

  ttlSeconds:
    number;
}

export interface SignedMediaUpload {
  url:
    string;

  method:
    "PUT";

  expiresAt:
    Date;

  requiredHeaders:
    Readonly<
      Record<
        string,
        string
      >
    >;
}

export interface CreateSignedMediaReadInput {
  storage:
    MediaAssetStorageLocator;

  ttlSeconds:
    number;
}

export interface SignedMediaRead {
  url:
    string;

  method:
    "GET";

  expiresAt:
    Date;
}

/*
 * Object metadata is used after upload to verify that
 * the stored object actually matches Poster-owned media
 * metadata before the asset can transition to ready.
 */
export interface StoredMediaObjectMetadata {
  contentType:
    string | null;

  sizeBytes:
    number;

  etag:
    string | null;

  updatedAt:
    Date | null;
}

export type DeleteStoredMediaObjectResult =
  | {
      status:
        "deleted";
    }
  | {
      status:
        "not_found";
    };

/*
 * Provider-neutral storage adapter contract.
 *
 * Business/application code depends on this interface,
 * not on Google Cloud Storage classes.
 *
 * Physical bucket/object identity remains Backend-owned.
 */
export interface MediaStorageAdapter {
  readonly provider:
    MediaAssetStorageProvider;

  createSignedUpload:
    (
      input:
        CreateSignedMediaUploadInput
    ) =>
      Promise<
        SignedMediaUpload
      >;

  createSignedRead:
    (
      input:
        CreateSignedMediaReadInput
    ) =>
      Promise<
        SignedMediaRead
      >;

  getObjectMetadata:
    (
      storage:
        MediaAssetStorageLocator
    ) =>
      Promise<
        StoredMediaObjectMetadata |
        null
      >;

  deleteObject:
    (
      storage:
        MediaAssetStorageLocator
    ) =>
      Promise<
        DeleteStoredMediaObjectResult
      >;
}