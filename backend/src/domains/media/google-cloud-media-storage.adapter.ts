import {
  Storage,
} from "@google-cloud/storage";

import type {
  MediaAssetStorageLocator,
} from "./media-asset.types.js";

import {
  MEDIA_SIGNED_URL_MAX_TTL_SECONDS,
  MEDIA_SIGNED_URL_MIN_TTL_SECONDS,
  type CreateSignedMediaReadInput,
  type CreateSignedMediaUploadInput,
  type MediaStorageAdapter,
  type SignedMediaRead,
  type SignedMediaUpload,
  type StoredMediaObjectMetadata,
} from "./media-storage-adapter.types.js";

export interface GoogleCloudSignedUrlConfig {
  version:
    "v4";

  action:
    "read" |
    "write";

  expires:
    Date;

  contentType?:
    string;
}

export interface GoogleCloudObjectMetadata {
  contentType?:
    unknown;

  size?:
    unknown;

  etag?:
    unknown;

  updated?:
    unknown;
}

export interface GoogleCloudStorageFilePort {
  getSignedUrl:
    (
      config:
        GoogleCloudSignedUrlConfig
    ) =>
      Promise<
        readonly [
          string
        ]
      >;

  getMetadata:
    () =>
      Promise<
        readonly [
          GoogleCloudObjectMetadata
        ]
      >;

  delete:
    () =>
      Promise<
        void
      >;
}

export type GoogleCloudStorageFileResolver =
  (
    bucket:
      string,
    objectKey:
      string
  ) =>
    GoogleCloudStorageFilePort;

export interface GoogleCloudMediaStorageAdapterOptions {
  fileResolver?:
    GoogleCloudStorageFileResolver;

  now?:
    () =>
      Date;
}

function createSdkFileResolver():
  GoogleCloudStorageFileResolver {
  const storage =
    new Storage();

  return (
    bucket,
    objectKey
  ) => {
    const file =
      storage
        .bucket(
          bucket
        )
        .file(
          objectKey
        );

    return {
      getSignedUrl:
        async config => {
          const [
            url,
          ] =
            await file
              .getSignedUrl(
                config
              );

          return [
            url,
          ];
        },

      getMetadata:
        async () => {
          const [
            metadata,
          ] =
            await file
              .getMetadata();

          return [
            metadata as
              GoogleCloudObjectMetadata,
          ];
        },

      delete:
        async () => {
          await file
            .delete();
        },
    };
  };
}

function assertStorageLocator(
  storage:
    MediaAssetStorageLocator
): {
  bucket:
    string;

  objectKey:
    string;
} {
  if (
    storage.provider !==
    "gcs"
  ) {
    throw new Error(
      "Google Cloud media storage adapter requires a GCS storage locator."
    );
  }

  const bucket =
    storage.bucket.trim();

  const objectKey =
    storage.objectKey.trim();

  if (bucket.length === 0) {
    throw new Error(
      "Media storage bucket must not be blank."
    );
  }

  if (objectKey.length === 0) {
    throw new Error(
      "Media storage object key must not be blank."
    );
  }

  return {
    bucket,
    objectKey,
  };
}

function assertSignedUrlTtl(
  ttlSeconds:
    number
): void {
  if (
    !Number.isInteger(
      ttlSeconds
    ) ||
    ttlSeconds <
      MEDIA_SIGNED_URL_MIN_TTL_SECONDS ||
    ttlSeconds >
      MEDIA_SIGNED_URL_MAX_TTL_SECONDS
  ) {
    throw new RangeError(
      `Signed media URL TTL must be an integer between ${MEDIA_SIGNED_URL_MIN_TTL_SECONDS} and ${MEDIA_SIGNED_URL_MAX_TTL_SECONDS} seconds.`
    );
  }
}

function normalizeContentType(
  contentType:
    string
): string {
  const normalized =
    contentType
      .trim()
      .toLowerCase();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      "Signed media upload content type must not be blank."
    );
  }

  return normalized;
}

function createExpiry(
  now:
    () =>
      Date,
  ttlSeconds:
    number
): Date {
  const current =
    now();

  const currentTime =
    current.getTime();

  if (
    !Number.isFinite(
      currentTime
    )
  ) {
    throw new Error(
      "Media storage clock returned an invalid date."
    );
  }

  return new Date(
    currentTime +
      ttlSeconds *
        1000
  );
}

function assertSignedUrl(
  url:
    string
): string {
  const normalized =
    url.trim();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      "Google Cloud Storage returned an empty signed URL."
    );
  }

  return normalized;
}

