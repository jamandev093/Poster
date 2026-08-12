import type {
  DirectSponsoredCampaign,
  MonetizationItem,
  MonetizationMediaItem,
  PosterAffiliatePromotion,
} from "../components/ads";

import type {
  MobileDiscoveryAdSlotContract,
  MobileDiscoveryCommercialDelivery,
  MobileDiscoveryCommercialMediaItem,
} from "./MobileDiscoveryService";

function optionalText(
  value:
    | string
    | null
): string | undefined {
  const normalized =
    value?.trim() ??
    "";

  return normalized ||
    undefined;
}

function mapMediaItem(
  item:
    MobileDiscoveryCommercialMediaItem
): MonetizationMediaItem {
  return {
    id:
      item.id,

    mediaType:
      item.mediaType,

    imageUrl:
      optionalText(
        item.imageUrl
      ),

    videoUrl:
      optionalText(
        item.videoUrl
      ),

    thumbnailUrl:
      optionalText(
        item.thumbnailUrl
      ),

    title:
      optionalText(
        item.title
      ),

    accessibilityLabel:
      optionalText(
        item.title
      ) ??
      "Sponsored media",
  };
}

function mapDirectSponsorship(
  delivery:
    Extract<
      MobileDiscoveryCommercialDelivery,
      {
        commercialType:
          "direct_sponsorship";
      }
    >
): DirectSponsoredCampaign {
  return {
    id:
      delivery.id,

    type:
      "direct_sponsorship",

    placement:
      delivery.placement,

    placements:
      [...delivery.placements],

    status:
      "active",

    creativeFormat:
      delivery.creativeFormat,

    title:
      delivery.title,

    description:
      optionalText(
        delivery.description
      ),

    mediaType:
      delivery.mediaType ??
      undefined,

    imageUrl:
      optionalText(
        delivery.imageUrl
      ),

    videoUrl:
      optionalText(
        delivery.videoUrl
      ),

    thumbnailUrl:
      optionalText(
        delivery.thumbnailUrl
      ),

    mediaItems:
      delivery.mediaItems
        .map(
          mapMediaItem
        ),

    destinationUrl:
      delivery.destinationUrl,

    callToAction:
      delivery.callToAction,

    startAt:
      delivery.startAt,

    endAt:
      delivery.endAt,

    advertiserName:
      delivery.advertiserName,

    advertiserDomain:
      delivery.advertiserDomain,

    disclosure:
      delivery.disclosure,

    campaignId:
      delivery.campaignId,
  };
}

function mapAffiliatePromotion(
  delivery:
    Extract<
      MobileDiscoveryCommercialDelivery,
      {
        commercialType:
          "affiliate_promotion";
      }
    >
): PosterAffiliatePromotion {
  return {
    id:
      delivery.id,

    type:
      "poster_affiliate",

    placement:
      delivery.placement,

    placements:
      [...delivery.placements],

    status:
      "active",

    creativeFormat:
      delivery.creativeFormat,

    sourceName:
      "Poster",

    partnerName:
      delivery.partnerName,

    /*
     * Keep the locked Mobile disclosure text.
     *
     * Backend still validates and preserves its own
     * affiliate disclosure metadata independently.
     */
    disclosure:
      "Affiliate by Poster \u00B7 Poster may earn a commission",
    title:
      delivery.title,

    description:
      optionalText(
        delivery.description
      ),

    mediaType:
      delivery.mediaType ??
      undefined,

    imageUrl:
      optionalText(
        delivery.imageUrl
      ),

    videoUrl:
      optionalText(
        delivery.videoUrl
      ),

    thumbnailUrl:
      optionalText(
        delivery.thumbnailUrl
      ),

    mediaItems:
      delivery.mediaItems
        .map(
          mapMediaItem
        ),

    /*
     * Backend delivery already resolves the active
     * tracking URL as destinationUrl.
     */
    destinationUrl:
      delivery.destinationUrl,

    trackingUrl:
      delivery.trackingUrl,

    callToAction:
      delivery.callToAction,

    startAt:
      delivery.startAt,

    endAt:
      delivery.endAt,
  };
}

function mapDelivery(
  delivery:
    MobileDiscoveryCommercialDelivery
): MonetizationItem {
  if (
    delivery.commercialType ===
      "direct_sponsorship"
  ) {
    return mapDirectSponsorship(
      delivery
    );
  }

  return mapAffiliatePromotion(
    delivery
  );
}

/**
 * Converts only Backend-resolved delivery payloads.
 *
 * Empty/null ad slots produce no local commercial item.
 * Poster Promotion and Google SDK advertising are not
 * manufactured here.
 */
export function mapMobileDiscoveryCommercialItems(
  adSlots:
    readonly MobileDiscoveryAdSlotContract[]
): MonetizationItem[] {
  const seenIds =
    new Set<string>();

  const result:
    MonetizationItem[] =
    [];

  for (
    const slot of
    adSlots
  ) {
    const delivery =
      slot.delivery;

    if (!delivery) {
      continue;
    }

    const mapped =
      mapDelivery(
        delivery
      );

    if (
      seenIds.has(
        mapped.id
      )
    ) {
      continue;
    }

    seenIds.add(
      mapped.id
    );

    result.push(
      mapped
    );
  }

  return result;
}

export default mapMobileDiscoveryCommercialItems;