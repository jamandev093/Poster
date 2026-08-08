import {
  classifyPosterBrainContentItem,
  createPosterBrainContentPersistencePlan,
  type PosterBrainContentClassificationResult,
  type PosterBrainContentPersistenceClassificationInput,
  type PosterBrainContentPersistencePlan,
  type PosterBrainNormalizedContentItem,
  type PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainContentIngestionService {
  createPersistencePlan(input: {
    readonly source: PosterBrainRssSource;
    readonly items: readonly PosterBrainNormalizedContentItem[];
    readonly discoveredAt: string;
    readonly classifications?: readonly PosterBrainContentPersistenceClassificationInput[];
  }): PosterBrainContentPersistencePlan;

  createClassifiedPersistencePlan(input: {
    readonly source: PosterBrainRssSource;
    readonly items: readonly PosterBrainNormalizedContentItem[];
    readonly discoveredAt: string;
  }): PosterBrainContentPersistencePlan;
}

function toPersistenceClassification(input: {
  readonly item: PosterBrainNormalizedContentItem;
  readonly classification: PosterBrainContentClassificationResult;
}): PosterBrainContentPersistenceClassificationInput {
  return {
    externalContentId: input.item.externalContentId,
    category: input.classification.category,
    canonicalTopicIds: input.classification.canonicalTopicIds,
    evolvingTopicIds: input.classification.evolvingTopicIds,
    qualityScore: input.classification.qualityScore,
    aiClassification: input.classification.aiClassification,
  };
}

export function createPosterBrainContentIngestionService():
  PosterBrainContentIngestionService {
  return {
    createPersistencePlan(input) {
      return createPosterBrainContentPersistencePlan(input);
    },

    createClassifiedPersistencePlan(input) {
      const classifications =
        input.items.map(item =>
          toPersistenceClassification({
            item,
            classification:
              classifyPosterBrainContentItem({
                item,
              }),
          })
        );

      return createPosterBrainContentPersistencePlan({
        source: input.source,
        items: input.items,
        discoveredAt: input.discoveredAt,
        classifications,
      });
    },
  };
}