import type {
  AdvertisingAiTrainingCandidateModel,
} from "./advertising-ai-training-handoff.service.js";

export type AdvertisingAiModelStatus =
  | "candidate"
  | "promoted"
  | "rejected"
  | "retired";

export type AdvertisingAiEvaluationDecision =
  | "pass"
  | "fail";

export interface AdvertisingAiStoredModel {
  readonly id:
    string;

  readonly modelId:
    string;

  readonly modelType:
    "hashed_logistic_ad_response_v1";

  readonly trainingEngineVersion:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    256;

  readonly datasetId:
    string;

  readonly datasetChecksum:
    string;

  readonly modelChecksum:
    string;

  readonly status:
    AdvertisingAiModelStatus;

  readonly trainedAt:
    string;

  readonly materializedEventCount:
    number;

  readonly labeledEventCount:
    number;

  readonly trainingEventCount:
    number;

  readonly trainingPositiveCount:
    number;

  readonly trainingNegativeCount:
    number;

  readonly intercept:
    number;

  readonly weights:
    readonly number[];

  readonly validationEventCount:
    number;

  readonly validationPositiveCount:
    number;

  readonly validationNegativeCount:
    number;

  readonly validationAccuracy:
    number;

  readonly validationLogLoss:
    number;

  readonly validationRocAuc:
    number |
    null;

  readonly rejectionReason:
    string |
    null;

  readonly createdAt:
    string;

  readonly promotedAt:
    string |
    null;

  readonly rejectedAt:
    string |
    null;

  readonly retiredAt:
    string |
    null;
}

export interface AdvertisingAiStoredEvaluation {
  readonly id:
    string;

  readonly candidateModelId:
    string;

  readonly incumbentModelId:
    string |
    null;

  readonly decision:
    AdvertisingAiEvaluationDecision;

  readonly reason:
    string;

  readonly baselineLogLoss:
    number;

  readonly candidateLogLoss:
    number;

  readonly candidateRocAuc:
    number |
    null;

  readonly candidateAccuracy:
    number;

  readonly validationEventCount:
    number;

  readonly validationPositiveCount:
    number;

  readonly validationNegativeCount:
    number;

  readonly evaluatedAt:
    string;
}

export interface AdvertisingAiCandidateRegistrationInput {
  readonly candidate:
    AdvertisingAiTrainingCandidateModel;
}

export interface AdvertisingAiCandidateEvaluationResult {
  readonly decision:
    AdvertisingAiEvaluationDecision;

  readonly reason:
    string;

  readonly baselineLogLoss:
    number;

  readonly candidateLogLoss:
    number;

  readonly candidateRocAuc:
    number |
    null;

  readonly candidateAccuracy:
    number;

  readonly validationEventCount:
    number;

  readonly validationPositiveCount:
    number;

  readonly validationNegativeCount:
    number;
}