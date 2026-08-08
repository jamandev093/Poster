import {
  createPosterBrainRankedFeedAssemblyService,
  type PosterBrainRankedFeedAssemblyService,
} from "./ranked-feed-assembly.service.js";

import type {
  PosterBrainRankedDiscoveryQueryInput,
  PosterBrainRankedDiscoveryQueryRepository,
} from "./ranked-discovery-query.repository.js";

import type {
  PosterBrainCandidateScore,
  PosterBrainRankingPolicy,
  PosterBrainRankingSurface,
  PosterBrainUserInterestProfile,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRankedFeedReadInput {
  readonly surface: PosterBrainRankingSurface;
  readonly policy: PosterBrainRankingPolicy;
  readonly userProfile: PosterBrainUserInterestProfile | null;
  readonly limit: number;
  readonly offset?: number;
  readonly candidatePoolLimit?: number;
  readonly searchQuery?: string | null;
  readonly languageCode?: string | null;
  readonly regionCode?: string | null;
  readonly category?: string | null;
}

export interface PosterBrainRankedFeedReadResult {
  readonly surface: PosterBrainRankingSurface;
  readonly totalCandidateRows: number;
  readonly rankedCount: number;
  readonly scores: readonly PosterBrainCandidateScore[];
}

export interface PosterBrainRankedFeedReadService {
  readRankedFeed(
    input: PosterBrainRankedFeedReadInput
  ): Promise<PosterBrainRankedFeedReadResult>;
}

export interface PosterBrainRankedFeedReadServiceDependencies {
  readonly rankedDiscoveryQueryRepository:
    PosterBrainRankedDiscoveryQueryRepository;
  readonly rankedFeedAssemblyService?:
    PosterBrainRankedFeedAssemblyService;
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.floor(value)));
}

function createCandidatePoolLimit(input: {
  readonly limit: number;
  readonly candidatePoolLimit?: number;
}): number {
  if (
    input.candidatePoolLimit !== undefined &&
    Number.isFinite(input.candidatePoolLimit)
  ) {
    return Math.max(
      input.limit,
      Math.min(200, Math.floor(input.candidatePoolLimit))
    );
  }

  return Math.min(200, Math.max(input.limit, input.limit * 3));
}

function createRepositoryQuery(
  input: PosterBrainRankedFeedReadInput
): PosterBrainRankedDiscoveryQueryInput {
  const limit =
    normalizeLimit(input.limit);

  const poolLimit =
    input.candidatePoolLimit === undefined
      ? createCandidatePoolLimit({
          limit,
        })
      : createCandidatePoolLimit({
          limit,
          candidatePoolLimit:
            input.candidatePoolLimit,
        });

  const query: {
    surface: PosterBrainRankingSurface;
    limit: number;
    offset?: number;
    searchQuery?: string | null;
    languageCode?: string | null;
    regionCode?: string | null;
    category?: string | null;
  } = {
    surface:
      input.surface,
    limit:
      poolLimit,
  };

  if (input.offset !== undefined) {
    query.offset =
      input.offset;
  }

  if (input.searchQuery !== undefined) {
    query.searchQuery =
      input.searchQuery;
  }

  if (input.languageCode !== undefined) {
    query.languageCode =
      input.languageCode;
  }

  if (input.regionCode !== undefined) {
    query.regionCode =
      input.regionCode;
  }

  if (input.category !== undefined) {
    query.category =
      input.category;
  }

  return query;
}

export function createPosterBrainRankedFeedReadService(
  dependencies: PosterBrainRankedFeedReadServiceDependencies
): PosterBrainRankedFeedReadService {
  const rankedFeedAssemblyService =
    dependencies.rankedFeedAssemblyService ??
    createPosterBrainRankedFeedAssemblyService();

  return {
    async readRankedFeed(input) {
      const limit =
        normalizeLimit(input.limit);

      const rows =
        await dependencies
          .rankedDiscoveryQueryRepository
          .listRankingRows(
            createRepositoryQuery(input)
          );

      const scores =
        rankedFeedAssemblyService.assembleRankedFeed({
          rows,
          surface:
            input.surface,
          policy:
            input.policy,
          userProfile:
            input.userProfile,
          limit,
        });

      return {
        surface:
          input.surface,
        totalCandidateRows:
          rows.length,
        rankedCount:
          scores.length,
        scores,
      };
    },
  };
}