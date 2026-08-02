import {
  interestTaxonomyRegistry,
} from "./taxonomy.registry";

import {
  interestTaxonomyValidation,
} from "./taxonomy.validation";

export interface InterestTaxonomySummary {
  version: number;

  domainCount: number;

  categoryCount: number;

  topicCount: number;

  activeTopicCount: number;

  selectableTopicCount: number;

  searchableTopicCount: number;

  featuredTopicCount: number;

  onboardingTopicCount: number;

  hubTopicCount: number;

  coreTopicCount: number;

  specialistTopicCount: number;

  dynamicTopicCount: number;

  internalTopicCount: number;

  deprecatedTopicCount: number;

  mergedTopicCount: number;

  hiddenTopicCount: number;

  relationCount: number;

  dynamicConceptCount: number;

  validationErrorCount: number;

  validationWarningCount: number;

  valid: boolean;
}

let initialized = false;

function isActiveTopic(
  status: string
): boolean {
  return status === "active";
}

export function getInterestTaxonomySummary(): InterestTaxonomySummary {
  const topics =
    interestTaxonomyRegistry.topics;

  const activeTopics =
    topics.filter(
      (topic) =>
        isActiveTopic(
          topic.status
        )
    );

  return {
    version:
      interestTaxonomyRegistry.version,

    domainCount:
      interestTaxonomyRegistry
        .domains.length,

    categoryCount:
      interestTaxonomyRegistry
        .categories.length,

    topicCount:
      topics.length,

    activeTopicCount:
      activeTopics.length,

    selectableTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.selectable &&
          topic.tier !== "internal"
      ).length,

    searchableTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.searchable &&
          topic.tier !== "internal"
      ).length,

    featuredTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.featured &&
          topic.tier !== "internal"
      ).length,

    onboardingTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.selectable &&
          topic.tier !== "internal" &&
          (
            topic.onboarding ===
              true ||
            typeof topic.onboardingPriority ===
              "number"
          )
      ).length,

    hubTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.tier === "hub"
      ).length,

    coreTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.tier === "core"
      ).length,

    specialistTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.tier ===
          "specialist"
      ).length,

    dynamicTopicCount:
      activeTopics.filter(
        (topic) =>
          topic.tier === "dynamic"
      ).length,

    internalTopicCount:
      topics.filter(
        (topic) =>
          topic.tier ===
            "internal" ||
          topic.status ===
            "internal"
      ).length,

    deprecatedTopicCount:
      topics.filter(
        (topic) =>
          topic.status ===
          "deprecated"
      ).length,

    mergedTopicCount:
      topics.filter(
        (topic) =>
          topic.status ===
          "merged"
      ).length,

    hiddenTopicCount:
      topics.filter(
        (topic) =>
          topic.status ===
          "hidden"
      ).length,

    relationCount:
      interestTaxonomyRegistry
        .relations?.length ?? 0,

    dynamicConceptCount:
      interestTaxonomyRegistry
        .dynamicConcepts?.length ?? 0,

    validationErrorCount:
      interestTaxonomyValidation
        .errors.length,

    validationWarningCount:
      interestTaxonomyValidation
        .warnings.length,

    valid:
      interestTaxonomyValidation.valid,
  };
}

export function initializeInterestTaxonomy(): void {
  if (initialized) {
    return;
  }

  if (
    interestTaxonomyValidation
      .errors.length > 0
  ) {
    const errorMessage =
      interestTaxonomyValidation
        .errors
        .map(
          (issue) =>
            `[${issue.code}] ${issue.message}`
        )
        .join("\n");

    throw new Error(
      `Poster interest taxonomy is invalid:\n${errorMessage}`
    );
  }

  initialized = true;

  if (!__DEV__) {
    return;
  }

  const summary =
    getInterestTaxonomySummary();

  console.info(
    "[Poster Taxonomy]",
    {
      version:
        summary.version,

      valid:
        summary.valid,

      domains:
        summary.domainCount,

      categories:
        summary.categoryCount,

      topics:
        summary.topicCount,

      activeTopics:
        summary.activeTopicCount,

      selectableTopics:
        summary.selectableTopicCount,

      searchableTopics:
        summary.searchableTopicCount,

      featuredTopics:
        summary.featuredTopicCount,

      onboardingTopics:
        summary.onboardingTopicCount,

      hubTopics:
        summary.hubTopicCount,

      coreTopics:
        summary.coreTopicCount,

      specialistTopics:
        summary.specialistTopicCount,

      relations:
        summary.relationCount,

      dynamicConcepts:
        summary.dynamicConceptCount,

      warnings:
        summary.validationWarningCount,
    }
  );

  interestTaxonomyValidation
    .warnings
    .forEach(
      (issue) => {
        console.warn(
          `[Poster Taxonomy: ${issue.code}]`,
          issue.message
        );
      }
    );
}

export function resetInterestTaxonomyInitializationForTesting(): void {
  initialized = false;
}