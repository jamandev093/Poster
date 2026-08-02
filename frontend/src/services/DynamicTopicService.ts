import {
  findInterestTopicByName,
  getInterestTopicById,
  getRelatedInterestTopics,
  getSearchableInterestTopics,
  InterestTopicDefinition,
  resolveInterestTopic,
} from "../data/interests";

import {
  ContentVisibilityContext,
  ContentVisibilityEvaluation,
  evaluateContentVisibility,
} from "../data/contentVisibilityPolicy";

export type TopicResolutionKind =
  | "canonical"
  | "dynamic"
  | "unavailable";

export type TopicMatchReason =
  | "exact_id"
  | "exact_slug"
  | "exact_name"
  | "exact_alias"
  | "exact_keyword"
  | "name_prefix"
  | "alias_prefix"
  | "phrase"
  | "token"
  | "category"
  | "domain";

export interface CanonicalTopicMatch {
  topic:
    InterestTopicDefinition;

  score: number;

  reasons:
    TopicMatchReason[];
}

export interface DynamicTopicResolution {
  id: string;

  kind:
    TopicResolutionKind;

  query: string;

  normalizedQuery: string;

  displayName: string;

  canSurface: boolean;

  visibility:
    ContentVisibilityEvaluation;

  canonicalTopic?:
    InterestTopicDefinition;

  parentTopics:
    InterestTopicDefinition[];

  relatedTopics:
    InterestTopicDefinition[];

  searchTerms:
    string[];
}

export interface TopicSearchSuggestion {
  id: string;

  label: string;

  kind:
    "canonical" | "dynamic";

  canonicalTopicId?:
    string;

  categoryName?: string;

  domainName?: string;

  score: number;

  searchTerms:
    string[];
}

interface ResolveTopicOptions {
  visibilityContext?:
    ContentVisibilityContext;

  maximumParentTopics?: number;

  maximumRelatedTopics?: number;
}

interface SuggestTopicOptions {
  visibilityContext?:
    ContentVisibilityContext;

  limit?: number;
}

const DEFAULT_PARENT_LIMIT = 4;

const DEFAULT_RELATED_LIMIT = 8;

const DEFAULT_SUGGESTION_LIMIT =
  12;

const MINIMUM_PARENT_SCORE = 14;

const STOP_WORDS =
  new Set<string>([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
  ]);

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

function cleanDisplayText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function createSlug(
  value: string
): string {
  return normalizeText(value)
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 80);
}

function createHash(
  value: string
): string {
  let hash = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(
        index
      );

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return (
    hash >>> 0
  )
    .toString(36);
}

function createDynamicTopicId(
  normalizedQuery: string
): string {
  const slug =
    createSlug(
      normalizedQuery
    ) || "topic";

  return [
    "dynamic",
    slug,
    createHash(
      normalizedQuery
    ),
  ].join("-");
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

  values.forEach((value) => {
    const cleanValue =
      value
        ?.trim()
        .replace(/\s+/g, " ");

    if (!cleanValue) {
      return;
    }

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
  });

  return result;
}

function tokenize(
  value: string
): string[] {
  return createUniqueValues(
    normalizeText(value)
      .split(
        /[^a-z0-9]+/
      )
      .filter(
        (token) =>
          token.length >= 2 &&
          !STOP_WORDS.has(
            token
          )
      )
  );
}

function getTopicValues(
  topic:
    InterestTopicDefinition
): string[] {
  const resolved =
    resolveInterestTopic(
      topic
    );

  return createUniqueValues([
    topic.id,
    topic.slug,
    topic.name,
    topic.description,

    ...(topic.aliases ??
      []),

    ...(topic.searchKeywords ??
      []),

    resolved?.category.name,
    resolved?.domain.name,
  ]);
}

function addReason(
  reasons:
    TopicMatchReason[],
  reason:
    TopicMatchReason
): void {
  if (
    !reasons.includes(
      reason
    )
  ) {
    reasons.push(reason);
  }
}

