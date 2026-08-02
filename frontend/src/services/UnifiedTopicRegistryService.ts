import {
  findInterestTopicByName,
  getInterestTopicById,
  getSearchableInterestTopics,
  resolveInterestTopic,
} from "../data/interests";

import TaxonomyEvolutionService, {
  EvolvingTopicRecord,
} from "./TaxonomyEvolutionService";

type CanonicalTopic =
  ReturnType<
    typeof getSearchableInterestTopics
  >[number];

export type UnifiedTopicKind =
  | "canonical"
  | "evolving";

export interface UnifiedTopic {
  id: string;

  slug: string;

  name: string;

  normalizedName: string;

  kind:
    UnifiedTopicKind;

  aliases: string[];

  searchKeywords: string[];

  description?: string;

  categoryName?: string;

  domainName?: string;

  parentTopicIds: string[];

  promotionScore: number;

  source:
    | CanonicalTopic
    | EvolvingTopicRecord;
}

export interface UnifiedTopicSearchResult {
  topic:
    UnifiedTopic;

  score: number;

  matchedBy:
    | "id"
    | "slug"
    | "name"
    | "alias"
    | "keyword"
    | "phrase"
    | "token";
}

export interface UnifiedTopicRegistry {
  canonicalTopics:
    UnifiedTopic[];

  evolvingTopics:
    UnifiedTopic[];

  allTopics:
    UnifiedTopic[];
}

const MAX_SEARCH_RESULTS =
  30;

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

function tokenize(
  value: string
): string[] {
  return uniqueValues(
    normalizeText(value)
      .split(
        /[^a-z0-9]+/
      )
      .filter(
        (token) =>
          token.length >= 2
      )
  );
}

function toCanonicalUnifiedTopic(
  topic:
    CanonicalTopic
): UnifiedTopic {
  const resolved =
    resolveInterestTopic(
      topic
    );

  return {
    id:
      topic.id,

    slug:
      topic.slug,

    name:
      topic.name,

    normalizedName:
      normalizeText(
        topic.name
      ),

    kind:
      "canonical",

    aliases:
      uniqueValues(
        topic.aliases ??
          []
      ),

    searchKeywords:
      uniqueValues(
        topic.searchKeywords ??
          []
      ),

    description:
      topic.description,

    categoryName:
      resolved?.category.name,

    domainName:
      resolved?.domain.name,

    parentTopicIds: [],

    /*
     * Canonical topics already belong
     * to the trusted permanent taxonomy.
     */
    promotionScore:
      1,

    source:
      topic,
  };
}

function toEvolvingUnifiedTopic(
  topic:
    EvolvingTopicRecord
): UnifiedTopic {
  return {
    id:
      topic.id,

    slug:
      topic.slug,

    name:
      topic.name,

    normalizedName:
      topic.normalizedName,

    kind:
      "evolving",

    aliases:
      uniqueValues(
        topic.aliases
      ),

    /*
     * Dynamic concepts do not invent
     * artificial keywords here.
     * Backend/AI enrichment can add
     * semantic terms later.
     */
    searchKeywords: [],

    parentTopicIds:
      uniqueValues(
        topic.parentTopicIds
      ),

    promotionScore:
      topic.evidence
        .promotionScore,

    source:
      topic,
  };
}

function getTopicSearchValues(
  topic:
    UnifiedTopic
): string[] {
  return uniqueValues([
    topic.id,

    topic.slug,

    topic.name,

    ...topic.aliases,

    ...topic.searchKeywords,

    topic.description,

    topic.categoryName,

    topic.domainName,
  ]);
}

