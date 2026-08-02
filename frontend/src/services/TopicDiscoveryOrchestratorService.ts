import {
  ContentVisibilityContext,
  ContentVisibilityEvaluation,
  evaluateContentVisibility,
} from "../data/contentVisibilityPolicy";

import TaxonomyEvolutionService, {
  EvolvingTopicRecord,
  TaxonomyLifecycleState,
} from "./TaxonomyEvolutionService";

import UnifiedTopicRegistryService, {
  UnifiedTopic,
  UnifiedTopicSearchResult,
} from "./UnifiedTopicRegistryService";

export type TopicDiscoveryKind =
  | "canonical"
  | "evolving"
  | "dynamic"
  | "unavailable";

export type TopicSuggestionKind =
  | "canonical"
  | "evolving"
  | "dynamic_candidate";

export interface RuntimeDynamicTopic {
  id: string;

  name: string;

  normalizedName: string;

  slug: string;

  aliases: string[];

  lifecycle:
    TaxonomyLifecycleState;

  parentTopicIds: string[];

  promotionScore: number;

  visibility:
    ContentVisibilityEvaluation;

  source:
    EvolvingTopicRecord;
}

export interface TopicDiscoverySuggestion {
  id: string;

  label: string;

  kind:
    TopicSuggestionKind;

  score: number;

  canonicalTopicId?: string;

  parentTopicIds: string[];

  categoryName?: string;

  domainName?: string;
}

export interface TopicDiscoveryPreview {
  query: string;

  normalizedQuery: string;

  kind:
    TopicDiscoveryKind;

  canSurface: boolean;

  visibility:
    ContentVisibilityEvaluation;

  exactTopic?:
    UnifiedTopic;

  suggestions:
    TopicDiscoverySuggestion[];

  searchTerms: string[];
}

export interface TopicDiscoveryResult {
  query: string;

  normalizedQuery: string;

  kind:
    TopicDiscoveryKind;

  canSurface: boolean;

  visibility:
    ContentVisibilityEvaluation;

  primaryTopic?:
    UnifiedTopic;

  dynamicTopic?:
    RuntimeDynamicTopic;

  parentTopics:
    UnifiedTopic[];

  relatedMatches:
    UnifiedTopicSearchResult[];

  searchTerms: string[];
}

export interface PreviewTopicOptions {
  visibilityContext?:
    ContentVisibilityContext;

  suggestionLimit?: number;
}

export interface DiscoverTopicOptions {
  visibilityContext?:
    ContentVisibilityContext;

  sourceId?: string;

  trustedSource?: boolean;

  engaged?: boolean;

  sessionId?: string;

  relatedLimit?: number;

  now?: Date;
}

const DEFAULT_SUGGESTION_LIMIT =
  12;

const DEFAULT_RELATED_LIMIT =
  10;

function normalizeText(
  value?: string
): string {
  return (
    value
      ?.normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase() ?? ""
  );
}

