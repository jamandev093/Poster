import {
  listActiveTaxonomyTopics,
} from "../../domains/taxonomy/taxonomy.repository.js";

import type {
  PosterBrainEvolvingTopicClassificationInput,
  PosterBrainPreparedEvolvingTopicObservation,
} from "./evolving-topic.types.js";

interface CanonicalTopic {
  readonly id:
    string;

  readonly slug:
    string;

  readonly name:
    string;

  readonly parentTopicId:
    string | null;
}

export interface PosterBrainEvolvingTopicNormalizationService {
  prepareObservations(
    input:
      PosterBrainEvolvingTopicClassificationInput
  ):
    Promise<
      readonly PosterBrainPreparedEvolvingTopicObservation[]
    >;
}

export interface PosterBrainEvolvingTopicNormalizationDependencies {
  readonly listActiveTopics?:
    () =>
      Promise<
        readonly CanonicalTopic[]
      >;
}

function cleanText(
  value:
    string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSlug(
  value:
    string
): string {
  return cleanText(
    value
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(
  slug:
    string
): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function clampConfidence(
  value:
    number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function tokenize(
  value:
    string
): readonly string[] {
  return normalizeSlug(
    value
  )
    .split("-")
    .filter(
      token =>
        token.length >= 3
    );
}

function rootTopic(
  topic:
    CanonicalTopic,

  byId:
    ReadonlyMap<
      string,
      CanonicalTopic
    >
): CanonicalTopic {
  let current =
    topic;

  const visited =
    new Set<string>();

  while (
    current.parentTopicId !==
    null
  ) {
    if (
      visited.has(
        current.id
      )
    ) {
      break;
    }

    visited.add(
      current.id
    );

    const parent =
      byId.get(
        current.parentTopicId
      );

    if (parent === undefined) {
      break;
    }

    current =
      parent;
  }

  return current;
}

function lexicalScore(
  candidateText:
    string,

  topic:
    CanonicalTopic
): number {
  const candidate =
    normalizeSlug(
      candidateText
    );

  const topicSlug =
    normalizeSlug(
      topic.slug
    );

  const topicName =
    normalizeSlug(
      topic.name
    );

  if (
    candidate === topicSlug ||
    candidate === topicName
  ) {
    return 100;
  }

  if (
    candidate.includes(topicSlug) ||
    topicSlug.includes(candidate)
  ) {
    return 20;
  }

  const candidateTokens =
    new Set(
      tokenize(
        candidateText
      )
    );

  const topicTokens =
    tokenize(
      `${topic.slug} ${topic.name}`
    );

  let matches =
    0;

  for (
    const token
    of topicTokens
  ) {
    if (
      candidateTokens.has(
        token
      )
    ) {
      matches +=
        1;
    }
  }

  return matches *
    5;
}

function resolveCanonicalRoot(
  input: {
    readonly canonicalTopicIds:
      readonly string[];

    readonly classificationText:
      readonly string[];

    readonly topics:
      readonly CanonicalTopic[];
  }
): CanonicalTopic | null {
  const byId =
    new Map(
      input.topics.map(
        topic =>
          [
            topic.id,
            topic,
          ] as const
      )
    );

  const bySlug =
    new Map(
      input.topics.map(
        topic =>
          [
            normalizeSlug(
              topic.slug
            ),
            topic,
          ] as const
      )
    );

  /*
   * Strongest signal:
   * a canonical topic already emitted by Poster classification.
   */
  for (
    const canonicalTopicId
    of input.canonicalTopicIds
  ) {
    const match =
      bySlug.get(
        normalizeSlug(
          canonicalTopicId
        )
      );

    if (match !== undefined) {
      return rootTopic(
        match,
        byId
      );
    }
  }

  /*
   * Conservative lexical fallback.
   * Low-confidence matches remain unassigned rather than
   * inventing a canonical relationship.
   */
  let bestTopic:
    CanonicalTopic |
    null =
    null;

  let bestScore =
    0;

  for (
    const text
    of input.classificationText
  ) {
    for (
      const topic
      of input.topics
    ) {
      const score =
        lexicalScore(
          text,
          topic
        );

      if (
        score >
        bestScore
      ) {
        bestScore =
          score;

        bestTopic =
          topic;
      }
    }
  }

  if (
    bestTopic === null ||
    bestScore < 10
  ) {
    return null;
  }

  return rootTopic(
    bestTopic,
    byId
  );
}

export function createPosterBrainEvolvingTopicNormalizationService(
  dependencies:
    PosterBrainEvolvingTopicNormalizationDependencies = {}
): PosterBrainEvolvingTopicNormalizationService {
  const listTopics =
    dependencies.listActiveTopics ??
    (
      async () => {
        const topics =
          await listActiveTaxonomyTopics();

        return topics.map(
          topic => ({
            id:
              topic.id,

            slug:
              topic.slug,

            name:
              topic.name,

            parentTopicId:
              topic.parentTopicId,
          })
        );
      }
    );

  return {
    async prepareObservations(
      input
    ) {
      const activeTopics =
        await listTopics();

      const canonicalSlugs =
        new Set(
          activeTopics.map(
            topic =>
              normalizeSlug(
                topic.slug
              )
          )
        );

      const root =
        resolveCanonicalRoot({
          canonicalTopicIds:
            input.canonicalTopicIds,

          classificationText: [
            input.primaryCategory,
            ...input.topics,
            ...input.evolvingTopicIds,
          ],

          topics:
            activeTopics,
        });

      const rawNames =
        new Map<string, string>();

      for (
        const raw
        of [
          input.primaryCategory,
          ...input.topics,
        ]
      ) {
        const cleaned =
          cleanText(
            raw
          );

        const slug =
          normalizeSlug(
            cleaned
          );

        if (
          slug &&
          !rawNames.has(slug)
        ) {
          rawNames.set(
            slug,
            cleaned
          );
        }
      }

      const evolvingSlugs:
        string[] =
        [];

      const seen =
        new Set<string>();

      for (
        const raw
        of input.evolvingTopicIds
      ) {
        const slug =
          normalizeSlug(
            raw
          );

        if (
          !slug ||
          seen.has(slug) ||
          canonicalSlugs.has(slug)
        ) {
          continue;
        }

        seen.add(
          slug
        );

        evolvingSlugs.push(
          slug
        );

        if (
          evolvingSlugs.length >=
          12
        ) {
          break;
        }
      }

      const observed =
        new Date(
          input.observedAt
        );

      if (
        Number.isNaN(
          observed.getTime()
        )
      ) {
        throw new Error(
          "Invalid evolving topic classification observedAt."
        );
      }

      const providerKey =
        cleanText(
          input.providerKey
        )
          .toLowerCase();

      if (!providerKey) {
        throw new Error(
          "Evolving topic provider key is required."
        );
      }

      const modelKey =
        input.modelKey ===
          undefined
          ? null
          : (
              cleanText(
                input.modelKey
              ) ||
              null
            );

      return evolvingSlugs.map(
        slug => ({
          slug,

          displayName:
            rawNames.get(
              slug
            ) ??
            titleFromSlug(
              slug
            ),

          canonicalParentTopicId:
            root?.id ??
            null,

          canonicalParentSlug:
            root?.slug ??
            null,

          providerKey,

          modelKey,

          externalContentId:
            cleanText(
              input.externalContentId
            ),

          confidence:
            clampConfidence(
              input.confidence
            ),

          observedAt:
            observed.toISOString(),
        })
      );
    },
  };
}