import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_DEFAULT_TRAINING_MIN_EVENTS,
  createPosterBrainAiLearningPolicy,
  createPosterBrainAiLearningPolicyFromRuntimeEnv,
} from "../src/application/poster-brain/ai-learning-policy.service.js";

describe(
  "Poster Brain AI learning policy",
  () => {
    it(
      "arms auto-learning by default with a 10000-event training threshold and evaluation-gated promotion",
      () => {
        const policy =
          createPosterBrainAiLearningPolicy();

        expect(
          policy.autoLearningEnabled
        ).toBe(
          true
        );

        expect(
          policy.activationState
        ).toBe(
          "armed"
        );

        expect(
          policy.trainingMinEvents
        ).toBe(
          POSTER_BRAIN_DEFAULT_TRAINING_MIN_EVENTS
        );

        expect(
          policy.modelPromotionRequiresEvalPass
        ).toBe(
          true
        );

        expect(
          policy.canStartTraining(
            9999
          )
        ).toBe(
          false
        );

        expect(
          policy.canStartTraining(
            10000
          )
        ).toBe(
          true
        );

        expect(
          policy.canPromoteModel(
            false
          )
        ).toBe(
          false
        );

        expect(
          policy.canPromoteModel(
            true
          )
        ).toBe(
          true
        );
      }
    );

    it(
      "allows v1 runtime env to explicitly keep auto-learning enabled",
      () => {
        const policy =
          createPosterBrainAiLearningPolicy({
            AUTO_LEARNING_ENABLED:
              "true",

            TRAINING_MIN_EVENTS:
              "25000",

            MODEL_PROMOTION_REQUIRES_EVAL_PASS:
              "true",
          });

        expect(
          policy.activationState
        ).toBe(
          "armed"
        );

        expect(
          policy.trainingMinEvents
        ).toBe(
          25000
        );

        expect(
          policy.minimumEventThresholdMet(
            24999
          )
        ).toBe(
          false
        );

        expect(
          policy.minimumEventThresholdMet(
            25000
          )
        ).toBe(
          true
        );
      }
    );

    it(
      "does not allow the training threshold to be configured below 10000",
      () => {
        const policy =
          createPosterBrainAiLearningPolicy({
            TRAINING_MIN_EVENTS:
              "25",
          });

        expect(
          policy.trainingMinEvents
        ).toBe(
          10000
        );

        expect(
          policy.canStartTraining(
            9999
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "can disable auto-learning while still preserving threshold and promotion policy",
      () => {
        const policy =
          createPosterBrainAiLearningPolicy({
            AUTO_LEARNING_ENABLED:
              "false",

            TRAINING_MIN_EVENTS:
              "10000",

            MODEL_PROMOTION_REQUIRES_EVAL_PASS:
              "true",
          });

        expect(
          policy.activationState
        ).toBe(
          "disabled"
        );

        expect(
          policy.minimumEventThresholdMet(
            10000
          )
        ).toBe(
          true
        );

        expect(
          policy.canStartTraining(
            10000
          )
        ).toBe(
          false
        );

        expect(
          policy.canPromoteModel(
            false
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "supports runtime environment records used by backend process env",
      () => {
        const policy =
          createPosterBrainAiLearningPolicyFromRuntimeEnv({
            AUTO_LEARNING_ENABLED:
              "yes",

            TRAINING_MIN_EVENTS:
              "12000",

            MODEL_PROMOTION_REQUIRES_EVAL_PASS:
              "on",
          });

        expect(
          policy.autoLearningEnabled
        ).toBe(
          true
        );

        expect(
          policy.trainingMinEvents
        ).toBe(
          12000
        );

        expect(
          policy.canStartTraining(
            11999
          )
        ).toBe(
          false
        );

        expect(
          policy.canStartTraining(
            12000
          )
        ).toBe(
          true
        );
      }
    );

    it(
      "falls back safely for invalid runtime values",
      () => {
        const policy =
          createPosterBrainAiLearningPolicy({
            AUTO_LEARNING_ENABLED:
              "maybe",

            TRAINING_MIN_EVENTS:
              "not-a-number",

            MODEL_PROMOTION_REQUIRES_EVAL_PASS:
              "unknown",
          });

        expect(
          policy.autoLearningEnabled
        ).toBe(
          true
        );

        expect(
          policy.trainingMinEvents
        ).toBe(
          10000
        );

        expect(
          policy.modelPromotionRequiresEvalPass
        ).toBe(
          true
        );
      }
    );
  }
);
