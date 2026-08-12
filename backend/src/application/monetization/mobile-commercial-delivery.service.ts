import type {
  MonetizationPlacement,
} from "../../domains/monetization/commercial.types.js";

import {
  listMobileCommercialDeliverySources,
  type MobileCommercialDeliverySourceRecord,
} from "../../domains/monetization/mobile-commercial-delivery.repository.js";

export type MobileCommercialDeliveryType =
  | "direct_sponsorship"
  | "affiliate_promotion";

export type MobileCommercialCreativeFormat =
  | "standard"
  | "sliding";

export type MobileCommercialMediaType =
  | "image"
  | "video";

export interface MobileCommercialDeliveryMediaItem {
  id: string;

  mediaType:
    MobileCommercialMediaType;

  imageUrl:
    | string
    | null;

  videoUrl:
    | string
    | null;

  thumbnailUrl:
    | string
    | null;

  title:
    | string
    | null;
}

interface MobileCommercialDeliveryBase {
  kind:
    "commercial";

  id: string;

  commercialType:
    MobileCommercialDeliveryType;

  campaignId: string;

  placement:
    MonetizationPlacement;

  placements:
    readonly MonetizationPlacement[];

  status:
    "active";

  title: string;

  description:
    | string
    | null;

  destinationUrl: string;

  callToAction: string;

  startAt: string;

  endAt: string;

  creativeFormat:
    MobileCommercialCreativeFormat;

  mediaType:
    | MobileCommercialMediaType
    | null;

  imageUrl:
    | string
    | null;

  videoUrl:
    | string
    | null;

  thumbnailUrl:
    | string
    | null;

  mediaItems:
    readonly MobileCommercialDeliveryMediaItem[];
}

export interface MobileDirectSponsorshipDeliveryItem
  extends MobileCommercialDeliveryBase {
  commercialType:
    "direct_sponsorship";

  advertiserName: string;

  advertiserDomain: string;

  disclosure: string;
}

export interface MobileAffiliatePromotionDeliveryItem
  extends MobileCommercialDeliveryBase {
  commercialType:
    "affiliate_promotion";

  partnerName: string;

  disclosure: string;

  trackingUrl: string;

  canonicalDestinationUrl: string;
}

export type MobileCommercialDeliveryItem =
  | MobileDirectSponsorshipDeliveryItem
  | MobileAffiliatePromotionDeliveryItem;

export interface ListMobileCommercialDeliveryInput {
  placement:
    MonetizationPlacement;

  limit?:
    number;
}

export type ListMobileCommercialDeliverySourcesOperation =
  (
    input: {
      placement:
        MonetizationPlacement;

      limit?:
        number;
    }
  ) => Promise<
    readonly MobileCommercialDeliverySourceRecord[]
  >;

export interface MobileCommercialDeliveryServiceDependencies {
  listSources?:
    ListMobileCommercialDeliverySourcesOperation;
}

export interface MobileCommercialDeliveryService {
  listForPlacement:
    (
      input:
        ListMobileCommercialDeliveryInput
    ) => Promise<
      MobileCommercialDeliveryItem[]
    >;
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
}

function normalizeText(
  value: unknown
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  return normalized ||
    null;
}

function readFirstText(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[],
  keys:
    readonly string[]
): string | null {
  for (
    const record of records
  ) {
    if (!record) {
      continue;
    }

    for (
      const key of keys
    ) {
      const value =
        normalizeText(
          record[key]
        );

      if (value) {
        return value;
      }
    }
  }

  return null;
}

