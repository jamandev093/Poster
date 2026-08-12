import {
  MonetizationItem,
  MonetizationPlacement,
} from "../components/ads";

import {
  MONETIZATION_CONFIG,
  isMonetizationPlacementEnabled,
} from "../constants/monetization";

import {
  findInterestTopicByName,
  getInterestTopicById,
  getRelatedInterestTopics,
  resolveInterestTopic,
} from "../data/interests";

import {
  googleNativeAdPlaceholder,
  posterPromotion,
} from "../data/mockMonetization";

import UnifiedTopicRegistryService, {
  UnifiedTopic,
} from "./UnifiedTopicRegistryService";

import {
  Article,
} from "../types/article";

import {
  FeedEntry,
} from "../types/feedEntry";

import buildFeedEntries from "../utils/buildFeedEntries";

interface GetEligibleItemsOptions {
  placement:
    MonetizationPlacement;

  query?: string;

  /**
   * Accepts a canonical topic ID,
   * canonical topic name, alias,
   * category label, or legacy value.
   */
  topic?: string;

  hiddenItemIds?: readonly string[];
}

interface ComposeFeedOptions
  extends GetEligibleItemsOptions {
  articles: Article[];
}

function normalizeText(
  value?: string
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ")
      .toLowerCase() ?? ""
  );
}

function createUniqueValues(
  values:
    readonly (
      | string
      | undefined
    )[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach(
    (value) => {
      const normalizedValue =
        value
          ?.trim()
          .replace(/\s+/g, " ");

      if (!normalizedValue) {
        return;
      }

      const comparisonKey =
        normalizedValue.toLowerCase();

      if (
        seen.has(
          comparisonKey
        )
      ) {
        return;
      }

      seen.add(
        comparisonKey
      );

      result.push(
        normalizedValue
      );
    }
  );

  return result;
}

function tokenizeValues(
  values: readonly string[]
): string[] {
  const tokens =
    values.flatMap(
      (value) =>
        normalizeText(
          value
        )
          .split(/\s+/)
          .filter(
            (token) =>
              token.length >=
              2
          )
    );

  return createUniqueValues(
    tokens
  );
}

const TAXONOMY_CONTEXT_CACHE_LIMIT =
  100;

const liveTaxonomyContextCache =
  new Map<
    string,
    string[]
  >();

const liveTaxonomyContextRequests =
  new Map<
    string,
    Promise<void>
  >();

function createTaxonomyCacheKey(
  value?: string
): string {
  return normalizeText(
    value
  );
}

function setCachedTaxonomyContext(
  key: string,
  values: readonly string[]
): void {
  if (!key) {
    return;
  }

  if (
    !liveTaxonomyContextCache.has(
      key
    ) &&
    liveTaxonomyContextCache.size >=
      TAXONOMY_CONTEXT_CACHE_LIMIT
  ) {
    const oldestKey =
      liveTaxonomyContextCache
        .keys()
        .next()
        .value;

    if (
      typeof oldestKey ===
      "string"
    ) {
      liveTaxonomyContextCache.delete(
        oldestKey
      );
    }
  }

  liveTaxonomyContextCache.set(
    key,
    createUniqueValues(
      values
    )
  );
}

function resolveCanonicalTaxonomyContext(
  topicValue?: string
): string[] {
  const normalizedTopic =
    topicValue?.trim();

  if (!normalizedTopic) {
    return [];
  }

  const topic =
    getInterestTopicById(
      normalizedTopic
    ) ??
    findInterestTopicByName(
      normalizedTopic
    );

  if (!topic) {
    return [
      normalizedTopic,
    ];
  }

  const resolvedTopic =
    resolveInterestTopic(
      topic
    );

  const relatedTopics =
    getRelatedInterestTopics(
      topic.id,
      4
    );

  return createUniqueValues([
    topic.id,
    topic.slug,
    topic.name,
    topic.description,

    ...(topic.aliases ?? []),

    ...(topic.searchKeywords ??
      []),

    resolvedTopic
      ?.category
      .name,

    resolvedTopic
      ?.domain
      .name,

    ...relatedTopics.map(
      (relatedTopic) =>
        relatedTopic.name
    ),

    ...relatedTopics.flatMap(
      (relatedTopic) =>
        relatedTopic.aliases ??
        []
    ),
  ]);
}

function createUnifiedTopicValues(
  topic:
    UnifiedTopic
): string[] {
  return createUniqueValues([
    topic.id,
    topic.slug,
    topic.name,
    topic.description,
    topic.categoryName,
    topic.domainName,

    ...topic.aliases,

    ...topic.searchKeywords,

    ...topic.parentTopicIds,
  ]);
}

async function buildLiveTaxonomyContext(
  topicValue: string
): Promise<string[]> {
  const canonicalFallback =
    resolveCanonicalTaxonomyContext(
      topicValue
    );

  let topic =
    await UnifiedTopicRegistryService
      .resolveTopic(
        topicValue
      );

  /*
   * A previously saved evolving topic
   * may have been merged into another
   * canonical/promoted topic.
   */
  if (!topic) {
    topic =
      await UnifiedTopicRegistryService
        .resolveMergedTopic(
          topicValue
        );
  }

  if (!topic) {
    return canonicalFallback;
  }

  const parentTopics =
    await UnifiedTopicRegistryService
      .getParentTopics(
        topic
      );

  return createUniqueValues([
    ...canonicalFallback,

    ...createUnifiedTopicValues(
      topic
    ),

    ...parentTopics.flatMap(
      (parentTopic) =>
        createUnifiedTopicValues(
          parentTopic
        )
    ),
  ]);
}

function resolveTaxonomyContext(
  topicValue?: string
): string[] {
  const normalizedTopic =
    topicValue?.trim();

  if (!normalizedTopic) {
    return [];
  }

  const cacheKey =
    createTaxonomyCacheKey(
      normalizedTopic
    );

  const cachedContext =
    liveTaxonomyContextCache.get(
      cacheKey
    );

  if (cachedContext) {
    return cachedContext;
  }

  /*
   * Synchronous feed composition always
   * retains the trusted canonical fallback.
   */
  return resolveCanonicalTaxonomyContext(
    normalizedTopic
  );
}

function createContextValues(
  query?: string,
  topic?: string
): string[] {
  return createUniqueValues([
    query,
    topic,

    ...resolveTaxonomyContext(
      topic
    ),
  ]);
}

function parseOptionalTimestamp(
  value?: string
): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp =
    Date.parse(
      value
    );

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : undefined;
}