function scoreCanonicalTopic(
  topic:
    InterestTopicDefinition,
  query: string
): CanonicalTopicMatch {
  const normalizedQuery =
    normalizeText(query);

  const normalizedId =
    normalizeText(
      topic.id
    );

  const normalizedSlug =
    normalizeText(
      topic.slug
    );

  const normalizedName =
    normalizeText(
      topic.name
    );

  const aliases =
    (topic.aliases ?? [])
      .map(normalizeText)
      .filter(Boolean);

  const keywords =
    (
      topic.searchKeywords ??
      []
    )
      .map(normalizeText)
      .filter(Boolean);

  const resolved =
    resolveInterestTopic(
      topic
    );

  const categoryName =
    normalizeText(
      resolved?.category.name
    );

  const domainName =
    normalizeText(
      resolved?.domain.name
    );

  const searchableValues =
    getTopicValues(topic)
      .map(normalizeText)
      .filter(Boolean);

  const queryTokens =
    tokenize(
      normalizedQuery
    );

  let score = 0;

  const reasons:
    TopicMatchReason[] =
    [];

  if (
    normalizedQuery ===
    normalizedId
  ) {
    score += 120;

    addReason(
      reasons,
      "exact_id"
    );
  }

  if (
    normalizedQuery ===
    normalizedSlug
  ) {
    score += 115;

    addReason(
      reasons,
      "exact_slug"
    );
  }

  if (
    normalizedQuery ===
    normalizedName
  ) {
    score += 110;

    addReason(
      reasons,
      "exact_name"
    );
  }

  if (
    aliases.includes(
      normalizedQuery
    )
  ) {
    score += 100;

    addReason(
      reasons,
      "exact_alias"
    );
  }

  if (
    keywords.includes(
      normalizedQuery
    )
  ) {
    score += 90;

    addReason(
      reasons,
      "exact_keyword"
    );
  }

  if (
    normalizedName.startsWith(
      normalizedQuery
    ) &&
    normalizedQuery.length >=
      2
  ) {
    score += 55;

    addReason(
      reasons,
      "name_prefix"
    );
  }

  if (
    aliases.some(
      (alias) =>
        alias.startsWith(
          normalizedQuery
        )
    ) &&
    normalizedQuery.length >=
      2
  ) {
    score += 48;

    addReason(
      reasons,
      "alias_prefix"
    );
  }

  if (
    normalizedQuery.length >=
      3 &&
    searchableValues.some(
      (value) =>
        value.includes(
          normalizedQuery
        )
    )
  ) {
    score += 34;

    addReason(
      reasons,
      "phrase"
    );
  }

  if (
    normalizedName.length >= 4 &&
    normalizedQuery.includes(
      normalizedName
    )
  ) {
    score += 30;

    addReason(
      reasons,
      "phrase"
    );
  }

  if (
    categoryName &&
    (
      normalizedQuery ===
        categoryName ||
      normalizedQuery.includes(
        categoryName
      ) ||
      categoryName.includes(
        normalizedQuery
      )
    )
  ) {
    score += 18;

    addReason(
      reasons,
      "category"
    );
  }

  if (
    domainName &&
    (
      normalizedQuery ===
        domainName ||
      normalizedQuery.includes(
        domainName
      ) ||
      domainName.includes(
        normalizedQuery
      )
    )
  ) {
    score += 14;

    addReason(
      reasons,
      "domain"
    );
  }

  if (
    queryTokens.length > 0
  ) {
    let matchedTokens = 0;

    queryTokens.forEach(
      (token) => {
        const matches =
          searchableValues.some(
            (value) =>
              tokenize(
                value
              ).includes(
                token
              )
          );

        if (matches) {
          matchedTokens += 1;
        }
      }
    );

    if (
      matchedTokens > 0
    ) {
      const coverage =
        matchedTokens /
        queryTokens.length;

      score +=
        matchedTokens * 10;

      score +=
        Math.round(
          coverage * 20
        );

      addReason(
        reasons,
        "token"
      );
    }
  }

  const priority =
    topic.searchPriority ??
    50;

  score += Math.max(
    0,
    Math.min(
      5,
      Math.round(
        (100 - priority) /
          20
      )
    )
  );

  return {
    topic,

    score,

    reasons,
  };
}

