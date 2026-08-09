export type PosterBrainAiLearningActivationState =
  | "armed"
  | "disabled";

export interface PosterBrainAiLearningPolicyEnvironment {
  readonly AUTO_LEARNING_ENABLED?: string;
  readonly TRAINING_MIN_EVENTS?: string;
  readonly MODEL_PROMOTION_REQUIRES_EVAL_PASS?: string;
}

export interface PosterBrainAiLearningPolicy {
  readonly autoLearningEnabled: boolean;
  readonly trainingMinEvents: number;
  readonly modelPromotionRequiresEvalPass: boolean;
  readonly activationState: PosterBrainAiLearningActivationState;
  readonly minimumEventThresholdMet: (
    observedEventCount: number
  ) => boolean;
  readonly canStartTraining: (
    observedEventCount: number
  ) => boolean;
  readonly canPromoteModel: (
    evaluationPassed: boolean
  ) => boolean;
}

export const POSTER_BRAIN_DEFAULT_TRAINING_MIN_EVENTS =
  10000;

export const POSTER_BRAIN_MINIMUM_TRAINING_MIN_EVENTS =
  10000;

function normalizeOptionalText(
  value:
    | string
    | undefined
): string | null {
  if (value === undefined) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return normalized.length > 0
    ? normalized
    : null;
}

function readBoolean(
  value:
    | string
    | undefined,
  defaultValue: boolean
): boolean {
  const normalized =
    normalizeOptionalText(
      value
    );

  if (normalized === null) {
    return defaultValue;
  }

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "on"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }

  return defaultValue;
}

function readTrainingMinEvents(
  value:
    | string
    | undefined
): number {
  const normalized =
    normalizeOptionalText(
      value
    );

  if (normalized === null) {
    return POSTER_BRAIN_DEFAULT_TRAINING_MIN_EVENTS;
  }

  const parsed =
    Number.parseInt(
      normalized,
      10
    );

  if (!Number.isFinite(parsed)) {
    return POSTER_BRAIN_DEFAULT_TRAINING_MIN_EVENTS;
  }

  return Math.max(
    Math.trunc(parsed),
    POSTER_BRAIN_MINIMUM_TRAINING_MIN_EVENTS
  );
}

function hasMetThreshold(
  observedEventCount: number,
  threshold: number
): boolean {
  if (!Number.isFinite(observedEventCount)) {
    return false;
  }

  return Math.trunc(observedEventCount) >=
    threshold;
}

export function createPosterBrainAiLearningPolicy(
  environment:
    PosterBrainAiLearningPolicyEnvironment =
    {}
): PosterBrainAiLearningPolicy {
  const autoLearningEnabled =
    readBoolean(
      environment.AUTO_LEARNING_ENABLED,
      true
    );

  const trainingMinEvents =
    readTrainingMinEvents(
      environment.TRAINING_MIN_EVENTS
    );

  const modelPromotionRequiresEvalPass =
    readBoolean(
      environment.MODEL_PROMOTION_REQUIRES_EVAL_PASS,
      true
    );

  const activationState:
    PosterBrainAiLearningActivationState =
    autoLearningEnabled
      ? "armed"
      : "disabled";

  return {
    autoLearningEnabled,

    trainingMinEvents,

    modelPromotionRequiresEvalPass,

    activationState,

    minimumEventThresholdMet(observedEventCount) {
      return hasMetThreshold(
        observedEventCount,
        trainingMinEvents
      );
    },

    canStartTraining(observedEventCount) {
      return autoLearningEnabled &&
        hasMetThreshold(
          observedEventCount,
          trainingMinEvents
        );
    },

    canPromoteModel(evaluationPassed) {
      if (!modelPromotionRequiresEvalPass) {
        return true;
      }

      return activationState,

    minimumEventThresholdMet(observedEventCount) {
      return hasMetThreshold(
        observedEventCount,
        trainingMinEvents
      );
    },

    canStartTraining(observedEventCount) {
      return autoLearningEnabled &&
        hasMetThreshold(
          observedEventCount,
          trainingMinEvents
        );
    },

    canPromoteModel(evaluationPassed) {
      if (!modelPromotionRequiresEvalPass) {
        return true;
      }

      return evaluationPassed === true;
    },
  };
}

export function createPosterBrainAiLearningPolicyFromRuntimeEnv(
  environment:
    Readonly<Record<string, string | undefined>> =
    process.env
): PosterBrainAiLearningPolicy {
  return createPosterBrainAiLearningPolicy({
    AUTO_LEARNING_ENABLED:
      environment.AUTO_LEARNING_ENABLED,

    TRAINING_MIN_EVENTS:
      environment.TRAINING_MIN_EVENTS,

    MODEL_PROMOTION_REQUIRES_EVAL_PASS:
      environment.MODEL_PROMOTION_REQUIRES_EVAL_PASS,
  });
}
