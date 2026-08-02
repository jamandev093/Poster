import {
  interestTaxonomyData,
  INTEREST_CATEGORIES,
  INTEREST_DOMAINS,
  INTEREST_TOPICS,
} from "./taxonomy.data";

import {
  InterestCategoryDefinition,
  InterestDomainDefinition,
  InterestTaxonomy,
  InterestTopicDefinition,
} from "./taxonomy.types";

/**
 * Canonical domain registry.
 *
 * This export name is preserved for compatibility
 * with the current selectors, validation utilities,
 * health checks and public taxonomy exports.
 */
export const interestDomainsRegistry:
  readonly InterestDomainDefinition[] =
  INTEREST_DOMAINS;

/**
 * Canonical category registry.
 *
 * Categories now work as broad, user-facing
 * interest hubs beneath the main domains.
 */
export const interestCategoriesRegistry:
  readonly InterestCategoryDefinition[] =
  INTEREST_CATEGORIES;

/**
 * Canonical topic registry.
 *
 * This contains only curated, useful frontend
 * topics. Narrow long-tail concepts will later
 * be supplied by backend and AI services.
 */
export const interestTopicsRegistry:
  readonly InterestTopicDefinition[] =
  INTEREST_TOPICS;

/**
 * Complete frontend taxonomy registry.
 *
 * The registry is now sourced directly from the
 * compact canonical dataset instead of converting
 * the older temporary interestCategories structure.
 */
export const interestTaxonomyRegistry:
  InterestTaxonomy = {
    version:
      interestTaxonomyData.version,

    domains:
      interestDomainsRegistry,

    categories:
      interestCategoriesRegistry,

    topics:
      interestTopicsRegistry,

    relations:
      interestTaxonomyData.relations,

    dynamicConcepts:
      interestTaxonomyData.dynamicConcepts,
  };