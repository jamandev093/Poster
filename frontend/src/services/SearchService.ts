import {
  ContentVisibilityContext,
  ContentVisibilityEvaluation,
} from "../data/contentVisibilityPolicy";

import TopicDiscoveryOrchestratorService, {
  DiscoverTopicOptions,
  PreviewTopicOptions,
  TopicDiscoveryKind,
  TopicDiscoverySuggestion,
} from "./TopicDiscoveryOrchestratorService";

export interface SearchTaxonomyPlan {
  query: string;

  normalizedQuery: string;

  canSearch: boolean;

  discoveryKind:
    TopicDiscoveryKind;

  visibility:
    ContentVisibilityEvaluation;

  primaryTopicId?: string;

  primaryTopicName?: string;

  dynamicTopicId?: string;

  parentTopicIds: string[];

  relatedTopicIds: string[];

  expandedSearchTerms: string[];
}

export interface SearchPreviewResult {
  plan:
    SearchTaxonomyPlan;

  suggestions:
    TopicDiscoverySuggestion[];
}

export interface SearchCommitOptions {
  visibilityContext?:
    ContentVisibilityContext;

  sourceId?: string;

  trustedSource?: boolean;

  engaged?: boolean;

  sessionId?: string;

  relatedLimit?: number;

  now?: Date;
}

const MAX_EXPANDED_TERMS = 80;

function normalizeQuery(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanQuery(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function uniqueValues(
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
      if (!value) {
        return;
      }

      const cleanValue =
        cleanQuery(value);

      const key =
        normalizeQuery(
          cleanValue
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);

      result.push(
        cleanValue
      );
    }
  );

  return result;
}

export default class SearchService {
  /**
   * PREVIEW ONLY
   *
   * Safe to call while the user types.
   *
   * This never records taxonomy demand,
   * creates evolving topics, or changes
   * promotion scores.
   */
  static async preview(
    query: string,
    options:
      PreviewTopicOptions = {}
  ): Promise<SearchPreviewResult> {
    const preview =
      await TopicDiscoveryOrchestratorService
        .previewQuery(
          query,
          options
        );

    const expandedSearchTerms =
      uniqueValues([
        preview.query,

        ...preview.searchTerms,
      ]).slice(
        0,
        MAX_EXPANDED_TERMS
      );

    return {
      plan: {
        query:
          preview.query,

        normalizedQuery:
          preview.normalizedQuery,

        canSearch:
          preview.canSurface,

        discoveryKind:
          preview.kind,

        visibility:
          preview.visibility,

        primaryTopicId:
          preview.exactTopic?.id,

        primaryTopicName:
          preview.exactTopic?.name,

        parentTopicIds:
          preview.exactTopic
            ?.parentTopicIds
            ? [
                ...preview
                  .exactTopic
                  .parentTopicIds,
              ]
            : [],

        relatedTopicIds: [],

        expandedSearchTerms,
      },

      suggestions:
        preview.suggestions,
    };
  }

  /**
   * COMMITTED SEARCH
   *
   * Call exactly once for a genuine
   * user-submitted or selected query.
   *
   * This is allowed to teach the
   * self-evolving taxonomy.
   *
   * Do NOT call this again for:
   * - pagination
   * - load more
   * - refresh
   * - rerender
   * - focus restoration
   */
  static async commit(
    query: string,
    options:
      SearchCommitOptions = {}
  ): Promise<SearchTaxonomyPlan> {
    const discoveryOptions:
      DiscoverTopicOptions = {
        visibilityContext:
          options.visibilityContext,

        sourceId:
          options.sourceId,

        trustedSource:
          options.trustedSource,

        engaged:
          options.engaged,

        sessionId:
          options.sessionId,

        relatedLimit:
          options.relatedLimit,

        now:
          options.now,
      };

    const discovery =
      await TopicDiscoveryOrchestratorService
        .discoverTopic(
          query,
          discoveryOptions
        );

    const expandedSearchTerms =
      uniqueValues([
        discovery.query,

        ...discovery.searchTerms,
      ]).slice(
        0,
        MAX_EXPANDED_TERMS
      );

    return {
      query:
        discovery.query,

      normalizedQuery:
        discovery.normalizedQuery,

      canSearch:
        discovery.canSurface,

      discoveryKind:
        discovery.kind,

      visibility:
        discovery.visibility,

      primaryTopicId:
        discovery.primaryTopic?.id,

      primaryTopicName:
        discovery.primaryTopic?.name,

      dynamicTopicId:
        discovery.dynamicTopic?.id,

      parentTopicIds:
        discovery.parentTopics.map(
          (topic) =>
            topic.id
        ),

      relatedTopicIds:
        discovery.relatedMatches.map(
          (match) =>
            match.topic.id
        ),

      expandedSearchTerms,
    };
  }

  /**
   * Pagination / refresh must reuse the
   * already-created committed plan.
   *
   * Returning a cloned plan prevents
   * accidental taxonomy observation.
   */
  static continueSearch(
    plan:
      SearchTaxonomyPlan
  ): SearchTaxonomyPlan {
    return {
      ...plan,

      parentTopicIds: [
        ...plan.parentTopicIds,
      ],

      relatedTopicIds: [
        ...plan.relatedTopicIds,
      ],

      expandedSearchTerms: [
        ...plan.expandedSearchTerms,
      ],

      visibility: {
        ...plan.visibility,

        categories: [
          ...plan.visibility
            .categories,
        ],

        reasons: [
          ...plan.visibility
            .reasons,
        ],

        matchedSignals: [
          ...plan.visibility
            .matchedSignals,
        ],
      },
    };
  }

  static createSearchTerms(
    plan:
      SearchTaxonomyPlan
  ): string[] {
    if (!plan.canSearch) {
      return [];
    }

    return uniqueValues([
      plan.query,

      ...plan.expandedSearchTerms,
    ]).slice(
      0,
      MAX_EXPANDED_TERMS
    );
  }

  static isSearchAllowed(
    plan:
      SearchTaxonomyPlan
  ): boolean {
    return (
      plan.canSearch &&
      Boolean(
        plan.normalizedQuery
      )
    );
  }

  static async getSuggestions(
    query: string,
    limit = 12,
    visibilityContext?:
      ContentVisibilityContext
  ): Promise<
    TopicDiscoverySuggestion[]
  > {
    return TopicDiscoveryOrchestratorService
      .getSuggestions(
        query,
        limit,
        visibilityContext
      );
  }
}