function scoreTopic(
  topic:
    UnifiedTopic,
  query: string
): UnifiedTopicSearchResult | null {
  const normalizedQuery =
    normalizeText(
      query
    );

  if (!normalizedQuery) {
    return null;
  }

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

  const normalizedAliases =
    topic.aliases.map(
      normalizeText
    );

  const normalizedKeywords =
    topic.searchKeywords.map(
      normalizeText
    );

  const searchableValues =
    getTopicSearchValues(
      topic
    )
      .map(
        normalizeText
      )
      .filter(Boolean);

  let score = 0;

  let matchedBy:
    UnifiedTopicSearchResult["matchedBy"] =
    "token";

  if (
    normalizedQuery ===
    normalizedId
  ) {
    score = 150;

    matchedBy =
      "id";
  } else if (
    normalizedQuery ===
    normalizedSlug
  ) {
    score = 145;

    matchedBy =
      "slug";
  } else if (
    normalizedQuery ===
    normalizedName
  ) {
    score = 140;

    matchedBy =
      "name";
  } else if (
    normalizedAliases.includes(
      normalizedQuery
    )
  ) {
    score = 130;

    matchedBy =
      "alias";
  } else if (
    normalizedKeywords.includes(
      normalizedQuery
    )
  ) {
    score = 120;

    matchedBy =
      "keyword";
  } else {
    const phraseMatch =
      searchableValues.some(
        (value) =>
          value.includes(
            normalizedQuery
          ) ||
          normalizedQuery.includes(
            value
          )
      );

    if (phraseMatch) {
      score = 70;

      matchedBy =
        "phrase";
    }

    const queryTokens =
      tokenize(
        normalizedQuery
      );

    if (
      queryTokens.length > 0
    ) {
      const searchableTokens =
        new Set(
          searchableValues.flatMap(
            tokenize
          )
        );

      const matchedTokens =
        queryTokens.filter(
          (token) =>
            searchableTokens.has(
              token
            )
        ).length;

      if (
        matchedTokens > 0
      ) {
        const tokenScore =
          matchedTokens *
            12 +
          Math.round(
            (
              matchedTokens /
              queryTokens.length
            ) *
              20
          );

        if (
          tokenScore >
          score
        ) {
          score =
            tokenScore;

          matchedBy =
            "token";
        }
      }
    }
  }

  if (score <= 0) {
    return null;
  }

  /*
   * Canonical topics get a small
   * stability advantage.
   *
   * Promoted evolving topics receive
   * a relevance bonus from their
   * accumulated promotion evidence.
   */
  if (
    topic.kind ===
    "canonical"
  ) {
    score += 8;
  } else {
    score +=
      Math.round(
        topic.promotionScore *
          10
      );
  }

  return {
    topic,

    score,

    matchedBy,
  };
}

function deduplicateTopics(
  topics:
    readonly UnifiedTopic[]
): UnifiedTopic[] {
  const seenIds =
    new Set<string>();

  const seenNames =
    new Set<string>();

  const result:
    UnifiedTopic[] = [];

  /*
   * Canonical topics should appear
   * before evolving topics so the
   * permanent taxonomy wins any
   * accidental duplicate.
   */
  const ordered =
    [...topics].sort(
      (
        first,
        second
      ) => {
        if (
          first.kind !==
          second.kind
        ) {
          return first.kind ===
            "canonical"
            ? -1
            : 1;
        }

        return (
          second.promotionScore -
          first.promotionScore
        );
      }
    );

  ordered.forEach(
    (topic) => {
      const normalizedId =
        normalizeText(
          topic.id
        );

      const normalizedName =
        normalizeText(
          topic.name
        );

      if (
        seenIds.has(
          normalizedId
        ) ||
        seenNames.has(
          normalizedName
        )
      ) {
        return;
      }

      seenIds.add(
        normalizedId
      );

      seenNames.add(
        normalizedName
      );

      result.push(
        topic
      );
    }
  );

  return result;
}

export default class UnifiedTopicRegistryService {
  static async getRegistry(): Promise<
    UnifiedTopicRegistry
  > {
    const canonicalTopics =
      getSearchableInterestTopics()
        .map(
          toCanonicalUnifiedTopic
        );

    const promotedRecords =
      await TaxonomyEvolutionService
        .getPromotedTopics();

    const evolvingTopics =
      promotedRecords
        .filter(
          (topic) =>
            topic.lifecycle ===
              "promoted" &&
            !topic
              .mergedIntoTopicId &&
            topic
              .visibilityDecision !==
              "block" &&
            topic
              .visibilityDecision !==
              "review" &&
            topic
              .visibilityDecision !==
              "restrict"
        )
        .map(
          toEvolvingUnifiedTopic
        );

    const allTopics =
      deduplicateTopics([
        ...canonicalTopics,
        ...evolvingTopics,
      ]);

    return {
      canonicalTopics,

      evolvingTopics,

      allTopics,
    };
  }

