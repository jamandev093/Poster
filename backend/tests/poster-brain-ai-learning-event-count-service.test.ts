import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiLearningEventCountService,
} from "../src/application/poster-brain/ai-learning-event-count.service.js";

import type {
  PosterBrainAiLearningEventCountRepository,
} from "../src/application/poster-brain/ai-learning-event-count.repository.js";

import type {
  PosterBrainAiLearningPolicy,
} from "../src/application/poster-brain/ai-learning-policy.service.js";

function createRepository(
  observedEventCount: number
): PosterBrainAiLearningEventCountRepository {
  return {
    async getSnapshot() {
      return {
        organicContentEvents: observedEventCount,
        shareEvents: 0,
        reportEvents: 0,
        bookmarkEvents: 0,
        articleInteractions: 0,
        articleFeedback: 0,
        observedEventCount,
      };
    },
  };
}

function createPolicy(
  autoLearningEnabled: boolean
): PosterBrainAiLearningPolicy {
  return {
    autoLearningEnabled,
    trainingMinEvents: 10000,

    canStartTraining(
      observedEventCount: number
    ): boolean {
      return (
        autoLearningEnabled &&
        observedEventCount >= 10000
      );
    },
  } as PosterBrainAiLearningPolicy;
}

describe(
  "Poster Brain AI learning event count service",
  () => {
    it(
      "remains collecting below 10000 real events",
      async () => {
        const service =
          createPosterBrainAiLearningEventCountService(
            createRepository(9999),
            createPolicy(true)
          );

        const result =
          await service.getReadiness();

        expect(result.status).toBe("collecting");
        expect(result.trainingMinEvents).toBe(10000);
        expect(result.remainingEventCount).toBe(1);
        expect(result.canStartTraining).toBe(false);
        expect(result.snapshot.observedEventCount).toBe(9999);
      }
    );

    it(
      "becomes ready at 10000 real events",
      async () => {
        const service =
          createPosterBrainAiLearningEventCountService(
            createRepository(10000),
            createPolicy(true)
          );

        const result =
          await service.getReadiness();

        expect(result.status).toBe("ready");
        expect(result.trainingMinEvents).toBe(10000);
        expect(result.remainingEventCount).toBe(0);
        expect(result.canStartTraining).toBe(true);
        expect(result.snapshot.observedEventCount).toBe(10000);
      }
    );

    it(
      "stays disabled even when enough events exist",
      async () => {
        const service =
          createPosterBrainAiLearningEventCountService(
            createRepository(50000),
            createPolicy(false)
          );

        const result =
          await service.getReadiness();

        expect(result.status).toBe("disabled");
        expect(result.remainingEventCount).toBe(0);
        expect(result.canStartTraining).toBe(false);
        expect(result.snapshot.observedEventCount).toBe(50000);
      }
    );
  }
);