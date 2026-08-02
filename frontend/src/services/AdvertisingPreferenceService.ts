import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STORAGE_KEYS,
} from "../constants/storage";

let mutationQueue:
  Promise<void> =
  Promise.resolve();

function enqueueMutation(
  operation: () => Promise<void>
): Promise<void> {
  const nextMutation =
    mutationQueue.then(
      operation,
      operation
    );

  mutationQueue =
    nextMutation.catch(() => {
      // Keep the queue usable after
      // an individual storage failure.
    });

  return nextMutation;
}

function parseBoolean(
  value: string | null,
  fallback: boolean
): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function parseStringArray(
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

    return Array.from(
      new Set(
        parsed
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          )
          .map((item) =>
            item.trim()
          )
          .filter(
            (item) =>
              item.length > 0
          )
      )
    );
  } catch {
    return [];
  }
}

export default class AdvertisingPreferenceService {
  static async getPersonalizedAdsEnabled(): Promise<boolean> {
    try {
      const value =
        await AsyncStorage.getItem(
          STORAGE_KEYS.PERSONALIZED_ADS
        );

      return parseBoolean(
        value,
        false
      );
    } catch {
      return false;
    }
  }

  static async setPersonalizedAdsEnabled(
    enabled: boolean
  ): Promise<void> {
    return enqueueMutation(
      async () => {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PERSONALIZED_ADS,
          String(enabled)
        );
      }
    );
  }

  static async getHiddenItemIds(): Promise<
    string[]
  > {
    try {
      const value =
        await AsyncStorage.getItem(
          STORAGE_KEYS.HIDDEN_MONETIZATION_ITEMS
        );

      return parseStringArray(
        value
      );
    } catch {
      return [];
    }
  }

  static async isItemHidden(
    itemId: string
  ): Promise<boolean> {
    const normalizedItemId =
      itemId.trim();

    if (!normalizedItemId) {
      return false;
    }

    const hiddenItemIds =
      await AdvertisingPreferenceService.getHiddenItemIds();

    return hiddenItemIds.includes(
      normalizedItemId
    );
  }

  static async hideItem(
    itemId: string
  ): Promise<void> {
    const normalizedItemId =
      itemId.trim();

    if (!normalizedItemId) {
      return;
    }

    return enqueueMutation(
      async () => {
        const hiddenItemIds =
          await AdvertisingPreferenceService.getHiddenItemIds();

        if (
          hiddenItemIds.includes(
            normalizedItemId
          )
        ) {
          return;
        }

        const nextHiddenItemIds =
          [
            ...hiddenItemIds,
            normalizedItemId,
          ];

        await AsyncStorage.setItem(
          STORAGE_KEYS.HIDDEN_MONETIZATION_ITEMS,
          JSON.stringify(
            nextHiddenItemIds
          )
        );
      }
    );
  }

  static async unhideItem(
    itemId: string
  ): Promise<void> {
    const normalizedItemId =
      itemId.trim();

    if (!normalizedItemId) {
      return;
    }

    return enqueueMutation(
      async () => {
        const hiddenItemIds =
          await AdvertisingPreferenceService.getHiddenItemIds();

        const nextHiddenItemIds =
          hiddenItemIds.filter(
            (
              currentItemId
            ) =>
              currentItemId !==
              normalizedItemId
          );

        if (
          nextHiddenItemIds.length ===
          hiddenItemIds.length
        ) {
          return;
        }

        await AsyncStorage.setItem(
          STORAGE_KEYS.HIDDEN_MONETIZATION_ITEMS,
          JSON.stringify(
            nextHiddenItemIds
          )
        );
      }
    );
  }

  static async clearHiddenItems(): Promise<void> {
    return enqueueMutation(
      async () => {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.HIDDEN_MONETIZATION_ITEMS
        );
      }
    );
  }

  static async reset(): Promise<void> {
    return enqueueMutation(
      async () => {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.PERSONALIZED_ADS,
          STORAGE_KEYS.HIDDEN_MONETIZATION_ITEMS,
          STORAGE_KEYS.MONETIZATION_FEEDBACK,
        ]);
      }
    );
  }
}