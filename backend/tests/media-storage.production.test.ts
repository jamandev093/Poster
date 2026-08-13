import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  MediaStorageConfiguration,
} from "../src/config/media-storage.config.js";

import {
  createMediaAssetStorageLocatorFactory,
} from "../src/application/media/media-storage-locator.factory.js";

import {
  createProductionMediaStorageRuntime,
} from "../src/application/media/media-storage.production.js";

import type {
  MediaAssetRepository,
} from "../src/domains/media/media-asset.types.js";

import type {
  CreateSignedMediaUploadInput,
  MediaStorageAdapter,
} from "../src/domains/media/media-storage-adapter.types.js";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001901";

const USER_ID =
  "00000000-0000-4000-8000-000000001902";

const NOW =
  new Date(
    "2026-08-13T06:00:00.000Z"
  );

const CONFIGURATION:
  MediaStorageConfiguration = {
  provider:
    "gcs",

  bucket:
    "poster-media-production",

  objectPrefix:
    "poster/media-assets",
};

function createRepository():
  MediaAssetRepository {
  return {
    async findById() {
      return null;
    },

    async create(
      input
    ) {
      return {
        ...input,

        updatedAt:
          input.createdAt,

        rowVersion:
          "1",
      };
    },

    async updateStatus() {
      return {
        status:
          "not_found",
      };
    },
  };
}

function createAdapterHarness() {
  const uploadInputs:
    CreateSignedMediaUploadInput[] =
      [];

  const adapter:
    MediaStorageAdapter = {
    provider:
      "gcs",

    async createSignedUpload(
      input
    ) {
      uploadInputs.push(
        input
      );

      return {
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
            input.contentType,
        },
      };
    },

    async createSignedRead() {
      throw new Error(
        "createSignedRead not expected in this test."
      );
    },

    async getObjectMetadata() {
      return null;
    },

    async deleteObject() {
      return {
        status:
          "not_found",
      };
    },
  };

  return {
    adapter,
    uploadInputs,
  };
}

describe(
  "Production media storage runtime",
  () => {
    it(
      "creates Backend-owned deterministic GCS object keys",
      () => {
        const factory =
          createMediaAssetStorageLocatorFactory({
            ...CONFIGURATION,

            objectPrefix:
              "/poster/media-assets/",
          });

        const locator =
          factory({
            assetId:
              ASSET_ID,

            purpose:
              "poster_promotion",

            mediaType:
              "image",

            fileName:
              "../../dangerous.webp",

            mimeType:
              "image/webp",
          });

        expect(
          locator
        ).toEqual({
          provider:
            "gcs",

          bucket:
            "poster-media-production",

          objectKey:
            `poster/media-assets/poster_promotion/${ASSET_ID}`,
        });

        expect(
          locator.objectKey
        ).not.toContain(
          "dangerous"
        );

        expect(
          locator.objectKey
        ).not.toContain(
          ".."
        );
      }
    );

    it(
      "rejects unsafe configured path segments",
      () => {
        expect(
          () =>
            createMediaAssetStorageLocatorFactory({
              ...CONFIGURATION,

              objectPrefix:
                "poster/../media",
            })
        ).toThrow(
          "invalid path segment"
        );

        expect(
          () =>
            createMediaAssetStorageLocatorFactory({
              ...CONFIGURATION,

              objectPrefix:
                "poster\\media",
            })
        ).toThrow(
          "invalid path segment"
        );
      }
    );

    it(
      "rejects invalid asset identity",
      () => {
        const factory =
          createMediaAssetStorageLocatorFactory(
            CONFIGURATION
          );

        expect(
          () =>
            factory({
              assetId:
                "../bad",

              purpose:
                "poster_promotion",

              mediaType:
                "image",

              fileName:
                "creative.webp",

              mimeType:
                "image/webp",
            })
        ).toThrow(
          "valid UUID"
        );
      }
    );

    it(
      "composes configuration, adapter, locator and lifecycle service",
      async () => {
        const repository =
          createRepository();

        const {
          adapter,
          uploadInputs,
        } =
          createAdapterHarness();

        let configurationCalls =
          0;

        const runtime =
          createProductionMediaStorageRuntime({
            repository,

            getConfiguration:
              () => {
                configurationCalls +=
                  1;

                return CONFIGURATION;
              },

            createStorageAdapter:
              () =>
                adapter,

            createAssetId:
              () =>
                ASSET_ID,

            now:
              () =>
                NOW,
          });

        const result =
          await runtime
            .lifecycleService
            .createUpload({
              purpose:
                "poster_promotion",

              mediaType:
                "image",

              fileName:
                "../../creative.webp",

              mimeType:
                "image/webp",

              sizeBytes:
                2048,

              createdByUserId:
                USER_ID,
            });

        expect(
          configurationCalls
        ).toBe(
          1
        );

        expect(
          runtime.configuration
        ).toEqual(
          CONFIGURATION
        );

        expect(
          runtime.storageAdapter
        ).toBe(
          adapter
        );

        expect(
          result.asset.storage
        ).toEqual({
          provider:
            "gcs",

          bucket:
            "poster-media-production",

          objectKey:
            `poster/media-assets/poster_promotion/${ASSET_ID}`,
        });

        expect(
          uploadInputs
        ).toEqual([
          {
            storage: {
              provider:
                "gcs",

              bucket:
                "poster-media-production",

              objectKey:
                `poster/media-assets/poster_promotion/${ASSET_ID}`,
            },

            contentType:
              "image/webp",

            ttlSeconds:
              600,
          },
        ]);
      }
    );

    it(
      "works when optional test hooks are omitted",
      () => {
        const repository =
          createRepository();

        const {
          adapter,
        } =
          createAdapterHarness();

        const runtime =
          createProductionMediaStorageRuntime({
            repository,

            getConfiguration:
              () =>
                CONFIGURATION,

            createStorageAdapter:
              () =>
                adapter,
          });

        expect(
          runtime.storageAdapter.provider
        ).toBe(
          "gcs"
        );
      }
    );

    it(
      "fails closed on storage provider mismatch",
      () => {
        const repository =
          createRepository();

        const {
          adapter,
        } =
          createAdapterHarness();

        const invalidAdapter =
          {
            ...adapter,

            provider:
              "invalid",
          } as unknown as
            MediaStorageAdapter;

        expect(
          () =>
            createProductionMediaStorageRuntime({
              repository,

              getConfiguration:
                () =>
                  CONFIGURATION,

              createStorageAdapter:
                () =>
                  invalidAdapter,
            })
        ).toThrow(
          "does not match"
        );
      }
    );
  }
);