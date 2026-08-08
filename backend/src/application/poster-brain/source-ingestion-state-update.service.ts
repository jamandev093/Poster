import type {
  PosterBrainSourceIngestionOutcome,
  PosterBrainSourceIngestionOutcomeHealth,
} from "./source-ingestion-outcome.service.js";

export interface PosterBrainSourceIngestionStateUpdate {
  readonly sourceKey: string;
  readonly health: PosterBrainSourceIngestionOutcomeHealth;
  readonly failureCount: number;
  readonly nextEligibleAt: string;
  readonly lastSucceededAt: string | null;
  readonly lastFailedAt: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly lastAcceptedCount: number;
  readonly lastRejectedCount: number;
  readonly lastPersistedCount: number;
  readonly updatedAt: string;
}

export interface PosterBrainSourceIngestionStateUpdateInput {
  readonly outcomes: readonly PosterBrainSourceIngestionOutcome[];
  readonly updatedAt: string;
}

export interface PosterBrainSourceIngestionStateUpdateService {
  createStateUpdates(
    input: PosterBrainSourceIngestionStateUpdateInput
  ): readonly PosterBrainSourceIngestionStateUpdate[];
}

export function createPosterBrainSourceIngestionStateUpdates(
  input: PosterBrainSourceIngestionStateUpdateInput
): readonly PosterBrainSourceIngestionStateUpdate[] {
  return input.outcomes.map(outcome => ({
    sourceKey:
      outcome.sourceKey,
    health:
      outcome.health,
    failureCount:
      outcome.failureCount,
    nextEligibleAt:
      outcome.nextEligibleAt,
    lastSucceededAt:
      outcome.lastSucceededAt,
    lastFailedAt:
      outcome.lastFailedAt,
    lastErrorCode:
      outcome.errorCode,
    lastErrorMessage:
      outcome.errorMessage,
    lastAcceptedCount:
      outcome.acceptedCount,
    lastRejectedCount:
      outcome.rejectedCount,
    lastPersistedCount:
      outcome.persistedCount,
    updatedAt:
      input.updatedAt,
  }));
}

export function createPosterBrainSourceIngestionStateUpdateService():
  PosterBrainSourceIngestionStateUpdateService {
  return {
    createStateUpdates(input) {
      return createPosterBrainSourceIngestionStateUpdates(input);
    },
  };
}