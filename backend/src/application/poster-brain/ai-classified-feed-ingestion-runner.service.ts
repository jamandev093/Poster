import type {
  PosterBrainContentClassificationResult,
  PosterBrainContentPersistenceClassificationInput,
  PosterBrainNormalizedContentItem,
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainAiClassification,
  PosterBrainAiClassificationProvider,
  PosterBrainAiClassificationRequest,
} from "./ai-classification-provider-gateway.service.js";

import {
  createPosterBrainContentClassificationService,
  type PosterBrainContentClassificationService,
} from "./content-classification.service.js";

import {
  createPosterBrainContentIngestionService,
  type PosterBrainContentIngestionService,
} from "./content-ingestion.service.js";

import type {
  PosterBrainContentPersistenceRepository,
} from "./content-persistence.repository.js";

import {
  createPosterBrainRssIngestionService,
} from "./rss-ingestion.service.js";

import type {
  PosterBrainClassifiedFeedIngestionRunner,
} from "./source-feed-job-executor.service.js";

export interface PosterBrainAiClassifiedFeedRssIngestionService {
  parseFeedXml(input: {
    readonly source: PosterBrainRssSource;
    readonly xml: string;
  }): {
    readonly accepted: readonly PosterBrainNormalizedContentItem[];
    readonly rejected: readonly unknown[];
  };
}

export interface PosterBrainAiClassifiedFeedIngestionRunnerDependencies {
  readonly contentPersistenceRepository:
    PosterBrainContentPersistenceRepository;

  readonly aiClassificationProvider:
    PosterBrainAiClassificationProvider;

  readonly rssIngestionService?:
    PosterBrainAiClassifiedFeedRssIngestionService;

  readonly contentIngestionService?:
    PosterBrainContentIngestionService;

  readonly contentClassificationService?:
    PosterBrainContentClassificationService;
}

function cleanText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeTopicId(
  value: string
): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueTopicIds(
  values: readonly string[]
): readonly string[] {
  const seen =
    new Set<string>();

  const result:
    string[] =
    [];

  for (const value of values) {
    const normalized =
      normalizeTopicId(
        value
      );

    if (
      normalized.length === 0 ||
      seen.has(normalized)
    ) {
      continue;
    }

    seen.add(
      normalized
    );

    result.push(
      normalized
    );

    if (result.length >= 12) {
      break;
    }
  }

  return result;
}

function uniqueTextValues(
  values: readonly string[]
): readonly string[] {
  const seen =
    new Set<string>();

  const result:
    string[] =
    [];

  for (const value of values) {
    const cleaned =
      cleanText(
        value
      );

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

    if (result.length >= 12) {
      break;
    }
  }

  return result;
}

function createAiRequest(
  item: PosterBrainNormalizedContentItem
): PosterBrainAiClassificationRequest {
  const excerpt =
    cleanText(
      item.excerpt
    );

  const categories =
    uniqueTextValues(
      item.tags
    );

  return {
    sourceKey:
      item.sourceKey,

    url:
      item.originalUrl,

    title:
      item.title,

    publishedAt:
      item.publishedAt,

    ...(excerpt.length === 0
      ? {}
      : {
          excerpt,
        }),

    ...(categories.length === 0
      ? {}
      : {
          categories,
        }),
  };
}

function createPersistenceClassification(input: {
  readonly item:
    PosterBrainNormalizedContentItem;

  readonly baseline:
    PosterBrainContentClassificationResult;

  readonly ai:
    PosterBrainAiClassification;
}): PosterBrainContentPersistenceClassificationInput {
  const aiCategory =
    cleanText(
      input.ai.primaryCategory
    );

  const category =
    aiCategory.length > 0
      ? aiCategory
      : input.baseline.category;

  const evolvingTopicIds =
    uniqueTopicIds([
      ...input.baseline.evolvingTopicIds,
      input.ai.primaryCategory,
      ...input.ai.topics,
    ]);

  const topics =
    uniqueTextValues([
      input.ai.primaryCategory,
      ...input.ai.topics,
    ]);

  const provider =
    cleanText(
      input.ai.provider
    ) || "unknown";

  const classifiedAt =
    cleanText(
      input.ai.classifiedAt
    );

  const model =
    input.ai.model === undefined
      ? undefined
      : cleanText(
          input.ai.model
        ) || undefined;

  const baselineMetadata = {
    ...input.baseline.aiClassification,
  };

  delete baselineMetadata.provider;
  delete baselineMetadata.version;
  delete baselineMetadata.model;

  return {
    externalContentId:
      input.item.externalContentId,

    category,

    canonicalTopicIds:
      input.baseline.canonicalTopicIds,

    evolvingTopicIds,

    qualityScore:
      input.baseline.qualityScore,

    aiClassification: {
      ...baselineMetadata,

      provider,

      status:
        "classified",

      category,

      canonicalTopicIds:
        input.baseline.canonicalTopicIds,

      evolvingTopicIds,

      topics,

      qualityScore:
        input.baseline.qualityScore,

      safetyStatus:
        input.baseline.safetyStatus,

      confidence:
        input.ai.confidence,

      classifiedAt,

      ...(model === undefined
        ? {}
        : {
            model,
            version:
              model,
          }),
    },
  };
}

export function createPosterBrainAiClassifiedFeedIngestionRunner(
  dependencies:
    PosterBrainAiClassifiedFeedIngestionRunnerDependencies
): PosterBrainClassifiedFeedIngestionRunner {
  const rssIngestionService =
    dependencies.rssIngestionService ??
    createPosterBrainRssIngestionService();

  const contentIngestionService =
    dependencies.contentIngestionService ??
    createPosterBrainContentIngestionService();

  const contentClassificationService =
    dependencies.contentClassificationService ??
    createPosterBrainContentClassificationService();

  return {
    async ingestClassifiedFeed(input) {
      const normalized =
        rssIngestionService.parseFeedXml({
          source:
            input.source,

          xml:
            input.feedXml,
        });

      const classifications =
        await Promise.all(
          normalized.accepted.map(
            async item => {
              const baseline =
                contentClassificationService.classifyItem({
                  item,
                });

              const ai =
                await dependencies
                  .aiClassificationProvider
                  .classifyContent(
                    createAiRequest(
                      item
                    )
                  );

              return createPersistenceClassification({
                item,
                baseline,
                ai,
              });
            }
          )
        );

      const persistencePlan =
        contentIngestionService.createPersistencePlan({
          source:
            input.source,

          items:
            normalized.accepted,

          discoveredAt:
            input.discoveredAt,

          classifications,
        });

      const persistence =
        await dependencies
          .contentPersistenceRepository
          .persistPlan(
            persistencePlan
          );

      return {
        acceptedCount:
          normalized.accepted.length,

        rejectedCount:
          normalized.rejected.length,

        persistedCount:
          persistence.persistedContentCount,

        persistencePlan,
      };
    },
  };
}