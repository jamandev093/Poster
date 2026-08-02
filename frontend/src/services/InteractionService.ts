import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STORAGE_KEYS,
} from "../constants/storage";

interface ArticleInteractionState {
  recommendedIds: string[];

  helpfulIds: string[];
}

function parseArticleIds(
  value: string | null
): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validIds =
      parsed.filter(
        (
          item
        ): item is string =>
          typeof item ===
            "string" &&
          item.trim().length > 0
      );

    return Array.from(
      new Set(validIds)
    );
  } catch {
    return [];
  }
}

export default class InteractionService {
  /**
   * AsyncStorage does not provide an
   * atomic read-modify-write operation.
   *
   * Serializing mutations prevents rapid
   * reaction taps from overwriting one
   * another.
   */
  private static mutationQueue:
    Promise<void> =
    Promise.resolve();

  private static runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      InteractionService
        .mutationQueue
        .then(mutation);

    InteractionService
      .mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  private static async readIds(
    storageKey: string
  ): Promise<string[]> {
    const value =
      await AsyncStorage.getItem(
        storageKey
      );

    return parseArticleIds(
      value
    );
  }

  private static async writeIds(
    storageKey: string,
    ids: string[]
  ): Promise<void> {
    const uniqueIds =
      Array.from(
        new Set(ids)
      );

    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(
        uniqueIds
      )
    );
  }

  private static async addId(
    storageKey: string,
    articleId: string
  ): Promise<boolean> {
    const normalizedId =
      articleId.trim();

    if (!normalizedId) {
      return false;
    }

    return InteractionService.runMutation(
      async () => {
        const currentIds =
          await InteractionService.readIds(
            storageKey
          );

        if (
          currentIds.includes(
            normalizedId
          )
        ) {
          return true;
        }

        await InteractionService.writeIds(
          storageKey,
          [
            normalizedId,
            ...currentIds,
          ]
        );

        return true;
      }
    );
  }

  static async getRecommendedIds(): Promise<
    string[]
  > {
    try {
      await InteractionService
        .mutationQueue;

      return await InteractionService.readIds(
        STORAGE_KEYS
          .RECOMMENDED_ARTICLE_IDS
      );
    } catch {
      return [];
    }
  }

  static async getHelpfulIds(): Promise<
    string[]
  > {
    try {
      await InteractionService
        .mutationQueue;

      return await InteractionService.readIds(
        STORAGE_KEYS
          .HELPFUL_ARTICLE_IDS
      );
    } catch {
      return [];
    }
  }

  static async getState(): Promise<
    ArticleInteractionState
  > {
    try {
      await InteractionService
        .mutationQueue;

      const [
        recommendedIds,
        helpfulIds,
      ] = await Promise.all([
        InteractionService.readIds(
          STORAGE_KEYS
            .RECOMMENDED_ARTICLE_IDS
        ),

        InteractionService.readIds(
          STORAGE_KEYS
            .HELPFUL_ARTICLE_IDS
        ),
      ]);

      return {
        recommendedIds,
        helpfulIds,
      };
    } catch {
      return {
        recommendedIds: [],
        helpfulIds: [],
      };
    }
  }

  static async isRecommended(
    articleId: string
  ): Promise<boolean> {
    const ids =
      await InteractionService.getRecommendedIds();

    return ids.includes(
      articleId
    );
  }

  static async isHelpful(
    articleId: string
  ): Promise<boolean> {
    const ids =
      await InteractionService.getHelpfulIds();

    return ids.includes(
      articleId
    );
  }

  static async worthReading(
    articleId: string
  ): Promise<boolean> {
    const saved =
      await InteractionService.addId(
        STORAGE_KEYS
          .RECOMMENDED_ARTICLE_IDS,
        articleId
      );

    // TODO:
    // POST /interactions/recommend

    return saved;
  }

  static async helpful(
    articleId: string
  ): Promise<boolean> {
    const saved =
      await InteractionService.addId(
        STORAGE_KEYS
          .HELPFUL_ARTICLE_IDS,
        articleId
      );

    // TODO:
    // POST /interactions/helpful

    return saved;
  }

  static async clear(): Promise<void> {
    await InteractionService.runMutation(
      async () => {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS
            .RECOMMENDED_ARTICLE_IDS,

          STORAGE_KEYS
            .HELPFUL_ARTICLE_IDS,
        ]);
      }
    );
  }
}