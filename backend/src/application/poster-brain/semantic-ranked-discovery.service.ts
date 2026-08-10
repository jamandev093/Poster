import {
  createPosterBrainRankedFeedAssemblyService,
  type PosterBrainRankedFeedAssemblyService,
} from "./ranked-feed-assembly.service.js";

import type {
  PosterBrainAiSemanticQueryService,
} from "./ai-semantic-query.service.js";

import type {
  PosterBrainContentEmbeddingRepository,
} from "./content-embedding.repository.js";

import type {
  PosterBrainRankedDiscoveryQueryRepository,
} from "./ranked-discovery-query.repository.js";

import type {
  PosterBrainCandidateScore,
  PosterBrainRankingPolicy,
  PosterBrainRankingSurface,
  PosterBrainUserInterestProfile,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainSemanticRankedDiscoveryInput {
  readonly query: string;
  readonly surface: PosterBrainRankingSurface;
  readonly policy: PosterBrainRankingPolicy;
  readonly userProfile:
    PosterBrainUserInterestProfile |
    null;
  readonly limit: number;
  readonly languageCode?: string | null;
  readonly regionCode?: string | null;
  readonly category?: string | null;
}

export interface PosterBrainSemanticRankedDiscoveryResult {
  readonly semanticAvailable: boolean;
  readonly semanticCandidateCount: number;
  readonly rankedCount: number;
  readonly scores:
    readonly PosterBrainCandidateScore[];
}

export interface PosterBrainSemanticRankedDiscoveryService {
  search(
    input:
      PosterBrainSemanticRankedDiscoveryInput
  ): Promise<
    PosterBrainSemanticRankedDiscoveryResult
  >;
}

export interface PosterBrainSemanticRankedDiscoveryDependencies {
  readonly semanticQueryService:
    PosterBrainAiSemanticQueryService;

  readonly embeddingRepository:
    PosterBrainContentEmbeddingRepository;

  readonly rankedDiscoveryQueryRepository:
    PosterBrainRankedDiscoveryQueryRepository;

  readonly rankedFeedAssemblyService?:
    PosterBrainRankedFeedAssemblyService;
}

function limit(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 20;
  }

  return Math.min(
    100,
    Math.max(
      1,
      Math.floor(value)
    )
  );
}

export function createPosterBrainSemanticRankedDiscoveryService(
  dependencies:
    PosterBrainSemanticRankedDiscoveryDependencies
): PosterBrainSemanticRankedDiscoveryService {
  const assembly =
    dependencies.rankedFeedAssemblyService ??
    createPosterBrainRankedFeedAssemblyService();

  return {
    async search(
      input
    ) {
      const query =
        input.query
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (!query) {
        throw new Error(
          "Poster Brain semantic search query cannot be empty."
        );
      }

      const resultLimit =
        limit(
          input.limit
        );

      const candidateLimit =
        Math.min(
          100,
          Math.max(
            resultLimit,
            resultLimit * 3
          )
        );

      const embedding =
        await dependencies
          .semanticQueryService
          .embedQuery(
            query
          );

      if (!embedding.available) {
        return {
          semanticAvailable:
            false,
          semanticCandidateCount:
            0,
          rankedCount:
            0,
          scores:
            [],
        };
      }

      const matches =
        await dependencies
          .embeddingRepository
          .findSimilarContent({
            providerName:
              embedding.provider,
            modelName:
              embedding.model,
            vector:
              embedding.vector,
            limit:
              candidateLimit,
          });

      const externalContentIds =
        [
          ...new Set(
            matches.map(
              match =>
                match.externalContentId
            )
          ),
        ];

      if (
        externalContentIds.length ===
        0
      ) {
        return {
          semanticAvailable:
            true,
          semanticCandidateCount:
            0,
          rankedCount:
            0,
          scores:
            [],
        };
      }

      const rankingQuery = {
        surface:
          input.surface,

        limit:
          candidateLimit,

        searchQuery:
          null,

        externalContentIds,

        ...(input.languageCode === undefined
          ? {}
          : {
              languageCode:
                input.languageCode,
            }),

        ...(input.regionCode === undefined
          ? {}
          : {
              regionCode:
                input.regionCode,
            }),

        ...(input.category === undefined
          ? {}
          : {
              category:
                input.category,
            }),
      };

      const rows =
        await dependencies
          .rankedDiscoveryQueryRepository
          .listRankingRows(
            rankingQuery
          );

      const scores =
        assembly.assembleRankedFeed({
          rows,
          surface:
            input.surface,
          policy:
            input.policy,
          userProfile:
            input.userProfile,
          limit:
            resultLimit,
        });

      return {
        semanticAvailable:
          true,
        semanticCandidateCount:
          externalContentIds.length,
        rankedCount:
          scores.length,
        scores,
      };
    },
  };
}