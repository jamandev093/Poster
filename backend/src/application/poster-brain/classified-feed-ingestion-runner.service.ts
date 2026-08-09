import type {
  PosterBrainClassifiedFeedIngestionRunner,
} from "./source-feed-job-executor.service.js";

import type {
  PosterBrainFeedIngestionService,
} from "./feed-ingestion-orchestrator.service.js";

export interface PosterBrainClassifiedFeedIngestionRunnerDependencies {
  readonly feedIngestionService: PosterBrainFeedIngestionService;
}

export function createPosterBrainClassifiedFeedIngestionRunner(
  dependencies: PosterBrainClassifiedFeedIngestionRunnerDependencies
): PosterBrainClassifiedFeedIngestionRunner {
  return {
    async ingestClassifiedFeed(input) {
      const result =
        await dependencies
          .feedIngestionService
          .ingestFeedXml({
            source:
              input.source,

            xml:
              input.feedXml,

            discoveredAt:
              input.discoveredAt,
          });

      return {
        acceptedCount:
          result.acceptedCount,

        rejectedCount:
          result.rejectedCount,

        persistedCount:
          result.persistence.persistedContentCount,

        persistencePlan:
          null,
      };
    },
  };
}