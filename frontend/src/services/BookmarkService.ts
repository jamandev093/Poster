import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STORAGE_KEYS,
} from "../constants/storage";

import {
  Article,
} from "../types/article";

import MobileActionsApiService from "./MobileActionsApiService";

export interface BookmarkToggleResult {
  success:
    boolean;

  bookmarked:
    boolean;
}

function isArticle(
  value:
    unknown
): value is Article {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const article =
    value as Partial<Article>;

  return (
    typeof article.id === "string" &&
    typeof article.title === "string" &&
    typeof article.publisher === "string" &&
    typeof article.publisherUrl ===
      "string" &&
    typeof article.image === "string" &&
    typeof article.publishedAt ===
      "string" &&
    typeof article.discoveredAt ===
      "string" &&
    typeof article.category === "string" &&
    typeof article.originalUrl ===
      "string" &&
    typeof article.verified === "boolean"
  );
}

function parseArticles(
  value:
    string |
    null
): Article[] {
  if (!value) {
    return [];
  }

  try {
    const parsed:
      unknown =
      JSON.parse(
        value
      );

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validArticles =
      parsed.filter(
        isArticle
      );

    return Array.from(
      new Map(
        validArticles.map(
          (article) => [
            article.id,
            article,
          ]
        )
      ).values()
    );
  } catch {
    return [];
  }
}

function mergeArticleIntoList(
  articles:
    readonly Article[],
  article:
    Article
): Article[] {
  const existingIndex =
    articles.findIndex(
      (item) =>
        item.id === article.id
    );

  if (existingIndex >= 0) {
    return articles.map(
      (item) =>
        item.id === article.id
          ? article
          : item
    );
  }

  return [
    article,
    ...articles,
  ];
}

function removeArticleFromList(
  articles:
    readonly Article[],
  articleId:
    string
): Article[] {
  return articles.filter(
    (article) =>
      article.id !== articleId
  );
}

function mapBackendBookmarksToArticles(
  bookmarks:
    Awaited<
      ReturnType<
        typeof MobileActionsApiService.listBookmarks
      >
    >
): Article[] {
  return bookmarks.flatMap(
    (bookmark) => {
      const article =
        MobileActionsApiService
          .mapBookmarkRecordToArticle(
            bookmark
          );

      return article
        ? [article]
        : [];
    }
  );
}

export default class BookmarkService {
  /**
   * AsyncStorage remains the local
   * compatibility cache and offline
   * fallback. Backend is authoritative
   * when authenticated and reachable.
   */
  private static mutationQueue:
    Promise<void> =
    Promise.resolve();

  private static async readArticles(): Promise<
    Article[]
  > {
    const value =
      await AsyncStorage.getItem(
        STORAGE_KEYS.BOOKMARKED_ARTICLES
      );

    return parseArticles(
      value
    );
  }

