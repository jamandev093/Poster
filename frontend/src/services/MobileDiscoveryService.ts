import AuthService, {
  AuthenticationApiError,
} from "./AuthService";

import {
  Article,
} from "../types/article";

declare const process: {
  env?: {
    EXPO_PUBLIC_POSTER_API_BASE_URL?: string;
  };
};

const DEFAULT_POSTER_API_BASE_URL =
  "http://localhost:4000";

const API_VERSION_PREFIX =
  "/api/v1";

const POSTER_BRAIN_DISCOVERY_PREFIX =
  "/poster-brain";

const POSTER_BRAIN_RANKED_FEED_PATH =
  "/ranked-feed";

const AUTHENTICATION_REQUIRED_CODE =
  "AUTHENTICATION_REQUIRED";

export type MobileDiscoverySurface =
  | "home"
  | "search"
  | "trending";

export type MobileDiscoveryRefreshMode =
  | "initial"
  | "older"
  | "refresh";

export type MobileDiscoveryCommercialType =
  | "poster_promotion"
  | "affiliate_promotion"
  | "direct_sponsorship"
  | "programmatic";

export interface MobileDiscoveryOrganicActions {
  canOpenOriginal: true;

  canSave: true;

  canShare: true;

  canHide: true;

  canReport: true;
}

export interface MobileDiscoveryFeedItem {
  kind: "organic";

  id: string;

  sourceId: string;

  publisher: {
    name: string;

    domain:
      | string
      | null;
  };

  title: string;

  excerpt: string;

  originalUrl: string;

  imageUrl:
    | string
    | null;

  mediaType: string;

  category:
    | string
    | null;

  topics: string[];

  tags: string[];

  languageCode: string;

  regionCode:
    | string
    | null;

  publishedAt:
    | string
    | null;

  discoveredAt: string;

  actions: MobileDiscoveryOrganicActions;
}

export interface MobileDiscoveryAdSlotContract {
  kind: "ad_slot";

  placementKey: string;

  surface: MobileDiscoverySurface;

  afterOrganicIndex: number;

  commercialType: MobileDiscoveryCommercialType;

  commercialSaveAllowed: false;

  allowedActions: {
    canOpen: true;

    canShare: true;

    canHide: true;

    canReport: true;
  };
}

export interface MobileDiscoveryPagination {
  nextCursor:
    | string
    | null;

  hasMore: boolean;

  refreshAfterSeconds: number;

  refreshMode: MobileDiscoveryRefreshMode;
}

export interface MobileDiscoverySearchEnginePlan {
  engine: "postgres_full_text";

  query:
    | string
    | null;

  fullTextEnabled: true;

  semanticSearchReady: boolean;

  publisherSearchReady: true;

  topicSearchReady: true;

  committedQueryRequiredForTaxonomyMutation: true;
}

export interface MobileDiscoveryRecommendationContext {
  organicRankingFirst: true;

  personalizationReady: true;

  sourceDiversityReady: true;

  negativeFeedbackReady: true;

  repeatedExposureControlReady: true;

  monetizationInsertedAfterOrganicRanking: true;
}

export interface MobileDiscoveryPythonAiHandoff {
  apiBackendLanguage: "typescript";

  aiServiceLanguage: "python";

  classificationReady: boolean;

  embeddingsReady: boolean;

  semanticDeduplicationReady: boolean;

  rankingAssistReady: boolean;

  trendIntelligenceReady: boolean;
}

export interface MobileDiscoveryFeedResponse {
  surface: MobileDiscoverySurface;

  items: MobileDiscoveryFeedItem[];

  adSlots: MobileDiscoveryAdSlotContract[];

  pagination: MobileDiscoveryPagination;

  searchEngine: MobileDiscoverySearchEnginePlan;

  recommendation: MobileDiscoveryRecommendationContext;

  aiHandoff: MobileDiscoveryPythonAiHandoff;

  generatedAt: string;
}

export interface MobileDiscoveryFeedRequest {
  limit?:
    | number
    | null;

  cursor?:
    | string
    | null;

  refreshMode?:
    | MobileDiscoveryRefreshMode
    | null;

  query?:
    | string
    | null;

  category?:
    | string
    | null;

  languageCode?:
    | string
    | null;

  regionCode?:
    | string
    | null;
}

