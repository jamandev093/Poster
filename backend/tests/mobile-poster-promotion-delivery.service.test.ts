import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CreateMediaAssetReadResult,
} from "../src/application/media/media-asset-lifecycle.service.js";

import {
  createMobilePosterPromotionDeliveryService,
} from "../src/application/monetization/mobile-poster-promotion-delivery.service.js";

import type {
  MediaAssetRecord,
} from "../src/domains/media/index.js";

import type {
  MobilePosterPromotionDeliverySourceRecord,
} from "../src/domains/monetization/mobile-poster-promotion-delivery.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001701";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001702";

const SOURCE:
  MobilePosterPromotionDeliverySourceRecord = {
  campaignId:
    CAMPAIGN_ID,

  campaignName:
    "Poster Knowledge",

  placements: [
    "home",
    "search",
    "trending",
  ],

  scheduledStartDate:
    "2026-08-01",

  scheduledEndDate:
    "2026-08-31",

  headline:
    "Discover more with Poster",

  body:
    "Explore a Poster-curated knowledge collection.",

  callToAction:
    "Explore",

  destinationUrl:
    "https://getpostar.com/collections/knowledge",

  disclosure:
    "Promoted by Poster",

  assetId:
    ASSET_ID,

  mediaType:
    "image",

  mediaFileName:
    "poster-knowledge.webp",

  mediaMimeType:
    "image/webp",

  mediaSizeBytes:
    1048576,
};

function createAsset(
  source:
    MobilePosterPromotionDeliverySourceRecord,
  overrides:
    Partial<
      MediaAssetRecord
    > =
      {}
): MediaAssetRecord {
  return {
    assetId:
      source.assetId,

    purpose:
      "poster_promotion",

    mediaType:
      source.mediaType,

    fileName:
      source.mediaFileName,

    mimeType:
      source.mediaMimeType,

    sizeBytes:
      source.mediaSizeBytes,

    storage: {
      provider:
        "gcs",

      bucket:
        "poster-private-media",

      objectKey:
        `poster/media-assets/poster_promotion/${source.assetId}`,
    },

    status:
      "ready",

    createdByUserId:
      "00000000-0000-4000-8000-000000000101",

    createdAt:
      new Date(
        "2026-08-01T00:00:00.000Z"
      ),

    updatedAt:
      new Date(
        "2026-08-01T00:01:00.000Z"
      ),

    rowVersion:
      "2",

    ...overrides,
  };
}

function createReadyRead(
  source:
    MobilePosterPromotionDeliverySourceRecord,
  url:
    string,
  assetOverrides:
    Partial<
      MediaAssetRecord
    > =
      {}
): CreateMediaAssetReadResult {
  return {
    status:
      "ready",

    asset:
      createAsset(
        source,
        assetOverrides
      ),

    read: {
      url,
    },
  } as unknown as
    CreateMediaAssetReadResult;
}

