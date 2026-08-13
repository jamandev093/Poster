import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createGoogleCloudMediaStorageAdapter,
  type GoogleCloudObjectMetadata,
  type GoogleCloudSignedUrlConfig,
  type GoogleCloudStorageFilePort,
} from "../src/domains/media/google-cloud-media-storage.adapter.js";

import {
  MEDIA_SIGNED_URL_MAX_TTL_SECONDS,
  MEDIA_SIGNED_URL_MIN_TTL_SECONDS,
} from "../src/domains/media/media-storage-adapter.types.js";

const NOW =
  new Date(
    "2026-08-13T05:00:00.000Z"
  );

const STORAGE = {
  provider:
    "gcs" as const,

  bucket:
    "poster-media-production",

  objectKey:
    "poster/media-assets/promotion/example.webp",
};

interface HarnessOptions {
  metadata?:
    GoogleCloudObjectMetadata;

  metadataError?:
    unknown;

  deleteError?:
    unknown;
}

function createHarness(
  options:
    HarnessOptions =
      {}
) {
  const signedConfigs:
    GoogleCloudSignedUrlConfig[] =
      [];

  const resolvedLocations: {
    bucket:
      string;

    objectKey:
      string;
  }[] =
    [];

  let metadataCalls =
    0;

  let deleteCalls =
    0;

  const file:
    GoogleCloudStorageFilePort = {
    getSignedUrl:
      async config => {
        signedConfigs.push(
          config
        );

        return [
          "https://signed.example/object",
        ];
      },

    getMetadata:
      async () => {
        metadataCalls +=
          1;

        if (
          options.metadataError !==
          undefined
        ) {
          throw options
            .metadataError;
        }

        return [
          options.metadata ?? {
            contentType:
              "image/webp",

            size:
              "2048",

            etag:
              "etag-1",

            updated:
              "2026-08-13T04:59:00.000Z",
          },
        ];
      },

    delete:
      async () => {
        deleteCalls +=
          1;

        if (
          options.deleteError !==
          undefined
        ) {
          throw options
            .deleteError;
        }
      },
  };

  const adapter =
    createGoogleCloudMediaStorageAdapter({
      fileResolver:
        (
          bucket,
          objectKey
        ) => {
          resolvedLocations.push({
            bucket,
            objectKey,
          });

          return file;
        },

      now:
        () =>
          NOW,
    });

  return {
    adapter,
    signedConfigs,
    resolvedLocations,

    getMetadataCalls:
      () =>
        metadataCalls,

    getDeleteCalls:
      () =>
        deleteCalls,
  };
}

describe(
  "Google Cloud media storage adapter",
  () => {
    it(
      "creates a V4 PUT signed upload bound to content type",
      async () => {
        const harness =
          createHarness();

        const result =
          await harness.adapter
            .createSignedUpload({
              storage:
                STORAGE,

              contentType:
                " IMAGE/WEBP ",

              ttlSeconds:
                600,
            });

        const expiresAt =
          new Date(
            NOW.getTime() +
              600000
          );

        expect(
          result
        ).toEqual({
          url:
            "https://signed.example/object",

          method:
            "PUT",

          expiresAt,

          requiredHeaders: {
            "Content-Type":
              "image/webp",
          },
        });

        expect(
          harness.signedConfigs
        ).toEqual([
          {
            version:
              "v4",

            action:
              "write",

            expires:
              expiresAt,

            contentType:
              "image/webp",
          },
        ]);

        expect(
          harness.resolvedLocations
        ).toEqual([
          {
            bucket:
              STORAGE.bucket,

            objectKey:
              STORAGE.objectKey,
          },
        ]);
      }
    );

    it(
      "creates a V4 GET signed read URL",
      async () => {
        const harness =
          createHarness();

        const result =
          await harness.adapter
            .createSignedRead({
              storage:
                STORAGE,

              ttlSeconds:
                300,
            });

        const expiresAt =
          new Date(
            NOW.getTime() +
              300000
          );

        expect(
          result
        ).toEqual({
          url:
            "https://signed.example/object",

          method:
            "GET",

          expiresAt,
        });

        expect(
          harness.signedConfigs
        ).toEqual([
          {
            version:
              "v4",

            action:
              "read",

            expires:
              expiresAt,
          },
        ]);
      }
    );

    it(
      "rejects signed URL TTL values outside Poster policy",
      async () => {
        const harness =
          createHarness();

        await expect(
          harness.adapter
            .createSignedRead({
              storage:
                STORAGE,

              ttlSeconds:
                MEDIA_SIGNED_URL_MIN_TTL_SECONDS -
                1,
            })
        ).rejects.toThrow(
          RangeError
        );

        await expect(
          harness.adapter
            .createSignedRead({
              storage:
                STORAGE,

              ttlSeconds:
                MEDIA_SIGNED_URL_MAX_TTL_SECONDS +
                1,
            })
        ).rejects.toThrow(
          RangeError
        );

        await expect(
          harness.adapter
            .createSignedRead({
              storage:
                STORAGE,

              ttlSeconds:
                60.5,
            })
        ).rejects.toThrow(
          RangeError
        );

        expect(
          harness.signedConfigs
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "rejects blank upload content type before signing",
      async () => {
        const harness =
          createHarness();

        await expect(
          harness.adapter
            .createSignedUpload({
              storage:
                STORAGE,

              contentType:
                "   ",

              ttlSeconds:
                600,
            })
        ).rejects.toThrow(
          "content type must not be blank"
        );

        expect(
          harness.signedConfigs
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "maps authoritative stored-object metadata",
      async () => {
        const harness =
          createHarness();

        const result =
          await harness.adapter
            .getObjectMetadata(
              STORAGE
            );

        expect(
          result
        ).toEqual({
          contentType:
            "image/webp",

          sizeBytes:
            2048,

          etag:
            "etag-1",

          updatedAt:
            new Date(
              "2026-08-13T04:59:00.000Z"
            ),
        });

        expect(
          harness.getMetadataCalls()
        ).toBe(
          1
        );
      }
    );

    it(
      "returns null when stored object metadata is not found",
      async () => {
        const harness =
          createHarness({
            metadataError: {
              code:
                404,
            },
          });

        await expect(
          harness.adapter
            .getObjectMetadata(
              STORAGE
            )
        ).resolves.toBeNull();
      }
    );

    it(
      "deletes a stored object",
      async () => {
        const harness =
          createHarness();

        await expect(
          harness.adapter
            .deleteObject(
              STORAGE
            )
        ).resolves.toEqual({
          status:
            "deleted",
        });

        expect(
          harness.getDeleteCalls()
        ).toBe(
          1
        );
      }
    );

    it(
      "returns not found when deleting an absent object",
      async () => {
        const harness =
          createHarness({
            deleteError: {
              code:
                404,
            },
          });

        await expect(
          harness.adapter
            .deleteObject(
              STORAGE
            )
        ).resolves.toEqual({
          status:
            "not_found",
        });
      }
    );
  }
);