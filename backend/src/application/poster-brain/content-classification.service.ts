import {
  classifyPosterBrainContentItem,
  type PosterBrainContentClassificationResult,
  type PosterBrainNormalizedContentItem,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainContentClassificationService {
  classifyItem(input: {
    readonly item: PosterBrainNormalizedContentItem;
  }): PosterBrainContentClassificationResult;
}

export function createPosterBrainContentClassificationService():
  PosterBrainContentClassificationService {
  return {
    classifyItem(input) {
      return classifyPosterBrainContentItem(input);
    },
  };
}