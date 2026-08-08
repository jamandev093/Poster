import {
  createPosterBrainContentIngestionService,
  type PosterBrainContentIngestionService,
} from "./content-ingestion.service.js";

import {
  type PosterBrainContentPersistenceRepository,
  type PosterBrainContentPersistenceRepositoryResult,
} from "./content-persistence.repository.js";

import {
  createPosterBrainRssIngestionService,
  type PosterBrainRssIngestionService,
} from "./rss-ingestion.service.js";

import type {
  PosterBrainContentPersistencePlan,
  PosterBrainRejectedRssItem,
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainFeedIngestionResult {
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly rejected: readonly PosterBrainRejectedRssItem[];
  readonly persistencePlan: PosterBrainContentPersistencePlan;
  readonly persistence: PosterBrainContentPersistenceRepositoryResult;
}

export interface PosterBrainFeedIngestionService {
  ingestFeedXml(input: {
    readonly source: PosterBrainRssSource;
    readonly xml: string;
    readonly discoveredAt: string;
  }): Promise<PosterBrainFeedIngestionResult>;
}

export interface PosterBrainFeedIngestionServiceDependencies {
  readonly contentPersistenceRepository:
    PosterBrainContentPersistenceRepository;
  readonly rssIngestionService?:
    PosterBrainRssIngestionService;
  readonly contentIngestionService?:
    PosterBrainContentIngestionService;
}

export function createPosterBrainFeedIngestionService(
  dependencies: PosterBrainFeedIngestionServiceDependencies
): PosterBrainFeedIngestionService {
  const rssIngestionService =
    dependencies.rssIngestionService ??
    createPosterBrainRssIngestionService();

  const contentIngestionService =
    dependencies.contentIngestionService ??
    createPosterBrainContentIngestionService();

  return {
    async ingestFeedXml(input) {
      const normalized =
        rssIngestionService.parseFeedXml({
          source:
            input.source,
          xml:
            input.xml,
        });

      const persistencePlan =
        contentIngestionService.createPersistencePlan({
          source:
            input.source,
          items:
            normalized.accepted,
          discoveredAt:
            input.discoveredAt,
        });

      const persistence =
        await dependencies
          .contentPersistenceRepository
          .persistPlan(persistencePlan);

      return {
        acceptedCount:
          normalized.accepted.length,
        rejectedCount:
          normalized.rejected.length,
        rejected:
          normalized.rejected,
        persistencePlan,
        persistence,
      };
    },
  };
}