export type MobileDiscoveryFeedArticle =
  Article & {
    bookmarked: boolean;

    recommended: boolean;

    helpful: boolean;
  };

export interface MobileDiscoveryArticleState {
  bookmarkedIds?:
    readonly string[];

  recommendedIds?:
    readonly string[];

  helpfulIds?:
    readonly string[];
}

function normalizeApiBaseUrl(
  value: string | undefined
): string {
  const normalized =
    (
      value ??
      DEFAULT_POSTER_API_BASE_URL
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  return normalized ||
    DEFAULT_POSTER_API_BASE_URL;
}

function normalizePath(
  path: string
): string {
  return path.startsWith("/")
    ? path
    : `/${path}`;
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

function appendQueryParam(
  params: string[],
  key: string,
  value:
    | string
    | number
    | null
    | undefined
): void {
  if (
    value === undefined ||
    value === null
  ) {
    return;
  }

  const normalized =
    typeof value === "number"
      ? String(value)
      : value.trim();

  if (!normalized) {
    return;
  }

  params.push(
    `${encodeURIComponent(key)}=${encodeURIComponent(normalized)}`
  );
}

function getPosterBrainSurfaceFromLegacyPath(
  path: string
): MobileDiscoverySurface {
  const normalizedPath =
    normalizePath(
      path
    );

  if (normalizedPath === "/search") {
    return "search";
  }

  if (normalizedPath === "/feed/trending") {
    return "trending";
  }

  return "home";
}

function buildMobileDiscoveryUrl(
  path: string,
  request:
    MobileDiscoveryFeedRequest
): string {
  const baseUrl =
    normalizeApiBaseUrl(
      process.env?.EXPO_PUBLIC_POSTER_API_BASE_URL
    );

  const queryParams:
    string[] = [];

  appendQueryParam(
    queryParams,
    "surface",
    getPosterBrainSurfaceFromLegacyPath(
      path
    )
  );

  appendQueryParam(
    queryParams,
    "limit",
    request.limit ?? null
  );

  appendQueryParam(
    queryParams,
    "searchQuery",
    normalizeOptionalText(
      request.query
    )
  );

  appendQueryParam(
    queryParams,
    "category",
    request.category ?? null
  );

  appendQueryParam(
    queryParams,
    "languageCode",
    request.languageCode ?? null
  );

  appendQueryParam(
    queryParams,
    "regionCode",
    request.regionCode ?? null
  );

  const queryString =
    queryParams.length > 0
      ? `?${queryParams.join("&")}`
      : "";

  return [
    baseUrl,
    API_VERSION_PREFIX,
    POSTER_BRAIN_DISCOVERY_PREFIX,
    normalizePath(
      POSTER_BRAIN_RANKED_FEED_PATH
    ),
    queryString,
  ].join("");
}

async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as unknown;
  } catch {
    return text;
  }
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function isStringArray(
  value: unknown
): value is string[] {
  return Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string"
    );
}

function getRecord(
  record: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const value =
    record[key];

  return isRecord(value)
    ? value
    : null;
}

function getString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value =
    record[key];

  return typeof value === "string"
    ? value
    : null;
}

function getBoolean(
  record: Record<string, unknown>,
  key: string
): boolean | null {
  const value =
    record[key];

  return typeof value === "boolean"
    ? value
    : null;
}

function isSurface(
  value: unknown
): value is MobileDiscoverySurface {
  return value === "home" ||
    value === "search" ||
    value === "trending";
}

function isRefreshMode(
  value: unknown
): value is MobileDiscoveryRefreshMode {
  return value === "initial" ||
    value === "older" ||
    value === "refresh";
}

function isCommercialType(
  value: unknown
): value is MobileDiscoveryCommercialType {
  return value === "poster_promotion" ||
    value === "affiliate_promotion" ||
    value === "direct_sponsorship" ||
    value === "programmatic";
}

function getErrorMessageFromBody(
  body: unknown
): {
  message: string | null;

  code: string | null;
} {
  if (!isRecord(body)) {
    return {
      message:
        null,

      code:
        null,
    };
  }

  const directMessage =
    getString(
      body,
      "message"
    );

  const directCode =
    getString(
      body,
      "code"
    );

  if (
    directMessage ||
    directCode
  ) {
    return {
      message:
        directMessage,

      code:
        directCode,
    };
  }

  const error =
    getRecord(
      body,
      "error"
    );

  if (!error) {
    return {
      message:
        null,

      code:
        null,
    };
  }

  return {
    message:
      getString(
        error,
        "message"
      ),

    code:
      getString(
        error,
        "code"
      ),
  };
}

