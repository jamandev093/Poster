import {
  InterestCategoryDefinition,
  InterestDomainDefinition,
  InterestTaxonomy,
  InterestTopicDefinition,
} from "./taxonomy.types";

import {
  interestTaxonomyRegistry,
} from "./taxonomy.registry";

export type TaxonomyValidationSeverity =
  | "error"
  | "warning";

export interface TaxonomyValidationIssue {
  severity:
    TaxonomyValidationSeverity;

  code: string;

  message: string;

  entityId?: string;
}

export interface TaxonomyValidationResult {
  valid: boolean;

  errors:
    TaxonomyValidationIssue[];

  warnings:
    TaxonomyValidationIssue[];

  issues:
    TaxonomyValidationIssue[];
}

interface ComparableOrderedEntity {
  order: number;

  name: string;
}

interface TopicScoreField {
  name: string;

  value: number | undefined;
}

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

function createIssue(
  severity:
    TaxonomyValidationSeverity,
  code: string,
  message: string,
  entityId?: string
): TaxonomyValidationIssue {
  return {
    severity,
    code,
    message,
    entityId,
  };
}

function findDuplicateValues(
  values: readonly string[]
): string[] {
  const counts =
    new Map<string, number>();

  values.forEach((value) => {
    const normalizedValue =
      normalizeText(value);

    if (!normalizedValue) {
      return;
    }

    counts.set(
      normalizedValue,
      (
        counts.get(
          normalizedValue
        ) ?? 0
      ) + 1
    );
  });

  return Array.from(
    counts.entries()
  )
    .filter(
      ([, count]) =>
        count > 1
    )
    .map(
      ([value]) =>
        value
    );
}

function findDuplicateSlugs(
  values: readonly string[]
): string[] {
  const counts =
    new Map<string, number>();

  values.forEach((value) => {
    const normalizedValue =
      normalizeSlug(value);

    if (!normalizedValue) {
      return;
    }

    counts.set(
      normalizedValue,
      (
        counts.get(
          normalizedValue
        ) ?? 0
      ) + 1
    );
  });

  return Array.from(
    counts.entries()
  )
    .filter(
      ([, count]) =>
        count > 1
    )
    .map(
      ([value]) =>
        value
    );
}

function isValidOrder(
  entity:
    ComparableOrderedEntity
): boolean {
  return (
    Number.isFinite(
      entity.order
    ) &&
    entity.order >= 0
  );
}

function isScoreInRange(
  value: number | undefined
): boolean {
  return (
    value === undefined ||
    (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1
    )
  );
}

function hasRequiredDomainData(
  domain:
    InterestDomainDefinition
): boolean {
  return Boolean(
    domain.id.trim() &&
    domain.slug.trim() &&
    domain.name.trim() &&
    domain.description.trim()
  );
}

function hasRequiredCategoryData(
  category:
    InterestCategoryDefinition
): boolean {
  return Boolean(
    category.id.trim() &&
    category.slug.trim() &&
    category.name.trim() &&
    category.description.trim() &&
    category.domainId.trim()
  );
}

function hasRequiredTopicData(
  topic:
    InterestTopicDefinition
): boolean {
  return Boolean(
    topic.id.trim() &&
    topic.slug.trim() &&
    topic.name.trim() &&
    topic.description.trim() &&
    topic.domainId.trim() &&
    topic.categoryId.trim()
  );
}

