import UnifiedTopicRegistryService, {
  UnifiedTopic,
} from "./UnifiedTopicRegistryService";

export type InterestCatalogTopicKind =
  | "canonical"
  | "evolving";

export interface InterestCatalogTopic {
  id: string;

  slug: string;

  name: string;

  kind:
    InterestCatalogTopicKind;

  aliases: string[];

  searchKeywords: string[];

  description?: string;

  categoryName?: string;

  domainName?: string;

  parentTopicIds: string[];

  promotionScore: number;

  selectable: boolean;
}

export interface InterestCatalog {
  topics:
    InterestCatalogTopic[];

  canonicalTopics:
    InterestCatalogTopic[];

  evolvingTopics:
    InterestCatalogTopic[];
}

const MINIMUM_EVOLVING_PROMOTION_SCORE =
  0.72;

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
      const cleaned =
        cleanText(value);

      const key =
        normalizeText(
          cleaned
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);

      result.push(cleaned);
    }
  );

  return result;
}

function isSelectable(
  topic:
    UnifiedTopic
): boolean {
  if (
    topic.kind ===
    "canonical"
  ) {
    return true;
  }

  return (
    topic.promotionScore >=
    MINIMUM_EVOLVING_PROMOTION_SCORE
  );
}

function toCatalogTopic(
  topic:
    UnifiedTopic
): InterestCatalogTopic {
  return {
    id:
      topic.id,

    slug:
      topic.slug,

    name:
      topic.name,

    kind:
      topic.kind,

    aliases:
      uniqueValues(
        topic.aliases
      ),

    searchKeywords:
      uniqueValues(
        topic.searchKeywords
      ),

    description:
      topic.description,

    categoryName:
      topic.categoryName,

    domainName:
      topic.domainName,

    parentTopicIds:
      uniqueValues(
        topic.parentTopicIds
      ),

    promotionScore:
      topic.promotionScore,

    selectable:
      isSelectable(
        topic
      ),
  };
}

