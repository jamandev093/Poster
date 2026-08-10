import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiModelEvaluationService,
  type AdvertisingAiStoredModel,
} from "../src/application/advertising-ai/index.js";

function candidate(
  overrides:
    Partial<
      AdvertisingAiStoredModel
    > = {}
):
  AdvertisingAiStoredModel {
  return {
    id:
      "00000000-0000-4000-8000-000000000901",

    modelId:
      "poster-ad-response-v1-test",

    modelType:
      "hashed_logistic_ad_response_v1",

    trainingEngineVersion:
      "hashed-logistic-ad-response-v1",

    featureVersion:
      "advertising-campaign-placement-v1",

    featureDimension:
      256,

    datasetId:
      "00000000-0000-4000-8000-000000000301",

    datasetChecksum:
      `sha256:${"a".repeat(64)}`,

    modelChecksum:
      `sha256:${"b".repeat(64)}`,

    status:
      "candidate",

    trainedAt:
      "2026-08-10T17:00:00.000Z",

    materializedEventCount:
      10000,

    labeledEventCount:
      10000,

    trainingEventCount:
      8000,

    trainingPositiveCount:
      1600,

    trainingNegativeCount:
      6400,

    intercept:
      -1.2,

    weights:
      Array(
        256
      ).fill(
        0
      ),

    validationEventCount:
      2000,

    validationPositiveCount:
      400,

    validationNegativeCount:
      1600,

    validationAccuracy:
      0.84,

    validationLogLoss:
      0.4,

    validationRocAuc:
      0.72,

    rejectionReason:
      null,

    createdAt:
      "2026-08-10T17:01:00.000Z",

    promotedAt:
      null,

    rejectedAt:
      null,

    retiredAt:
      null,

    ...overrides,
  };
}

describe(
  "Advertising AI candidate quality evaluation",
  () => {

    it(
      "passes a candidate that beats the prevalence-only baseline",
      () => {
        const result =
          createAdvertisingAiModelEvaluationService()
            .evaluateCandidate(
              candidate()
            );

        expect(
          result.decision
        ).toBe(
          "pass"
        );

        expect(
          result.reason
        ).toBe(
          "candidate_quality_gate_passed"
        );

        expect(
          result.candidateLogLoss
        ).toBeLessThan(
          result.baselineLogLoss
        );
      }
    );

    it(
      "fails a candidate worse than the observed prevalence baseline",
      () => {
        const result =
          createAdvertisingAiModelEvaluationService()
            .evaluateCandidate(
              candidate({
                validationLogLoss:
                  0.8,
              })
            );

        expect(
          result.decision
        ).toBe(
          "fail"
        );

        expect(
          result.reason
        ).toBe(
          "candidate_worse_than_prevalence_baseline"
        );
      }
    );

    it(
      "fails an AUC below random discrimination",
      () => {
        const result =
          createAdvertisingAiModelEvaluationService()
            .evaluateCandidate(
              candidate({
                validationRocAuc:
                  0.49,
              })
            );

        expect(
          result.decision
        ).toBe(
          "fail"
        );

        expect(
          result.reason
        ).toBe(
          "candidate_auc_below_random"
        );
      }
    );

    it(
      "refuses lifecycle states other than candidate",
      () => {
        const result =
          createAdvertisingAiModelEvaluationService()
            .evaluateCandidate(
              candidate({
                status:
                  "promoted",
              })
            );

        expect(
          result.decision
        ).toBe(
          "fail"
        );

        expect(
          result.reason
        ).toBe(
          "candidate_status_invalid"
        );
      }
    );

    it(
      "uses only aggregate model metrics and no user-level signals",
      () => {
        const serialized =
          JSON.stringify(
            candidate()
          );

        expect(
          serialized
        ).not.toContain(
          "userId"
        );

        expect(
          serialized
        ).not.toContain(
          "session"
        );

        expect(
          serialized
        ).not.toContain(
          "organic"
        );
      }
    );
  }
);