export function getCanonicalTopicMatches(
  query: string,
  limit = 12
): CanonicalTopicMatch[] {
  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  return getSearchableInterestTopics()
    .map((topic) =>
      scoreCanonicalTopic(
        topic,
        normalizedQuery
      )
    )
    .filter(
      (match) =>
        match.score > 0
    )
    .sort(
      (
        first,
        second
      ) => {
        if (
          second.score !==
          first.score
        ) {
          return (
            second.score -
            first.score
          );
        }

        return first.topic.name.localeCompare(
          second.topic.name,
          undefined,
          {
            sensitivity:
              "base",
          }
        );
      }
    )
    .slice(
      0,
      Math.max(
        0,
        limit
      )
    );
}

function resolveExactCanonicalTopic(
  query: string
):
  | InterestTopicDefinition
  | undefined {
  const cleanQuery =
    cleanDisplayText(
      query
    );

  if (!cleanQuery) {
    return undefined;
  }

  return (
    getInterestTopicById(
      cleanQuery
    ) ??
    findInterestTopicByName(
      cleanQuery
    )
  );
}

function createRelatedTopics(
  parentTopics:
    readonly InterestTopicDefinition[],
  limit: number
): InterestTopicDefinition[] {
  const parentIds =
    new Set(
      parentTopics.map(
        (topic) =>
          topic.id
      )
    );

  const seen =
    new Set<string>();

  const result:
    InterestTopicDefinition[] =
    [];

  parentTopics.forEach(
    (parentTopic) => {
      getRelatedInterestTopics(
        parentTopic.id,
        limit
      ).forEach(
        (relatedTopic) => {
          if (
            parentIds.has(
              relatedTopic.id
            ) ||
            seen.has(
              relatedTopic.id
            )
          ) {
            return;
          }

          seen.add(
            relatedTopic.id
          );

          result.push(
            relatedTopic
          );
        }
      );
    }
  );

  return result.slice(
    0,
    limit
  );
}

function createSearchTerms(
  query: string,
  canonicalTopic:
    | InterestTopicDefinition
    | undefined,
  parentTopics:
    readonly InterestTopicDefinition[],
  relatedTopics:
    readonly InterestTopicDefinition[]
): string[] {
  return createUniqueValues([
    cleanDisplayText(
      query
    ),

    ...(canonicalTopic
      ? getTopicValues(
          canonicalTopic
        )
      : []),

    ...parentTopics.flatMap(
      (topic) =>
        getTopicValues(
          topic
        )
    ),

    ...relatedTopics.flatMap(
      (topic) => [
        topic.name,

        ...(topic.aliases ??
          []),

        ...(topic.searchKeywords ??
          []),
      ]
    ),
  ]).slice(
    0,
    60
  );
}

