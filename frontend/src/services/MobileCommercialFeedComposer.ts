import type {
  MonetizationItem,
  MonetizationPlacement,
} from "../components/ads";

import {
  MONETIZATION_CONFIG,
  isMonetizationPlacementEnabled,
} from "../constants/monetization";

import type {
  FeedEntry,
} from "../types/feedEntry";

import mapMobileDiscoveryCommercialItems from "./MobileCommercialDeliveryMapper";

import type {
  MobileDiscoveryAdSlotContract,
} from "./MobileDiscoveryService";

export interface ComposeMobileCommercialFeedEntriesInput {
  entries:
    readonly FeedEntry[];

  adSlots:
    readonly MobileDiscoveryAdSlotContract[];

  placement:
    MonetizationPlacement;

  hiddenItemIds?:
    readonly string[];
}

interface ReadyCommercialSlot {
  placementKey:
    string;

  afterOrganicIndex:
    number;

  itemId:
    string;

  entry:
    FeedEntry;
}

function normalizeHiddenItemIds(
  values:
    readonly string[]
): Set<string> {
  return new Set(
    values
      .map(
        value =>
          value.trim()
      )
      .filter(
        Boolean
      )
  );
}

function isBackendCommercialTypeEnabled(
  item:
    MonetizationItem
): boolean {
  switch (item.type) {
    case "direct_sponsorship":
      return (
        MONETIZATION_CONFIG
          .directSponsorshipsEnabled
      );

    case "poster_affiliate":
      return (
        MONETIZATION_CONFIG
          .affiliatePromotionsEnabled
      );

    case "poster_promotion":
      return (
        MONETIZATION_CONFIG
          .posterPromotionsEnabled
      );

    default:
      return false;
  }
}

function mapBackendItemToFeedEntry(
  item:
    MonetizationItem
): FeedEntry | null {
  switch (item.type) {
    case "direct_sponsorship":
      return {
        id:
          `direct-${item.id}`,

        type:
          "direct_sponsorship",

        campaign:
          item,
      };

    case "poster_affiliate":
      return {
        id:
          `affiliate-${item.id}`,

        type:
          "poster_affiliate",

        promotion:
          item,
      };

    case "poster_promotion":
      return {
        id:
          `poster-${item.id}`,

        type:
          "poster_promotion",

        promotion:
          item,
      };

    default:
      /*
       * Google advertising remains SDK-owned and is
       * intentionally composed by its existing path.
       */
      return null;
  }
}

function createReadyCommercialSlot(
  slot:
    MobileDiscoveryAdSlotContract,
  placement:
    MonetizationPlacement,
  hiddenItemIds:
    ReadonlySet<string>
): ReadyCommercialSlot | null {
  if (
    slot.surface !==
      placement ||
    !Number.isInteger(
      slot.afterOrganicIndex
    ) ||
    slot.afterOrganicIndex <
      0
  ) {
    return null;
  }

  if (
    slot.commercialType !==
      "direct_sponsorship" &&
    slot.commercialType !==
      "affiliate_promotion" &&
    slot.commercialType !==
      "poster_promotion"
  ) {
    return null;
  }

  const item =
    mapMobileDiscoveryCommercialItems(
      [
        slot,
      ]
    )[0];

  if (
    !item ||
    item.placement !==
      placement ||
    hiddenItemIds.has(
      item.id.trim()
    ) ||
    !isBackendCommercialTypeEnabled(
      item
    )
  ) {
    return null;
  }

  const entry =
    mapBackendItemToFeedEntry(
      item
    );

  if (!entry) {
    return null;
  }

  return {
    placementKey:
      slot.placementKey,

    afterOrganicIndex:
      slot.afterOrganicIndex,

    itemId:
      item.id,

    entry,
  };
}

/**
 * Merges paginated discovery slot contracts without
 * treating every page as a new placement coordinate system.
 *
 * Backend currently owns stable placement keys such as:
 *
 *   home:direct-sponsorship:after-4
 *   home:affiliate:after-10
 *
 * Incoming non-null deliveries replace older copies.
 * A null payload from an "older" page does not erase a
 * working delivery already received for the same slot.
 *
 * A full initial/refresh response should still replace
 * state directly instead of using this helper.
 */