function cleanText(
  value?: string
): string {
  return (
    value
      ?.normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ") ?? ""
  );
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
      const cleanValue =
        cleanText(value);

      const key =
        normalizeText(
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

function canSurface(
  visibility:
    ContentVisibilityEvaluation
): boolean {
  return (
    visibility.decision ===
      "allow" ||
    visibility.decision ===
      "allow_with_context"
  );
}

function createCandidateId(
  normalizedQuery: string
): string {
  return [
    "dynamic-candidate",
    encodeURIComponent(
      normalizedQuery
    ),
  ].join(":");
}

function createRuntimeDynamicTopic(
  record:
    EvolvingTopicRecord,
  visibility:
    ContentVisibilityEvaluation
): RuntimeDynamicTopic {
  return {
    id:
      record.id,

    name:
      record.name,

    normalizedName:
      record.normalizedName,

    slug:
      record.slug,

    aliases:
      [...record.aliases],

    lifecycle:
      record.lifecycle,

    parentTopicIds:
      [...record.parentTopicIds],

    promotionScore:
      record.evidence
        .promotionScore,

    visibility,

    source:
      record,
  };
}

function toSuggestion(
  result:
    UnifiedTopicSearchResult
): TopicDiscoverySuggestion {
  const topic =
    result.topic;

  return {
    id:
      topic.id,

    label:
      topic.name,

    kind:
      topic.kind ===
      "canonical"
        ? "canonical"
        : "evolving",

    score:
      result.score,

    canonicalTopicId:
      topic.kind ===
      "canonical"
        ? topic.id
        : undefined,

    parentTopicIds:
      [...topic.parentTopicIds],

    categoryName:
      topic.categoryName,

    domainName:
      topic.domainName,
  };
}

function createDynamicCandidateSuggestion(
  query: string,
  normalizedQuery: string
): TopicDiscoverySuggestion {
  return {
    id:
      createCandidateId(
        normalizedQuery
      ),

    label:
      cleanText(query),

    kind:
      "dynamic_candidate",

    /*
     * The exact user query appears
     * first as an open-ended discovery
     * option.
     *
     * It is not persisted until the
     * user actually submits/selects it.
     */
    score:
      Number.MAX_SAFE_INTEGER,

    parentTopicIds: [],
  };
}

function deduplicateSuggestions(
  suggestions:
    readonly TopicDiscoverySuggestion[]
): TopicDiscoverySuggestion[] {
  const seenIds =
    new Set<string>();

  const seenLabels =
    new Set<string>();

  return suggestions.filter(
    (suggestion) => {
      const idKey =
        normalizeText(
          suggestion.id
        );

      const labelKey =
        normalizeText(
          suggestion.label
        );

      if (
        !idKey ||
        !labelKey ||
        seenIds.has(
          idKey
        ) ||
        seenLabels.has(
          labelKey
        )
      ) {
        return false;
      }

      seenIds.add(
        idKey
      );

      seenLabels.add(
        labelKey
      );

      return true;
    }
  );
}

async function resolveParentTopics(
  parentTopicIds:
    readonly string[]
): Promise<UnifiedTopic[]> {
  if (
    parentTopicIds.length ===
    0
  ) {
    return [];
  }

  const results =
    await Promise.all(
      parentTopicIds.map(
        (topicId) =>
          UnifiedTopicRegistryService
            .getTopicById(
              topicId
            )
      )
    );

  return results.filter(
    (
      topic
    ): topic is UnifiedTopic =>
      Boolean(topic)
  );
}

function createSearchTerms(
  query: string,

  primaryTopic:
    | UnifiedTopic
    | undefined,

  dynamicTopic:
    | RuntimeDynamicTopic
    | undefined,

  parentTopics:
    readonly UnifiedTopic[],

  relatedMatches:
    readonly UnifiedTopicSearchResult[]
): string[] {
  return uniqueValues([
    cleanText(query),

    primaryTopic?.name,

    ...(primaryTopic?.aliases ??
      []),

    ...(primaryTopic
      ?.searchKeywords ??
      []),

    dynamicTopic?.name,

    ...(dynamicTopic?.aliases ??
      []),

    ...parentTopics.flatMap(
      (topic) => [
        topic.name,

        ...topic.aliases,

        ...topic
          .searchKeywords,
      ]
    ),

    ...relatedMatches.flatMap(
      (match) => [
        match.topic.name,

        ...match.topic.aliases,

        ...match.topic
          .searchKeywords,
      ]
    ),
  ]).slice(
    0,
    80
  );
}

function resolveDiscoveryKind(
  topic:
    UnifiedTopic
): TopicDiscoveryKind {
  return topic.kind ===
    "canonical"
    ? "canonical"
    : "evolving";
}

export default class TopicDiscoveryOrchestratorService {
  /**
   * PREVIEW
   *
   * Safe for every keystroke.
   *
   * Does NOT mutate or persist the
   * evolving taxonomy.
   */
  static async previewQuery(
    query: string,
    options:
      PreviewTopicOptions = {}
  ): Promise<TopicDiscoveryPreview> {
    const cleanQuery =
      cleanText(query);

    const normalizedQuery =
      normalizeText(query);

    const visibility =
      evaluateContentVisibility(
        cleanQuery,
        options.visibilityContext
      );

    if (
      !normalizedQuery ||
      !canSurface(
        visibility
      )
    ) {
      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        suggestions: [],

        searchTerms: [],
      };
    }

    const exactTopic =
      await UnifiedTopicRegistryService
        .resolveTopic(
          cleanQuery
        );

    const suggestionLimit =
      Math.max(
        1,
        options.suggestionLimit ??
          DEFAULT_SUGGESTION_LIMIT
      );

    const registryMatches =
      await UnifiedTopicRegistryService
        .searchTopics(
          cleanQuery,
          suggestionLimit
        );

    const suggestions =
      registryMatches.map(
        toSuggestion
      );

    /*
     * Any safe query that is not
     * already an exact unified topic
     * becomes a dynamic discovery
     * candidate.
     *
     * Still no persistence here.
     */
    if (!exactTopic) {
      suggestions.unshift(
        createDynamicCandidateSuggestion(
          cleanQuery,
          normalizedQuery
        )
      );
    }

    const finalSuggestions =
      deduplicateSuggestions(
        suggestions
      ).slice(
        0,
        suggestionLimit
      );

    return {
      query:
        cleanQuery,

      normalizedQuery,

      kind:
        exactTopic
          ? resolveDiscoveryKind(
              exactTopic
            )
          : "dynamic",

      canSurface:
        true,

      visibility,

      exactTopic,

      suggestions:
        finalSuggestions,

      searchTerms:
        uniqueValues([
          cleanQuery,

          exactTopic?.name,

          ...(exactTopic?.aliases ??
            []),

          ...(exactTopic
            ?.searchKeywords ??
            []),

          ...registryMatches.flatMap(
            (match) => [
              match.topic.name,

              ...match.topic
                .aliases,

              ...match.topic
                .searchKeywords,
            ]
          ),
        ]).slice(
          0,
          60
        ),
    };
  }

  /**
   * COMMIT DISCOVERY
   *
   * Call only after a user actually
   * submits/selects a topic or another
   * meaningful content signal occurs.
   *
   * This is where the living taxonomy
   * receives evidence.
   */
  static async discoverTopic(
    query: string,
    options:
      DiscoverTopicOptions = {}
  ): Promise<TopicDiscoveryResult> {
    const cleanQuery =
      cleanText(query);

    const normalizedQuery =
      normalizeText(query);

    const visibility =
      evaluateContentVisibility(
        cleanQuery,
        options.visibilityContext
      );

    if (!normalizedQuery) {
      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        parentTopics: [],

        relatedMatches: [],

        searchTerms: [],
      };
    }

    /*
     * A blocked concept is never
     * persisted into discovery.
     */
    if (
      visibility.decision ===
      "block"
    ) {
      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        parentTopics: [],

        relatedMatches: [],

        searchTerms: [],
      };
    }

    /*
     * Review/restrict concepts may be
     * recorded by the evolution engine
     * so they can enter quarantine,
     * but they are never surfaced.
     */
    if (
      !canSurface(
        visibility
      )
    ) {
      await TaxonomyEvolutionService
        .observeTopic(
          cleanQuery,
          {
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

            now:
              options.now,
          }
        );

      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        parentTopics: [],

        relatedMatches: [],

        searchTerms: [],
      };
    }

    const observation =
      await TaxonomyEvolutionService
        .observeTopic(
          cleanQuery,
          {
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

            now:
              options.now,
          }
        );

    if (
      observation.type ===
      "blocked"
    ) {
      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        parentTopics: [],

        relatedMatches: [],

        searchTerms: [],
      };
    }

    const relatedLimit =
      Math.max(
        1,
        options.relatedLimit ??
          DEFAULT_RELATED_LIMIT
      );

    if (
      observation.type ===
        "canonical" &&
      observation
        .canonicalTopic
    ) {
      const primaryTopic =
        await UnifiedTopicRegistryService
          .getTopicById(
            observation
              .canonicalTopic.id
          );

      const relatedMatches =
        await UnifiedTopicRegistryService
          .searchTopics(
            cleanQuery,
            relatedLimit
          );

      const filteredRelated =
        relatedMatches.filter(
          (match) =>
            match.topic.id !==
            primaryTopic?.id
        );

      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "canonical",

        canSurface:
          true,

        visibility,

        primaryTopic,

        parentTopics: [],

        relatedMatches:
          filteredRelated,

        searchTerms:
          createSearchTerms(
            cleanQuery,
            primaryTopic,
            undefined,
            [],
            filteredRelated
          ),
      };
    }

    const record =
      observation.dynamicTopic;

    if (!record) {
      return {
        query:
          cleanQuery,

        normalizedQuery,

        kind:
          "unavailable",

        canSurface:
          false,

        visibility,

        parentTopics: [],

        relatedMatches: [],

        searchTerms: [],
      };
    }

    /*
     * A concept may have been merged
     * into an existing canonical or
     * promoted topic during evolution.
     */
    if (
      record.mergedIntoTopicId
    ) {
      const mergedTopic =
        await UnifiedTopicRegistryService
          .resolveMergedTopic(
            record.id
          );

      if (mergedTopic) {
        const relatedMatches =
          await UnifiedTopicRegistryService
            .searchTopics(
              mergedTopic.name,
              relatedLimit
            );

        const filteredRelated =
          relatedMatches.filter(
            (match) =>
              match.topic.id !==
              mergedTopic.id
          );

        return {
          query:
            cleanQuery,

          normalizedQuery,

          kind:
            resolveDiscoveryKind(
              mergedTopic
            ),

          canSurface:
            true,

          visibility,

          primaryTopic:
            mergedTopic,

          parentTopics: [],

          relatedMatches:
            filteredRelated,

          searchTerms:
            createSearchTerms(
              cleanQuery,
              mergedTopic,
              undefined,
              [],
              filteredRelated
            ),
        };
      }
    }

    const dynamicTopic =
      createRuntimeDynamicTopic(
        record,
        visibility
      );

    const parentTopics =
      await resolveParentTopics(
        record.parentTopicIds
      );

    const relatedMatches =
      await UnifiedTopicRegistryService
        .searchTopics(
          cleanQuery,
          relatedLimit
        );

    const filteredRelated =
      relatedMatches.filter(
        (match) =>
          match.topic.id !==
          record.id &&
          !record.parentTopicIds.includes(
            match.topic.id
          )
      );

    /*
     * Once promoted, this same dynamic
     * record becomes available through
     * the unified registry automatically.
     */
    const promotedPrimary =
      record.lifecycle ===
      "promoted"
        ? await UnifiedTopicRegistryService
            .getTopicById(
              record.id
            )
        : undefined;

    return {
      query:
        cleanQuery,

      normalizedQuery,

      kind:
        promotedPrimary
          ? "evolving"
          : "dynamic",

      canSurface:
        true,

      visibility,

      primaryTopic:
        promotedPrimary,

      dynamicTopic,

      parentTopics,

      relatedMatches:
        filteredRelated,

      searchTerms:
        createSearchTerms(
          cleanQuery,
          promotedPrimary,
          dynamicTopic,
          parentTopics,
          filteredRelated
        ),
    };
  }

  /**
   * Convenience method for Search UI.
   *
   * This remains PREVIEW-only and must
   * never count every keystroke as topic
   * demand.
   */
  static async getSuggestions(
    query: string,
    limit =
      DEFAULT_SUGGESTION_LIMIT,
    visibilityContext?:
      ContentVisibilityContext
  ): Promise<
    TopicDiscoverySuggestion[]
  > {
    const preview =
      await TopicDiscoveryOrchestratorService
        .previewQuery(
          query,
          {
            visibilityContext,

            suggestionLimit:
              limit,
          }
        );

    return preview.suggestions;
  }

  /**
   * Returns expanded terms for a
   * committed discovery.
   *
   * Useful later for SearchService,
   * ranking, backend query expansion,
   * recommendations, and semantic
   * retrieval.
   */
  static async createDiscoverySearchTerms(
    query: string,
    options:
      DiscoverTopicOptions = {}
  ): Promise<string[]> {
    const discovery =
      await TopicDiscoveryOrchestratorService
        .discoverTopic(
          query,
          options
        );

    return discovery.canSurface
      ? discovery.searchTerms
      : [];
  }
}