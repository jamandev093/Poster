import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  STORAGE_KEYS,
} from "../constants/storage";

import {
  InterestTopicDefinition,
  findInterestTopicByName,
  getInterestTopicById,
  resolveStoredInterestValues,
} from "../data/interests";

export interface ResolvedUserInterests {
  /**
   * Stable canonical taxonomy IDs.
   */
  topicIds: string[];

  /**
   * Canonical display names for resolved topics.
   */
  topicNames: string[];

  /**
   * Older or custom values that do not currently
   * match the canonical taxonomy.
   */
  unresolvedValues: string[];

  /**
   * Complete display-name list used by the
   * current frontend.
   */
  displayValues: string[];
}

function normalizeInterest(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function createUniqueInterests(
  interests: readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const uniqueInterests:
    string[] = [];

  interests.forEach((interest) => {
    if (
      typeof interest !== "string"
    ) {
      return;
    }

    const normalizedInterest =
      normalizeInterest(
        interest
      );

    if (!normalizedInterest) {
      return;
    }

    const comparisonKey =
      normalizedInterest.toLowerCase();

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

    uniqueInterests.push(
      normalizedInterest
    );
  });

  return uniqueInterests;
}

function parseStoredInterests(
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

    return createUniqueInterests(
      parsed.filter(
        (item): item is string =>
          typeof item === "string"
      )
    );
  } catch {
    return [];
  }
}

function resolveInterestValue(
  value: string
): InterestTopicDefinition | undefined {
  return (
    getInterestTopicById(
      value
    ) ??
    findInterestTopicByName(
      value
    )
  );
}

class PreferenceService {
  async getDarkMode(): Promise<boolean> {
    try {
      const value =
        await AsyncStorage.getItem(
          STORAGE_KEYS.DARK_MODE
        );

      return value === "true";
    } catch {
      return false;
    }
  }

  async setDarkMode(
    enabled: boolean
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DARK_MODE,
        String(enabled)
      );
    } catch {
      // Keep local UI functional when storage fails.
    }
  }

  async getNotifications(): Promise<boolean> {
    try {
      const value =
        await AsyncStorage.getItem(
          STORAGE_KEYS.NOTIFICATIONS
        );

      return value !== "false";
    } catch {
      return true;
    }
  }

  async setNotifications(
    enabled: boolean
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        String(enabled)
      );
    } catch {
      // Keep local UI functional when storage fails.
    }
  }

  /**
   * Returns the current frontend-compatible
   * display values.
   *
   * Canonical IDs stored by future code are
   * automatically converted to topic names.
   * Unknown legacy values remain preserved.
   */
  async getInterests(): Promise<string[]> {
    try {
      const storedValue =
        await AsyncStorage.getItem(
          STORAGE_KEYS.USER_INTERESTS
        );

      const storedInterests =
        parseStoredInterests(
          storedValue
        );

      return createUniqueInterests(
        storedInterests.map(
          (storedInterest) => {
            const topic =
              resolveInterestValue(
                storedInterest
              );

            return (
              topic?.name ??
              storedInterest
            );
          }
        )
      );
    } catch {
      return [];
    }
  }

  /**
   * Saves frontend-compatible display values.
   *
   * Canonical IDs, canonical names, and aliases
   * are normalized to canonical topic names.
   * Unknown legacy/custom values remain intact.
   */
  async saveInterests(
    interests: readonly string[]
  ): Promise<void> {
    const normalizedInterests =
      createUniqueInterests(
        interests.map(
          (interest) => {
            const topic =
              resolveInterestValue(
                interest
              );

            return (
              topic?.name ??
              interest
            );
          }
        )
      );

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_INTERESTS,
        JSON.stringify(
          normalizedInterests
        )
      );
    } catch {
      throw new Error(
        "Unable to save user interests."
      );
    }
  }

  /**
   * Saves stable taxonomy IDs while preserving
   * unresolved legacy or custom values.
   *
   * The current storage remains a single array
   * for backward compatibility. getInterests()
   * converts these IDs back into display names.
   */
  async saveInterestTopicIds(
    topicIds: readonly string[],
    unresolvedValues:
      readonly string[] = []
  ): Promise<void> {
    const validTopicIds =
      createUniqueInterests(
        topicIds.filter(
          (topicId) =>
            Boolean(
              getInterestTopicById(
                topicId
              )
            )
        )
      );

    const preservedValues =
      createUniqueInterests(
        unresolvedValues
      );

    const storedValues = [
      ...validTopicIds,
      ...preservedValues,
    ];

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_INTERESTS,
        JSON.stringify(
          storedValues
        )
      );
    } catch {
      throw new Error(
        "Unable to save taxonomy interests."
      );
    }
  }

  /**
   * Resolves saved values into stable taxonomy
   * IDs and canonical names.
   */
  async getResolvedInterests(): Promise<ResolvedUserInterests> {
    try {
      const storedValue =
        await AsyncStorage.getItem(
          STORAGE_KEYS.USER_INTERESTS
        );

      const storedInterests =
        parseStoredInterests(
          storedValue
        );

      const resolved =
        resolveStoredInterestValues(
          storedInterests
        );

      const displayValues =
        createUniqueInterests([
          ...resolved.topicNames,
          ...resolved.unresolvedValues,
        ]);

      return {
        topicIds:
          resolved.topicIds,

        topicNames:
          resolved.topicNames,

        unresolvedValues:
          resolved.unresolvedValues,

        displayValues,
      };
    } catch {
      return {
        topicIds: [],
        topicNames: [],
        unresolvedValues: [],
        displayValues: [],
      };
    }
  }

  /**
   * Returns only stable taxonomy IDs for
   * recommendation and future API requests.
   */
  async getInterestTopicIds(): Promise<
    string[]
  > {
    const resolved =
      await this.getResolvedInterests();

    return resolved.topicIds;
  }

  /**
   * Returns canonical topic records for
   * recommendation and contextual systems.
   */
  async getInterestTopics(): Promise<
    InterestTopicDefinition[]
  > {
    const topicIds =
      await this.getInterestTopicIds();

    return topicIds.flatMap(
      (topicId) => {
        const topic =
          getInterestTopicById(
            topicId
          );

        return topic
          ? [topic]
          : [];
      }
    );
  }

  /**
   * Rewrites older names and aliases into
   * stable taxonomy IDs while retaining values
   * that cannot yet be resolved.
   *
   * This may be called once during a future
   * account or application migration.
   */
  async migrateInterestsToTaxonomy(): Promise<ResolvedUserInterests> {
    const resolved =
      await this.getResolvedInterests();

    await this.saveInterestTopicIds(
      resolved.topicIds,
      resolved.unresolvedValues
    );

    return resolved;
  }

  async clearInterests(): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        STORAGE_KEYS.USER_INTERESTS
      );
    } catch {
      throw new Error(
        "Unable to clear user interests."
      );
    }
  }
}

export default new PreferenceService();