  static async getAllTopics(): Promise<
    UnifiedTopic[]
  > {
    return (
      await UnifiedTopicRegistryService
        .getRegistry()
    ).allTopics;
  }

  static async getSelectableInterestTopics(): Promise<
    UnifiedTopic[]
  > {
    /*
     * This is the key bridge for the
     * self-evolving taxonomy.
     *
     * Onboarding and Profile will
     * eventually consume this instead
     * of a static canonical-only array.
     */
    return UnifiedTopicRegistryService
      .getAllTopics();
  }

  static async getTopicById(
    topicId: string
  ): Promise<
    UnifiedTopic | undefined
  > {
    const normalizedId =
      normalizeText(
        topicId
      );

    if (!normalizedId) {
      return undefined;
    }

    const exactCanonical =
      getInterestTopicById(
        topicId
      );

    if (exactCanonical) {
      return toCanonicalUnifiedTopic(
        exactCanonical
      );
    }

    const topics =
      await UnifiedTopicRegistryService
        .getAllTopics();

    return topics.find(
      (topic) =>
        normalizeText(
          topic.id
        ) ===
        normalizedId
    );
  }

  static async resolveTopic(
    value: string
  ): Promise<
    UnifiedTopic | undefined
  > {
    const normalizedValue =
      normalizeText(
        value
      );

    if (!normalizedValue) {
      return undefined;
    }

    const exactCanonical =
      getInterestTopicById(
        value
      ) ??
      findInterestTopicByName(
        value
      );

    if (exactCanonical) {
      return toCanonicalUnifiedTopic(
        exactCanonical
      );
    }

    const topics =
      await UnifiedTopicRegistryService
        .getAllTopics();

    return topics.find(
      (topic) => {
        if (
          normalizeText(
            topic.id
          ) ===
            normalizedValue ||
          normalizeText(
            topic.slug
          ) ===
            normalizedValue ||
          normalizeText(
            topic.name
          ) ===
            normalizedValue
        ) {
          return true;
        }

        return topic.aliases.some(
          (alias) =>
            normalizeText(
              alias
            ) ===
            normalizedValue
        );
      }
    );
  }

  static async searchTopics(
    query: string,
    limit =
      MAX_SEARCH_RESULTS
  ): Promise<
    UnifiedTopicSearchResult[]
  > {
    const normalizedQuery =
      normalizeText(
        query
      );

    if (!normalizedQuery) {
      return [];
    }

    const topics =
      await UnifiedTopicRegistryService
        .getAllTopics();

    return topics
      .map(
        (topic) =>
          scoreTopic(
            topic,
            normalizedQuery
          )
      )
      .filter(
        (
          result
        ): result is UnifiedTopicSearchResult =>
          result !== null
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

  static async getAliasesForTopic(
    topicId: string
  ): Promise<string[]> {
    const topic =
      await UnifiedTopicRegistryService
        .getTopicById(
          topicId
        );

    if (!topic) {
      return [];
    }

    return uniqueValues([
      topic.name,

      ...topic.aliases,

      ...topic.searchKeywords,
    ]);
  }

  static async getParentTopics(
    topic:
      UnifiedTopic
  ): Promise<
    UnifiedTopic[]
  > {
    if (
      topic.parentTopicIds
        .length === 0
    ) {
      return [];
    }

    const allTopics =
      await UnifiedTopicRegistryService
        .getAllTopics();

    const byId =
      new Map(
        allTopics.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    return topic.parentTopicIds
      .map(
        (parentId) =>
          byId.get(
            parentId
          )
      )
      .filter(
        (
          parent
        ): parent is UnifiedTopic =>
          Boolean(parent)
      );
  }

  static async resolveMergedTopic(
    topicId: string
  ): Promise<
    UnifiedTopic | undefined
  > {
    const registry =
      await TaxonomyEvolutionService
        .getAllTopics();

    const evolving =
      registry.find(
        (topic) =>
          topic.id ===
          topicId
      );

    if (
      !evolving
        ?.mergedIntoTopicId
    ) {
      return UnifiedTopicRegistryService
        .getTopicById(
          topicId
        );
    }

    return UnifiedTopicRegistryService
      .getTopicById(
        evolving
          .mergedIntoTopicId
      );
  }
}