export function mergeMobileDiscoveryAdSlots(
  current:
    readonly MobileDiscoveryAdSlotContract[],
  incoming:
    readonly MobileDiscoveryAdSlotContract[]
): MobileDiscoveryAdSlotContract[] {
  const byPlacementKey =
    new Map<
      string,
      MobileDiscoveryAdSlotContract
    >();

  current.forEach(
    slot => {
      byPlacementKey.set(
        slot.placementKey,
        slot
      );
    }
  );

  incoming.forEach(
    slot => {
      const existing =
        byPlacementKey.get(
          slot.placementKey
        );

      if (
        slot.delivery ||
        !existing
      ) {
        byPlacementKey.set(
          slot.placementKey,
          slot
        );
      }
    }
  );

  return Array.from(
    byPlacementKey.values()
  ).sort(
    (
      first,
      second
    ) =>
      first.afterOrganicIndex -
        second.afterOrganicIndex ||
      first.placementKey.localeCompare(
        second.placementKey
      )
  );
}

/**
 * Inserts Backend-resolved Direct Sponsorship and Affiliate
 * deliveries at the exact organic index declared by Backend.
 *
 * Critical rule:
 *
 * Only article entries increment organicCount.
 *
 * Existing locally composed Poster Promotion / Google entries
 * therefore do not alter Backend's organic placement authority.
 */
export default function composeMobileCommercialFeedEntries({
  entries,
  adSlots,
  placement,
  hiddenItemIds = [],
}: ComposeMobileCommercialFeedEntriesInput):
  FeedEntry[] {
  if (
    !isMonetizationPlacementEnabled(
      placement
    ) ||
    entries.length ===
      0 ||
    adSlots.length ===
      0
  ) {
    return [
      ...entries,
    ];
  }

  const hiddenIds =
    normalizeHiddenItemIds(
      hiddenItemIds
    );

  const seenPlacementKeys =
    new Set<string>();

  const seenCommercialItemIds =
    new Set<string>();

  const readySlots:
    ReadyCommercialSlot[] =
    [];

  for (
    const slot of
    adSlots
  ) {
    if (
      seenPlacementKeys.has(
        slot.placementKey
      )
    ) {
      continue;
    }

    const ready =
      createReadyCommercialSlot(
        slot,
        placement,
        hiddenIds
      );

    if (
      !ready ||
      seenCommercialItemIds.has(
        ready.itemId
      )
    ) {
      continue;
    }

    seenPlacementKeys.add(
      ready.placementKey
    );

    seenCommercialItemIds.add(
      ready.itemId
    );

    readySlots.push(
      ready
    );
  }

  readySlots.sort(
    (
      first,
      second
    ) =>
      first.afterOrganicIndex -
        second.afterOrganicIndex ||
      first.placementKey.localeCompare(
        second.placementKey
      )
  );

  if (
    readySlots.length ===
      0
  ) {
    return [
      ...entries,
    ];
  }

  const result:
    FeedEntry[] =
    [];

  const seenEntryIds =
    new Set(
      entries.map(
        entry =>
          entry.id
      )
    );

  let organicCount =
    0;

  let slotIndex =
    0;

  const insertSlotsAtCurrentOrganicCount =
    () => {
      while (
        slotIndex <
          readySlots.length &&
        readySlots[
          slotIndex
        ].afterOrganicIndex ===
          organicCount
      ) {
        const ready =
          readySlots[
            slotIndex
          ];

        slotIndex +=
          1;

        if (
          seenEntryIds.has(
            ready.entry.id
          )
        ) {
          continue;
        }

        seenEntryIds.add(
          ready.entry.id
        );

        result.push(
          ready.entry
        );
      }
    };

  /*
   * Supports a future Backend slot at organic index 0
   * without changing the current 4 / 10 contract.
   */
  insertSlotsAtCurrentOrganicCount();

  for (
    const entry of
    entries
  ) {
    result.push(
      entry
    );

    if (
      entry.type !==
        "article"
    ) {
      continue;
    }

    organicCount +=
      1;

    insertSlotsAtCurrentOrganicCount();
  }

  return result;
}