function validateTopicAliases(
  topics:
    readonly InterestTopicDefinition[]
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  const topicNameOwnerByValue =
    new Map<string, string>();

  const aliasOwnerByValue =
    new Map<string, string>();

  topics.forEach((topic) => {
    const normalizedName =
      normalizeText(
        topic.name
      );

    if (
      normalizedName &&
      !topicNameOwnerByValue.has(
        normalizedName
      )
    ) {
      topicNameOwnerByValue.set(
        normalizedName,
        topic.id
      );
    }
  });

  topics.forEach((topic) => {
    const aliasesSeenOnTopic =
      new Set<string>();

    (
      topic.aliases ?? []
    ).forEach((alias) => {
      const normalizedAlias =
        normalizeText(alias);

      if (!normalizedAlias) {
        issues.push(
          createIssue(
            "warning",
            "empty-topic-alias",
            `Topic "${topic.name}" contains an empty alias.`,
            topic.id
          )
        );

        return;
      }

      if (
        aliasesSeenOnTopic.has(
          normalizedAlias
        )
      ) {
        issues.push(
          createIssue(
            "warning",
            "duplicate-alias-on-topic",
            `Topic "${topic.name}" contains duplicate alias "${alias}".`,
            topic.id
          )
        );

        return;
      }

      aliasesSeenOnTopic.add(
        normalizedAlias
      );

      const topicNameOwner =
        topicNameOwnerByValue.get(
          normalizedAlias
        );

      if (
        topicNameOwner &&
        topicNameOwner !==
          topic.id
      ) {
        issues.push(
          createIssue(
            "warning",
            "alias-conflicts-with-topic-name",
            `Alias "${alias}" conflicts with another topic name.`,
            topic.id
          )
        );
      }

      const existingAliasOwner =
        aliasOwnerByValue.get(
          normalizedAlias
        );

      if (
        existingAliasOwner &&
        existingAliasOwner !==
          topic.id
      ) {
        issues.push(
          createIssue(
            "warning",
            "duplicate-topic-alias",
            `Alias "${alias}" is assigned to more than one topic.`,
            topic.id
          )
        );

        return;
      }

      aliasOwnerByValue.set(
        normalizedAlias,
        topic.id
      );
    });
  });

  return issues;
}

function validateTopicKeywords(
  topics:
    readonly InterestTopicDefinition[]
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  topics.forEach((topic) => {
    const seenKeywords =
      new Set<string>();

    (
      topic.searchKeywords ?? []
    ).forEach((keyword) => {
      const normalizedKeyword =
        normalizeText(keyword);

      if (!normalizedKeyword) {
        issues.push(
          createIssue(
            "warning",
            "empty-topic-keyword",
            `Topic "${topic.name}" contains an empty search keyword.`,
            topic.id
          )
        );

        return;
      }

      if (
        seenKeywords.has(
          normalizedKeyword
        )
      ) {
        issues.push(
          createIssue(
            "warning",
            "duplicate-topic-keyword",
            `Topic "${topic.name}" contains duplicate search keyword "${keyword}".`,
            topic.id
          )
        );

        return;
      }

      seenKeywords.add(
        normalizedKeyword
      );
    });
  });

  return issues;
}

function validateParentCycles(
  topics:
    readonly InterestTopicDefinition[]
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  const topicById =
    new Map<
      string,
      InterestTopicDefinition
    >(
      topics.map(
        (topic) => [
          topic.id,
          topic,
        ]
      )
    );

  const reportedTopicIds =
    new Set<string>();

  topics.forEach((topic) => {
    const visited =
      new Set<string>();

    let current:
      InterestTopicDefinition | undefined =
        topic;

    while (current) {
      if (
        visited.has(
          current.id
        )
      ) {
        if (
          !reportedTopicIds.has(
            topic.id
          )
        ) {
          reportedTopicIds.add(
            topic.id
          );

          issues.push(
            createIssue(
              "error",
              "circular-parent-topic",
              `Topic "${topic.name}" belongs to a circular parent-topic relationship.`,
              topic.id
            )
          );
        }

        break;
      }

      visited.add(
        current.id
      );

      if (
        !current.parentTopicId
      ) {
        break;
      }

      current =
        topicById.get(
          current.parentTopicId
        );
    }
  });

  return issues;
}

function validateRedirectCycles(
  topics:
    readonly InterestTopicDefinition[]
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  const topicById =
    new Map<
      string,
      InterestTopicDefinition
    >(
      topics.map(
        (topic) => [
          topic.id,
          topic,
        ]
      )
    );

  const reportedTopicIds =
    new Set<string>();

  topics.forEach((topic) => {
    const visited =
      new Set<string>();

    let current:
      InterestTopicDefinition | undefined =
        topic;

    while (current) {
      if (
        visited.has(
          current.id
        )
      ) {
        if (
          !reportedTopicIds.has(
            topic.id
          )
        ) {
          reportedTopicIds.add(
            topic.id
          );

          issues.push(
            createIssue(
              "error",
              "circular-topic-redirect",
              `Topic "${topic.name}" belongs to a circular redirect relationship.`,
              topic.id
            )
          );
        }

        break;
      }

      visited.add(
        current.id
      );

      if (
        !current.redirectToTopicId
      ) {
        break;
      }

      current =
        topicById.get(
          current.redirectToTopicId
        );
    }
  });

  return issues;
}

