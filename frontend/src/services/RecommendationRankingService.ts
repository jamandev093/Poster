import {
  FeedItem,
} from "../components/cards/feedCard.types";

import RecommendationContextService, {
  RecommendationContext,
  RecommendationTopicSignal,
} from "./RecommendationContextService";

export interface RecommendationInteractionState {
  recommendedIds:
    readonly string[];

  helpfulIds:
    readonly string[];
}

export interface RankedRecommendationArticle {
  article:
    FeedItem;

  score: number;

  matchedTopicIds:
    string[];

  reasons:
    RecommendationRankingReason[];
}

export type RecommendationRankingReason =
  | "selected_interest"
  | "related_interest"
  | "title_match"
  | "category_match"
  | "publisher_match"
  | "worth_reading_signal"
  | "helpful_signal";

export interface RankArticlesOptions {
  context?:
    RecommendationContext;

  interactions?:
    RecommendationInteractionState;

  limit?: number;
}

const SELECTED_TOPIC_BASE_SCORE =
  90;

const RELATED_TOPIC_BASE_SCORE =
  45;

const TITLE_MULTIPLIER =
  1;

const CATEGORY_MULTIPLIER =
  0.72;

const PUBLISHER_MULTIPLIER =
  0.35;

const WORTH_READING_BOOST =
  8;

const HELPFUL_BOOST =
  6;

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

function createUniqueValues(
  values:
    readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach(
    (value) => {
      const cleaned =
        value
          .trim()
          .replace(/\s+/g, " ");

      const key =
        normalizeText(
          cleaned
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);

      result.push(
        cleaned
      );
    }
  );

  return result;
}

function addReason(
  reasons:
    RecommendationRankingReason[],
  reason:
    RecommendationRankingReason
): void {
  if (
    !reasons.includes(
      reason
    )
  ) {
    reasons.push(
      reason
    );
  }
}

function getTopicTerms(
  topic:
    RecommendationTopicSignal
): string[] {
  return createUniqueValues([
    topic.name,

    ...topic.aliases,

    ...topic.searchKeywords,
  ]);
}

function calculateFieldMatch(
  fieldValue: string,
  topicTerms:
    readonly string[]
): number {
  const normalizedField =
    normalizeText(
      fieldValue
    );

  if (!normalizedField) {
    return 0;
  }

  let bestScore = 0;

  topicTerms.forEach(
    (term) => {
      const normalizedTerm =
        normalizeText(
          term
        );

      if (
        normalizedTerm.length <
        2
      ) {
        return;
      }

      if (
        normalizedField ===
        normalizedTerm
      ) {
        bestScore =
          Math.max(
            bestScore,
            1
          );

        return;
      }

      if (
        normalizedField.includes(
          normalizedTerm
        )
      ) {
        bestScore =
          Math.max(
            bestScore,
            0.82
          );

        return;
      }

      const termTokens =
        normalizedTerm
          .split(/\s+/)
          .filter(
            (token) =>
              token.length >= 3
          );

      if (
        termTokens.length ===
        0
      ) {
        return;
      }

      const matchedTokens =
        termTokens.filter(
          (token) =>
            normalizedField.includes(
              token
            )
        ).length;

      if (
        matchedTokens === 0
      ) {
        return;
      }

      bestScore =
        Math.max(
          bestScore,
          (
            matchedTokens /
            termTokens.length
          ) *
            0.6
        );
    }
  );

  return bestScore;
}

function scoreTopicAgainstArticle(
  article:
    FeedItem,
  topic:
    RecommendationTopicSignal,
  selected:
    boolean
): {
  score: number;

  matched: boolean;

  reasons:
    RecommendationRankingReason[];
} {
  const terms =
    getTopicTerms(
      topic
    );

  const titleMatch =
    calculateFieldMatch(
      article.title,
      terms
    );

  const categoryMatch =
    calculateFieldMatch(
      article.category,
      terms
    );

  const publisherMatch =
    calculateFieldMatch(
      article.publisher,
      terms
    );

  const strongestMatch =
    Math.max(
      titleMatch,
      categoryMatch,
      publisherMatch
    );

  if (
    strongestMatch <= 0
  ) {
    return {
      score: 0,

      matched: false,

      reasons: [],
    };
  }

  const reasons:
    RecommendationRankingReason[] =
    [];

  addReason(
    reasons,
    selected
      ? "selected_interest"
      : "related_interest"
  );

  if (
    titleMatch > 0
  ) {
    addReason(
      reasons,
      "title_match"
    );
  }

  if (
    categoryMatch > 0
  ) {
    addReason(
      reasons,
      "category_match"
    );
  }

  if (
    publisherMatch > 0
  ) {
    addReason(
      reasons,
      "publisher_match"
    );
  }

  const baseScore =
    selected
      ? SELECTED_TOPIC_BASE_SCORE
      : RELATED_TOPIC_BASE_SCORE;

  const topicStrength =
    topic.affinityScore *
    topic.recommendationWeight;

  const weightedMatch =
    titleMatch *
      TITLE_MULTIPLIER +

    categoryMatch *
      CATEGORY_MULTIPLIER +

    publisherMatch *
      PUBLISHER_MULTIPLIER;

  return {
    score:
      baseScore *
      topicStrength *
      weightedMatch,

    matched: true,

    reasons,
  };
}