function assertValidOrganicActions(
  value: unknown
): asserts value is MobileDiscoveryOrganicActions {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery feed action contract is invalid."
    );
  }

  if (
    getBoolean(value, "canOpenOriginal") !== true ||
    getBoolean(value, "canSave") !== true ||
    getBoolean(value, "canShare") !== true ||
    getBoolean(value, "canHide") !== true ||
    getBoolean(value, "canReport") !== true
  ) {
    throw new Error(
      "Discovery feed action permissions are invalid."
    );
  }
}

function parseFeedItem(
  value: unknown
): MobileDiscoveryFeedItem {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery feed item is invalid."
    );
  }

  const publisher =
    getRecord(
      value,
      "publisher"
    );

  const actions =
    value.actions;

  if (!publisher) {
    throw new Error(
      "Discovery feed item publisher is invalid."
    );
  }

  assertValidOrganicActions(
    actions
  );

  const id =
    getString(
      value,
      "id"
    );

  const sourceId =
    getString(
      value,
      "sourceId"
    );

  const title =
    getString(
      value,
      "title"
    );

  const excerpt =
    getString(
      value,
      "excerpt"
    );

  const originalUrl =
    getString(
      value,
      "originalUrl"
    );

  const mediaType =
    getString(
      value,
      "mediaType"
    );

  const languageCode =
    getString(
      value,
      "languageCode"
    );

  const discoveredAt =
    getString(
      value,
      "discoveredAt"
    );

  const publisherName =
    getString(
      publisher,
      "name"
    );

  if (
    value.kind !== "organic" ||
    !id ||
    !sourceId ||
    !title ||
    !excerpt ||
    !originalUrl ||
    !mediaType ||
    !languageCode ||
    !discoveredAt ||
    !publisherName ||
    !isStringArray(value.topics) ||
    !isStringArray(value.tags)
  ) {
    throw new Error(
      "Discovery feed item contract is incomplete."
    );
  }

  const publisherDomain =
    publisher.domain;

  if (
    publisherDomain !== null &&
    typeof publisherDomain !== "string"
  ) {
    throw new Error(
      "Discovery feed publisher domain is invalid."
    );
  }

  const imageUrl =
    value.imageUrl;

  if (
    imageUrl !== null &&
    typeof imageUrl !== "string"
  ) {
    throw new Error(
      "Discovery feed image URL is invalid."
    );
  }

  const category =
    value.category;

  if (
    category !== null &&
    typeof category !== "string"
  ) {
    throw new Error(
      "Discovery feed category is invalid."
    );
  }

  const regionCode =
    value.regionCode;

  if (
    regionCode !== null &&
    typeof regionCode !== "string"
  ) {
    throw new Error(
      "Discovery feed region code is invalid."
    );
  }

  const publishedAt =
    value.publishedAt;

  if (
    publishedAt !== null &&
    typeof publishedAt !== "string"
  ) {
    throw new Error(
      "Discovery feed publishedAt is invalid."
    );
  }

  return {
    kind:
      "organic",

    id,

    sourceId,

    publisher: {
      name:
        publisherName,

      domain:
        publisherDomain,
    },

    title,

    excerpt,

    originalUrl,

    imageUrl,

    mediaType,

    category,

    topics:
      value.topics,

    tags:
      value.tags,

    languageCode,

    regionCode,

    publishedAt,

    discoveredAt,

    actions,
  };
}

