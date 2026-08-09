import type {
  PosterBrainContentClassificationResult,
  PosterBrainNormalizedContentItem,
} from "../../domains/poster-brain/index.js";

import {
  createPosterBrainContentClassificationService,
  type PosterBrainContentClassificationService,
} from "./content-classification.service.js";

import type {
  PosterBrainAiClassification,
  PosterBrainAiClassificationProvider,
  PosterBrainAiClassificationRequest,
} from "./ai-classification-provider-gateway.service.js";

export interface PosterBrainRuleBasedAiClassificationProviderDependencies {
  readonly contentClassificationService?: PosterBrainContentClassificationService;
  readonly now: () => string;
}

function cleanText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function uniqueValues(
  values: readonly (
    | string
    | undefined
    | null
  )[]
): readonly string[] {
  const seen =
    new Set<string>();

  const result:
    string[] =
    [];

  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    const cleaned =
      cleanText(value);

    if (cleaned.length === 0) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(
      key
    );

    result.push(
      cleaned
    );
  }

  return result;
}

function createExternalContentId(
  input: PosterBrainAiClassificationRequest
): string {
  return [
    input.sourceKey,
    input.url,
  ].join(":");
}

function createNormalizedItem(
  input: PosterBrainAiClassificationRequest
): PosterBrainNormalizedContentItem {
  const categories =
    uniqueValues(
      input.categories ?? []
    );

  const excerpt =
    cleanText(
      input.excerpt ?? ""
    );

  const searchKeywords =
    uniqueValues([
      input.title,
      excerpt,
      ...categories,
    ]);

  return {
    externalContentId:
      createExternalContentId(input),

    title:
      cleanText(input.title),

    url:
      input.url,

    originalUrl:
      input.url,

    canonicalUrl:
      input.url,

    excerpt,

    summary:
      excerpt,

    description:
      excerpt,

    tags:
      categories,

    categories,

    rawCategories:
      categories,

    searchKeywords,

    publishedAt:
      input.publishedAt ?? null,

    languageCode:
      null,

    regionCode:
      null,

    imageUrl:
      null,

    authorName:
      null,
  } as unknown as PosterBrainNormalizedContentItem;
}

function toTopics(input: {
  readonly classification: PosterBrainContentClassificationResult;
  readonly request: PosterBrainAiClassificationRequest;
  readonly primaryCategory: string;
}): readonly string[] {
  const topics =
    uniqueValues([
      ...input.classification.canonicalTopicIds,
      ...input.classification.evolvingTopicIds,
    ]);

  if (topics.length > 0) {
    return topics;
  }

  const categoryTopics =
    uniqueValues(
      input.request.categories ?? []
    );

  if (categoryTopics.length > 0) {
    return categoryTopics.map(
      topic =>
        topic.toLowerCase()
    );
  }

  return [
    input.primaryCategory.toLowerCase(),
  ];
}

function readOptionalJsonString(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

function toProviderName(
  classification: PosterBrainContentClassificationResult
): string {
  return readOptionalJsonString(
    classification.aiClassification.provider
  ) ?? "poster_rule_seed";
}

function toModel(
  classification: PosterBrainContentClassificationResult
): string | undefined {
  return readOptionalJsonString(
    classification.aiClassification.version
  );
}

function toAiClassification(input: {
  readonly request: PosterBrainAiClassificationRequest;
  readonly classification: PosterBrainContentClassificationResult;
  readonly classifiedAt: string;
}): PosterBrainAiClassification {
  const primaryCategory =
    input.classification.category ??
    "general";

  const base: PosterBrainAiClassification = {
    primaryCategory,

    topics:
      toTopics({
        classification:
          input.classification,
        request:
          input.request,
        primaryCategory,
      }),

    confidence:
      input.classification.confidence,

    provider:
      toProviderName(
        input.classification
      ),

    classifiedAt:
      input.classifiedAt,
  };

  const model =
    toModel(
      input.classification
    );

  if (model === undefined) {
    return base;
  }

  return {
    ...base,
    model,
  };
}

export function createPosterBrainRuleBasedAiClassificationProvider(
  dependencies: PosterBrainRuleBasedAiClassificationProviderDependencies
): PosterBrainAiClassificationProvider {
  const contentClassificationService =
    dependencies.contentClassificationService ??
    createPosterBrainContentClassificationService();

  return {
    async classifyContent(input) {
      const classification =
        contentClassificationService
          .classifyItem({
            item:
              createNormalizedItem(
                input
              ),
          });

      return toAiClassification({
        request:
          input,
        classification,
        classifiedAt:
          dependencies.now(),
      });
    },
  };
}