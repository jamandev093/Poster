import {
  createPosterBrainSourceIngestionPlan,
  evaluatePosterBrainSourceForIngestion,
  type PosterBrainIngestionCandidateSource,
  type PosterBrainSourceIngestionDecision,
  type PosterBrainSourceIngestionPlan,
  type PosterBrainSourceIngestionPlannerPolicy,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainSourceIngestionPlannerService {
  evaluateSource(input: {
    readonly source: PosterBrainIngestionCandidateSource;
    readonly policy: PosterBrainSourceIngestionPlannerPolicy;
  }): PosterBrainSourceIngestionDecision;

  createPlan(input: {
    readonly sources: readonly PosterBrainIngestionCandidateSource[];
    readonly policy: PosterBrainSourceIngestionPlannerPolicy;
  }): PosterBrainSourceIngestionPlan;
}

export function createPosterBrainSourceIngestionPlannerService():
  PosterBrainSourceIngestionPlannerService {
  return {
    evaluateSource(input) {
      return evaluatePosterBrainSourceForIngestion(input);
    },

    createPlan(input) {
      return createPosterBrainSourceIngestionPlan(input);
    },
  };
}