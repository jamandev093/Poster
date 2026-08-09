import type {
  PosterBrainAiLearningEventCountRepository,
  PosterBrainAiLearningEventCountSnapshot,
} from "./ai-learning-event-count.repository.js";

import type {
  PosterBrainAiLearningPolicy,
} from "./ai-learning-policy.service.js";

export type PosterBrainAiLearningReadinessStatus =
  | "disabled"
  | "collecting"
  | "ready";

export interface PosterBrainAiLearningReadiness {
  readonly status:
    PosterBrainAiLearningReadinessStatus;

  readonly snapshot:
    PosterBrainAiLearningEventCountSnapshot;

  readonly trainingMinEvents:
    number;

  readonly remainingEventCount:
    number;

  readonly canStartTraining:
    boolean;
}

export interface PosterBrainAiLearningEventCountService {
  getReadiness():
    Promise<PosterBrainAiLearningReadiness>;
}

export class DefaultPosterBrainAiLearningEventCountService
  implements PosterBrainAiLearningEventCountService
{
  constructor(
    private readonly repository:
      PosterBrainAiLearningEventCountRepository,

    private readonly policy:
      PosterBrainAiLearningPolicy
  ) {}

  async getReadiness():
    Promise<PosterBrainAiLearningReadiness> {
    const snapshot =
      await this.repository.getSnapshot();

    const canStartTraining =
      this.policy.canStartTraining(
        snapshot.observedEventCount
      );

    const remainingEventCount =
      Math.max(
        this.policy.trainingMinEvents -
          snapshot.observedEventCount,
        0
      );

    const status:
      PosterBrainAiLearningReadinessStatus =
      !this.policy.autoLearningEnabled
        ? "disabled"
        : canStartTraining
          ? "ready"
          : "collecting";

    return {
      status,
      snapshot,
      trainingMinEvents:
        this.policy.trainingMinEvents,
      remainingEventCount,
      canStartTraining,
    };
  }
}

export function createPosterBrainAiLearningEventCountService(
  repository:
    PosterBrainAiLearningEventCountRepository,

  policy:
    PosterBrainAiLearningPolicy
): PosterBrainAiLearningEventCountService {
  return new DefaultPosterBrainAiLearningEventCountService(
    repository,
    policy
  );
}