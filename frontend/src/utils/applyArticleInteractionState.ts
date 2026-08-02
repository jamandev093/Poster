import {
  FeedItem,
} from "../components/cards/feedCard.types";

interface ArticleInteractionState {
  bookmarkedIds?: readonly string[];

  recommendedIds?: readonly string[];

  helpfulIds?: readonly string[];
}

export default function applyArticleInteractionState(
  articles: readonly FeedItem[],
  {
    bookmarkedIds = [],
    recommendedIds = [],
    helpfulIds = [],
  }: ArticleInteractionState
): FeedItem[] {
  const bookmarkedIdSet =
    new Set(bookmarkedIds);

  const recommendedIdSet =
    new Set(recommendedIds);

  const helpfulIdSet =
    new Set(helpfulIds);

  return articles.map(
    (article) => ({
      ...article,

      bookmarked:
        bookmarkedIdSet.has(
          article.id
        ),

      recommended:
        recommendedIdSet.has(
          article.id
        ),

      helpful:
        helpfulIdSet.has(
          article.id
        ),
    })
  );
}