import type {
  CreateMediaAssetReadResult,
} from "../media/media-asset-lifecycle.service.js";

import {
  createProductionMediaStorageRuntime,
} from "../media/media-storage.production.js";

import {
  mediaAssetRepository,
  type MediaAssetRecord,
} from "../../domains/media/index.js";

import type {
  MonetizationPlacement,
} from "../../domains/monetization/commercial.types.js";

import {
  listMobilePosterPromotionDeliverySources,
  type MobilePosterPromotionDeliverySourceRecord,
} from "../../domains/monetization/mobile-poster-promotion-delivery.repository.js";

import {
  POSTER_PROMOTION_DISCLOSURE,
} from "../../domains/monetization/poster-promotion.types.js";

import type {
  MobilePosterPromotionDeliveryItem,
} from "./mobile-commercial-delivery.service.js";

export interface ListMobilePosterPromotionDeliveryInput {
  placement:
    MonetizationPlacement;

  limit?:
    number;
}

export type ListMobilePosterPromotionDeliverySourcesOperation =
  (
    input:
      ListMobilePosterPromotionDeliveryInput
  ) => Promise<
    readonly MobilePosterPromotionDeliverySourceRecord[]
  >;

export type CreateMobilePosterPromotionMediaReadOperation =
  (
    assetId:
      string
  ) => Promise<
    CreateMediaAssetReadResult
  >;

export interface MobilePosterPromotionDeliveryServiceDependencies {
  listSources?:
    ListMobilePosterPromotionDeliverySourcesOperation;

  createRead?:
    CreateMobilePosterPromotionMediaReadOperation;
}

function normalizeText(
  value:
    string
): string | null {
  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeHttpUrl(
  value:
    string
): string | null {
  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(
        normalized
      );

    if (
      parsed.protocol !==
        "https:" &&
      parsed.protocol !==
        "http:"
    ) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

function assetMatchesSource(
  asset:
    MediaAssetRecord,
  source:
    MobilePosterPromotionDeliverySourceRecord
): boolean {
  return (
    asset.assetId ===
      source.assetId &&

    asset.purpose ===
      "poster_promotion" &&

    asset.status ===
      "ready" &&

    asset.mediaType ===
      source.mediaType &&

    asset.fileName.trim() ===
      source.mediaFileName.trim() &&

    asset.mimeType
      .trim()
      .toLowerCase() ===
      source.mediaMimeType
        .trim()
        .toLowerCase() &&

    asset.sizeBytes ===
      source.mediaSizeBytes
  );
}

function createDeliveryItem(
  source:
    MobilePosterPromotionDeliverySourceRecord,
  placement:
    MonetizationPlacement,
  read:
    CreateMediaAssetReadResult
): MobilePosterPromotionDeliveryItem | null {
  if (
    read.status !==
    "ready"
  ) {
    return null;
  }

  if (
    !assetMatchesSource(
      read.asset,
      source
    )
  ) {
    return null;
  }

  if (
    source.disclosure !==
    POSTER_PROMOTION_DISCLOSURE
  ) {
    return null;
  }

  if (
    !source.placements.includes(
      placement
    )
  ) {
    return null;
  }

  const title =
    normalizeText(
      source.headline
    );

  const callToAction =
    normalizeText(
      source.callToAction
    );

  const destinationUrl =
    normalizeHttpUrl(
      source.destinationUrl
    );

  const mediaUrl =
    normalizeHttpUrl(
      read.read.url
    );

  if (
    !title ||
    !callToAction ||
    !destinationUrl ||
    !mediaUrl
  ) {
    return null;
  }

  const description =
    normalizeText(
      source.body
    );

  return {
    kind:
      "commercial",

    id:
      `poster:${source.campaignId}`,

    commercialType:
      "poster_promotion",

    campaignId:
      source.campaignId,

    placement,

    placements:
      source.placements,

    status:
      "active",

    title,

    description,

    destinationUrl,

    callToAction,

    startAt:
      source.scheduledStartDate,

    endAt:
      source.scheduledEndDate,

    creativeFormat:
      "standard",

    mediaType:
      source.mediaType,

    imageUrl:
      source.mediaType ===
        "image"
        ? mediaUrl
        : null,

    videoUrl:
      source.mediaType ===
        "video"
        ? mediaUrl
        : null,

    thumbnailUrl:
      null,

    mediaItems:
      [],

    sourceName:
      "Poster",

    disclosure:
      POSTER_PROMOTION_DISCLOSURE,
  };
}

export function createMobilePosterPromotionDeliveryService(
  dependencies:
    MobilePosterPromotionDeliveryServiceDependencies =
      {}
) {
  const listSources =
    dependencies.listSources ??
    (
      async input =>
        await listMobilePosterPromotionDeliverySources(
          input
        )
    );

  let productionRuntime:
    ReturnType<
      typeof createProductionMediaStorageRuntime
    > |
    null =
      null;

  const createRead:
    CreateMobilePosterPromotionMediaReadOperation =
    dependencies.createRead ??
    (
      async assetId => {
        if (
          !productionRuntime
        ) {
          productionRuntime =
            createProductionMediaStorageRuntime({
              repository:
                mediaAssetRepository,
            });
        }

        return await productionRuntime
          .lifecycleService
          .createRead(
            assetId
          );
      }
    );

  return {
    listForPlacement:
      async (
        input:
          ListMobilePosterPromotionDeliveryInput
      ): Promise<
        MobilePosterPromotionDeliveryItem[]
      > => {
        const sources =
          await listSources(
            input
          );

        const result:
          MobilePosterPromotionDeliveryItem[] =
            [];

        for (
          const source
          of sources
        ) {
          if (
            !source.placements.includes(
              input.placement
            )
          ) {
            continue;
          }

          try {
            const read =
              await createRead(
                source.assetId
              );

            const item =
              createDeliveryItem(
                source,
                input.placement,
                read
              );

            if (
              item
            ) {
              result.push(
                item
              );
            }
          } catch {
            /*
             * One unavailable, stale, or unsignable media
             * asset must not suppress another eligible
             * Poster Promotion.
             */
          }
        }

        return result;
      },
  };
}

export type MobilePosterPromotionDeliveryService =
  ReturnType<
    typeof createMobilePosterPromotionDeliveryService
  >;

export async function listMobilePosterPromotionDeliveries(
  input:
    ListMobilePosterPromotionDeliveryInput
): Promise<
  MobilePosterPromotionDeliveryItem[]
> {
  return await createMobilePosterPromotionDeliveryService()
    .listForPlacement(
      input
    );
}