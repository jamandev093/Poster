import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "../constants/storage";

import { Article } from "../types/article";

export interface BookmarkToggleResult {
  success: boolean;

  bookmarked: boolean;
}

function isArticle(
  value: unknown
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
  value: string | null
): Article[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validArticles =
      parsed.filter(isArticle);

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

export default class BookmarkService {
  /**
   * AsyncStorage has no atomic
   * read-modify-write operation.
   *
   * All bookmark mutations are therefore
   * serialized to prevent rapid actions
   * from overwriting one another.
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

    return parseArticles(value);
  }

  private static async writeArticles(
    articles: Article[]
  ): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BOOKMARKED_ARTICLES,
      JSON.stringify(articles)
    );

    /*
     * Remove the obsolete ID-only format
     * after every successful mutation.
     */
    await AsyncStorage.removeItem(
      STORAGE_KEYS.BOOKMARKED_ARTICLE_IDS
    );
  }

  private static runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      BookmarkService.mutationQueue.then(
        mutation
      );

    BookmarkService.mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  static async getBookmarkedArticles(): Promise<
    Article[]
  > {
    try {
      await BookmarkService
        .mutationQueue;

      return await BookmarkService.readArticles();
    } catch {
      return [];
    }
  }

  static async getBookmarkedIds(): Promise<
    string[]
  > {
    const articles =
      await BookmarkService.getBookmarkedArticles();

    return articles.map(
      (article) => article.id
    );
  }

  static async isBookmarked(
    articleId: string
  ): Promise<boolean> {
    const articles =
      await BookmarkService.getBookmarkedArticles();

    return articles.some(
      (article) =>
        article.id === articleId
    );
  }

  static async add(
    article: Article
  ): Promise<void> {
    await BookmarkService.runMutation(
      async () => {
        const articles =
          await BookmarkService.readArticles();

        const existingIndex =
          articles.findIndex(
            (item) =>
              item.id === article.id
          );

        const nextArticles =
          existingIndex >= 0
            ? articles.map((item) =>
                item.id === article.id
                  ? article
                  : item
              )
            : [
                article,
                ...articles,
              ];

        await BookmarkService.writeArticles(
          nextArticles
        );

        // TODO:
        // POST /bookmarks
      }
    );
  }

  static async remove(
    articleId: string
  ): Promise<void> {
    await BookmarkService.runMutation(
      async () => {
        const articles =
          await BookmarkService.readArticles();

        const nextArticles =
          articles.filter(
            (article) =>
              article.id !== articleId
          );

        await BookmarkService.writeArticles(
          nextArticles
        );

        // TODO:
        // DELETE /bookmarks/:articleId
      }
    );
  }

  static async toggle(
    article: Article
  ): Promise<BookmarkToggleResult> {
    return BookmarkService.runMutation(
      async () => {
        const articles =
          await BookmarkService.readArticles();

        const currentlyBookmarked =
          articles.some(
            (item) =>
              item.id === article.id
          );

        const nextArticles =
          currentlyBookmarked
            ? articles.filter(
                (item) =>
                  item.id !== article.id
              )
            : [
                article,
                ...articles,
              ];

        await BookmarkService.writeArticles(
          nextArticles
        );

        // TODO:
        // Synchronize with backend.

        return {
          success: true,

          bookmarked:
            !currentlyBookmarked,
        };
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