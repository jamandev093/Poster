import {
  getRelatedInterestTopics,
  getSearchableInterestTopics,
  resolveInterestTopic,
} from "../data/interests";

import PreferenceService from "./PreferenceService";

import UnifiedTopicRegistryService, {
  UnifiedTopic,
} from "./UnifiedTopicRegistryService";

export interface RecommendationTopicSignal {
  topicId: string;

  name: string;

  kind:
    | "canonical"
    | "evolving";

  affinityScore: number;

  recommendationWeight: number;

  parentTopicIds: string[];

  aliases: string[];

  searchKeywords: string[];
}

export interface RecommendationContext {
  selectedTopics:
    RecommendationTopicSignal[];

  relatedTopics:
    RecommendationTopicSignal[];

  searchTerms: string[];

  topicIds: string[];
}

const DEFAULT_RELATED_LIMIT = 20;

function normalizeText(
  value?: string
): string {
  return (
    value
      ?.normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase() ?? ""
  );
}

function cleanText(
  value?: string
): string {
  return (
    value
      ?.normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ") ?? ""
  );
}

function uniqueValues(
  values:
    readonly (
      | string
      | undefined
    )[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach(
    (value) => {
      const cleaned =
        cleanText(value);

      const key =
        normalizeText(cleaned);

      if (
        !key ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);

      result.push(cleaned);
    }
  );

  return result;
}

function clamp(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function getCanonicalRecommendationWeight(
  topicId: string
): number {
  const topic =
    getSearchableInterestTopics()
      .find(
        (candidate) =>
          candidate.id ===
          topicId
      );

  if (!topic) {
    return 1;
  }

  return Math.max(
    0,
    topic.recommendationWeight ??
      1
  );
}

function toSignal(
  topic:
    UnifiedTopic,
  affinityScore: number
): RecommendationTopicSignal {
  return {
    topicId:
      topic.id,

    name:
      topic.name,

    kind:
      topic.kind,

    affinityScore:
      clamp(
        affinityScore
      ),

    recommendationWeight:
      topic.kind ===
      "canonical"
        ? getCanonicalRecommendationWeight(
            topic.id
          )
        : Math.max(
            0.5,
            topic.promotionScore
          ),

    parentTopicIds: [
      ...topic.parentTopicIds,
    ],

    aliases: [
      ...topic.aliases,
    ],

    searchKeywords: [
      ...topic.searchKeywords,
    ],
  };
}

async function resolveSavedTopic(
  value: string
): Promise<
  UnifiedTopic | undefined
> {
  const direct =
    await UnifiedTopicRegistryService
      .resolveTopic(
        value
      );

  if (direct) {
    return direct;
  }

  return UnifiedTopicRegistryService
    .resolveMergedTopic(
      value
    );
}

async function getRelatedUnifiedTopics(
  topic:
    UnifiedTopic,
  limit: number
): Promise<UnifiedTopic[]> {
  const seen =
    new Set<string>([
      topic.id,
    ]);

  const result:
    UnifiedTopic[] = [];

  const addTopic = (
    candidate:
      | UnifiedTopic
      | undefined
  ) => {
    if (
      !candidate ||
      seen.has(
        candidate.id
      )
    ) {
      return;
    }

    seen.add(
      candidate.id
    );

    result.push(
      candidate
    );
  };

  /*
   * Canonical topics already have
   * explicit related-topic edges.
   */
  if (
    topic.kind ===
    "canonical"
  ) {
    const canonicalRelated =
      getRelatedInterestTopics(
        topic.id,
        limit
      );

    for (
      const related of
      canonicalRelated
    ) {
      const unified =
        await UnifiedTopicRegistryService
          .getTopicById(
            related.id
          );

      addTopic(
        unified
      );

      if (
        result.length >=
        limit
      ) {
        return result;
      }
    }
  }

  /*
   * Evolving topics inherit context
   * from their inferred canonical
   * parent topics.
   */
  const parentTopics =
    await UnifiedTopicRegistryService
      .getParentTopics(
        topic
      );

  for (
    const parent of
    parentTopics
  ) {
    addTopic(parent);

    if (
      result.length >=
      limit
    ) {
      return result;
    }

    if (
      parent.kind !==
      "canonical"
    ) {
      continue;
    }

    const relatedParents =
      getRelatedInterestTopics(
        parent.id,
        limit
      );

    for (
      const related of
      relatedParents
    ) {
      const unified =
        await UnifiedTopicRegistryService
          .getTopicById(
            related.id
          );

      addTopic(
        unified
      );

      if (
        result.length >=
        limit
      ) {
        return result;
      }
    }
  }

  /*
   * Unified search adds promoted
   * evolving concepts that are
   * semantically/name-related.
   */
  const searchMatches =
    await UnifiedTopicRegistryService
      .searchTopics(
        topic.name,
        limit
      );

  searchMatches.forEach(
    (match) =>
      addTopic(
        match.topic
      )
  );

  return result.slice(
    0,
    limit
  );
}

export default class RecommendationContextService {
  static async buildContext(
    relatedLimit =
      DEFAULT_RELATED_LIMIT
  ): Promise<
    RecommendationContext
  > {
    const savedInterests =
      await PreferenceService
        .getInterests();

    const selectedTopics:
      RecommendationTopicSignal[] =
      [];

    const selectedUnifiedTopics:
      UnifiedTopic[] = [];

    const seenSelected =
      new Set<string>();

    for (
      const savedInterest of
      savedInterests
    ) {
      const topic =
        await resolveSavedTopic(
          savedInterest
        );

      if (
        !topic ||
        seenSelected.has(
          topic.id
        )
      ) {
        continue;
      }

      seenSelected.add(
        topic.id
      );

      selectedUnifiedTopics.push(
        topic
      );

      selectedTopics.push(
        toSignal(
          topic,
          1
        )
      );
    }

    const relatedTopicMap =
      new Map<
        string,
        RecommendationTopicSignal
      >();

    for (
      const selectedTopic of
      selectedUnifiedTopics
    ) {
      const related =
        await getRelatedUnifiedTopics(
          selectedTopic,
          relatedLimit
        );

      related.forEach(
        (topic, index) => {
          if (
            seenSelected.has(
              topic.id
            )
          ) {
            return;
          }

          /*
           * Nearby relationships receive
           * stronger affinity than topics
           * appearing later in expansion.
           */
          const affinityScore =
            Math.max(
              0.25,
              0.75 -
                index * 0.04
            );

          const existing =
            relatedTopicMap.get(
              topic.id
            );

          if (
            existing &&
            existing.affinityScore >=
              affinityScore
          ) {
            return;
          }

          relatedTopicMap.set(
            topic.id,
            toSignal(
              topic,
              affinityScore
            )
          );
        }
      );
    }

    const relatedTopics =
      Array.from(
        relatedTopicMap.values()
      )
        .sort(
          (
            first,
            second
          ) => {
            const firstScore =
              first.affinityScore *
              first.recommendationWeight;

            const secondScore =
              second.affinityScore *
              second.recommendationWeight;

            return (
              secondScore -
              firstScore
            );
          }
        )
        .slice(
          0,
          relatedLimit
        );

    const searchTerms =
      uniqueValues([
        ...selectedTopics.flatMap(
          (topic) => [
            topic.name,

            ...topic.aliases,

            ...topic.searchKeywords,
          ]
        ),

        ...relatedTopics.flatMap(
          (topic) => [
            topic.name,

            ...topic.aliases,

            ...topic.searchKeywords,
          ]
        ),
      ]);

    return {
      selectedTopics,

      relatedTopics,

      searchTerms,

      topicIds:
        uniqueValues([
          ...selectedTopics.map(
            (topic) =>
              topic.topicId
          ),

          ...relatedTopics.map(
            (topic) =>
              topic.topicId
          ),
        ]),
    };
  }

  static async getTopicAffinityMap(): Promise<
    Map<string, number>
  > {
    const context =
      await RecommendationContextService
        .buildContext();

    const affinity =
      new Map<
        string,
        number
      >();

    [
      ...context.selectedTopics,
      ...context.relatedTopics,
    ].forEach(
      (topic) => {
        const score =
          topic.affinityScore *
          topic.recommendationWeight;

        const current =
          affinity.get(
            topic.topicId
          ) ?? 0;

        if (
          score > current
        ) {
          affinity.set(
            topic.topicId,
            score
          );
        }
      }
    );

    return affinity;
  }
}