function isCurrentlyActive(
  item:
    MonetizationItem
): boolean {
  if (
    item.type ===
    "google_native_ad"
  ) {
    return (
      item.status !==
        "failed" &&
      item.status !==
        "no_fill"
    );
  }

  if (
    item.status !==
    "active"
  ) {
    return false;
  }

  const hasStartAt =
    Boolean(
      item.startAt
    );

  const hasEndAt =
    Boolean(
      item.endAt
    );

  const startTimestamp =
    parseOptionalTimestamp(
      item.startAt
    );

  const endTimestamp =
    parseOptionalTimestamp(
      item.endAt
    );

  if (
    hasStartAt &&
    startTimestamp ===
      undefined
  ) {
    return false;
  }

  if (
    hasEndAt &&
    endTimestamp ===
      undefined
  ) {
    return false;
  }

  if (
    startTimestamp !==
      undefined &&
    endTimestamp !==
      undefined &&
    endTimestamp <
      startTimestamp
  ) {
    return false;
  }

  const now =
    Date.now();

  if (
    startTimestamp !==
      undefined &&
    startTimestamp >
      now
  ) {
    return false;
  }

  if (
    endTimestamp !==
      undefined &&
    endTimestamp <
      now
  ) {
    return false;
  }

  return true;
}

function createItemSearchText(
  item:
    MonetizationItem
): string {
  switch (
    item.type
  ) {
    case "google_native_ad":
      /*
       * Google supplies native-ad content
       * dynamically.
       */
      return "";

    case "direct_sponsorship":
      return normalizeText(
        [
          item.title,
          item.description,
          item.advertiserName,
        ]
          .filter(
            (
              value
            ): value is string =>
              typeof value ===
                "string" &&
              value.trim()
                .length >
                0
          )
          .join(" ")
      );

    case "poster_affiliate":
      return normalizeText(
        [
          item.title,
          item.description,
          item.partnerName,
        ]
          .filter(
            (
              value
            ): value is string =>
              typeof value ===
                "string" &&
              value.trim()
                .length >
                0
          )
          .join(" ")
      );

    case "poster_promotion":
      return normalizeText(
        [
          item.title,
          item.description,
        ]
          .filter(
            (
              value
            ): value is string =>
              typeof value ===
                "string" &&
              value.trim()
                .length >
                0
          )
          .join(" ")
      );

    default:
      return "";
  }
}

