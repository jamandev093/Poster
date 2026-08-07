import {
  listDiscoveryContentItems,
  type DiscoveryContentItem,
  type DiscoveryFeedCursor,
  type DiscoverySurface,
} from "../../domains/mobile-discovery/index.js";

import type {
  ListDiscoveryContentItemsOperation,
  ListMobileDiscoveryFeedInput,
  MobileDiscoveryAdSlotContract,
  MobileDiscoveryFeedItem,
  MobileDiscoveryFeedResponse,
  MobileDiscoveryRefreshMode,
} from "./mobile-discovery.types.js";

const DEFAULT_LIMIT =
  20;

const MAXIMUM_LIMIT =
  50;

const REFRESH_SECONDS_BY_SURFACE:
  Record<DiscoverySurface, number> = {
  home:
    90,

  search:
    180,

  trending:
    60,
};

export interface MobileDiscoveryService {
  listFeed:
    (
      input: ListMobileDiscoveryFeedInput
    ) => Promise<MobileDiscoveryFeedResponse>;
}

export interface MobileDiscoveryServiceDependencies {
  listDiscoveryContentItems?:
    ListDiscoveryContentItemsOperation;

  now?:
    () => Date;
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined
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
      .replace(
        /\s+/g,
        " "
      );

  return normalized ||
    null;
}

function normalizeLimit(
  value:
    | number
    | null
    | undefined
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT;
  }

  const integerValue =
    Math.trunc(value);

  if (integerValue < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    integerValue,
    MAXIMUM_LIMIT
  );
}

function normalizeRefreshMode(
  value:
    | MobileDiscoveryRefreshMode
    | null
    | undefined
): MobileDiscoveryRefreshMode {
  if (
    value === "older" ||
    value === "refresh"
  ) {
    return value;
  }

  return "initial";
}

function getSurfaceScore(
  surface: DiscoverySurface,
  item: DiscoveryContentItem
): string {
  return surface === "trending"
    ? item.rankingSignals.trendingScore
    : item.rankingSignals.rankingScore;
}

function encodeCursor(
  cursor: DiscoveryFeedCursor
): string {
  return encodeURIComponent(
    JSON.stringify(
      cursor
    )
  );
}

function isCursorRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null;
}

function decodeCursor(
  value:
    | string
    | null
    | undefined,
  expectedSurface: DiscoverySurface
): DiscoveryFeedCursor | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(
        decodeURIComponent(
          value
        )
      );

    if (!isCursorRecord(parsed)) {
      return null;
    }

    if (
      parsed.surface !== expectedSurface ||
      typeof parsed.score !== "string" ||
      typeof parsed.discoveredAt !== "string" ||
      typeof parsed.id !== "string"
    ) {
      return null;
    }

    return {
      surface:
        expectedSurface,

      score:
        parsed.score,

      discoveredAt:
        parsed.discoveredAt,

      id:
        parsed.id,
    };
  } catch {
    return null;
  }
}

function createNextCursor(
  surface: DiscoverySurface,
  items: DiscoveryContentItem[],
  requestedLimit: number
): string | null {
  if (items.length < requestedLimit) {
    return null;
  }

  const lastItem =
    items[items.length - 1];

  if (!lastItem) {
    return null;
  }

  return encodeCursor({
    surface,

    score:
      getSurfaceScore(
        surface,
        lastItem
      ),

    discoveredAt:
      lastItem.discoveredAt.toISOString(),

    id:
      lastItem.id,
  });
}

function mapFeedItem(
  item: DiscoveryContentItem
): MobileDiscoveryFeedItem {
  return {
    kind:
      "organic",

    id:
      item.id,

    sourceId:
      item.externalContentId,

    publisher: {
      name:
        item.publisher?.publisherName ??
        item.source?.displayName ??
        "Unknown publisher",

      domain:
        item.publisher?.domain ??
        item.source?.primaryDomain ??
        null,
    },

    title:
      item.title,

    excerpt:
      item.excerpt,

    originalUrl:
      item.originalUrl,

    imageUrl:
      item.imageUrl,

    mediaType:
      item.mediaType,

    category:
      item.category,

    topics: [
      ...item.canonicalTopicIds,
      ...item.evolvingTopicIds,
    ],

    tags:
      item.tags,

    languageCode:
      item.languageCode,

    regionCode:
      item.regionCode,

    publishedAt:
      item.publishedAt
        ? item.publishedAt.toISOString()
        : null,

    discoveredAt:
      item.discoveredAt.toISOString(),

    actions: {
      canOpenOriginal:
        true,

      canSave:
        true,

      canShare:
        true,

      canHide:
        true,

      canReport:
        true,
    },
  };
}