function scoreArticle(
  article:
    FeedItem,
  context:
    RecommendationContext,
  interactions:
    RecommendationInteractionState
): RankedRecommendationArticle {
  let score = 0;

  const matchedTopicIds:
    string[] = [];

  const reasons:
    RecommendationRankingReason[] =
    [];

  context.selectedTopics.forEach(
    (topic) => {
      const result =
        scoreTopicAgainstArticle(
          article,
          topic,
          true
        );

      if (
        !result.matched
      ) {
        return;
      }

      score +=
        result.score;

      matchedTopicIds.push(
        topic.topicId
      );

      result.reasons.forEach(
        (reason) =>
          addReason(
            reasons,
            reason
          )
      );
    }
  );

  context.relatedTopics.forEach(
    (topic) => {
      const result =
        scoreTopicAgainstArticle(
          article,
          topic,
          false
        );

      if (
        !result.matched
      ) {
        return;
      }

      score +=
        result.score;

      matchedTopicIds.push(
        topic.topicId
      );

      result.reasons.forEach(
        (reason) =>
          addReason(
            reasons,
            reason
          )
      );
    }
  );

  if (
    interactions.recommendedIds.includes(
      article.id
    )
  ) {
    score +=
      WORTH_READING_BOOST;

    addReason(
      reasons,
      "worth_reading_signal"
    );
  }

  if (
    interactions.helpfulIds.includes(
      article.id
    )
  ) {
    score +=
      HELPFUL_BOOST;

    addReason(
      reasons,
      "helpful_signal"
    );
  }

  return {
    article,

    score,

    matchedTopicIds:
      createUniqueValues(
        matchedTopicIds
      ),

    reasons,
  };
}

export default class RecommendationRankingService {
  /**
   * Pure ranking operation.
   *
   * The original article array is never
   * mutated. Equal scores preserve the
   * existing feed order.
   */
  static rankArticles(
    articles:
      readonly FeedItem[],
    context:
      RecommendationContext,
    interactions:
      RecommendationInteractionState = {
        recommendedIds: [],
        helpfulIds: [],
      },
    limit?: number
  ): RankedRecommendationArticle[] {
    const ranked =
      articles.map(
        (article, index) => ({
          ...scoreArticle(
            article,
            context,
            interactions
          ),

          originalIndex:
            index,
        })
      );

    ranked.sort(
      (
        first,
        second
      ) => {
        if (
          second.score !==
          first.score
        ) {
          return (
            second.score -
            first.score
          );
        }

        return (
          first.originalIndex -
          second.originalIndex
        );
      }
    );

    const result =
      ranked.map(
        ({
          originalIndex: _,
          ...item
        }) =>
          item
      );

    if (
      typeof limit !== "number" ||
      !Number.isFinite(limit)
    ) {
      return result;
    }

    return result.slice(
      0,
      Math.max(
        0,
        Math.floor(limit)
      )
    );
  }

  /**
   * Convenience method for future Home
   * and backend/API integration.
   *
   * Builds the living taxonomy context,
   * then ranks the supplied articles.
   */
  static async buildRankedArticles(
    articles:
      readonly FeedItem[],
    interactions:
      RecommendationInteractionState = {
        recommendedIds: [],
        helpfulIds: [],
      },
    limit?: number
  ): Promise<
    RankedRecommendationArticle[]
  > {
    const context =
      await RecommendationContextService
        .buildContext();

    return RecommendationRankingService
      .rankArticles(
        articles,
        context,
        interactions,
        limit
      );
  }

  static async buildRankedFeed(
    articles:
      readonly FeedItem[],
    interactions:
      RecommendationInteractionState = {
        recommendedIds: [],
        helpfulIds: [],
      },
    limit?: number
  ): Promise<
    FeedItem[]
  > {
    const ranked =
      await RecommendationRankingService
        .buildRankedArticles(
          articles,
          interactions,
          limit
        );

    return ranked.map(
      (item) =>
        item.article
    );
  }
}