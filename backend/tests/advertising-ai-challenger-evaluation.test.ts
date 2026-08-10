import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiIndependentChallengerEvaluationService,
  type AdvertisingAiFrozenEvaluationEvent,
  type AdvertisingAiFrozenEvaluationSnapshotReader,
  type AdvertisingAiStoredModel,
} from "../src/application/advertising-ai/index.js";

const DATASET_ID =
  "00000000-0000-4000-8000-000000000301";

const CHECKSUM =
  `sha256:${"a".repeat(
    64
  )}`;

function model(
  input: {
    readonly status:
      "candidate" |
      "promoted";

    readonly modelId:
      string;

    readonly intercept:
      number;
  }
):
  AdvertisingAiStoredModel {
  return {
    id:
      input.status ===
        "candidate"
        ? "00000000-0000-4000-8000-000000000901"
        : "00000000-0000-4000-8000-000000000902",

    modelId:
      input.modelId,

    modelType:
      "hashed_logistic_ad_response_v1",

    trainingEngineVersion:
      "hashed-logistic-ad-response-v1",

    featureVersion:
      "advertising-campaign-placement-v1",

    featureDimension:
      256,

    datasetId:
      DATASET_ID,

    datasetChecksum:
      CHECKSUM,

    modelChecksum:
      input.status ===
        "candidate"
        ? `sha256:${"b".repeat(64)}`
        : `sha256:${"c".repeat(64)}`,

    status:
      input.status,

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
      input.intercept,

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
      0.8,

    validationLogLoss:
      0.5,

    validationRocAuc:
      0.5,

    rejectionReason:
      null,

    createdAt:
      "2026-08-10T17:01:00.000Z",

    promotedAt:
      input.status ===
        "promoted"
        ? "2026-08-10T18:00:00.000Z"
        : null,

    rejectedAt:
      null,

    retiredAt:
      null,
  };
}

function events():
  AdvertisingAiFrozenEvaluationEvent[] {
  return Array.from(
    {
      length:
        10000,
    },
    (
      _,
      index
    ) => {
      const campaign =
        index %
        100;

      return {
        eventKey:
          `advertising:event-${index}`,

        sourceEventId:
          `source-event-${index}`,

        campaignId:
          `campaign-${campaign}`,

        eventType:
          campaign <
            20
            ? "click"
            : "impression",

        placement:
          index %
            3 ===
            0
            ? "home"
            : (
                index %
                  3 ===
                  1
                  ? "search"
                  : "trending"
              ),

        occurredAt:
          "2026-08-10T14:00:00.000Z",
      };
    }
  );
}

function reader():
  AdvertisingAiFrozenEvaluationSnapshotReader {
  const rows =
    events();

  return {
    async getReadySnapshot() {
      return {
        id:
          DATASET_ID,

        status:
          "ready",

        materializedEventCount:
          10000,

        datasetChecksum:
          CHECKSUM,
      };
    },

    async listFrozenEvents(
      input
    ) {
      const start =
        input.cursor ===
          null
          ? 0
          : Number(
              input.cursor
            );

      const end =
        Math.min(
          start +
          input.limit,
          rows.length
        );

      return {
        events:
          rows.slice(
            start,
            end
          ),

        nextCursor:
          end <
          rows.length
            ? String(
                end
              )
            : null,
      };
    },
  };
}

describe(
  "Advertising AI independent challenger evaluation",
  () => {

    it(
      "scores challenger and incumbent on the same frozen validation evidence",
      async () => {
        const candidate =
          model({
            status:
              "candidate",

            modelId:
              "candidate",

            intercept:
              Math.log(
                0.2 /
                0.8
              ),
          });

        const incumbent =
          model({
            status:
              "promoted",

            modelId:
              "incumbent",

            intercept:
              0,
          });

        const result =
          await createAdvertisingAiIndependentChallengerEvaluationService(
            reader()
          ).evaluate({
            candidate,
            incumbent,
          });

        expect(
          result.decision
        ).toBe(
          "pass"
        );

        expect(
          result.reason
        ).toBe(
          "independent_candidate_beats_incumbent"
        );

        expect(
          result.validationEventCount
        ).toBeGreaterThan(
          20
        );

        expect(
          result.candidateLogLoss
        ).toBeLessThan(
          result.baselineLogLoss
        );
      }
    );

    it(
      "rejects a challenger that does not beat the incumbent",
      async () => {
        const candidate =
          model({
            status:
              "candidate",

            modelId:
              "candidate",

            intercept:
              0,
          });

        const incumbent =
          model({
            status:
              "promoted",

            modelId:
              "incumbent",

            intercept:
              Math.log(
                0.2 /
                0.8
              ),
          });

        const result =
          await createAdvertisingAiIndependentChallengerEvaluationService(
            reader()
          ).evaluate({
            candidate,
            incumbent,
          });

        expect(
          result.decision
        ).toBe(
          "fail"
        );

        expect(
          result.reason
        ).toBe(
          "independent_candidate_does_not_beat_incumbent"
        );
      }
    );

    it(
      "never reads user identity or organic Poster Brain signals",
      async () => {
        const candidate =
          model({
            status:
              "candidate",

            modelId:
              "candidate",

            intercept:
              Math.log(
                0.2 /
                0.8
              ),
          });

        const incumbent =
          model({
            status:
              "promoted",

            modelId:
              "incumbent",

            intercept:
              0,
          });

        const serialized =
          JSON.stringify({
            candidate,
            incumbent,
            events:
              events().slice(
                0,
                10
              ),
          });

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