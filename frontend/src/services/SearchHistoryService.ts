import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STORAGE_KEYS,
} from "../constants/storage";

const MAX_HISTORY_ITEMS = 10;

function normalizeQuery(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeComparisonKey(
  value: string
): string {
  return normalizeQuery(value)
    .toLowerCase();
}

function dedupeAndLimitHistory(
  values: readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach((value) => {
    const normalizedValue =
      normalizeQuery(value);

    if (!normalizedValue) {
      return;
    }

    const comparisonKey =
      normalizeComparisonKey(
        normalizedValue
      );

    if (
      seen.has(
        comparisonKey
      )
    ) {
      return;
    }

    seen.add(
      comparisonKey
    );

    result.push(
      normalizedValue
    );
  });

  return result.slice(
    0,
    MAX_HISTORY_ITEMS
  );
}

function parseHistory(
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

    return dedupeAndLimitHistory(
      parsed.filter(
        (
          item
        ): item is string =>
          typeof item ===
          "string"
      )
    );
  } catch {
    return [];
  }
}

export default class SearchHistoryService {
  /**
   * AsyncStorage has no atomic
   * read-modify-write operation.
   *
   * Serializing search-history mutations
   * prevents rapid submit/remove/clear
   * actions from overwriting each other.
   */
  private static mutationQueue:
    Promise<void> =
      Promise.resolve();

  private static runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      SearchHistoryService
        .mutationQueue
        .then(mutation);

    SearchHistoryService
      .mutationQueue =
        operation.then(
          () => undefined,
          () => undefined
        );

    return operation;
  }

  private static async readHistory(): Promise<
    string[]
  > {
    const value =
      await AsyncStorage.getItem(
        STORAGE_KEYS.SEARCH_HISTORY
      );

    return parseHistory(value);
  }

  private static async writeHistory(
    history: readonly string[]
  ): Promise<string[]> {
    const nextHistory =
      dedupeAndLimitHistory(history);

    await AsyncStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(nextHistory)
    );

    return nextHistory;
  }

  static async getHistory(): Promise<
    string[]
  > {
    try {
      return await SearchHistoryService
        .readHistory();
    } catch {
      return [];
    }
  }

  static async add(
    query: string
  ): Promise<string[]> {
    const normalizedQuery =
      normalizeQuery(query);

    if (!normalizedQuery) {
      return SearchHistoryService
        .getHistory();
    }

    return SearchHistoryService
      .runMutation(async () => {
        const currentHistory =
          await SearchHistoryService
            .readHistory();

        return SearchHistoryService
          .writeHistory([
            normalizedQuery,
            ...currentHistory,
          ]);
      });
  }

  static async remove(
    query: string
  ): Promise<string[]> {
    const normalizedQuery =
      normalizeQuery(query);

    if (!normalizedQuery) {
      return SearchHistoryService
        .getHistory();
    }

    const comparisonKey =
      normalizeComparisonKey(
        normalizedQuery
      );

    return SearchHistoryService
      .runMutation(async () => {
        const currentHistory =
          await SearchHistoryService
            .readHistory();

        const nextHistory =
          currentHistory.filter(
            (item) =>
              normalizeComparisonKey(
                item
              ) !== comparisonKey
          );

        return SearchHistoryService
          .writeHistory(
            nextHistory
          );
      });
  }

  static async clear(): Promise<void> {
    await SearchHistoryService
      .runMutation(async () => {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.SEARCH_HISTORY
        );
      });
  }
}