function isRelevantToContext(
  item:
    MonetizationItem,
  query?: string,
  topic?: string
): boolean {
  /*
   * Google controls native-ad targeting.
   */
  if (
    item.type ===
    "google_native_ad"
  ) {
    return true;
  }

  const contextValues =
    createContextValues(
      query,
      topic
    );

  if (
    contextValues.length ===
    0
  ) {
    return true;
  }

  const searchableText =
    createItemSearchText(
      item
    );

  if (!searchableText) {
    return false;
  }

  const normalizedPhrases =
    contextValues
      .map(
        normalizeText
      )
      .filter(
        Boolean
      );

  const phraseMatch =
    normalizedPhrases.some(
      (phrase) =>
        phrase.length >=
          3 &&
        searchableText.includes(
          phrase
        )
    );

  if (phraseMatch) {
    return true;
  }

  const contextTokens =
    tokenizeValues(
      contextValues
    );

  return contextTokens.some(
    (token) =>
      searchableText.includes(
        token
      )
  );
}

/**
 * Determines whether one commercial item is allowed
 * to appear on the requested discovery surface.
 *
 * Non-Google campaigns support one or many placements.
 *
 * Google native placeholders remain placement-specific
 * because real ad-unit IDs may differ by surface.
 */
function isItemEligibleForPlacement(
  item:
    MonetizationItem,
  placement:
    MonetizationPlacement
): boolean {
  if (
    item.type ===
    "google_native_ad"
  ) {
    return (
      item.placement ===
      placement
    );
  }

  const configuredPlacements =
    item.placements
      ?.length
      ? item.placements
      : [
          item.placement,
        ];

  return configuredPlacements.includes(
    placement
  );
}

/**
 * Produces a placement-resolved copy.
 *
 * Example:
 *
 * One campaign may be eligible for:
 *
 * Home + Search + Trending
 *
 * When rendered in Home:
 * placement = "home"
 *
 * When rendered in Search:
 * placement = "search"
 *
 * When rendered in Trending:
 * placement = "trending"
 *
 * Existing impression/click/report analytics therefore
 * automatically record the real delivery surface.
 */
function resolveItemForPlacement(
  item:
    MonetizationItem,
  placement:
    MonetizationPlacement
): MonetizationItem {
  if (
    item.type ===
    "google_native_ad"
  ) {
    return item;
  }

  return {
    ...item,

    placement,
  };
}