function parseAdSlot(
  value: unknown
): MobileDiscoveryAdSlotContract {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery ad slot contract is invalid."
    );
  }

  const placementKey =
    getString(
      value,
      "placementKey"
    );

  const surface =
    value.surface;

  const commercialType =
    value.commercialType;

  const afterOrganicIndex =
    value.afterOrganicIndex;

  const allowedActions =
    getRecord(
      value,
      "allowedActions"
    );

  if (
    value.kind !== "ad_slot" ||
    !placementKey ||
    !isSurface(surface) ||
    !isCommercialType(commercialType) ||
    typeof afterOrganicIndex !== "number" ||
    value.commercialSaveAllowed !== false ||
    !allowedActions ||
    getBoolean(allowedActions, "canOpen") !== true ||
    getBoolean(allowedActions, "canShare") !== true ||
    getBoolean(allowedActions, "canHide") !== true ||
    getBoolean(allowedActions, "canReport") !== true
  ) {
    throw new Error(
      "Discovery ad slot contract is incomplete."
    );
  }

  return {
    kind:
      "ad_slot",

    placementKey,

    surface,

    afterOrganicIndex,

    commercialType,

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
  };
}

function parsePagination(
  value: unknown
): MobileDiscoveryPagination {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery pagination contract is invalid."
    );
  }

  const nextCursor =
    value.nextCursor;

  const hasMore =
    value.hasMore;

  const refreshAfterSeconds =
    value.refreshAfterSeconds;

  const refreshMode =
    value.refreshMode;

  if (
    nextCursor !== null &&
    typeof nextCursor !== "string"
  ) {
    throw new Error(
      "Discovery pagination cursor is invalid."
    );
  }

  if (
    typeof hasMore !== "boolean" ||
    typeof refreshAfterSeconds !== "number" ||
    !isRefreshMode(refreshMode)
  ) {
    throw new Error(
      "Discovery pagination contract is incomplete."
    );
  }

  return {
    nextCursor,

    hasMore,

    refreshAfterSeconds,

    refreshMode,
  };
}

function parseSearchEngine(
  value: unknown
): MobileDiscoverySearchEnginePlan {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery search engine contract is invalid."
    );
  }

  const query =
    value.query;

  if (
    value.engine !== "postgres_full_text" ||
    (
      query !== null &&
      typeof query !== "string"
    ) ||
    value.fullTextEnabled !== true ||
    typeof value.semanticSearchReady !== "boolean" ||
    value.publisherSearchReady !== true ||
    value.topicSearchReady !== true ||
    value.committedQueryRequiredForTaxonomyMutation !== true
  ) {
    throw new Error(
      "Discovery search engine contract is incomplete."
    );
  }

  return {
    engine:
      "postgres_full_text",

    query,

    fullTextEnabled:
      true,

    semanticSearchReady:
      value.semanticSearchReady,

    publisherSearchReady:
      true,

    topicSearchReady:
      true,

    committedQueryRequiredForTaxonomyMutation:
      true,
  };
}

function parseRecommendation(
  value: unknown
): MobileDiscoveryRecommendationContext {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery recommendation contract is invalid."
    );
  }

  if (
    value.organicRankingFirst !== true ||
    value.personalizationReady !== true ||
    value.sourceDiversityReady !== true ||
    value.negativeFeedbackReady !== true ||
    value.repeatedExposureControlReady !== true ||
    value.monetizationInsertedAfterOrganicRanking !== true
  ) {
    throw new Error(
      "Discovery recommendation contract is incomplete."
    );
  }

  return {
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
  };
}

function parseAiHandoff(
  value: unknown
): MobileDiscoveryPythonAiHandoff {
  if (!isRecord(value)) {
    throw new Error(
      "Discovery AI handoff contract is invalid."
    );
  }

  if (
    value.apiBackendLanguage !== "typescript" ||
    value.aiServiceLanguage !== "python" ||
    typeof value.classificationReady !== "boolean" ||
    typeof value.embeddingsReady !== "boolean" ||
    typeof value.semanticDeduplicationReady !== "boolean" ||
    typeof value.rankingAssistReady !== "boolean" ||
    typeof value.trendIntelligenceReady !== "boolean"
  ) {
    throw new Error(
      "Discovery AI handoff contract is incomplete."
    );
  }

  return {
    apiBackendLanguage:
      "typescript",

    aiServiceLanguage:
      "python",

    classificationReady:
      value.classificationReady,

    embeddingsReady:
      value.embeddingsReady,

    semanticDeduplicationReady:
      value.semanticDeduplicationReady,

    rankingAssistReady:
      value.rankingAssistReady,

    trendIntelligenceReady:
      value.trendIntelligenceReady,
  };
}

function getStringArrayOrEmpty(
  value: unknown
): string[] {
  return isStringArray(
    value
  )
    ? value
    : [];
}

