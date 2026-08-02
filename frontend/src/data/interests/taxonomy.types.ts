export type InterestTopicStatus =
  | "active"
  | "deprecated"
  | "hidden"
  | "merged"
  | "internal";

export type InterestTopicAudience =
  | "general"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "professional"
  | "academic";

export type InterestTopicContentType =
  | "news"
  | "analysis"
  | "research"
  | "tutorial"
  | "guide"
  | "opinion"
  | "report"
  | "video"
  | "podcast"
  | "course"
  | "tool";

export type InterestTopicTier =
  | "hub"
  | "core"
  | "specialist"
  | "dynamic"
  | "internal";

export type InterestTopicRelationType =
  | "parent"
  | "child"
  | "related"
  | "broader"
  | "narrower"
  | "used-in"
  | "merged-into";

export type InterestSelectionSource =
  | "onboarding"
  | "profile"
  | "search"
  | "recommendation"
  | "migration"
  | "behavior";

export interface InterestDomainDefinition {
  /**
   * Permanent internal identifier.
   *
   * Example:
   * "domain-science"
   */
  id: string;

  /**
   * Stable URL-safe value.
   *
   * Example:
   * "science"
   */
  slug: string;

  /**
   * User-facing domain name.
   */
  name: string;

  /**
   * Short user-facing description.
   */
  description: string;

  /**
   * Domains remain sortable so onboarding,
   * browsing and management screens can use
   * a predictable order.
   */
  order: number;

  /**
   * Optional icon retained for compatibility.
   *
   * Individual topics should remain text-only.
   */
  icon?: string;

  featured?: boolean;

  searchable?: boolean;

  /**
   * Determines whether users may directly
   * select the broad domain as an interest.
   */
  selectable?: boolean;

  /**
   * Optional aliases used when resolving or
   * searching domain names.
   */
  aliases?: readonly string[];

  /**
   * Optional additional search terms.
   */
  searchKeywords?: readonly string[];

  status?: InterestTopicStatus;
}

export interface InterestCategoryDefinition {
  /**
   * Permanent internal identifier.
   *
   * Categories act as user-facing interest
   * hubs beneath broad domains.
   */
  id: string;

  slug: string;

  name: string;

  description: string;

  domainId: string;

  order: number;

  /**
   * Optional icon retained only for broad
   * category-level interfaces.
   */
  icon?: string;

  featured?: boolean;

  searchable?: boolean;

  /**
   * Allows a category to work as a selectable
   * interest hub without requiring every user
   * to select narrow child topics.
   */
  selectable?: boolean;

  /**
   * Shows this category during onboarding.
   */
  onboarding?: boolean;

  aliases?: readonly string[];

  searchKeywords?: readonly string[];

  status?: InterestTopicStatus;
}

export interface InterestTopicDefinition {
  /**
   * Permanent internal identifier.
   * Do not change after release.
   *
   * Example:
   * "topic-quantum-physics"
   */
  id: string;

  /**
   * Stable URL/API-safe value.
   *
   * Example:
   * "quantum-physics"
   */
  slug: string;

  /**
   * User-facing display label.
   */
  name: string;

  /**
   * Short explanation used in discovery,
   * search and interest management.
   */
  description: string;

  domainId: string;

  categoryId: string;

  /**
   * Optional parent topic.
   *
   * The taxonomy is not limited to a strict
   * tree, so additional relationships should
   * use relatedTopicIds or relation records.
   */
  parentTopicId?: string;

  /**
   * Defines how this topic is used.
   *
   * hub:
   * broad user-facing interest
   *
   * core:
   * curated high-value topic
   *
   * specialist:
   * narrow but still searchable/selectable
   *
   * dynamic:
   * article-derived or emerging concept
   *
   * internal:
   * classification-only concept
   */
  tier?: InterestTopicTier;