function normalizeHttpUrl(
  value: unknown
): string | null {
  const text =
    normalizeText(
      value
    );

  if (!text) {
    return null;
  }

  try {
    const parsed =
      new URL(text);

    if (
      parsed.protocol !==
        "http:" &&
      parsed.protocol !==
        "https:"
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function readFirstHttpUrl(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[],
  keys:
    readonly string[]
): string | null {
  for (
    const record of records
  ) {
    if (!record) {
      continue;
    }

    for (
      const key of keys
    ) {
      const url =
        normalizeHttpUrl(
          record[key]
        );

      if (url) {
        return url;
      }
    }
  }

  return null;
}

function normalizeDomain(
  value: unknown
): string | null {
  const text =
    normalizeText(
      value
    );

  if (!text) {
    return null;
  }

  try {
    const parsed =
      new URL(
        text.includes(
          "://"
        )
          ? text
          : `https://${text}`
      );

    const hostname =
      parsed.hostname
        .trim()
        .toLowerCase();

    return hostname ||
      null;
  } catch {
    return null;
  }
}

function domainFromUrl(
  value: string
): string | null {
  try {
    const parsed =
      new URL(value);

    return (
      parsed.hostname
        .trim()
        .toLowerCase() ||
      null
    );
  } catch {
    return null;
  }
}

function getCreativeRecords(
  source:
    MobileCommercialDeliverySourceRecord
): readonly (
  | Record<string, unknown>
  | null
)[] {
  const root =
    source
      .requestCreativeSpec;

  if (!root) {
    return [];
  }

  const creative =
    isRecord(
      root["creative"]
    )
      ? root["creative"]
      : null;

  const media =
    isRecord(
      root["media"]
    )
      ? root["media"]
      : null;

  return [
    creative,
    media,
    root,
  ];
}

function resolveCreativeFormat(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[],
  mediaItems:
    readonly MobileCommercialDeliveryMediaItem[]
): MobileCommercialCreativeFormat {
  const explicit =
    readFirstText(
      records,
      [
        "creativeFormat",
        "format",
      ]
    )
      ?.toLowerCase();

  if (
    explicit ===
      "sliding"
  ) {
    return "sliding";
  }

  if (
    explicit ===
      "standard"
  ) {
    return "standard";
  }

  return mediaItems.length >
    0
    ? "sliding"
    : "standard";
}

function resolveMediaType(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[],
  imageUrl:
    | string
    | null,
  videoUrl:
    | string
    | null
): MobileCommercialMediaType | null {
  const explicit =
    readFirstText(
      records,
      [
        "mediaType",
        "type",
      ]
    )
      ?.toLowerCase();

  if (
    explicit ===
      "image" ||
    explicit ===
      "video"
  ) {
    return explicit;
  }

  if (videoUrl) {
    return "video";
  }

  if (imageUrl) {
    return "image";
  }

  return null;
}

function findMediaItemsValue(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[]
): readonly unknown[] {
  for (
    const record of records
  ) {
    if (!record) {
      continue;
    }

    const direct =
      record[
        "mediaItems"
      ];

    if (
      Array.isArray(
        direct
      )
    ) {
      return direct;
    }

    const items =
      record["items"];

    if (
      Array.isArray(
        items
      )
    ) {
      return items;
    }
  }

  return [];
}

function mapMediaItems(
  records:
    readonly (
      | Record<string, unknown>
      | null
    )[]
): MobileCommercialDeliveryMediaItem[] {
  const rawItems =
    findMediaItemsValue(
      records
    );

  const result:
    MobileCommercialDeliveryMediaItem[] =
    [];

  for (
    const rawItem of
    rawItems
  ) {
    if (
      !isRecord(rawItem)
    ) {
      continue;
    }

    const id =
      normalizeText(
        rawItem["id"]
      );

    if (!id) {
      continue;
    }

    const imageUrl =
      normalizeHttpUrl(
        rawItem[
          "imageUrl"
        ]
      );

    const videoUrl =
      normalizeHttpUrl(
        rawItem[
          "videoUrl"
        ]
      );

    const thumbnailUrl =
      normalizeHttpUrl(
        rawItem[
          "thumbnailUrl"
        ]
      );

    const explicitType =
      normalizeText(
        rawItem[
          "mediaType"
        ]
      )
        ?.toLowerCase();

    const mediaType:
      MobileCommercialMediaType | null =
      explicitType ===
        "video"
        ? "video"
        : explicitType ===
            "image"
          ? "image"
          : videoUrl
            ? "video"
            : imageUrl
              ? "image"
              : null;

    if (!mediaType) {
      continue;
    }

    if (
      mediaType ===
        "video" &&
      !videoUrl
    ) {
      continue;
    }

    if (
      mediaType ===
        "image" &&
      !imageUrl
    ) {
      continue;
    }

    result.push({
      id,

      mediaType,

      imageUrl,

      videoUrl,

      thumbnailUrl,

      title:
        normalizeText(
          rawItem[
            "title"
          ]
        ),
    });
  }

  return result;
}

interface ResolvedCreative {
  title:
    | string
    | null;

  description:
    | string
    | null;

  callToAction:
    | string
    | null;

  creativeFormat:
    MobileCommercialCreativeFormat;

  mediaType:
    | MobileCommercialMediaType
    | null;

  imageUrl:
    | string
    | null;

  videoUrl:
    | string
    | null;

  thumbnailUrl:
    | string
    | null;

  mediaItems:
    readonly MobileCommercialDeliveryMediaItem[];

  advertiserName:
    | string
    | null;

  advertiserDomain:
    | string
    | null;

  disclosure:
    | string
    | null;
}

function resolveCreative(
  source:
    MobileCommercialDeliverySourceRecord
): ResolvedCreative {
  const records =
    getCreativeRecords(
      source
    );

  const imageUrl =
    readFirstHttpUrl(
      records,
      [
        "imageUrl",
        "image",
      ]
    );

  const videoUrl =
    readFirstHttpUrl(
      records,
      [
        "videoUrl",
        "video",
      ]
    );

  const thumbnailUrl =
    readFirstHttpUrl(
      records,
      [
        "thumbnailUrl",
        "posterUrl",
        "posterImageUrl",
      ]
    );

  const mediaItems =
    mapMediaItems(
      records
    );

  return {
    title:
      readFirstText(
        records,
        [
          "headline",
          "title",
        ]
      ),

    description:
      readFirstText(
        records,
        [
          "body",
          "description",
        ]
      ),

    callToAction:
      readFirstText(
        records,
        [
          "callToAction",
          "cta",
          "ctaLabel",
        ]
      ),

    creativeFormat:
      resolveCreativeFormat(
        records,
        mediaItems
      ),

    mediaType:
      resolveMediaType(
        records,
        imageUrl,
        videoUrl
      ),

    imageUrl,

    videoUrl,

    thumbnailUrl,

    mediaItems,

    advertiserName:
      readFirstText(
        records,
        [
          "advertiserName",
          "brandName",
          "organizationName",
        ]
      ),

    advertiserDomain:
      readFirstText(
        records,
        [
          "advertiserDomain",
          "brandDomain",
          "domain",
        ]
      ),

    disclosure:
      readFirstText(
        records,
        [
          "disclosure",
        ]
      ),
  };
}

function mapDirectSponsorship(
  source:
    MobileCommercialDeliverySourceRecord,
  placement:
    MonetizationPlacement
): MobileDirectSponsorshipDeliveryItem | null {
  if (
    source.campaignType !==
      "direct_sponsorship"
  ) {
    return null;
  }

  const destinationUrl =
    normalizeHttpUrl(
      source
        .requestDestinationUrl
    );

  if (!destinationUrl) {
    return null;
  }

  const creative =
    resolveCreative(
      source
    );

  const advertiserName =
    creative
      .advertiserName ??
    normalizeText(
      source.campaignName
    ) ??
    "Sponsor";

  const advertiserDomain =
    normalizeDomain(
      creative
        .advertiserDomain
    ) ??
    domainFromUrl(
      destinationUrl
    );

  if (!advertiserDomain) {
    return null;
  }

  const title =
    creative.title ??
    normalizeText(
      source.requestTitle
    ) ??
    normalizeText(
      source.campaignName
    );

  if (!title) {
    return null;
  }

  return {
    kind:
      "commercial",

    id:
      `direct:${source.campaignId}`,

    commercialType:
      "direct_sponsorship",

    campaignId:
      source.campaignId,

    placement,

    placements:
      source.placements,

    status:
      "active",

    title,

    description:
      creative.description ??
      normalizeText(
        source.requestObjective
      ),

    destinationUrl,

    callToAction:
      creative
        .callToAction ??
      "Learn More",

    startAt:
      source
        .scheduledStartDate,

    endAt:
      source
        .scheduledEndDate,

    creativeFormat:
      creative
        .creativeFormat,

    mediaType:
      creative
        .mediaType,

    imageUrl:
      creative
        .imageUrl,

    videoUrl:
      creative
        .videoUrl,

    thumbnailUrl:
      creative
        .thumbnailUrl,

    mediaItems:
      creative
        .mediaItems,

    advertiserName,

    advertiserDomain,

    disclosure:
      creative.disclosure ??
      `Sponsored by ${advertiserName}`,
  };
}

function mapAffiliatePromotion(
  source:
    MobileCommercialDeliverySourceRecord,
  placement:
    MonetizationPlacement
): MobileAffiliatePromotionDeliveryItem | null {
  if (
    source.campaignType !==
      "affiliate"
  ) {
    return null;
  }

  /*
   * An affiliate impression/click must remain
   * attributable. Do not silently fall back to a
   * non-tracking URL when tracking is not active.
   */
  if (
    source
      .affiliateTrackingStatus !==
    "active"
  ) {
    return null;
  }

  const trackingUrl =
    normalizeHttpUrl(
      source
        .affiliateTrackingUrl
    );

  const canonicalDestinationUrl =
    normalizeHttpUrl(
      source
        .affiliateDestinationUrl
    );

  if (
    !trackingUrl ||
    !canonicalDestinationUrl
  ) {
    return null;
  }

  const partnerName =
    normalizeText(
      source
        .affiliatePartnerName
    );

  if (!partnerName) {
    return null;
  }

  const creative =
    resolveCreative(
      source
    );

  const title =
    normalizeText(
      source
        .affiliateOfferName
    ) ??
    creative.title ??
    normalizeText(
      source.requestTitle
    ) ??
    normalizeText(
      source.campaignName
    );

  if (!title) {
    return null;
  }

  return {
    kind:
      "commercial",

    id:
      `affiliate:${source.campaignId}`,

    commercialType:
      "affiliate_promotion",

    campaignId:
      source.campaignId,

    placement,

    placements:
      source.placements,

    status:
      "active",

    title,

    description:
      creative.description ??
      normalizeText(
        source.requestObjective
      ),

    /*
     * Mobile opens the active tracking URL.
     * Canonical destination is retained separately
     * for audit/debugging and future validation.
     */
    destinationUrl:
      trackingUrl,

    callToAction:
      creative
        .callToAction ??
      "View Offer",

    startAt:
      source
        .scheduledStartDate,

    endAt:
      source
        .scheduledEndDate,

    creativeFormat:
      creative
        .creativeFormat,

    mediaType:
      creative
        .mediaType,

    imageUrl:
      creative
        .imageUrl,

    videoUrl:
      creative
        .videoUrl,

    thumbnailUrl:
      creative
        .thumbnailUrl,

    mediaItems:
      creative
        .mediaItems,

    partnerName,

    disclosure:
      normalizeText(
        source
          .affiliateDisclosure
      ) ??
      "Affiliate · Poster may earn a commission",

    trackingUrl,

    canonicalDestinationUrl,
  };
}

function normalizeLimit(
  value:
    | number
    | undefined
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {
    return 8;
  }

  return Math.min(
    20,
    Math.max(
      1,
      Math.floor(value)
    )
  );
}

export function createMobileCommercialDeliveryService(
  dependencies:
    MobileCommercialDeliveryServiceDependencies =
    {}
): MobileCommercialDeliveryService {
  const listSources =
    dependencies
      .listSources ??
    (
      input =>
        listMobileCommercialDeliverySources(
          input
        )
    );

  return {
    async listForPlacement(
      input
    ) {
      const placement =
        input.placement;

      const sources =
        await listSources({
          placement,

          limit:
            normalizeLimit(
              input.limit
            ),
        });

      const result:
        MobileCommercialDeliveryItem[] =
        [];

      for (
        const source of
        sources
      ) {
        if (
          !source
            .placements
            .includes(
              placement
            )
        ) {
          continue;
        }

        if (
          source.campaignType ===
          "direct_sponsorship"
        ) {
          const item =
            mapDirectSponsorship(
              source,
              placement
            );

          if (item) {
            result.push(
              item
            );
          }

          continue;
        }

        if (
          source.campaignType ===
          "affiliate"
        ) {
          const item =
            mapAffiliatePromotion(
              source,
              placement
            );

          if (item) {
            result.push(
              item
            );
          }
        }
      }

      return result;
    },
  };
}