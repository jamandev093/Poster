import type {
  DiscoverySurface,
} from "../../domains/mobile-discovery/index.js";

import type {
  ListMobileDiscoveryFeedInput,
  MobileDiscoveryAdSlotContract,
  MobileDiscoveryFeedItem,
  MobileDiscoveryFeedResponse,
  MobileDiscoveryRefreshMode,
} from "./mobile-discovery.types.js";

import type {
  MobileDiscoveryService,
} from "./mobile-discovery.service.js";

export interface PosterBrainMobileDiscoveryRankedFeedItem {
  readonly id: string;
  readonly title: string;
  readonly originalUrl: string;
  readonly publisherName: string;
  readonly score: number;
  readonly publishedAt: string | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface PosterBrainMobileDiscoveryRankedFeedInput {
  readonly actorUserId: string;
  readonly surface: DiscoverySurface;
  readonly limit: number;
  readonly searchQuery?: string;
  readonly languageCode?: string;
  readonly regionCode?: string;
  readonly category?: string;
}

export interface PosterBrainMobileDiscoveryRankedFeedResult {
  readonly items: readonly PosterBrainMobileDiscoveryRankedFeedItem[];
  readonly totalItems: number;
  readonly generatedAt: string;
}

export interface PosterBrainMobileDiscoveryRankedFeedService {
  readRankedFeed(
    input: PosterBrainMobileDiscoveryRankedFeedInput
  ): Promise<PosterBrainMobileDiscoveryRankedFeedResult>;
}

export interface PosterBrainMobileDiscoveryServiceDependencies {
  readonly rankedFeedService: PosterBrainMobileDiscoveryRankedFeedService;
  readonly actorUserId?: string;
}

const DEFAULT_LIMIT =
  20;

const MAXIMUM_LIMIT =
  50;

const DEFAULT_ACTOR_USER_ID =
  "mobile-discovery-system";

const REFRESH_SECONDS_BY_SURFACE:
  Record<DiscoverySurface, number> = {
  home:
    90,

  search:
    180,

  trending:
    60,
};

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeLimit(
  value:
    | number
    | null
    | undefined
): number {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(
      Math.trunc(value),
      1
    ),
    MAXIMUM_LIMIT
  );
}

function normalizeRefreshMode(
  value:
    | MobileDiscoveryRefreshMode
    | null
    | undefined
): MobileDiscoveryRefreshMode {
  if (value === "older" || value === "refresh") {
    return value;
  }

  return "initial";
}

function readMetadata(
  item: PosterBrainMobileDiscoveryRankedFeedItem
): Readonly<Record<string, unknown>> {
  return item.metadata ?? {};
}

function readString(
  source: Readonly<Record<string, unknown>>,
  key: string
): string | null {
  const value =
    source[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function readStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen =
    new Set<string>();

  const result:
    string[] =
    [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed =
      item.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key =
      trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function createReadRankedFeedInput(input: {
  readonly actorUserId: string;
  readonly request: ListMobileDiscoveryFeedInput;
  readonly limit: number;
  readonly query: string | null;
  readonly category: string | null;
  readonly languageCode: string | null;
  readonly regionCode: string | null;
}): PosterBrainMobileDiscoveryRankedFeedInput {
  const routeInput: {
    actorUserId: string;
    surface: DiscoverySurface;
    limit: number;
    searchQuery?: string;
    languageCode?: string;
    regionCode?: string;
    category?: string;
  } = {
    actorUserId:
      input.actorUserId,

    surface:
      input.request.surface,

    limit:
      input.limit,
  };

  if (input.query !== null) {
    routeInput.searchQuery =
      input.query;
  }

  if (input.category !== null) {
    routeInput.category =
      input.category;
  }

  if (input.languageCode !== null) {
    routeInput.languageCode =
      input.languageCode;
  }

  if (input.regionCode !== null) {
    routeInput.regionCode =
      input.regionCode;
  }

  return routeInput;
}

function mapRankedFeedItem(
  item: PosterBrainMobileDiscoveryRankedFeedItem,
  generatedAt: string
): MobileDiscoveryFeedItem {
  const metadata =
    readMetadata(
      item
    );

  const sourceId =
    readString(
      metadata,
      "sourceId"
    ) ??
    readString(
      metadata,
      "sourceKey"
    ) ??
    item.id;

  const excerpt =
    readString(
      metadata,
      "excerpt"
    ) ??
    readString(
      metadata,
      "summary"
    ) ??
    item.title;

  return {
    kind:
      "organic",

    id:
      item.id,

    sourceId,

    publisher: {
      name:
        item.publisherName,

      domain:
        readString(
          metadata,
          "publisherDomain"
        ),
    },

    title:
      item.title,

    excerpt,

    originalUrl:
      item.originalUrl,

    imageUrl:
      readString(
        metadata,
        "imageUrl"
      ),

    mediaType:
      readString(
        metadata,
        "mediaType"
      ) ??
      "article",

    category:
      readString(
        metadata,
        "category"
      ),

    topics:
      readStringArray(
        metadata.topics
      ),

    tags:
      readStringArray(
        metadata.tags
      ),

    languageCode:
      readString(
        metadata,
        "languageCode"
      ) ??
      "en",

    regionCode:
      readString(
        metadata,
        "regionCode"
      ),

    publishedAt:
      item.publishedAt,

    discoveredAt:
      generatedAt,

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
    MobileDiscoveryAdSlotContract[] =
    [];

  if (organicCount >= 4) {
    contracts.push({
      kind:
        "ad_slot",

      placementKey:
        surface + ":direct-sponsorship:after-4",

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
        surface + ":affiliate:after-10",

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

export function createPosterBrainMobileDiscoveryService(
  dependencies: PosterBrainMobileDiscoveryServiceDependencies
): MobileDiscoveryService {
  const actorUserId =
    normalizeOptionalText(
      dependencies.actorUserId
    ) ??
    DEFAULT_ACTOR_USER_ID;

  return {
    async listFeed(input) {
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

      const result =
        await dependencies
          .rankedFeedService
          .readRankedFeed(
            createReadRankedFeedInput({
              actorUserId,
              request:
                input,
              limit,
              query,
              category,
              languageCode,
              regionCode,
            })
          );

      return {
        surface:
          input.surface,

        items:
          result
            .items
            .map(
              item =>
                mapRankedFeedItem(
                  item,
                  result.generatedAt
                )
            ),

        adSlots:
          createAdSlotContracts(
            input.surface,
            result.items.length
          ),

        pagination: {
          nextCursor:
            null,

          hasMore:
            false,

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
            false,

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
            false,

          semanticDeduplicationReady:
            false,

          rankingAssistReady:
            true,

          trendIntelligenceReady:
            true,
        },

        generatedAt:
          result.generatedAt,
      };
    },
  };
}
