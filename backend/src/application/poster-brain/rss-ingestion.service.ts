import {
  normalizePosterBrainRssItems,
  type PosterBrainRssNormalizationResult,
  type PosterBrainRssSource,
  type PosterBrainRawRssItem,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRssIngestionService {
  normalizeFeed(input: {
    readonly source: PosterBrainRssSource;
    readonly items: readonly PosterBrainRawRssItem[];
  }): PosterBrainRssNormalizationResult;
}

export function createPosterBrainRssIngestionService():
  PosterBrainRssIngestionService {
  return {
    normalizeFeed(input) {
      return normalizePosterBrainRssItems(input);
    },
  };
}
