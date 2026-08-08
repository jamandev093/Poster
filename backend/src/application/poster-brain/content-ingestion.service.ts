import {
  createPosterBrainContentPersistencePlan,
  type PosterBrainContentPersistencePlan,
  type PosterBrainNormalizedContentItem,
  type PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainContentIngestionService {
  createPersistencePlan(input: {
    readonly source: PosterBrainRssSource;
    readonly items: readonly PosterBrainNormalizedContentItem[];
    readonly discoveredAt: string;
  }): PosterBrainContentPersistencePlan;
}

export function createPosterBrainContentIngestionService():
  PosterBrainContentIngestionService {
  return {
    createPersistencePlan(input) {
      return createPosterBrainContentPersistencePlan(input);
    },
  };
}