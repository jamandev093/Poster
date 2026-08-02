export const STORAGE_KEYS = {
  PROFILE_IMAGE:
    "@poster/profile-image",

  DARK_MODE:
    "@poster/dark-mode",

  // Retained temporarily for compatibility
  // with previously stored app data.
  NOTIFICATIONS:
    "@poster/notifications",

  USER_INTERESTS:
    "@poster/user-interests",

  USER_PROFILE:
    "@poster/user-profile",

  BOOKMARKED_ARTICLES:
    "@poster/bookmarked-articles",

  BOOKMARKED_ARTICLE_IDS:
    "@poster/bookmarked-article-ids",

  RECOMMENDED_ARTICLE_IDS:
    "@poster/recommended-article-ids",

  HELPFUL_ARTICLE_IDS:
    "@poster/helpful-article-ids",

  ARTICLE_FEEDBACK:
    "@poster/article-feedback",

  PERSONALIZED_ADS:
    "@poster/personalized-ads",

  HIDDEN_MONETIZATION_ITEMS:
    "@poster/hidden-monetization-items",

  MONETIZATION_FEEDBACK:
    "@poster/monetization-feedback",

  SEARCH_HISTORY:
    "@poster/search-history",
} as const;