  private static async writeArticles(
    articles:
      Article[]
  ): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BOOKMARKED_ARTICLES,
      JSON.stringify(
        articles
      )
    );

    await AsyncStorage.removeItem(
      STORAGE_KEYS.BOOKMARKED_ARTICLE_IDS
    );
  }

  private static runMutation<T>(
    mutation:
      () => Promise<T>
  ): Promise<T> {
    const operation =
      BookmarkService
        .mutationQueue
        .then(
          mutation
        );

    BookmarkService.mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  private static async readBackendArticles():
    Promise<Article[]> {
    const bookmarks =
      await MobileActionsApiService
        .listBookmarks();

    return mapBackendBookmarksToArticles(
      bookmarks
    );
  }

  static async getBookmarkedArticles(): Promise<
    Article[]
  > {
    try {
      await BookmarkService
        .mutationQueue;

      const backendArticles =
        await BookmarkService
          .readBackendArticles();

      await BookmarkService
        .writeArticles(
          backendArticles
        );

      return backendArticles;
    } catch {
      try {
        return await BookmarkService
          .readArticles();
      } catch {
        return [];
      }
    }
  }

  static async getBookmarkedIds(): Promise<
    string[]
  > {
    const articles =
      await BookmarkService
        .getBookmarkedArticles();

    return articles.map(
      (article) =>
        article.id
    );
  }

  static async isBookmarked(
    articleId:
      string
  ): Promise<boolean> {
    const articles =
      await BookmarkService
        .getBookmarkedArticles();

    return articles.some(
      (article) =>
        article.id === articleId
    );
  }

  static async add(
    article:
      Article
  ): Promise<void> {
    await BookmarkService.runMutation(
      async () => {
        const currentArticles =
          await BookmarkService
            .readArticles();

        await BookmarkService
          .writeArticles(
            mergeArticleIntoList(
              currentArticles,
              article
            )
          );

        try {
          const backendState =
            await MobileActionsApiService
              .getInteractionState();

          if (
            backendState.bookmarkedIds
              .includes(
                article.id
              )
          ) {
            return;
          }

          const result =
            await MobileActionsApiService
              .toggleBookmark(
                article
              );

          if (!result.bookmarked) {
            await BookmarkService
              .writeArticles(
                removeArticleFromList(
                  await BookmarkService
                    .readArticles(),
                  article.id
                )
              );
          }
        } catch {
          /*
           * Keep the local cache as an
           * offline/unauthenticated
           * compatibility fallback.
           */
        }
      }
    );
  }

  static async remove(
    articleId:
      string
  ): Promise<void> {
    await BookmarkService.runMutation(
      async () => {
        const currentArticles =
          await BookmarkService
            .readArticles();

        const removedArticle =
          currentArticles.find(
            (article) =>
              article.id === articleId
          ) ?? null;

        await BookmarkService
          .writeArticles(
            removeArticleFromList(
              currentArticles,
              articleId
            )
          );

        if (!removedArticle) {
          return;
        }

        try {
          const backendState =
            await MobileActionsApiService
              .getInteractionState();

          if (
            !backendState.bookmarkedIds
              .includes(
                articleId
              )
          ) {
            return;
          }

          const result =
            await MobileActionsApiService
              .toggleBookmark(
                removedArticle
              );

          if (result.bookmarked) {
            await BookmarkService
              .writeArticles(
                mergeArticleIntoList(
                  await BookmarkService
                    .readArticles(),
                  removedArticle
                )
              );
          }
        } catch {
          /*
           * Keep local removal as the
           * fallback. The next successful
           * authenticated refresh will
           * resync the cache.
           */
        }
      }
    );
  }

  static async toggle(
    article:
      Article
  ): Promise<BookmarkToggleResult> {
    return BookmarkService.runMutation(
      async () => {
        const currentArticles =
          await BookmarkService
            .readArticles();

        const currentlyBookmarked =
          currentArticles.some(
            (item) =>
              item.id === article.id
          );

        const optimisticArticles =
          currentlyBookmarked
            ? removeArticleFromList(
                currentArticles,
                article.id
              )
            : mergeArticleIntoList(
                currentArticles,
                article
              );

        await BookmarkService
          .writeArticles(
            optimisticArticles
          );

        try {
          const result =
            await MobileActionsApiService
              .toggleBookmark(
                article
              );

          const confirmedArticles =
            result.bookmarked
              ? mergeArticleIntoList(
                  await BookmarkService
                    .readArticles(),
                  article
                )
              : removeArticleFromList(
                  await BookmarkService
                    .readArticles(),
                  article.id
                );

          await BookmarkService
            .writeArticles(
              confirmedArticles
            );

          return {
            success:
              true,

            bookmarked:
              result.bookmarked,
          };
        } catch {
          return {
            success:
              true,

            bookmarked:
              !currentlyBookmarked,
          };
        }
      }
    );
  }

  static async clear(): Promise<void> {
    await BookmarkService.runMutation(
      async () => {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.BOOKMARKED_ARTICLES,
          STORAGE_KEYS.BOOKMARKED_ARTICLE_IDS,
        ]);
      }
    );
  }
}
