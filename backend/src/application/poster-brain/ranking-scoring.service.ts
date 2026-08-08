import {
  rankPosterBrainCandidates,
  scorePosterBrainRankingCandidate,
  type PosterBrainCandidateScore,
  type PosterBrainRankingCandidate,
  type PosterBrainRankingPolicy,
  type PosterBrainRankingSurface,
  type PosterBrainUserInterestProfile,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRankingScoringService {
  scoreCandidate(input: {
    readonly candidate: PosterBrainRankingCandidate;
    readonly surface: PosterBrainRankingSurface;
    readonly policy: PosterBrainRankingPolicy;
    readonly userProfile: PosterBrainUserInterestProfile | null;
  }): PosterBrainCandidateScore;

  rankCandidates(input: {
    readonly candidates: readonly PosterBrainRankingCandidate[];
    readonly surface: PosterBrainRankingSurface;
    readonly policy: PosterBrainRankingPolicy;
    readonly userProfile: PosterBrainUserInterestProfile | null;
    readonly limit: number;
  }): readonly PosterBrainCandidateScore[];
}

export function createPosterBrainRankingScoringService():
  PosterBrainRankingScoringService {
  return {
    scoreCandidate(input) {
      return scorePosterBrainRankingCandidate(input);
    },

    rankCandidates(input) {
      return rankPosterBrainCandidates(input);
    },
  };
}