function deduplicateCatalog(
  topics:
    readonly InterestCatalogTopic[]
): InterestCatalogTopic[] {
  const seenIds =
    new Set<string>();

  const seenNames =
    new Set<string>();

  const result:
    InterestCatalogTopic[] =
    [];

  /*
   * Canonical topics win exact
   * collisions. Evolving topics are
   * retained only when genuinely
   * distinct.
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

        if (
          second.promotionScore !==
          first.promotionScore
        ) {
          return (
            second.promotionScore -
            first.promotionScore
          );
        }

        return first.name.localeCompare(
          second.name,
          undefined,
          {
            sensitivity:
              "base",
          }
        );
      }
    );

  ordered.forEach(
    (topic) => {
      const idKey =
        normalizeText(
          topic.id
        );

      const nameKey =
        normalizeText(
          topic.name
        );

      if (
        !idKey ||
        !nameKey ||
        seenIds.has(idKey) ||
        seenNames.has(nameKey)
      ) {
        return;
      }

      seenIds.add(idKey);

      seenNames.add(
        nameKey
      );

      result.push(topic);
    }
  );

  return result;
}

export default class InterestCatalogService {
  /**
   * Returns the living selectable
   * interest catalog:
   *
   * canonical topics
   * +
   * safely promoted evolving topics.
   */
  static async getCatalog(): Promise<
    InterestCatalog
  > {
    const registry =
      await UnifiedTopicRegistryService
        .getRegistry();

    const canonicalTopics =
      registry.canonicalTopics
        .map(toCatalogTopic)
        .filter(
          (topic) =>
            topic.selectable
        );

    const evolvingTopics =
      registry.evolvingTopics
        .map(toCatalogTopic)
        .filter(
          (topic) =>
            topic.selectable
        );

    const topics =
      deduplicateCatalog([
        ...canonicalTopics,
        ...evolvingTopics,
      ]);

    return {
      topics,

      canonicalTopics:
        topics.filter(
          (topic) =>
            topic.kind ===
            "canonical"
        ),

      evolvingTopics:
        topics.filter(
          (topic) =>
            topic.kind ===
            "evolving"
        ),
    };
  }

  static async getSelectableTopics(): Promise<
    InterestCatalogTopic[]
  > {
    return (
      await InterestCatalogService
        .getCatalog()
    ).topics;
  }

  static async getTopicById(
    topicId: string
  ): Promise<
    InterestCatalogTopic | undefined
  > {
    const normalizedId =
      normalizeText(
        topicId
      );

    if (!normalizedId) {
      return undefined;
    }

    const topics =
      await InterestCatalogService
        .getSelectableTopics();

    return topics.find(
      (topic) =>
        normalizeText(
          topic.id
        ) ===
        normalizedId
    );
  }

  static async search(
    query: string,
    limit = 30
  ): Promise<
    InterestCatalogTopic[]
  > {
    const normalizedQuery =
      normalizeText(
        query
      );

    if (!normalizedQuery) {
      return [];
    }

    const topics =
      await InterestCatalogService
        .getSelectableTopics();

    return topics
      .map(
        (topic) => {
          const name =
            normalizeText(
              topic.name
            );

          const aliases =
            topic.aliases.map(
              normalizeText
            );

          const keywords =
            topic.searchKeywords.map(
              normalizeText
            );

          let score = 0;

          if (
            name ===
            normalizedQuery
          ) {
            score += 120;
          } else if (
            name.startsWith(
              normalizedQuery
            )
          ) {
            score += 90;
          } else if (
            name.includes(
              normalizedQuery
            )
          ) {
            score += 70;
          }

          if (
            aliases.some(
              (alias) =>
                alias ===
                normalizedQuery
            )
          ) {
            score += 100;
          } else if (
            aliases.some(
              (alias) =>
                alias.includes(
                  normalizedQuery
                )
            )
          ) {
            score += 60;
          }

          if (
            keywords.some(
              (keyword) =>
                keyword ===
                normalizedQuery
            )
          ) {
            score += 80;
          } else if (
            keywords.some(
              (keyword) =>
                keyword.includes(
                  normalizedQuery
                )
            )
          ) {
            score += 45;
          }

          if (
            topic.categoryName &&
            normalizeText(
              topic.categoryName
            ).includes(
              normalizedQuery
            )
          ) {
            score += 25;
          }

          if (
            topic.domainName &&
            normalizeText(
              topic.domainName
            ).includes(
              normalizedQuery
            )
          ) {
            score += 20;
          }

          if (
            topic.kind ===
            "evolving"
          ) {
            score +=
              Math.round(
                topic.promotionScore *
                  10
              );
          }

          return {
            topic,

            score,
          };
        }
      )
      .filter(
        (item) =>
          item.score > 0
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
      )
      .map(
        (item) =>
          item.topic
      );
  }

  /**
   * Resolves old saved values, names,
   * aliases or IDs against the living
   * catalog.
   *
   * This prepares us for safe migration
   * of existing users when an evolving
   * topic becomes canonical or aliases
   * are merged later.
   */
  static async resolveSavedInterest(
    value: string
  ): Promise<
    InterestCatalogTopic | undefined
  > {
    const normalizedValue =
      normalizeText(
        value
      );

    if (!normalizedValue) {
      return undefined;
    }

    const topics =
      await InterestCatalogService
        .getSelectableTopics();

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

  static async resolveSavedInterests(
    values:
      readonly string[]
  ): Promise<
    InterestCatalogTopic[]
  > {
    const results =
      await Promise.all(
        values.map(
          (value) =>
            InterestCatalogService
              .resolveSavedInterest(
                value
              )
        )
      );

    const valid =
      results.filter(
        (
          topic
        ): topic is InterestCatalogTopic =>
          Boolean(topic)
      );

    return deduplicateCatalog(
      valid
    );
  }
}