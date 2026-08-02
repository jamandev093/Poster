/**
 * Poster interest taxonomy public API.
 *
 * Application screens, services and data modules
 * should import taxonomy functionality from this
 * barrel file instead of importing internal files
 * directly.
 */

export {
  INTEREST_DOMAINS,
  INTEREST_CATEGORIES,
  INTEREST_TOPICS,
  interestTaxonomyData,
} from "./taxonomy.data";

export {
  interestDomainsRegistry,
  interestCategoriesRegistry,
  interestTopicsRegistry,
  interestTaxonomyRegistry,
} from "./taxonomy.registry";

export {
  getAllInterestDomains,
  getFeaturedInterestDomains,
  getInterestDomainById,
  getAllInterestCategories,
  getInterestCategoriesByDomain,
  getFeaturedInterestCategories,
  getInterestCategoryById,
  getAllInterestTopics,
  getSelectableInterestTopics,
  getSearchableInterestTopics,
  getFeaturedInterestTopics,
  getOnboardingInterestTopics,
  getInterestTopicsByDomain,
  getInterestTopicsByCategory,
  getInterestTopicById,
  getInterestTopicBySlug,
  findInterestTopicByName,
  resolveInterestTopic,
  getResolvedInterestTopicById,
  getRelatedInterestTopics,
} from "./taxonomy.selectors";

export {
  getRelatedTopics,
  getRelatedTopicIds,
  getRelatedTopicNames,
} from "./recommendations";

export {
  migrateInterestValues,
  migrateInterestNamesToIds,
  resolveStoredInterestValues,
} from "./taxonomy.migration";

export {
  validateInterestTaxonomy,
  interestTaxonomyValidation,
  assertValidInterestTaxonomy,
} from "./taxonomy.validation";

export {
  getInterestTaxonomySummary,
  initializeInterestTaxonomy,
  resetInterestTaxonomyInitializationForTesting,
} from "./taxonomy.health";

export type {
  InterestTopicStatus,
  InterestTopicAudience,
  InterestTopicContentType,
  InterestTopicTier,
  InterestTopicRelationType,
  InterestSelectionSource,
  InterestDomainDefinition,
  InterestCategoryDefinition,
  InterestTopicDefinition,
  InterestTopicRelation,
  DynamicInterestConcept,
  InterestTaxonomy,
  ResolvedInterestTopic,
  InterestTopicSearchResult,
  InterestSelection,
} from "./taxonomy.types";

export type {
  InterestMigrationResult,
} from "./taxonomy.migration";

export type {
  TaxonomyValidationSeverity,
  TaxonomyValidationIssue,
  TaxonomyValidationResult,
} from "./taxonomy.validation";

export type {
  InterestTaxonomySummary,
} from "./taxonomy.health";