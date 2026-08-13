import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminPosterPromotionMediaService,
} from "../src/application/media/admin-poster-promotion-media.service.js";

import type {
  MediaAssetLifecycleService,
} from "../src/application/media/media-asset-lifecycle.service.js";

const ASSET_ID =
  "00000000-0000-4000-8000-000000002001";

const USER_ID =
  "00000000-0000-4000-8000-000000002002";

const NOW =
  new Date(
    "2026-08-13T06:30:00.000Z"
  );

function createLifecycleHarness() {
  const createUpload =
    vi.fn(
      async () => ({
        asset: {
          assetId:
            ASSET_ID,

          purpose:
            "poster_promotion" as const,

          mediaType:
            "image" as const,

          fileName:
            "creative.webp",

          mimeType:
            "image/webp",

          sizeBytes:
            2048,

          storage: {
            provider:
              "gcs" as const,

            bucket:
              "poster-media",

            objectKey:
              `poster/media-assets/poster_promotion/${ASSET_ID}`,
          },

          status:
            "pending_upload" as const,

          createdByUserId:
            USER_ID,

          createdAt:
            NOW,

          updatedAt:
            NOW,

          rowVersion:
            "1",
        },

        upload: {
          url:
            "https://signed.example/upload",

          method:
            "PUT" as const,

          expiresAt:
            new Date(
              NOW.getTime() +
                600000
            ),

          requiredHeaders: {
            "Content-Type":
              "image/webp",
          },
        },
      })
    );

  const verifyUpload =
    vi.fn(
      async () => ({
        status:
          "ready" as const,

        asset: {
          assetId:
            ASSET_ID,

          purpose:
            "poster_promotion" as const,

          mediaType:
            "image" as const,

          fileName:
            "creative.webp",

          mimeType:
            "image/webp",

          sizeBytes:
            2048,

          storage: {
            provider:
              "gcs" as const,

            bucket:
              "poster-media",

            objectKey:
              `poster/media-assets/poster_promotion/${ASSET_ID}`,
          },

          status:
            "ready" as const,

          createdByUserId:
            USER_ID,

          createdAt:
            NOW,

          updatedAt:
            NOW,

          rowVersion:
            "2",
        },
      })
    );

  const lifecycleService = {
    createUpload,
    verifyUpload,

    createUploadForExistingAsset:
      async () =>
        null,

    createRead:
      async () => ({
        status:
          "not_found" as const,
      }),

    deleteAsset:
      async () => ({
        status:
          "not_found" as const,
      }),
  } satisfies
    MediaAssetLifecycleService;

  return {
    lifecycleService,
    createUpload,
    verifyUpload,
  };
}

describe(
  "Admin Poster Promotion media service",
  () => {
    it(
      "creates a normalized Poster Promotion image upload",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        const result =
          await service
            .createUpload({
              actorUserId:
                USER_ID,

              type:
                "image",

              fileName:
                " creative.webp ",

              mimeType:
                " IMAGE/WEBP ",

              sizeBytes:
                2048,
            });

        expect(
          result.asset.assetId
        ).toBe(
          ASSET_ID
        );

        expect(
          harness.createUpload
        ).toHaveBeenCalledWith({
          purpose:
            "poster_promotion",

          mediaType:
            "image",

          fileName:
            "creative.webp",

          mimeType:
            "image/webp",

          sizeBytes:
            2048,

          createdByUserId:
            USER_ID,
        });
      }
    );

    it(
      "accepts the locked video MIME formats",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        await service
          .createUpload({
            actorUserId:
              USER_ID,

            type:
              "video",

            fileName:
              "creative.webm",

            mimeType:
              "video/webm",

            sizeBytes:
              1024,
          });

        expect(
          harness.createUpload
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaType:
              "video",

            mimeType:
              "video/webm",
          })
        );
      }
    );

    it(
      "rejects unsupported media MIME types",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        await expect(
          service.createUpload({
            actorUserId:
              USER_ID,

            type:
              "image",

            fileName:
              "creative.gif",

            mimeType:
              "image/gif",

            sizeBytes:
              1024,
          })
        ).rejects.toThrow(
          "MIME type is not supported"
        );

        expect(
          harness.createUpload
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "enforces the 10 MB image limit",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        await expect(
          service.createUpload({
            actorUserId:
              USER_ID,

            type:
              "image",

            fileName:
              "creative.webp",

            mimeType:
              "image/webp",

            sizeBytes:
              10 *
              1024 *
              1024 +
              1,
          })
        ).rejects.toThrow(
          "10 MB"
        );
      }
    );

    it(
      "enforces the 20 MB video limit",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        await expect(
          service.createUpload({
            actorUserId:
              USER_ID,

            type:
              "video",

            fileName:
              "creative.mp4",

            mimeType:
              "video/mp4",

            sizeBytes:
              20 *
              1024 *
              1024 +
              1,
          })
        ).rejects.toThrow(
          "20 MB"
        );
      }
    );

    it(
      "forwards upload verification with optimistic row version",
      async () => {
        const harness =
          createLifecycleHarness();

        const service =
          createAdminPosterPromotionMediaService({
            lifecycleService:
              harness.lifecycleService,
          });

        const result =
          await service
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
          harness.verifyUpload
        ).toHaveBeenCalledWith({
          assetId:
            ASSET_ID,

          expectedRowVersion:
            "1",
        });
      }
    );
  }
);