function getRankedFeedMetadata(
  value: Record<string, unknown>
): Record<string, unknown> {
  const metadata =
       value
  )
    ? value
    : [];
}

function getRankedFeedMetadata(
  value: Record value.metadata;

  return isRecord(
    metadata
  )
    ? metadata
    : {};
}

function isPosterBrainRankedFeedResponse(
  value: unknown
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return isSurface(value.surface) &&
    Array.isArray(value.items) &&
    getString(value, "generatedAt") !== null &&
    !("adSlots" in value);
}

function parsePosterBrainRankedFeedItem(
  value: unknown,
  generatedAt: string
): MobileDiscoveryFeedItem {
  if (!isRecord(value)) {
    throw new Error(
      "Poster Brain ranked feed item is invalid."
    );
  }

  const metadata =
    getRankedFeedMetadata(
      value
    );

  const id =
    getString(
      value,
      "id"
    );

  const title =
    getString(
      value,
      "title"
    );

  const originalUrl =
    getString(
      value,
      "originalUrl"
    );

  const publisherName =
    getString(
      value,
      "publisherName"
    );

  if (!id || !title || !originalUrl || !publisherName) {
    throw new Error(
      "Poster Brain ranked feed item contract is incomplete."
    );
  }

  const excerpt =
    getString(
      metadata,
      "excerpt"
    ) ??
    getString(
      metadata,
      "summary"
    ) ??
    title;

  const sourceId =
    getString(
      metadata,
      "sourceId"
    ) ??
    getString(
      metadata,
      "sourceKey"
    ) ??
    getString(
      metadata,
      "source"
    ) ??
    id;

  return {
    kind:
      "organic",

    id,

    sourceId,

    publisher: {
      name:
        publisherName,

      domain:
        getString(
          metadata,
          "publisherDomain"
        ),
    },

    title,

    excerpt,

    originalUrl,

    imageUrl:
      getString(
        metadata,
        "imageUrl"
      ),

    mediaType:
      getString(
        metadata,
        "mediaType"
      ) ??
      "article",

    category:
      getString(
        metadata,
        "category"
      ),

    topics:
      getStringArrayOrEmpty(
        metadata.topics
      ),

    tags:
      getStringArrayOrEmpty(
        metadata.tags
      ),

    languageCode:
      getString(
        metadata,
        "languageCode"
      ) ??
      "en",

    regionCode:
      getString(
        metadata,
        "regionCode"
      ),

    publishedAt:
      getString(
        value,
        "publishedAt"
      ),

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

      canGiveFeedback:
        true,
    },
  };
}

