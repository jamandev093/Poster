import {
  normalizePosterBrainRssItems,
  parsePosterBrainRssXml,
  type PosterBrainRssNormalizationResult,
  type PosterBrainRssSource,
  type PosterBrainRawRssItem,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRssIngestionService {
  normalizeFeed(input: {
    readonly source: PosterBrainRssSource;
    readonly items: readonly PosterBrainRawRssItem[];
  }): PosterBrainRssNormalizationResult;

  parseFeedXml(input: {
    readonly source: PosterBrainRssSource;
    readonly xml: string;
  }): PosterBrainRssNormalizationResult;
}

export function createPosterBrainRssIngestionService():
  PosterBrainRssIngestionService {
  return {
    normalizeFeed(input) {
      return normalizePosterBrainRssItems(input);
    },

    parseFeedXml(input) {
      return normalizePosterBrainRssItems({
        source: input.source,
        items: parsePosterBrainRssXml(input.xml),
      });
    },
  };
}