  /**
   * Alternate names used for resolution and
   * search matching.
   *
   * Example:
   * ["AI", "Machine Intelligence"]
   */
  aliases?: readonly string[];

  /**
   * Additional terms used by Search and
   * future article classification.
   */
  searchKeywords?: readonly string[];

  /**
   * Related canonical topic IDs.
   */
  relatedTopicIds?: readonly string[];

  audiences?: readonly InterestTopicAudience[];

  contentTypes?: readonly InterestTopicContentType[];

  status: InterestTopicStatus;

  /**
   * Replacement topic used when this topic
   * is merged or deprecated.
   */
  redirectToTopicId?: string;

  /**
   * Searchable topics may appear in topic
   * search results.
   */
  searchable: boolean;

  /**
   * Selectable topics may be saved directly
   * to a user profile.
   */
  selectable: boolean;

  /**
   * Featured topics may appear in discovery
   * surfaces.
   */
  featured: boolean;

  /**
   * Explicit onboarding eligibility.
   *
   * Existing data may omit this property and
   * rely on onboardingPriority instead.
   */
  onboarding?: boolean;

  /**
   * Lower values represent higher priority.
   */
  onboardingPriority?: number;

  searchPriority?: number;

  trendingPriority?: number;

  recommendationWeight?: number;

  /**
   * Optional popularity signal normalized
   * between 0 and 1.
   */
  popularityScore?: number;

  /**
   * Optional long-term topic quality signal
   * normalized between 0 and 1.
   */
  qualityScore?: number;

  /**
   * Optional coverage signal based on article
   * volume and publisher diversity.
   */
  coverageScore?: number;

  /**
   * Optional current-growth signal.
   */
  trendScore?: number;

  /**
   * Optional icon retained for compatibility.
   *
   * Topic chips and topic records remain
   * text-only in the user interface.
   */
  icon?: string;

  /**
   * Optional moderation-sensitive marker.
   * This does not imply the topic is blocked.
   */
  sensitive?: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface InterestTopicRelation {
  id: string;

  sourceTopicId: string;

  targetTopicId: string;

  type: InterestTopicRelationType;

  /**
   * Optional relation strength normalized
   * between 0 and 1.
   */
  weight?: number;
}

export interface DynamicInterestConcept {
  /**
   * Dynamic concepts are not required to be
   * part of the permanent frontend taxonomy.
   *
   * They can later be generated by backend or
   * AI services from article content.
   */
  id: string;

  name: string;

  slug: string;

  relatedTopicIds: readonly string[];

  aliases?: readonly string[];

  searchKeywords?: readonly string[];

  articleCount?: number;

  publisherCount?: number;

  engagementScore?: number;

  trendScore?: number;

  createdAt?: string;

  updatedAt?: string;
}

export interface InterestTaxonomy {
  version: number;

  domains:
    readonly InterestDomainDefinition[];

  categories:
    readonly InterestCategoryDefinition[];

  topics:
    readonly InterestTopicDefinition[];

  /**
   * Optional graph relationships.
   *
   * Existing taxonomy data does not need to
   * provide this field immediately.
   */
  relations?:
    readonly InterestTopicRelation[];

  /**
   * Optional dynamic concepts.
   *
   * The frontend should normally receive only
   * a small relevant subset from the backend.
   */
  dynamicConcepts?:
    readonly DynamicInterestConcept[];
}

export interface ResolvedInterestTopic
  extends InterestTopicDefinition {
  domain:
    InterestDomainDefinition;

  category:
    InterestCategoryDefinition;

  parentTopic?:
    InterestTopicDefinition;
}

export interface InterestTopicSearchResult {
  topic:
    ResolvedInterestTopic;

  score: number;

  matchedBy:
    | "name"
    | "alias"
    | "keyword"
    | "description"
    | "category"
    | "domain";
}

export interface InterestSelection {
  topicId: string;

  selectedAt: string;

  source:
    InterestSelectionSource;
}