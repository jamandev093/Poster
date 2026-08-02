import {
  findInterestTopicByName,
  getInterestTopicById,
  getInterestTopicBySlug,
  getRelatedInterestTopics,
} from "./taxonomy.selectors";

import {
  InterestTopicDefinition,
} from "./taxonomy.types";

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeLimit(
  limit: number | undefined,
  fallback: number
): number {
  if (
    typeof limit !== "number" ||
    !Number.isFinite(limit)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(limit)
  );
}

function createUniqueTopics(
  topics:
    readonly InterestTopicDefinition[]
): InterestTopicDefinition[] {
  const seenTopicIds =
    new Set<string>();

  const result:
    InterestTopicDefinition[] = [];

  topics.forEach(
    (topic) => {
      if (
        seenTopicIds.has(
          topic.id
        )
      ) {
        return;
      }

      seenTopicIds.add(
        topic.id
      );

      result.push(topic);
    }
  );

  return result;
}

function resolveTopic(
  topicIdOrName: string
): InterestTopicDefinition | undefined {
  const normalizedValue =
    normalizeText(
      topicIdOrName
    );

  if (!normalizedValue) {
    return undefined;
  }

  return (
    getInterestTopicById(
      normalizedValue
    ) ??
    getInterestTopicBySlug(
      normalizedValue
    ) ??
    findInterestTopicByName(
      normalizedValue
    )
  );
}

/**
 * Returns related canonical taxonomy topics.
 *
 * The input may be:
 * - a stable taxonomy topic ID
 * - a stable topic slug
 * - a canonical topic name
 * - a recognized alias
 *
 * Examples:
 * - "topic-generative-ai"
 * - "generative-ai"
 * - "Generative AI"
 * - "Gen AI"
 */
export function getRelatedTopics(
  topicIdOrName: string,
  limit = 10
): InterestTopicDefinition[] {
  const normalizedLimit =
    normalizeLimit(
      limit,
      10
    );

  if (
    normalizedLimit === 0
  ) {
    return [];
  }

  const topic =
    resolveTopic(
      topicIdOrName
    );

  if (!topic) {
    return [];
  }

  const relatedTopics =
    getRelatedInterestTopics(
      topic.id,
      normalizedLimit
    );

  return createUniqueTopics(
    relatedTopics
  ).slice(
    0,
    normalizedLimit
  );
}

/**
 * Returns stable canonical topic IDs for
 * persistence, APIs and recommendation logic.
 */
export function getRelatedTopicIds(
  topicIdOrName: string,
  limit = 10
): string[] {
  return getRelatedTopics(
    topicIdOrName,
    limit
  ).map(
    (topic) =>
      topic.id
  );
}

/**
 * Returns user-facing names for frontend
 * components that still consume string labels.
 */
export function getRelatedTopicNames(
  topicIdOrName: string,
  limit = 10
): string[] {
  return getRelatedTopics(
    topicIdOrName,
    limit
  ).map(
    (topic) =>
      topic.name
  );
}