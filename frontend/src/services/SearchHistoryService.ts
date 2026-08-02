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

    const validQueries =
      parsed
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map(normalizeQuery)
        .filter(Boolean);

    const uniqueQueries:
      string[] = [];

    validQueries.forEach(
      (query) => {
        const alreadyExists =
          uniqueQueries.some(
            (existingQuery) =>
              existingQuery.toLowerCase() ===
              query.toLowerCase()
          );

        if (!alreadyExists) {
          uniqueQueries.push(query);
        }
      }
    );

    return uniqueQueries.slice(
      0,
      MAX_HISTORY_ITEMS
    );
  } catch {
    return [];
  }
}

export default class SearchHistoryService {
  static async getHistory(): Promise<
    string[]
  > {
    try {
      const value =
        await AsyncStorage.getItem(
          STORAGE_KEYS.SEARCH_HISTORY
        );

      return parseHistory(value);
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
      return SearchHistoryService.getHistory();
    }

    const currentHistory =
      await SearchHistoryService.getHistory();

    const filteredHistory =
      currentHistory.filter(
        (item) =>
          item.toLowerCase() !==
          normalizedQuery.toLowerCase()
      );

    const nextHistory = [
      normalizedQuery,
      ...filteredHistory,
    ].slice(
      0,
      MAX_HISTORY_ITEMS
    );

    await AsyncStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(nextHistory)
    );

    return nextHistory;
  }

  static async remove(
    query: string
  ): Promise<string[]> {
    const normalizedQuery =
      normalizeQuery(query);

    const currentHistory =
      await SearchHistoryService.getHistory();

    const nextHistory =
      currentHistory.filter(
        (item) =>
          item.toLowerCase() !==
          normalizedQuery.toLowerCase()
      );

    await AsyncStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(nextHistory)
    );

    return nextHistory;
  }

  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(
      STORAGE_KEYS.SEARCH_HISTORY
    );
  }
}