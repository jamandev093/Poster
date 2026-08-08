import {
  getInterestCategoryById,
} from "./interests";

const SEARCH_CATEGORY_IDS = [
  "category-ai",
  "category-technology",
  "category-science",
  "category-business",
  "category-programming",
  "category-cybersecurity",
] as const;

function resolveCategoryNames(
  categoryIds:
    readonly string[]
): string[] {
  return categoryIds.flatMap(
    (categoryId) => {
      const category =
        getInterestCategoryById(
          categoryId
        );

      if (!category) {
        return [];
      }

      return [category.name];
    }
  );
}

export const recentSearches = [
  "OpenAI",
  "SpaceX",
  "Quantum Computing",
  "Cybersecurity",
  "Apple AI",
];

export const searchFilters = [
  "All",
  ...resolveCategoryNames(
    SEARCH_CATEGORY_IDS
  ),
];

export const trendingSearches = [
  "GPT-5",
  "Gemini",
  "NASA",
  "ISRO",
  "Apple",
  "Microsoft",
];