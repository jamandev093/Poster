 import {
  InterestSelection,
  InterestTopicDefinition,
} from "./taxonomy.types";

import {
  findInterestTopicByName,
  getInterestTopicById,
  getInterestTopicBySlug,
} from "./taxonomy.selectors";

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSlug(
  value: string
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueStrings(
  values: readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach((value) => {
    const normalizedValue =
      normalizeText(value);

    if (!normalizedValue) {
      return;
    }

    const comparisonKey =
      normalizedValue.toLowerCase();

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

  return result;
}

function isUsableStoredTopic(
  topic: InterestTopicDefinition
): boolean {
  return (
    topic.status === "active" &&
    topic.selectable === true &&
    topic.tier !== "internal"
  );
}

function resolveRedirectedTopic(
  topic: InterestTopicDefinition
): InterestTopicDefinition | undefined {
  if (
    topic.status === "active"
  ) {
    return isUsableStoredTopic(
      topic
    )
      ? topic
      : undefined;
  }

  if (
    !topic.redirectToTopicId
  ) {
    return undefined;
  }

  const redirectedTopic =
    getInterestTopicById(
      topic.redirectToTopicId
    );

  if (
    !redirectedTopic ||
    !isUsableStoredTopic(
      redirectedTopic
    )
  ) {
    return undefined;
  }

  return redirectedTopic;
}

function resolveStoredTopic(
  value: string
): InterestTopicDefinition | undefined {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return undefined;
  }

  const topic =
    getInterestTopicById(
      normalizedValue
    ) ??
    getInterestTopicBySlug(
      normalizeSlug(
        normalizedValue
      )
    ) ??
    findInterestTopicByName(
      normalizedValue
    );

  if (!topic) {
    return undefined;
  }

  return resolveRedirectedTopic(
    topic
  );
}

export interface InterestMigrationResult {
  selections:
    InterestSelection[];

  resolvedTopics:
    InterestTopicDefinition[];

  unresolvedValues:
    string[];
}

export function migrateInterestValues(
  values: readonly string[],
  source:
    InterestSelection["source"] =
      "migration"
): InterestMigrationResult {
  const uniqueValues =
    createUniqueStrings(values);

  const resolvedTopics:
    InterestTopicDefinition[] = [];

  const unresolvedValues:
    string[] = [];

  const resolvedTopicIds =
    new Set<string>();

  uniqueValues.forEach(
    (value) => {
      const topic =
        resolveStoredTopic(
          value
        );

      if (!topic) {
        unresolvedValues.push(
          value
        );

        return;
      }

      if (
        resolvedTopicIds.has(
          topic.id
        )
      ) {
        return;
      }

      resolvedTopicIds.add(
        topic.id
      );

      resolvedTopics.push(
        topic
      );
    }
  );

  const migratedAt =
    new Date().toISOString();

  const selections =
    resolvedTopics.map(
      (
        topic
      ): InterestSelection => ({
        topicId:
          topic.id,

        selectedAt:
          migratedAt,

        source,
      })
    );

  return {
    selections,

    resolvedTopics,

    unresolvedValues,
  };
}

export function migrateInterestNamesToIds(
  values: readonly string[]
): string[] {
  return migrateInterestValues(
    values
  ).resolvedTopics.map(
    (topic) =>
      topic.id
  );
}

export function resolveStoredInterestValues(
  values: readonly string[]
): {
  topicIds: string[];

  topicNames: string[];

  unresolvedValues: string[];
} {
  const result =
    migrateInterestValues(
      values
    );

  return {
    topicIds:
      result.resolvedTopics.map(
        (topic) =>
          topic.id
      ),

    topicNames:
      result.resolvedTopics.map(
        (topic) =>
          topic.name
      ),

    unresolvedValues:
      result.unresolvedValues,
  };
}