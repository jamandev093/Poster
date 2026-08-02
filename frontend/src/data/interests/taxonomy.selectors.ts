import {
  InterestCategoryDefinition,
  InterestDomainDefinition,
  InterestTopicDefinition,
  ResolvedInterestTopic,
} from "./taxonomy.types";

import {
  interestTaxonomyRegistry,
} from "./taxonomy.registry";

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeSlug(
  value: string
): string {
  return normalizeText(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLimit(
  limit: number | undefined,
  fallback: number
): number {
  if (
    typeof limit !== "number" ||
    !Number.isFinite(limit)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(limit)
  );
}

function compareByOrder(
  first: {
    order: number;
    name: string;
  },
  second: {
    order: number;
    name: string;
  }
): number {
  if (
    first.order !==
    second.order
  ) {
    return (
      first.order -
      second.order
    );
  }

  return first.name.localeCompare(
    second.name
  );
}

function compareOptionalPriority(
  firstPriority:
    number | undefined,
  secondPriority:
    number | undefined
): number {
  const normalizedFirst =
    typeof firstPriority ===
      "number" &&
    Number.isFinite(
      firstPriority
    )
      ? firstPriority
      : Number.MAX_SAFE_INTEGER;

  const normalizedSecond =
    typeof secondPriority ===
      "number" &&
    Number.isFinite(
      secondPriority
    )
      ? secondPriority
      : Number.MAX_SAFE_INTEGER;

  return (
    normalizedFirst -
    normalizedSecond
  );
}

function compareTopicsByPriority(
  first: InterestTopicDefinition,
  second: InterestTopicDefinition
): number {
  const priorityComparison =
    compareOptionalPriority(
      first.searchPriority ??
        first.onboardingPriority,
      second.searchPriority ??
        second.onboardingPriority
    );

  if (
    priorityComparison !== 0
  ) {
    return priorityComparison;
  }

  if (
    first.featured !==
    second.featured
  ) {
    return first.featured
      ? -1
      : 1;
  }

  return first.name.localeCompare(
    second.name
  );
}

function isActiveTopic(
  topic: InterestTopicDefinition
): boolean {
  return (
    topic.status === "active"
  );
}

function isVisibleDomain(
  domain:
    InterestDomainDefinition
): boolean {
  return (
    domain.status ===
      undefined ||
    domain.status ===
      "active"
  );
}

function isVisibleCategory(
  category:
    InterestCategoryDefinition
): boolean {
  return (
    category.status ===
      undefined ||
    category.status ===
      "active"
  );
}

function createUniqueTopics(
  topics:
    readonly InterestTopicDefinition[]
): InterestTopicDefinition[] {
  const seen =
    new Set<string>();

  const result:
    InterestTopicDefinition[] = [];

  topics.forEach(
    (topic) => {
      if (
        seen.has(topic.id)
      ) {
        return;
      }

      seen.add(topic.id);
      result.push(topic);
    }
  );

  return result;
}

const domainById =
  new Map<
    string,
    InterestDomainDefinition
  >(
    interestTaxonomyRegistry.domains.map(
      (domain) => [
        domain.id,
        domain,
      ]
    )
  );

const domainBySlug =
  new Map<
    string,
    InterestDomainDefinition
  >(
    interestTaxonomyRegistry.domains.map(
      (domain) => [
        normalizeSlug(
          domain.slug
        ),
        domain,
      ]
    )
  );

const categoryById =
  new Map<
    string,
    InterestCategoryDefinition
  >(
    interestTaxonomyRegistry.categories.map(
      (category) => [
        category.id,
        category,
      ]
    )
  );

const categoryBySlug =
  new Map<
    string,
    InterestCategoryDefinition
  >(
    interestTaxonomyRegistry.categories.map(
      (category) => [
        normalizeSlug(
          category.slug
        ),
        category,
      ]
    )
  );

const topicById =
  new Map<
    string,
    InterestTopicDefinition
  >(
    interestTaxonomyRegistry.topics.map(
      (topic) => [
        topic.id,
        topic,
      ]
    )
  );

const topicBySlug =
  new Map<
    string,
    InterestTopicDefinition
  >(
    interestTaxonomyRegistry.topics.map(
      (topic) => [
        normalizeSlug(
          topic.slug
        ),
        topic,
      ]
    )
  );

const topicByName =
  new Map<
    string,
    InterestTopicDefinition
  >();

const topicByAlias =
  new Map<
    string,
    InterestTopicDefinition
  >();

interestTaxonomyRegistry.topics.forEach(
  (topic) => {
    const normalizedName =
      normalizeText(
        topic.name
      );

    if (
      normalizedName &&
      !topicByName.has(
        normalizedName
      )
    ) {
      topicByName.set(
        normalizedName,
        topic
      );
    }

    topic.aliases?.forEach(
      (alias) => {
        const normalizedAlias =
          normalizeText(alias);

        if (
          normalizedAlias &&
          !topicByAlias.has(
            normalizedAlias
          )
        ) {
          topicByAlias.set(
            normalizedAlias,
            topic
          );
        }
      }
    );
  }
);

export function getAllInterestDomains(): InterestDomainDefinition[] {
  return interestTaxonomyRegistry.domains
    .filter(
      isVisibleDomain
    )
    .slice()
    .sort(
      compareByOrder
    );
}

export function getFeaturedInterestDomains(): InterestDomainDefinition[] {
  return getAllInterestDomains().filter(
    (domain) =>
      domain.featured === true &&
      domain.searchable !== false
  );
}

export function getInterestDomainById(
  domainId: string
): InterestDomainDefinition | undefined {
  const normalizedValue =
    domainId.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return (
    domainById.get(
      normalizedValue
    ) ??
    domainBySlug.get(
      normalizeSlug(
        normalizedValue
      )
    )
  );
}

export function getAllInterestCategories(): InterestCategoryDefinition[] {
  return interestTaxonomyRegistry.categories
    .filter(
      isVisibleCategory
    )
    .slice()
    .sort(
      compareByOrder
    );
}

export function getInterestCategoriesByDomain(
  domainId: string
): InterestCategoryDefinition[] {
  const resolvedDomain =
    getInterestDomainById(
      domainId
    );

  const resolvedDomainId =
    resolvedDomain?.id ??
    domainId;

  return getAllInterestCategories().filter(
    (category) =>
      category.domainId ===
      resolvedDomainId
  );
}

export function getFeaturedInterestCategories(): InterestCategoryDefinition[] {
  return getAllInterestCategories().filter(
    (category) =>
      category.featured === true &&
      category.searchable !== false
  );
}

export function getInterestCategoryById(
  categoryId: string
): InterestCategoryDefinition | undefined {
  const normalizedValue =
    categoryId.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return (
    categoryById.get(
      normalizedValue
    ) ??
    categoryBySlug.get(
      normalizeSlug(
        normalizedValue
      )
    )
  );
}

export function getAllInterestTopics(): InterestTopicDefinition[] {
  return interestTaxonomyRegistry.topics
    .filter(
      isActiveTopic
    )
    .slice()
    .sort(
      compareTopicsByPriority
    );
}

export function getSelectableInterestTopics(): InterestTopicDefinition[] {
  return getAllInterestTopics().filter(
    (topic) =>
      topic.selectable === true &&
      topic.tier !== "internal"
  );
}

export function getSearchableInterestTopics(): InterestTopicDefinition[] {
  return getAllInterestTopics().filter(
    (topic) =>
      topic.searchable === true &&
      topic.tier !== "internal"
  );
}

export function getFeaturedInterestTopics(
  limit = 24
): InterestTopicDefinition[] {
  const normalizedLimit =
    normalizeLimit(
      limit,
      24
    );

  return getSelectableInterestTopics()
    .filter(
      (topic) =>
        topic.featured === true
    )
    .slice()
    .sort(
      compareTopicsByPriority
    )
    .slice(
      0,
      normalizedLimit
    );
}

export function getOnboardingInterestTopics(
  limit = 30
): InterestTopicDefinition[] {
  const normalizedLimit =
    normalizeLimit(
      limit,
      30
    );

  return getSelectableInterestTopics()
    .filter(
      (topic) =>
        topic.onboarding ===
          true ||
        typeof topic.onboardingPriority ===
          "number"
    )
    .slice()
    .sort(
      (first, second) => {
        const priorityComparison =
          compareOptionalPriority(
            first.onboardingPriority,
            second.onboardingPriority
          );

        if (
          priorityComparison !== 0
        ) {
          return priorityComparison;
        }

        if (
          first.featured !==
          second.featured
        ) {
          return first.featured
            ? -1
            : 1;
        }

        return first.name.localeCompare(
          second.name
        );
      }
    )
    .slice(
      0,
      normalizedLimit
    );
}

export function getInterestTopicsByDomain(
  domainId: string
): InterestTopicDefinition[] {
  const resolvedDomain =
    getInterestDomainById(
      domainId
    );

  const resolvedDomainId =
    resolvedDomain?.id ??
    domainId;

  return getSelectableInterestTopics().filter(
    (topic) =>
      topic.domainId ===
      resolvedDomainId
  );
}

export function getInterestTopicsByCategory(
  categoryId: string
): InterestTopicDefinition[] {
  const resolvedCategory =
    getInterestCategoryById(
      categoryId
    );

  const resolvedCategoryId =
    resolvedCategory?.id ??
    categoryId;

  return getSelectableInterestTopics().filter(
    (topic) =>
      topic.categoryId ===
      resolvedCategoryId
  );
}

export function getInterestTopicById(
  topicId: string
): InterestTopicDefinition | undefined {
  const normalizedValue =
    topicId.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return topicById.get(
    normalizedValue
  );
}

export function getInterestTopicBySlug(
  slug: string
): InterestTopicDefinition | undefined {
  const normalizedValue =
    normalizeSlug(slug);

  if (!normalizedValue) {
    return undefined;
  }

  return topicBySlug.get(
    normalizedValue
  );
}

export function findInterestTopicByName(
  nameOrAlias: string
): InterestTopicDefinition | undefined {
  const normalizedValue =
    normalizeText(
      nameOrAlias
    );

  if (!normalizedValue) {
    return undefined;
  }

  return (
    topicByName.get(
      normalizedValue
    ) ??
    topicByAlias.get(
      normalizedValue
    ) ??
    topicBySlug.get(
      normalizeSlug(
        normalizedValue
      )
    )
  );
}

export function resolveInterestTopic(
  topic: InterestTopicDefinition
): ResolvedInterestTopic | undefined {
  const domain =
    domainById.get(
      topic.domainId
    );

  const category =
    categoryById.get(
      topic.categoryId
    );

  if (
    !domain ||
    !category ||
    !isVisibleDomain(domain) ||
    !isVisibleCategory(category)
  ) {
    return undefined;
  }

  const parentTopic =
    topic.parentTopicId
      ? topicById.get(
          topic.parentTopicId
        )
      : undefined;

  return {
    ...topic,

    domain,

    category,

    parentTopic,
  };
}

export function getResolvedInterestTopicById(
  topicId: string
): ResolvedInterestTopic | undefined {
  const topic =
    getInterestTopicById(
      topicId
    );

  if (!topic) {
    return undefined;
  }

  return resolveInterestTopic(
    topic
  );
}

export function getRelatedInterestTopics(
  topicId: string,
  limit = 10
): InterestTopicDefinition[] {
  const topic =
    getInterestTopicById(
      topicId
    );

  if (
    !topic ||
    !isActiveTopic(topic)
  ) {
    return [];
  }

  const normalizedLimit =
    normalizeLimit(
      limit,
      10
    );

  if (
    normalizedLimit === 0
  ) {
    return [];
  }

  const explicitlyRelated =
    (
      topic.relatedTopicIds ??
      []
    ).flatMap(
      (
        relatedTopicId
      ) => {
        const relatedTopic =
          getInterestTopicById(
            relatedTopicId
          );

        if (
          !relatedTopic ||
          relatedTopic.id ===
            topic.id ||
          !isActiveTopic(
            relatedTopic
          ) ||
          !relatedTopic.selectable ||
          relatedTopic.tier ===
            "internal"
        ) {
          return [];
        }

        return [
          relatedTopic,
        ];
      }
    );

  const categoryFallback =
    getInterestTopicsByCategory(
      topic.categoryId
    ).filter(
      (candidate) =>
        candidate.id !==
        topic.id
    );

  const domainFallback =
    getInterestTopicsByDomain(
      topic.domainId
    ).filter(
      (candidate) =>
        candidate.id !==
          topic.id &&
        candidate.categoryId !==
          topic.categoryId
    );

  return createUniqueTopics([
    ...explicitlyRelated,
    ...categoryFallback,
    ...domainFallback,
  ])
    .slice()
    .sort(
      compareTopicsByPriority
    )
    .slice(
      0,
      normalizedLimit
    );
}