function createAdSlotContracts(
  surface: DiscoverySurface,
  organicCount: number
): MobileDiscoveryAdSlotContract[] {
  const contracts:
    MobileDiscoveryAdSlotContract[] = [];

  if (organicCount >= 4) {
    contracts.push({
      kind:
        "ad_slot",

      placementKey:
        `${surface}:direct-sponsorship:after-4`,

      surface,

      afterOrganicIndex:
        4,

      commercialType:
        "direct_sponsorship",

      commercialSaveAllowed:
        false,

      allowedActions: {
        canOpen:
          true,

        canShare:
          true,

        canHide:
          true,

        canReport:
          true,
      },
    });
  }

  if (organicCount >= 10) {
    contracts.push({
      kind:
        "ad_slot",

      placementKey:
        `${surface}:affiliate:after-10`,

      surface,

      afterOrganicIndex:
        10,

      commercialType:
        "affiliate_promotion",

      commercialSaveAllowed:
        false,

      allowedActions: {
        canOpen:
          true,

        canShare:
          true,

        canHide:
          true,

        canReport:
          true,
      },
    });
  }

  return contracts;
}

export function createMobileDiscoveryService(
  dependencies:
    MobileDiscoveryServiceDependencies =
    {}
): MobileDiscoveryService {
  const listItems =
    dependencies.listDiscoveryContentItems ??
    listDiscoveryContentItems;

  const now =
    dependencies.now ??
    (() => new Date());

  return {
    listFeed:
      async (
        input
      ) => {
        const limit =
          normalizeLimit(
            input.limit
          );

        const query =
          normalizeOptionalText(
            input.query
          );

        const category =
          normalizeOptionalText(
            input.category
          );

        const languageCode =
          normalizeOptionalText(
            input.languageCode
          );

        const regionCode =
          normalizeOptionalText(
            input.regionCode
          );

        const refreshMode =
          normalizeRefreshMode(
            input.refreshMode
          );

        const cursor =
          decodeCursor(
            input.cursor,
            input.surface
          );

        const items =
          await listItems({
            surface:
              input.surface,

            query,

            category,

            languageCode,

            regionCode,

            limit,

            cursor,
          });

        const nextCursor =
          createNextCursor(
            input.surface,
            items,
            limit
          );

        return {
          surface:
            input.surface,

          items:
            items.map(
              mapFeedItem
            ),

          adSlots:
            createAdSlotContracts(
              input.surface,
              items.length
            ),

          pagination: {
            nextCursor,

            hasMore:
              nextCursor !== null,

            refreshAfterSeconds:
              REFRESH_SECONDS_BY_SURFACE[
                input.surface
              ],

            refreshMode,
          },

          searchEngine: {
            engine:
              "postgres_full_text",

            query,

            fullTextEnabled:
              true,

            semanticSearchReady:
              true,

            publisherSearchReady:
              true,

            topicSearchReady:
              true,

            committedQueryRequiredForTaxonomyMutation:
              true,
          },

          recommendation: {
            organicRankingFirst:
              true,

            personalizationReady:
              true,

            sourceDiversityReady:
              true,

            negativeFeedbackReady:
              true,

            repeatedExposureControlReady:
              true,

            monetizationInsertedAfterOrganicRanking:
              true,
          },

          aiHandoff: {
            apiBackendLanguage:
              "typescript",

            aiServiceLanguage:
              "python",

            classificationReady:
              true,

            embeddingsReady:
              true,

            semanticDeduplicationReady:
              true,

            rankingAssistReady:
              true,

            trendIntelligenceReady:
              true,
          },

          generatedAt:
            now().toISOString(),
        };
      },
  };
}
