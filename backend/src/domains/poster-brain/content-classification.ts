import type {
  PosterBrainContentClassificationResult,
  PosterBrainContentSafetyStatus,
} from "./content-classification.types.js";

import type {
  PosterBrainJsonObject,
} from "./content-persistence.types.js";

import type {
  PosterBrainNormalizedContentItem,
} from "./rss-ingestion.types.js";

interface TopicRule {
  readonly category: string;
  readonly canonicalTopicId: string;
  readonly keywords: readonly string[];
}

const TOPIC_RULES: readonly TopicRule[] = [
  {
    category: "AI",
    canonicalTopicId: "ai",
    keywords: [
      "ai",
      "artificial intelligence",
      "machine learning",
      "language model",
      "neural",
    ],
  },
  {
    category: "Policy",
    canonicalTopicId: "policy",
    keywords: [
      "policy",
      "regulation",
      "government",
      "law",
      "compliance",
    ],
  },
  {
    category: "Technology",
    canonicalTopicId: "technology",
    keywords: [
      "technology",
      "software",
      "platform",
      "startup",
      "cloud",
    ],
  },
  {
    category: "Business",
    canonicalTopicId: "business",
    keywords: [
      "market",
      "company",
      "revenue",
      "funding",
      "business",
    ],
  },
];

const REVIEW_KEYWORDS = [
  "rumor",
  "unverified",
  "leak",
  "alleged",
];

const BLOCKED_KEYWORDS = [
  "terror",
  "porn",
  "casino",
  "gambling",
  "weapon",
];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function createSearchCorpus(
  item: PosterBrainNormalizedContentItem
): string {
  return normalizeText(
    [
      item.title,
      item.excerpt,
      item.publisherName,
      ...item.tags,
      ...item.searchKeywords,
    ].join(" ")
  );
}

function hasKeyword(
  corpus: string,
  keywords: readonly string[]
): boolean {
  return keywords.some(keyword =>
    corpus.includes(normalizeText(keyword))
  );
}

function unique(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function classifySafety(
  corpus: string
): PosterBrainContentSafetyStatus {
  if (hasKeyword(corpus, BLOCKED_KEYWORDS)) {
    return "blocked";
  }

  if (hasKeyword(corpus, REVIEW_KEYWORDS)) {
    return "needs_review";
  }

  return "safe";
}

function calculateQualityScore(
  item: PosterBrainNormalizedContentItem,
  safetyStatus: PosterBrainContentSafetyStatus,
  topicCount: number
): number {
  let score = 0.35;

  if (item.title.length >= 12) {
    score += 0.15;
  }

  if (item.excerpt.length >= 40) {
    score += 0.15;
  }

  if (item.canonicalUrl) {
    score += 0.05;
  }

  if (item.publishedAt) {
    score += 0.1;
  }

  if (item.tags.length > 0) {
    score += 0.1;
  }

  if (topicCount > 0) {
    score += 0.1;
  }

  if (safetyStatus === "needs_review") {
    score -= 0.2;
  }

  if (safetyStatus === "blocked") {
    score = 0;
  }

  return clamp01(score);
}

function createClassificationMetadata(input: {
  readonly category: string | null;
  readonly canonicalTopicIds: readonly string[];
  readonly evolvingTopicIds: readonly string[];
  readonly qualityScore: number;
  readonly safetyStatus: PosterBrainContentSafetyStatus;
  readonly confidence: number;
  readonly reasons: readonly string[];
}): PosterBrainJsonObject {
  return {
    provider: "poster_rule_seed",
    version: "s02m",
    status: "classified",
    category: input.category,
    canonicalTopicIds: input.canonicalTopicIds,
    evolvingTopicIds: input.evolvingTopicIds,
    qualityScore: input.qualityScore,
    safetyStatus: input.safetyStatus,
    confidence: input.confidence,
    reasons: input.reasons,
  };
}

export function classifyPosterBrainContentItem(input: {
  readonly item: PosterBrainNormalizedContentItem;
}): PosterBrainContentClassificationResult {
  const corpus =
    createSearchCorpus(input.item);

  const matchedRules =
    TOPIC_RULES.filter(rule =>
      hasKeyword(corpus, rule.keywords)
    );

  const canonicalTopicIds =
    unique(matchedRules.map(rule => rule.canonicalTopicId));

  const evolvingTopicIds =
    unique([
      ...input.item.tags,
      ...input.item.searchKeywords,
    ]);

  const category =
    matchedRules[0]?.category ?? null;

  const safetyStatus =
    classifySafety(corpus);

  const reasons: string[] = [];

  if (category) {
    reasons.push(`matched_category:${category}`);
  } else {
    reasons.push("no_category_match");
  }

  reasons.push(`safety:${safetyStatus}`);

  const qualityScore =
    calculateQualityScore(
      input.item,
      safetyStatus,
      canonicalTopicIds.length
    );

  const confidence =
    safetyStatus === "blocked"
      ? 0.95
      : clamp01(
          0.35 +
            canonicalTopicIds.length * 0.15 +
            input.item.tags.length * 0.05
        );

  const aiClassification =
    createClassificationMetadata({
      category,
      canonicalTopicIds,
      evolvingTopicIds,
      qualityScore,
      safetyStatus,
      confidence,
      reasons,
    });

  return {
    category,
    canonicalTopicIds,
    evolvingTopicIds,
    qualityScore,
    safetyStatus,
    confidence,
    reasons,
    aiClassification,
  };
}