function validateTaxonomyRelations(
  taxonomy:
    InterestTaxonomy
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  const topicIdSet =
    new Set(
      taxonomy.topics.map(
        (topic) =>
          topic.id
      )
    );

  const relationIdSet =
    new Set<string>();

  const relationKeySet =
    new Set<string>();

  (
    taxonomy.relations ?? []
  ).forEach((relation) => {
    if (
      !relation.id.trim()
    ) {
      issues.push(
        createIssue(
          "error",
          "invalid-relation-id",
          "A taxonomy relation is missing its ID."
        )
      );
    }

    if (
      relationIdSet.has(
        relation.id
      )
    ) {
      issues.push(
        createIssue(
          "error",
          "duplicate-relation-id",
          `Duplicate relation ID: "${relation.id}".`,
          relation.id
        )
      );
    }

    relationIdSet.add(
      relation.id
    );

    if (
      !topicIdSet.has(
        relation.sourceTopicId
      )
    ) {
      issues.push(
        createIssue(
          "error",
          "missing-relation-source",
          `Relation "${relation.id}" references missing source topic "${relation.sourceTopicId}".`,
          relation.id
        )
      );
    }

    if (
      !topicIdSet.has(
        relation.targetTopicId
      )
    ) {
      issues.push(
        createIssue(
          "error",
          "missing-relation-target",
          `Relation "${relation.id}" references missing target topic "${relation.targetTopicId}".`,
          relation.id
        )
      );
    }

    if (
      relation.sourceTopicId ===
      relation.targetTopicId
    ) {
      issues.push(
        createIssue(
          "warning",
          "self-topic-relation",
          `Relation "${relation.id}" connects a topic to itself.`,
          relation.id
        )
      );
    }

    const relationKey = [
      relation.sourceTopicId,
      relation.targetTopicId,
      relation.type,
    ].join("::");

    if (
      relationKeySet.has(
        relationKey
      )
    ) {
      issues.push(
        createIssue(
          "warning",
          "duplicate-topic-relation",
          `Duplicate topic relation exists for "${relation.sourceTopicId}" and "${relation.targetTopicId}".`,
          relation.id
        )
      );
    }

    relationKeySet.add(
      relationKey
    );

    if (
      relation.weight !==
        undefined &&
      (
        !Number.isFinite(
          relation.weight
        ) ||
        relation.weight < 0 ||
        relation.weight > 1
      )
    ) {
      issues.push(
        createIssue(
          "warning",
          "invalid-relation-weight",
          `Relation "${relation.id}" has a weight outside the supported 0–1 range.`,
          relation.id
        )
      );
    }
  });

  return issues;
}

function validateDynamicConcepts(
  taxonomy:
    InterestTaxonomy
): TaxonomyValidationIssue[] {
  const issues:
    TaxonomyValidationIssue[] = [];

  const topicIdSet =
    new Set(
      taxonomy.topics.map(
        (topic) =>
          topic.id
      )
    );

  const conceptIdSet =
    new Set<string>();

  const conceptSlugSet =
    new Set<string>();

  (
    taxonomy.dynamicConcepts ?? []
  ).forEach((concept) => {
    if (
      !concept.id.trim() ||
      !concept.name.trim() ||
      !concept.slug.trim()
    ) {
      issues.push(
        createIssue(
          "error",
          "invalid-dynamic-concept",
          `Dynamic concept "${concept.id}" is missing required identifying data.`,
          concept.id
        )
      );
    }

    if (
      conceptIdSet.has(
        concept.id
      )
    ) {
      issues.push(
        createIssue(
          "error",
          "duplicate-dynamic-concept-id",
          `Duplicate dynamic concept ID: "${concept.id}".`,
          concept.id
        )
      );
    }

    conceptIdSet.add(
      concept.id
    );

    const normalizedSlug =
      normalizeSlug(
        concept.slug
      );

    if (
      conceptSlugSet.has(
        normalizedSlug
      )
    ) {
      issues.push(
        createIssue(
          "warning",
          "duplicate-dynamic-concept-slug",
          `Duplicate dynamic concept slug: "${concept.slug}".`,
          concept.id
        )
      );
    }

    conceptSlugSet.add(
      normalizedSlug
    );

    concept.relatedTopicIds.forEach(
      (topicId) => {
        if (
          !topicIdSet.has(
            topicId
          )
        ) {
          issues.push(
            createIssue(
              "warning",
              "missing-dynamic-concept-topic",
              `Dynamic concept "${concept.name}" references missing topic "${topicId}".`,
              concept.id
            )
          );
        }
      }
    );

    const scoreFields:
      TopicScoreField[] = [
        {
          name:
            "engagementScore",
          value:
            concept.engagementScore,
        },
        {
          name:
            "trendScore",
          value:
            concept.trendScore,
        },
      ];

    scoreFields.forEach(
      ({ name, value }) => {
        if (
          !isScoreInRange(
            value
          )
        ) {
          issues.push(
            createIssue(
              "warning",
              "invalid-dynamic-concept-score",
              `Dynamic concept "${concept.name}" has ${name} outside the supported 0–1 range.`,
              concept.id
            )
          );
        }
      }
    );
  });

  return issues;
}