function canSurfaceVisibility(
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

export function resolveTopicQuery(
  query: string,
  options:
    ResolveTopicOptions = {}
): DynamicTopicResolution {
  const displayName =
    cleanDisplayText(
      query
    );

  const normalizedQuery =
    normalizeText(
      query
    );

  const visibility =
    evaluateContentVisibility(
      displayName,
      options.visibilityContext
    );

  const canSurface =
    canSurfaceVisibility(
      visibility
    );

  if (
    !normalizedQuery ||
    !canSurface
  ) {
    return {
      id:
        normalizedQuery
          ? createDynamicTopicId(
              normalizedQuery
            )
          : "dynamic-empty",

      kind:
        "unavailable",

      query:
        displayName,

      normalizedQuery,

      displayName,

      canSurface:
        false,

      visibility,

      parentTopics: [],

      relatedTopics: [],

      searchTerms: [],
    };
  }

  const exactCanonical =
    resolveExactCanonicalTopic(
      displayName
    );

  if (exactCanonical) {
    const maximumRelatedTopics =
      Math.max(
        0,
        options.maximumRelatedTopics ??
          DEFAULT_RELATED_LIMIT
      );

    const relatedTopics =
      getRelatedInterestTopics(
        exactCanonical.id,
        maximumRelatedTopics
      );

    return {
      id:
        exactCanonical.id,

      kind:
        "canonical",

      query:
        displayName,

      normalizedQuery,

      displayName:
        exactCanonical.name,

      canSurface:
        true,

      visibility,

      canonicalTopic:
        exactCanonical,

      parentTopics: [
        exactCanonical,
      ],

      relatedTopics,

      searchTerms:
        createSearchTerms(
          displayName,
          exactCanonical,
          [
            exactCanonical,
          ],
          relatedTopics
        ),
    };
  }

  const maximumParentTopics =
    Math.max(
      1,
      options.maximumParentTopics ??
        DEFAULT_PARENT_LIMIT
    );

  const parentTopics =
    getCanonicalTopicMatches(
      displayName,
      Math.max(
        maximumParentTopics *
          3,
        12
      )
    )
      .filter(
        (match) =>
          match.score >=
          MINIMUM_PARENT_SCORE
      )
      .slice(
        0,
        maximumParentTopics
      )
      .map(
        (match) =>
          match.topic
      );

  const maximumRelatedTopics =
    Math.max(
      0,
      options.maximumRelatedTopics ??
        DEFAULT_RELATED_LIMIT
    );

  const relatedTopics =
    createRelatedTopics(
      parentTopics,
      maximumRelatedTopics
    );

  return {
    id:
      createDynamicTopicId(
        normalizedQuery
      ),

    kind:
      "dynamic",

    query:
      displayName,

    normalizedQuery,

    displayName,

    canSurface:
      true,

    visibility,

    parentTopics,

    relatedTopics,

    searchTerms:
      createSearchTerms(
        displayName,
        undefined,
        parentTopics,
        relatedTopics
      ),
  };
}

function createCanonicalSuggestion(
  match:
    CanonicalTopicMatch
): TopicSearchSuggestion {
  const resolved =
    resolveInterestTopic(
      match.topic
    );

  return {
    id:
      match.topic.id,

    label:
      match.topic.name,

    kind:
      "canonical",

    canonicalTopicId:
      match.topic.id,

    categoryName:
      resolved?.category.name,

    domainName:
      resolved?.domain.name,

    score:
      match.score,

    searchTerms:
      getTopicValues(
        match.topic
      ),
  };
}

export function getTopicSearchSuggestions(
  query: string,
  options:
    SuggestTopicOptions = {}
): TopicSearchSuggestion[] {
  const displayQuery =
    cleanDisplayText(
      query
    );

  if (!displayQuery) {
    return [];
  }

  const visibility =
    evaluateContentVisibility(
      displayQuery,
      options.visibilityContext
    );

  if (
    !canSurfaceVisibility(
      visibility
    )
  ) {
    return [];
  }

  const limit =
    Math.max(
      1,
      options.limit ??
        DEFAULT_SUGGESTION_LIMIT
    );

  const exactCanonical =
    resolveExactCanonicalTopic(
      displayQuery
    );

  const canonicalMatches =
    getCanonicalTopicMatches(
      displayQuery,
      limit
    );

  const suggestions =
    canonicalMatches.map(
      createCanonicalSuggestion
    );

  /*
   * Infinite/open-ended discovery:
   * every safe query may become a
   * temporary dynamic topic even when
   * it is not part of the canonical
   * taxonomy.
   *
   * Dynamic topics are not automatically
   * persisted as official interests.
   */
  if (!exactCanonical) {
    const dynamicResolution =
      resolveTopicQuery(
        displayQuery,
        {
          visibilityContext:
            options.visibilityContext,
        }
      );

    if (
      dynamicResolution.canSurface
    ) {
      suggestions.unshift({
        id:
          dynamicResolution.id,

        label:
          dynamicResolution.displayName,

        kind:
          "dynamic",

        score:
          Number.MAX_SAFE_INTEGER,

        searchTerms:
          dynamicResolution.searchTerms,
      });
    }
  }

  const seen =
    new Set<string>();

  return suggestions
    .filter(
      (suggestion) => {
        const key =
          normalizeText(
            suggestion.label
          );

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    )
    .slice(
      0,
      limit
    );
}

export function createTopicSearchTerms(
  query: string,
  context?:
    ContentVisibilityContext
): string[] {
  const resolution =
    resolveTopicQuery(
      query,
      {
        visibilityContext:
          context,
      }
    );

  return resolution.canSurface
    ? resolution.searchTerms
    : [];
}

export function isDynamicTopicQueryAllowed(
  query: string,
  context?:
    ContentVisibilityContext
): boolean {
  return resolveTopicQuery(
    query,
    {
      visibilityContext:
        context,
    }
  ).canSurface;
}