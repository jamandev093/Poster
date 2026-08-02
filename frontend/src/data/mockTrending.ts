import {
  getInterestCategoryById,
} from "./interests";

const TRENDING_CATEGORY_IDS = [
  "category-technology",
  "category-science",
  "category-cybersecurity",
  "category-business",
  "category-finance",
  "category-programming",
  "category-space",
  "category-health",
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

export const trendingTopics = [
  "All",
  ...resolveCategoryNames(
    TRENDING_CATEGORY_IDS
  ),
];

export const trendingFeed = [
  {
    id: "1",
    topic: "All",
    score: 98,
  },
  {
    id: "2",
    topic: "Technology",
    score: 95,
  },
  {
    id: "3",
    topic: "Science",
    score: 92,
  },
  {
    id: "4",
    topic: "Cybersecurity",
    score: 91,
  },
  {
    id: "5",
    topic: "Business & Economy",
    score: 89,
  },
];