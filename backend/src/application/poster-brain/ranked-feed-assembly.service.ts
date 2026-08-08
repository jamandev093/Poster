import {
  mapPosterBrainDiscoveryContentRowsToRankingCandidates,
  rankPosterBrainCandidates,
  type PosterBrainCandidateScore,
  type PosterBrainDiscoveryContentRankingRow,
  type PosterBrainRankingPolicy,
  type PosterBrainRankingSurface,
  type PosterBrainUserInterestProfile,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRankedFeedAssemblyService {
  assembleRankedFeed(input: {
    readonly rows: readonly PosterBrainDiscoveryContentRankingRow[];
    readonly surface: PosterBrainRankingSurface;
    readonly policy: PosterBrainRankingPolicy;
    readonly userProfile: PosterBrainUserInterestProfile | null;
    readonly limit: number;
  }): readonly PosterBrainCandidateScore[];
}

export function assemblePosterBrainRankedFeed(input: {
  readonly rows: readonly PosterBrainDiscoveryContentRankingRow[];
  readonly surface: PosterBrainRankingSurface;
  readonly policy: PosterBrainRankingPolicy;
  readonly userProfile: PosterBrainUserInterestProfile | null;
  readonly limit: number;
}): readonly PosterBrainCandidateScore[] {
  const candidates =
    mapPosterBrainDiscoveryContentRowsToRankingCandidates(
      input.rows
    );

  return rankPosterBrainCandidates({
    candidates,
    surface:
      input.surface,
    policy:
      input.policy,
    userProfile:
      input.userProfile,
    limit:
      input.limit,
  });
}

export function createPosterBrainRankedFeedAssemblyService():
  PosterBrainRankedFeedAssemblyService {
  return {
    assembleRankedFeed(input) {
      return assemblePosterBrainRankedFeed(input);
    },
  };
}