function isNotFoundError(
  error:
    unknown
): boolean {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return false;
  }

  const candidate =
    error as {
      code?:
        unknown;

      statusCode?:
        unknown;
    };

  return (
    candidate.code ===
      404 ||
    candidate.code ===
      "404" ||
    candidate.statusCode ===
      404 ||
    candidate.statusCode ===
      "404"
  );
}

function optionalString(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  return value.length > 0
    ? value
    : null;
}

function parseSizeBytes(
  value:
    unknown
): number {
  const parsed =
    typeof value ===
    "number"
      ? value
      : typeof value ===
          "string" &&
        /^[0-9]+$/.test(
          value
        )
        ? Number(
            value
          )
        : Number.NaN;

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed < 0
  ) {
    throw new Error(
      "Google Cloud Storage returned an invalid object size."
    );
  }

  return parsed;
}

function parseUpdatedAt(
  value:
    unknown
): Date | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const parsed =
    new Date(
      value
    );

  return Number.isFinite(
    parsed.getTime()
  )
    ? parsed
    : null;
}

export function createGoogleCloudMediaStorageAdapter(
  options:
    GoogleCloudMediaStorageAdapterOptions =
      {}
): MediaStorageAdapter {
  const fileResolver =
    options.fileResolver ??
    createSdkFileResolver();

  const now =
    options.now ??
    (() =>
      new Date());

  return {
    provider:
      "gcs",

    createSignedUpload:
      async (
        input:
          CreateSignedMediaUploadInput
      ): Promise<
        SignedMediaUpload
      > => {
        assertSignedUrlTtl(
          input.ttlSeconds
        );

        const contentType =
          normalizeContentType(
            input.contentType
          );

        const location =
          assertStorageLocator(
            input.storage
          );

        const expiresAt =
          createExpiry(
            now,
            input.ttlSeconds
          );

        const file =
          fileResolver(
            location.bucket,
            location.objectKey
          );

        const [
          signedUrl,
        ] =
          await file
            .getSignedUrl({
              version:
                "v4",

              action:
                "write",

              expires:
                expiresAt,

              contentType,
            });

        return {
          url:
            assertSignedUrl(
              signedUrl
            ),

          method:
            "PUT",

          expiresAt,

          requiredHeaders: {
            "Content-Type":
              contentType,
          },
        };
      },

    createSignedRead:
      async (
        input:
          CreateSignedMediaReadInput
      ): Promise<
        SignedMediaRead
      > => {
        assertSignedUrlTtl(
          input.ttlSeconds
        );

        const location =
          assertStorageLocator(
            input.storage
          );

        const expiresAt =
          createExpiry(
            now,
            input.ttlSeconds
          );

        const file =
          fileResolver(
            location.bucket,
            location.objectKey
          );

        const [
          signedUrl,
        ] =
          await file
            .getSignedUrl({
              version:
                "v4",

              action:
                "read",

              expires:
                expiresAt,
            });

        return {
          url:
            assertSignedUrl(
              signedUrl
            ),

          method:
            "GET",

          expiresAt,
        };
      },

    getObjectMetadata:
      async (
        storage:
          MediaAssetStorageLocator
      ): Promise<
        StoredMediaObjectMetadata |
        null
      > => {
        const location =
          assertStorageLocator(
            storage
          );

        const file =
          fileResolver(
            location.bucket,
            location.objectKey
          );

        try {
          const [
            metadata,
          ] =
            await file
              .getMetadata();

          return {
            contentType:
              optionalString(
                metadata
                  .contentType
              ),

            sizeBytes:
              parseSizeBytes(
                metadata
                  .size
              ),

            etag:
              optionalString(
                metadata
                  .etag
              ),

            updatedAt:
              parseUpdatedAt(
                metadata
                  .updated
              ),
          };
        } catch (error) {
          if (
            isNotFoundError(
              error
            )
          ) {
            return null;
          }

          throw error;
        }
      },

    deleteObject:
      async (
        storage:
          MediaAssetStorageLocator
      ) => {
        const location =
          assertStorageLocator(
            storage
          );

        const file =
          fileResolver(
            location.bucket,
            location.objectKey
          );

        try {
          await file
            .delete();

          return {
            status:
              "deleted",
          };
        } catch (error) {
          if (
            isNotFoundError(
              error
            )
          ) {
            return {
              status:
                "not_found",
            };
          }

          throw error;
        }
      },
  };
}