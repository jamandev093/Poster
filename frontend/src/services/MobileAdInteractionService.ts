import MobileActionsApiService from "./MobileActionsApiService";

import type {
  MobileActionAdInteractionEventType,
  MobileActionEngagementMetadata,
} from "./MobileActionsApiService";

import type {
  FeedEntry,
} from "../types/feedEntry";

interface ResolvedAdInteractionDetails {
  feedEntryId: string;
  itemId: string;
  monetizationType: string;
  placement: string;
  advertiserName?: string;
  campaignId?: string | null;
}

interface RecordHiddenItemInput {
  itemId: string;
  placement: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeText(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(/\s+/g, " ");

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeUuid(
  value:
    string |
    null |
    undefined
): string | null {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return null;
  }

  return UUID_PATTERN.test(normalized)
    ? normalized
    : null;
}

function resolveEntryDetails(
  entry:
    FeedEntry
): ResolvedAdInteractionDetails | null {
  switch (entry.type) {
    case "poster_promotion":
      return {
        feedEntryId:
          entry.id,

        itemId:
          entry.promotion.id,

        monetizationType:
          entry.promotion.type,

        placement:
          entry.promotion.placement,
      };

    case "poster_affiliate":
      return {
        feedEntryId:
          entry.id,

        itemId:
          entry.promotion.id,

        monetizationType:
          entry.promotion.type,

        placement:
          entry.promotion.placement,

        advertiserName:
          entry.promotion.partnerName,
      };

    case "direct_sponsorship":
      return {
        feedEntryId:
          entry.id,

        itemId:
          entry.campaign.id,

        monetizationType:
          entry.campaign.type,

        placement:
          entry.campaign.placement,

        campaignId:
          entry.campaign.campaignId,

        advertiserName:
          entry.campaign.advertiserName,
      };

    case "google_native_ad":
      /*
       * Google native-ad billing and measurement
       * are owned by the Google SDK. Do not double
       * count provider-managed events here.
       */
      return null;

    case "article":
      return null;

    default:
      return null;
  }
}

function createDeduplicationKey(
  eventType:
    MobileActionAdInteractionEventType,
  details:
    ResolvedAdInteractionDetails
): string {
  return [
    "mobile-ad",
    eventType,
    details.placement,
    details.feedEntryId,
    details.itemId,
  ].join(":");
}

function buildMetadata(
  eventType:
    MobileActionAdInteractionEventType,
  details:
    ResolvedAdInteractionDetails,
  extraMetadata:
    MobileActionEngagementMetadata =
      {}
): MobileActionEngagementMetadata {
  return {
    ...extraMetadata,

    source:
      "monetized_feed",

    eventType,

    feedEntryId:
      details.feedEntryId,

    itemId:
      details.itemId,

    monetizationType:
      details.monetizationType,

    placement:
      details.placement,

    campaignId:
      details.campaignId ??
      null,

    advertiserName:
      details.advertiserName ??
      null,
  };
}

export default class MobileAdInteractionService {
  /**
   * Backend ad interaction logging is best-effort.
   * It must never block feed scrolling, navigation,
   * local analytics, or hide/report UX.
   */
  private static async recordEntryEvent(
    entry:
      FeedEntry,
    eventType:
      MobileActionAdInteractionEventType,
    metadata:
      MobileActionEngagementMetadata =
        {}
  ): Promise<void> {
    const details =
      resolveEntryDetails(entry);

    if (!details) {
      return;
    }

    try {
      await MobileActionsApiService
        .recordAdInteraction({
          eventType,

          placement:
            details.placement,

          adSlotId:
            null,

          campaignId:
            normalizeUuid(
              details.campaignId
            ),

          creativeId:
            normalizeUuid(
              details.itemId
            ),

          contentId:
            null,

          deduplicationKey:
            createDeduplicationKey(
              eventType,
              details
            ),

          occurredAt:
            new Date().toISOString(),

          metadata:
            buildMetadata(
              eventType,
              details,
              metadata
            ),
        });
    } catch {
      /*
       * Ad event persistence must not interrupt
       * user interaction or existing local analytics.
       */
    }
  }

  static async recordImpression(
    entry:
      FeedEntry
  ): Promise<void> {
    await MobileAdInteractionService
      .recordEntryEvent(
        entry,
        "impression",
        {
          visibilityRule:
            "60_percent_for_1000ms",
        }
      );
  }

  static async recordClick(
    entry:
      FeedEntry
  ): Promise<void> {
    await MobileAdInteractionService
      .recordEntryEvent(
        entry,
        "click"
      );
  }

  static async recordHideForItem(
    input:
      RecordHiddenItemInput
  ): Promise<void> {
    const itemId =
      normalizeText(input.itemId);

    const placement =
      normalizeText(input.placement);

    if (
      !itemId ||
      !placement
    ) {
      return;
    }

    try {
      await MobileActionsApiService
        .recordAdInteraction({
          eventType:
            "hide",

          placement,

          adSlotId:
            null,

          campaignId:
            null,

          creativeId:
            normalizeUuid(itemId),

          contentId:
            null,

          deduplicationKey:
            [
              "mobile-ad",
              "hide",
              placement,
              itemId,
            ].join(":"),

          occurredAt:
            new Date().toISOString(),

          metadata: {
            source:
              "monetized_feed",

            eventType:
              "hide",

            itemId,

            placement,
          },
        });
    } catch {
      /*
       * Hide UX already completed locally.
       * Backend persistence is best-effort.
       */
    }
  }
}
