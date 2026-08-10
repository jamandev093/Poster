import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiTrainingHandoffService,
  type AdvertisingAiLearningSnapshot,
  type AdvertisingAiLearningSnapshotRepository,
  type AdvertisingAiTrainingFetch,
} from "../src/application/advertising-ai/index.js";

const DATASET_ID =
  "00000000-0000-4000-8000-000000000301";

const CHECKSUM =
  `sha256:${"a".repeat(
    64
  )}`;

const CUTOFF =
  "2026-08-10T15:00:00.000Z";

function readySnapshot():
  AdvertisingAiLearningSnapshot {
  return {
    id:
      DATASET_ID,

    schemaVersion:
      1,

    status:
      "ready",

    sourceEventCount:
      2,

    materializedEventCount:
      2,

    sourceCutoffAt:
      CUTOFF,

    firstEventAt:
      "2026-08-10T14:00:00.000Z",

    lastEventAt:
      "2026-08-10T14:01:00.000Z",

    datasetChecksum:
      CHECKSUM,

    createdAt:
      CUTOFF,

    completedAt:
      CUTOFF,

    failedAt:
      null,

    failureCode:
      null,
  };
}

function repository():
  AdvertisingAiLearningSnapshotRepository {
  return {
    async createSnapshot() {
      throw new Error(
        "not used"
      );
    },

    async appendEvents() {
      throw new Error(
        "not used"
      );
    },

    async completeSnapshot() {
      throw new Error(
        "not used"
      );
    },

    async failSnapshot() {
      throw new Error(
        "not used"
      );
    },

    async getReadySnapshot() {
      return readySnapshot();
    },

    async listFrozenEvents() {
      return {
        events: [
          {
            eventKey:
              "advertising:event-1",

            sourceEventId:
              "00000000-0000-4000-8000-000000000401",

            campaignId:
              "00000000-0000-4000-8000-000000000501",

            eventType:
              "impression",

            placement:
              "home",

            occurredAt:
              "2026-08-10T14:00:00.000Z",
          },

          {
            eventKey:
              "advertising:event-2",

            sourceEventId:
              "00000000-0000-4000-8000-000000000402",

            campaignId:
              "00000000-0000-4000-8000-000000000501",

            eventType:
              "click",

            placement:
              "home",

            occurredAt:
              "2026-08-10T14:01:00.000Z",
          },
        ],

        nextCursor:
          null,
      };
    },
  };
}

describe(
  "Advertising AI training handoff",
  () => {

    it(
      "streams the frozen advertising dataset and reconciles the AI response",
      async () => {
        let bodyText =
          "";

        const fetchImplementation:
          AdvertisingAiTrainingFetch =
          async (
            _input,
            init
          ) => {
            bodyText =
              await new Response(
                init.body
              ).text();

            return new Response(
              JSON.stringify({
                status:
                  "trained",

                accepted:
                  true,

                datasetId:
                  DATASET_ID,

                schemaVersion:
                  1,

                datasetChecksum:
                  CHECKSUM,

                sourceCutoffAt:
                  CUTOFF,

                materializedEventCount:
                  2,

                trainingAttempted:
                  true,

                candidateCreated:
                  true,

                reason:
                  "advertising_candidate_model_trained",

                observedEventCount:
                  2,

                labeledEventCount:
                  2,

                skippedEventCount:
                  0,

                positiveEventCount:
                  1,

                negativeEventCount:
                  1,

                candidate: {
                  modelId:
                    "candidate-1",

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

                  trainedAt:
                    "2026-08-10T16:00:00.000Z",

                  materializedEventCount:
                    2,

                  labeledEventCount:
                    2,

                  trainingEventCount:
                    1,

                  trainingPositiveCount:
                    1,

                  trainingNegativeCount:
                    0,

                  intercept:
                    0,

                  weights:
                    Array(
                      256
                    ).fill(
                      0
                    ),

                  metrics: {
                    validationEventCount:
                      1,

                    validationPositiveCount:
                      0,

                    validationNegativeCount:
                      1,

                    accuracy:
                      1,

                    logLoss:
                      0.1,

                    rocAuc:
                      null,
                  },

                  modelChecksum:
                    `sha256:${"b".repeat(
                      64
                    )}`,
                },

                promoted:
                  false,
              }),
              {
                status:
                  200,

                headers: {
                  "content-type":
                    "application/json",
                },
              }
            );
          };

        const result =
          await createAdvertisingAiTrainingHandoffService({
            snapshotRepository:
              repository(),

            endpoint:
              "http://127.0.0.1:9999/v1/advertising-training/train",

            fetchImplementation,
          }).train(
            DATASET_ID
          );

        const lines =
          bodyText
            .trim()
            .split(
              "\n"
            )
            .map(
              line =>
                JSON.parse(
                  line
                ) as
                  Record<
                    string,
                    unknown
                  >
            );

        expect(
          lines
        ).toHaveLength(
          3
        );

        expect(
          lines[0]
        ).toMatchObject({
          recordType:
            "manifest",

          datasetId:
            DATASET_ID,

          datasetChecksum:
            CHECKSUM,
        });

        expect(
          lines[1]
        ).toMatchObject({
          recordType:
            "event",

          eventType:
            "impression",
        });

        expect(
          bodyText
        ).not.toContain(
          "user"
        );

        expect(
          bodyText
        ).not.toContain(
          "session"
        );

        expect(
          bodyText
        ).not.toContain(
          "metadata"
        );

        expect(
          result.status
        ).toBe(
          "trained"
        );

        expect(
          result.candidate
            ?.featureDimension
        ).toBe(
          256
        );

        expect(
          result.promoted
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects AI responses that do not reconcile with the frozen snapshot",
      async () => {
        const fetchImplementation:
          AdvertisingAiTrainingFetch =
          async () =>
            new Response(
              JSON.stringify({
                status:
                  "not_trainable",

                accepted:
                  true,

                datasetId:
                  DATASET_ID,

                schemaVersion:
                  1,

                datasetChecksum:
                  `sha256:${"f".repeat(
                    64
                  )}`,

                sourceCutoffAt:
                  CUTOFF,

                materializedEventCount:
                  2,

                trainingAttempted:
                  true,

                candidateCreated:
                  false,

                reason:
                  "insufficient_class_diversity",

                observedEventCount:
                  2,

                labeledEventCount:
                  2,

                skippedEventCount:
                  0,

                positiveEventCount:
                  0,

                negativeEventCount:
                  2,

                candidate:
                  null,

                promoted:
                  false,
              }),
              {
                status:
                  200,
              }
            );

        await expect(
          createAdvertisingAiTrainingHandoffService({
            snapshotRepository:
              repository(),

            endpoint:
              "http://127.0.0.1:9999/v1/advertising-training/train",

            fetchImplementation,
          }).train(
            DATASET_ID
          )
        ).rejects.toThrow(
          "checksum mismatch"
        );
      }
    );
  }
);