describe(
  "Mobile Poster Promotion delivery service",
  () => {
    it(
      "maps a ready Poster image to a signed Mobile delivery item",
      async () => {
        const listSources =
          vi.fn(
            async () => [
              SOURCE,
            ]
          );

        const createRead =
          vi.fn(
            async () =>
              createReadyRead(
                SOURCE,
                "https://storage.googleapis.com/signed-poster-image"
              )
          );

        const service =
          createMobilePosterPromotionDeliveryService({
            listSources,
            createRead,
          });

        const result =
          await service.listForPlacement({
            placement:
              "home",
          });

        expect(
          createRead
        ).toHaveBeenCalledWith(
          ASSET_ID
        );

        expect(
          result
        ).toEqual([
          expect.objectContaining({
            kind:
              "commercial",

            id:
              `poster:${CAMPAIGN_ID}`,

            commercialType:
              "poster_promotion",

            campaignId:
              CAMPAIGN_ID,

            placement:
              "home",

            status:
              "active",

            title:
              "Discover more with Poster",

            destinationUrl:
              "https://getpostar.com/collections/knowledge",

            callToAction:
              "Explore",

            creativeFormat:
              "standard",

            mediaType:
              "image",

            imageUrl:
              "https://storage.googleapis.com/signed-poster-image",

            videoUrl:
              null,

            sourceName:
              "Poster",

            disclosure:
              "Promoted by Poster",
          }),
        ]);
      }
    );

    it(
      "maps a ready Poster video to the signed video URL",
      async () => {
        const videoSource:
          MobilePosterPromotionDeliverySourceRecord = {
          ...SOURCE,

          assetId:
            "00000000-0000-4000-8000-000000001703",

          mediaType:
            "video",

          mediaFileName:
            "poster-video.mp4",

          mediaMimeType:
            "video/mp4",

          mediaSizeBytes:
            5242880,
        };

        const service =
          createMobilePosterPromotionDeliveryService({
            listSources:
              async () => [
                videoSource,
              ],

            createRead:
              async () =>
                createReadyRead(
                  videoSource,
                  "https://storage.googleapis.com/signed-poster-video"
                ),
          });

        const result =
          await service.listForPlacement({
            placement:
              "search",
          });

        expect(
          result
        ).toHaveLength(
          1
        );

        expect(
          result[0]
        ).toEqual(
          expect.objectContaining({
            commercialType:
              "poster_promotion",

            mediaType:
              "video",

            imageUrl:
              null,

            videoUrl:
              "https://storage.googleapis.com/signed-poster-video",
          })
        );
      }
    );

    it(
      "does not deliver an asset that is not ready",
      async () => {
        const service =
          createMobilePosterPromotionDeliveryService({
            listSources:
              async () => [
                SOURCE,
              ],

            createRead:
              async () => ({
                status:
                  "not_ready",

                asset:
                  createAsset(
                    SOURCE,
                    {
                      status:
                        "pending_upload",
                    }
                  ),
              }),
          });

        await expect(
          service.listForPlacement({
            placement:
              "home",
          })
        ).resolves.toEqual(
          []
        );
      }
    );

    it(
      "rejects signed reads whose authoritative asset metadata does not match the creative",
      async () => {
        const service =
          createMobilePosterPromotionDeliveryService({
            listSources:
              async () => [
                SOURCE,
              ],

            createRead:
              async () =>
                createReadyRead(
                  SOURCE,
                  "https://storage.googleapis.com/signed-mismatch",
                  {
                    sizeBytes:
                      SOURCE.mediaSizeBytes +
                      1,
                  }
                ),
          });

        await expect(
          service.listForPlacement({
            placement:
              "home",
          })
        ).resolves.toEqual(
          []
        );
      }
    );

    it(
      "fails closed for one media signing failure",
      async () => {
        const service =
          createMobilePosterPromotionDeliveryService({
            listSources:
              async () => [
                SOURCE,
              ],

            createRead:
              async () => {
                throw new Error(
                  "signing unavailable"
                );
              },
          });

        await expect(
          service.listForPlacement({
            placement:
              "home",
          })
        ).resolves.toEqual(
          []
        );
      }
    );

    it(
      "does not sign a source that is not eligible for the requested placement",
      async () => {
        const searchOnly:
          MobilePosterPromotionDeliverySourceRecord = {
          ...SOURCE,

          placements: [
            "search",
          ],
        };

        const createRead =
          vi.fn(
            async () =>
              createReadyRead(
                searchOnly,
                "https://storage.googleapis.com/signed-unused"
              )
          );

        const service =
          createMobilePosterPromotionDeliveryService({
            listSources:
              async () => [
                searchOnly,
              ],

            createRead,
          });

        await expect(
          service.listForPlacement({
            placement:
              "home",
          })
        ).resolves.toEqual(
          []
        );

        expect(
          createRead
        ).not.toHaveBeenCalled();
      }
    );
  }
);