export function validateInterestTaxonomy(
  taxonomy:
    InterestTaxonomy
): TaxonomyValidationResult {
  const issues:
    TaxonomyValidationIssue[] = [];

  if (
    !Number.isFinite(
      taxonomy.version
    ) ||
    taxonomy.version < 1
  ) {
    issues.push(
      createIssue(
        "error",
        "invalid-taxonomy-version",
        "The taxonomy version must be a positive finite number."
      )
    );
  }

  const domainIds =
    taxonomy.domains.map(
      (domain) =>
        domain.id
    );

  const domainSlugs =
    taxonomy.domains.map(
      (domain) =>
        domain.slug
    );

  const domainNames =
    taxonomy.domains.map(
      (domain) =>
        domain.name
    );

  const categoryIds =
    taxonomy.categories.map(
      (category) =>
        category.id
    );

  const categorySlugs =
    taxonomy.categories.map(
      (category) =>
        category.slug
    );

  const categoryNames =
    taxonomy.categories.map(
      (category) =>
        category.name
    );

  const topicIds =
    taxonomy.topics.map(
      (topic) =>
        topic.id
    );

  const topicSlugs =
    taxonomy.topics.map(
      (topic) =>
        topic.slug
    );

  const topicNames =
    taxonomy.topics.map(
      (topic) =>
        topic.name
    );

  findDuplicateValues(
    domainIds
  ).forEach((duplicateId) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-domain-id",
        `Duplicate domain ID: "${duplicateId}".`,
        duplicateId
      )
    );
  });

  findDuplicateSlugs(
    domainSlugs
  ).forEach((duplicateSlug) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-domain-slug",
        `Duplicate domain slug: "${duplicateSlug}".`
      )
    );
  });

  findDuplicateValues(
    domainNames
  ).forEach((duplicateName) => {
    issues.push(
      createIssue(
        "warning",
        "duplicate-domain-name",
        `Duplicate domain name: "${duplicateName}".`
      )
    );
  });

  findDuplicateValues(
    categoryIds
  ).forEach((duplicateId) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-category-id",
        `Duplicate category ID: "${duplicateId}".`,
        duplicateId
      )
    );
  });

  findDuplicateSlugs(
    categorySlugs
  ).forEach((duplicateSlug) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-category-slug",
        `Duplicate category slug: "${duplicateSlug}".`
      )
    );
  });

  findDuplicateValues(
    categoryNames
  ).forEach((duplicateName) => {
    issues.push(
      createIssue(
        "warning",
        "duplicate-category-name",
        `Duplicate category name: "${duplicateName}".`
      )
    );
  });

  findDuplicateValues(
    topicIds
  ).forEach((duplicateId) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-topic-id",
        `Duplicate topic ID: "${duplicateId}".`,
        duplicateId
      )
    );
  });

  findDuplicateSlugs(
    topicSlugs
  ).forEach((duplicateSlug) => {
    issues.push(
      createIssue(
        "error",
        "duplicate-topic-slug",
        `Duplicate topic slug: "${duplicateSlug}".`
      )
    );
  });

  findDuplicateValues(
    topicNames
  ).forEach((duplicateName) => {
    issues.push(
      createIssue(
        "warning",
        "duplicate-topic-name",
        `Duplicate topic name: "${duplicateName}".`
      )
    );
  });

  const domainIdSet =
    new Set(domainIds);

  const categoryIdSet =
    new Set(categoryIds);

  const topicIdSet =
    new Set(topicIds);

  const categoryById =
    new Map<
      string,
      InterestCategoryDefinition
    >(
      taxonomy.categories.map(
        (category) => [
          category.id,
          category,
        ]
      )
    );

  taxonomy.domains.forEach(
    (domain) => {
      if (
        !hasRequiredDomainData(
          domain
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "invalid-domain",
            `Domain "${domain.id}" is missing required identifying data.`,
            domain.id
          )
        );
      }

      if (
        !isValidOrder(
          domain
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "invalid-domain-order",
            `Domain "${domain.name}" has an invalid order value.`,
            domain.id
          )
        );
      }

      if (
        domain.status !==
          undefined &&
        domain.status !==
          "active" &&
        domain.selectable
      ) {
        issues.push(
          createIssue(
            "warning",
            "inactive-selectable-domain",
            `Domain "${domain.name}" is selectable but not active.`,
            domain.id
          )
        );
      }
    }
  );

  taxonomy.categories.forEach(
    (category) => {
      if (
        !hasRequiredCategoryData(
          category
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "invalid-category",
            `Category "${category.id}" is missing required identifying data.`,
            category.id
          )
        );
      }

      if (
        !domainIdSet.has(
          category.domainId
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "missing-category-domain",
            `Category "${category.name}" references missing domain "${category.domainId}".`,
            category.id
          )
        );
      }

      if (
        !isValidOrder(
          category
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "invalid-category-order",
            `Category "${category.name}" has an invalid order value.`,
            category.id
          )
        );
      }

      if (
        category.status !==
          undefined &&
        category.status !==
          "active" &&
        category.selectable
      ) {
        issues.push(
          createIssue(
            "warning",
            "inactive-selectable-category",
            `Category "${category.name}" is selectable but not active.`,
            category.id
          )
        );
      }

      if (
        category.onboarding &&
        !category.selectable
      ) {
        issues.push(
          createIssue(
            "warning",
            "onboarding-category-not-selectable",
            `Category "${category.name}" is marked for onboarding but is not selectable.`,
            category.id
          )
        );
      }
    }
  );

  taxonomy.topics.forEach(
    (topic) => {
      if (
        !hasRequiredTopicData(
          topic
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "invalid-topic",
            `Topic "${topic.id}" is missing required identifying data.`,
            topic.id
          )
        );
      }

      if (
        !domainIdSet.has(
          topic.domainId
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "missing-topic-domain",
            `Topic "${topic.name}" references missing domain "${topic.domainId}".`,
            topic.id
          )
        );
      }

      if (
        !categoryIdSet.has(
          topic.categoryId
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "missing-topic-category",
            `Topic "${topic.name}" references missing category "${topic.categoryId}".`,
            topic.id
          )
        );
      }

      const category =
        categoryById.get(
          topic.categoryId
        );

      if (
        category &&
        category.domainId !==
          topic.domainId
      ) {
        issues.push(
          createIssue(
            "error",
            "topic-category-domain-mismatch",
            `Topic "${topic.name}" belongs to domain "${topic.domainId}", but its category belongs to "${category.domainId}".`,
            topic.id
          )
        );
      }

      if (
        topic.parentTopicId &&
        !topicIdSet.has(
          topic.parentTopicId
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "missing-parent-topic",
            `Topic "${topic.name}" references missing parent topic "${topic.parentTopicId}".`,
            topic.id
          )
        );
      }

      if (
        topic.parentTopicId ===
        topic.id
      ) {
        issues.push(
          createIssue(
            "error",
            "self-parent-topic",
            `Topic "${topic.name}" cannot be its own parent.`,
            topic.id
          )
        );
      }

      if (
        topic.redirectToTopicId &&
        !topicIdSet.has(
          topic.redirectToTopicId
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "missing-topic-redirect",
            `Topic "${topic.name}" redirects to missing topic "${topic.redirectToTopicId}".`,
            topic.id
          )
        );
      }

      if (
        topic.redirectToTopicId ===
        topic.id
      ) {
        issues.push(
          createIssue(
            "error",
            "self-topic-redirect",
            `Topic "${topic.name}" cannot redirect to itself.`,
            topic.id
          )
        );
      }

      if (
        (
          topic.status ===
            "deprecated" ||
          topic.status ===
            "merged"
        ) &&
        !topic.redirectToTopicId
      ) {
        issues.push(
          createIssue(
            "warning",
            "inactive-topic-without-redirect",
            `${topic.status === "merged"
              ? "Merged"
              : "Deprecated"} topic "${topic.name}" has no redirect target.`,
            topic.id
          )
        );
      }

      if (
        topic.selectable &&
        topic.status !==
          "active"
      ) {
        issues.push(
          createIssue(
            "warning",
            "inactive-selectable-topic",
            `Topic "${topic.name}" is selectable but not active.`,
            topic.id
          )
        );
      }

      if (
        topic.tier ===
          "internal" &&
        (
          topic.selectable ||
          topic.featured ||
          topic.onboarding
        )
      ) {
        issues.push(
          createIssue(
            "error",
            "visible-internal-topic",
            `Internal topic "${topic.name}" cannot be selectable, featured or shown during onboarding.`,
            topic.id
          )
        );
      }

      if (
        topic.onboarding &&
        !topic.selectable
      ) {
        issues.push(
          createIssue(
            "warning",
            "onboarding-topic-not-selectable",
            `Topic "${topic.name}" is marked for onboarding but is not selectable.`,
            topic.id
          )
        );
      }

      if (
        topic.relatedTopicIds?.includes(
          topic.id
        )
      ) {
        issues.push(
          createIssue(
            "warning",
            "self-related-topic",
            `Topic "${topic.name}" lists itself as related.`,
            topic.id
          )
        );
      }

      const relatedIdsSeen =
        new Set<string>();

      (
        topic.relatedTopicIds ?? []
      ).forEach(
        (relatedTopicId) => {
          if (
            relatedIdsSeen.has(
              relatedTopicId
            )
          ) {
            issues.push(
              createIssue(
                "warning",
                "duplicate-related-topic",
                `Topic "${topic.name}" lists related topic "${relatedTopicId}" more than once.`,
                topic.id
              )
            );
          }

          relatedIdsSeen.add(
            relatedTopicId
          );

          if (
            !topicIdSet.has(
              relatedTopicId
            )
          ) {
            issues.push(
              createIssue(
                "warning",
                "missing-related-topic",
                `Topic "${topic.name}" references missing related topic "${relatedTopicId}".`,
                topic.id
              )
            );
          }
        }
      );

      const scoreFields:
        TopicScoreField[] = [
          {
            name:
              "popularityScore",
            value:
              topic.popularityScore,
          },
          {
            name:
              "qualityScore",
            value:
              topic.qualityScore,
          },
          {
            name:
              "coverageScore",
            value:
              topic.coverageScore,
          },
          {
            name:
              "trendScore",
            value:
              topic.trendScore,
          },
        ];

      scoreFields.forEach(
        ({ name, value }) => {
          if (
            !isScoreInRange(
              value
            )
          ) {
            issues.push(
              createIssue(
                "warning",
                "invalid-topic-score",
                `Topic "${topic.name}" has ${name} outside the supported 0–1 range.`,
                topic.id
              )
            );
          }
        }
      );

      if (
        topic.recommendationWeight !==
          undefined &&
        (
          !Number.isFinite(
            topic.recommendationWeight
          ) ||
          topic.recommendationWeight <
            0
        )
      ) {
        issues.push(
          createIssue(
            "warning",
            "invalid-recommendation-weight",
            `Topic "${topic.name}" has an invalid recommendation weight.`,
            topic.id
          )
        );
      }
    }
  );

  issues.push(
    ...validateTopicAliases(
      taxonomy.topics
    )
  );

  issues.push(
    ...validateTopicKeywords(
      taxonomy.topics
    )
  );

  issues.push(
    ...validateParentCycles(
      taxonomy.topics
    )
  );

  issues.push(
    ...validateRedirectCycles(
      taxonomy.topics
    )
  );

  issues.push(
    ...validateTaxonomyRelations(
      taxonomy
    )
  );

  issues.push(
    ...validateDynamicConcepts(
      taxonomy
    )
  );

  const errors =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error"
    );

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning"
    );

  return {
    valid:
      errors.length === 0,

    errors,

    warnings,

    issues,
  };
}

export const interestTaxonomyValidation =
  validateInterestTaxonomy(
    interestTaxonomyRegistry
  );

export function assertValidInterestTaxonomy(): void {
  if (
    interestTaxonomyValidation.valid
  ) {
    return;
  }

  const message =
    interestTaxonomyValidation.errors
      .map(
        (issue) =>
          `${issue.code}: ${issue.message}`
      )
      .join("\n");

  throw new Error(
    `Invalid Poster interest taxonomy:\n${message}`
  );
}