function getCandidateItems():
  MonetizationItem[] {
  const candidates:
    MonetizationItem[] = [];

  /*
   * Direct Sponsorship and Affiliate are not local
   * Mobile candidates anymore.
   *
   * Mobile Discovery Backend owns:
   * - delivery eligibility;
   * - selected campaign;
   * - exact organic slot position.
   *
   * Poster Promotion and Google remain on their
   * existing local paths until their own migration.
   */

  if (
    MONETIZATION_CONFIG
      .googleAdsEnabled
  ) {
    candidates.push(
      googleNativeAdPlaceholder
    );
  }

  if (
    MONETIZATION_CONFIG
      .posterPromotionsEnabled
  ) {
    candidates.push(
      posterPromotion
    );
  }

  return candidates;
}
export default class MonetizationService {
  /**
   * Warms the synchronous targeting cache
   * with canonical + promoted evolving
   * taxonomy context.
   */
  static async warmTaxonomyContext(
    topicValue?: string
  ): Promise<void> {
    const cleanTopic =
      topicValue?.trim();

    if (!cleanTopic) {
      return;
    }

    const cacheKey =
      createTaxonomyCacheKey(
        cleanTopic
      );

    if (
      !cacheKey ||
      liveTaxonomyContextCache.has(
        cacheKey
      )
    ) {
      return;
    }

    const existingRequest =
      liveTaxonomyContextRequests.get(
        cacheKey
      );

    if (
      existingRequest
    ) {
      return existingRequest;
    }

    const request =
      buildLiveTaxonomyContext(
        cleanTopic
      )
        .then(
          (
            contextValues
          ) => {
            setCachedTaxonomyContext(
              cacheKey,
              contextValues
            );
          }
        )
        .catch(
          () => {
            /*
             * Targeting degrades safely to
             * canonical/string matching.
             */
          }
        )
        .finally(
          () => {
            liveTaxonomyContextRequests.delete(
              cacheKey
            );
          }
        );

    liveTaxonomyContextRequests.set(
      cacheKey,
      request
    );

    return request;
  }

  static clearTaxonomyContextCache():
    void {
    liveTaxonomyContextCache.clear();

    liveTaxonomyContextRequests.clear();
  }

  static getEligibleItems({
    placement,
    query,
    topic,
    hiddenItemIds = [],
  }: GetEligibleItemsOptions):
    MonetizationItem[] {
    if (
      !isMonetizationPlacementEnabled(
        placement
      )
    ) {
      return [];
    }

    const hiddenIds =
      new Set(
        hiddenItemIds
          .map(
            (itemId) =>
              itemId.trim()
          )
          .filter(
            Boolean
          )
      );

    return getCandidateItems()
      .filter(
        (item) =>
          !hiddenIds.has(
            item.id.trim()
          ) &&
          isItemEligibleForPlacement(
            item,
            placement
          ) &&
          isCurrentlyActive(
            item
          ) &&
          isRelevantToContext(
            item,
            query,
            topic
          )
      )
      .map(
        (item) =>
          resolveItemForPlacement(
            item,
            placement
          )
      );
  }

  static composeFeed({
    articles,
    placement,
    query,
    topic,
    hiddenItemIds = [],
  }: ComposeFeedOptions):
    FeedEntry[] {
    if (
      articles.length ===
        0 ||
      !isMonetizationPlacementEnabled(
        placement
      )
    ) {
      return buildFeedEntries({
        articles,
        placement,

        maximumMonetizedItems:
          0,
      });
    }

    const eligibleItems =
      MonetizationService
        .getEligibleItems({
          placement,
          query,
          topic,
          hiddenItemIds,
        });

    const googleAd =
      eligibleItems.find(
        (item) =>
          item.type ===
          "google_native_ad"
      );

    const selectedPosterPromotion =
      eligibleItems.find(
        (item) =>
          item.type ===
          "poster_promotion"
      );

    const placementConfig =
      MONETIZATION_CONFIG
        .placements[
          placement
        ];

    return buildFeedEntries({
      articles,

      placement,

      googleAd:
        googleAd?.type ===
        "google_native_ad"
          ? googleAd
          : undefined,

      posterPromotion:
        selectedPosterPromotion
          ?.type ===
        "poster_promotion"
          ? selectedPosterPromotion
          : undefined,

      organicItemsBeforeFirstMonetized:
        placementConfig
          .organicItemsBeforeFirstMonetized,

      organicItemsBetweenMonetized:
        placementConfig
          .organicItemsBetweenMonetized,

      maximumMonetizedItems:
        placementConfig
          .maximumMonetizedItems,
    });
  }
}
