import type {
  DiscoveryContentItem,
  DiscoveryFeedCursor,
  DiscoverySurface,
} from "../../domains/mobile-discovery/index.js";

import type {
  MobileCommercialDeliveryItem,
} from "../monetization/mobile-commercial-delivery.service.js";

export type MobileDiscoveryRefreshMode =
  | "initial"
  | "older"
  | "refresh";

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

  surface: DiscoverySurface;

  afterOrganicIndex: number;

  commercialType:
    | "poster_promotion"
    | "affiliate_promotion"
    | "direct_sponsorship"
    | "programmatic";

  /**
   * Real delivery payload resolved by Backend.
   *
   * Optional while Mobile is migrated away from the
   * legacy local monetization candidate layer.
   *
   * A null payload means the placement exists but no
   * currently eligible commercial item was available.
   */
  delivery?:
    | MobileCommercialDeliveryItem
    | null;

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

export interface ListMobileDiscoveryFeedInput {
  surface: DiscoverySurface;

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

  limit?:
    | number
    | null;

  cursor?:
    | string
    | null;

  refreshMode?:
    | MobileDiscoveryRefreshMode
    | null;
}

export interface MobileDiscoveryFeedResponse {
  surface: DiscoverySurface;

  items: MobileDiscoveryFeedItem[];

  adSlots: MobileDiscoveryAdSlotContract[];

  pagination: MobileDiscoveryPagination;

  searchEngine: MobileDiscoverySearchEnginePlan;

  recommendation: MobileDiscoveryRecommendationContext;

  aiHandoff: MobileDiscoveryPythonAiHandoff;

  generatedAt: string;
}

export type ListDiscoveryContentItemsOperation =
  (
    input: {
      surface: DiscoverySurface;

      query:
        | string
        | null;

      category:
        | string
        | null;

      languageCode:
        | string
        | null;

      regionCode:
        | string
        | null;

      limit: number;

      cursor:
        | DiscoveryFeedCursor
        | null;
    }
  ) => Promise<DiscoveryContentItem[]>;