function parsePosterBrainRankedFeedResponse(
  value: Record<string, unknown>
): MobileDiscoveryFeedResponse {
  const surface =
    isSurface(value.surface)
      ? value.surface
      : "home";

  const generatedAt =
    getString(
      value,
      "generatedAt"
    ) ??
    new Date()
      .toISOString();

  const query =
    getRecord(
      value,
      "query"
    );

  return {
    surface,

    items:
      Array.isArray(value.items)
        ? value.items.map(
            item =>
              parsePosterBrainRankedFeedItem(
                item,
                generatedAt
              )
          )
        : [],

    adSlots:
      [],

    pagination: {
      nextCursor:
        null,

      hasMore:
        false,

      refreshAfterSeconds:
        60,

      refreshMode:
        "initial",
    },

    searchEngine: {
      engine:
        "postgres_full_text",

      query:
        query
          ? normalizeOptionalText(
              getString(
                query,
                "searchQuery"
              )
            )
          : null,

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

    generatedAt,
  };
}

function parseFeedResponse(
  value: unknown
): MobileDiscoveryFeedResponse {
  if (isPosterBrainRankedFeedResponse(value)) {
    return parsePosterBrainRankedFeedResponse(value);
  }

  if (!isRecord(value)) {
    throw new Error(
      "Discovery feed response is invalid."
    );
  }

  const surface =
    value.surface;

  const items =
    value.items;

  const adSlots =
    value.adSlots;

  const generatedAt =
    getString(
      value,
      "generatedAt"
    );

  if (
    !isSurface(surface) ||
    !Array.isArray(items) ||
    !Array.isArray(adSlots) ||
    !generatedAt
  ) {
    throw new Error(
      "Discovery feed response contract is incomplete."
    );
  }

  return {
    surface,

    items:
      items.map(
        parseFeedItem
      ),

    adSlots:
      adSlots.map(
        parseAdSlot
      ),

    pagination:
      parsePagination(
        value.pagination
      ),

    searchEngine:
      parseSearchEngine(
        value.searchEngine
      ),

    recommendation:
      parseRecommendation(
        value.recommendation
      ),

    aiHandoff:
      parseAiHandoff(
        value.aiHandoff
      ),

    generatedAt,
  };
}

async function requestMobileDiscoveryFeed(
  path: string,
  request:
    MobileDiscoveryFeedRequest
): Promise<MobileDiscoveryFeedResponse> {
  const accessToken =
    await AuthService.getAccessToken();

  const normalizedAccessToken =
    accessToken?.trim() ?? "";

  if (!normalizedAccessToken) {
    throw new AuthenticationApiError(
      "Sign in again to load Poster discovery.",
      401,
      AUTHENTICATION_REQUIRED_CODE
    );
  }

  const response =
    await fetch(
      buildMobileDiscoveryUrl(
        path,
        request
      ),
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${normalizedAccessToken}`,
        },

        credentials:
          "include",
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getErrorMessageFromBody(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Poster could not load discovery. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  return parseFeedResponse(
    responseBody
  );
}

function cleanPublisherDomain(
  domain:
    | string
    | null
): string | null {
  const normalized =
    domain
      ?.trim()
      .replace(
        /^https?:\/\//i,
        ""
      )
      .replace(
        /\/+$/,
        ""
      ) ??
    "";

  return normalized ||
    null;
}

function createIdSet(
  values:
    | readonly string[]
    | undefined
): Set<string> {
  return new Set(
    values ?? []
  );
}

function mapFeedItemToArticle(
  item: MobileDiscoveryFeedItem,
  state: {
    bookmarkedIds: Set<string>;

    recommendedIds: Set<string>;

    helpfulIds: Set<string>;
  }
): MobileDiscoveryFeedArticle {
  return {
    id:
      item.id,

    title:
      item.title,

    summary:
      item.excerpt,

    publisher:
      item.publisher.name,

    publisherUrl:
      cleanPublisherDomain(
        item.publisher.domain
      ) ??
      item.originalUrl,

    image:
      item.imageUrl ??
      "",

    publishedAt:
      item.publishedAt ??
      item.discoveredAt,

    discoveredAt:
      item.discoveredAt,

    category:
      item.category ??
      "General",

    originalUrl:
      item.originalUrl,

    verified:
      true,

    bookmarked:
      state
        .bookmarkedIds
        .has(
          item.id
        ),

    recommended:
      state
        .recommendedIds
        .has(
          item.id
        ),

    helpful:
      state
        .helpfulIds
        .has(
          item.id
        ),
  };
}

export default class MobileDiscoveryService {
  static async getHomeFeed(
    request:
      MobileDiscoveryFeedRequest =
      {}
  ): Promise<MobileDiscoveryFeedResponse> {
    return requestMobileDiscoveryFeed(
      "/feed/home",
      request
    );
  }

  static async getTrendingFeed(
    request:
      MobileDiscoveryFeedRequest =
      {}
  ): Promise<MobileDiscoveryFeedResponse> {
    return requestMobileDiscoveryFeed(
      "/feed/trending",
      request
    );
  }

  static async search(
    request:
      MobileDiscoveryFeedRequest
  ): Promise<MobileDiscoveryFeedResponse> {
    return requestMobileDiscoveryFeed(
      "/search",
      {
        ...request,

        query:
          normalizeOptionalText(
            request.query
          ),
      }
    );
  }

  static mapToArticles(
    response:
      MobileDiscoveryFeedResponse,
    state:
      MobileDiscoveryArticleState =
      {}
  ): MobileDiscoveryFeedArticle[] {
    const bookmarkedIds =
      createIdSet(
        state.bookmarkedIds
      );

    const recommendedIds =
      createIdSet(
        state.recommendedIds
      );

    const helpfulIds =
      createIdSet(
        state.helpfulIds
      );

    return response.items.map(
      (item) =>
        mapFeedItemToArticle(
          item,
          {
            bookmarkedIds,

            recommendedIds,

            helpfulIds,
          }
        )
    );
  }
}
