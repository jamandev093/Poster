import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiTrainingCandidateService,
} from "../src/application/poster-brain/ai-training-candidate.service.js";

import {
  createPosterBrainAiTrainingCandidateRuntimeConfiguration,
  createPosterBrainAiTrainingCandidateServiceFromRuntimeEnv,
} from "../src/application/poster-brain/ai-training-candidate-runtime.service.js";

import type {
  PosterBrainAiLearningDatasetHandoffFetch,
} from "../src/application/poster-brain/ai-learning-dataset-handoff.service.js";

import type {
  PosterBrainAiLearningDatasetReadySnapshot,
  PosterBrainAiLearningDatasetSnapshotReadRepository,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.js";

import type {
  PosterBrainAiLearningDatasetEvent,
} from "../src/application/poster-brain/ai-learning-dataset.types.js";

import type {
  CreatePosterBrainAiModelCandidateInput,
  PosterBrainAiModelRegistryRepository,
  PosterBrainAiModelVersion,
} from "../src/application/poster-brain/ai-model-registry.repository.js";

const DATASET_ID =
  "11111111-1111-4111-8111-111111111111";

const DATASET_CHECKSUM =
  "sha256:" +
  "a".repeat(
    64
  );

const MODEL_ID =
  "poster-engagement-v1-test";

const MODEL_CHECKSUM =
  "sha256:" +
  "b".repeat(
    64
  );

const SOURCE_CUTOFF =
  "2026-08-09T16:00:00.000Z";

const EVENT_COUNT =
  10000;

const CONTENT_COUNT =
  20;

function createSnapshot():
  PosterBrainAiLearningDatasetReadySnapshot {
  return {
    id:
      DATASET_ID,

    schemaVersion:
      1,

    status:
      "ready",

    sourceEventCount:
      EVENT_COUNT,

    materializedEventCount:
      EVENT_COUNT,

    materializedContentCount:
      CONTENT_COUNT,

    sourceCutoffAt:
      SOURCE_CUTOFF,

    firstEventAt:
      "2026-08-09T13:13:20.000Z",

    lastEventAt:
      "2026-08-09T15:59:59.000Z",

    datasetChecksum:
      DATASET_CHECKSUM,

    createdAt:
      SOURCE_CUTOFF,

    completedAt:
      "2026-08-09T16:01:00.000Z",
  };
}

function createEvent(
  index:
    number
): PosterBrainAiLearningDatasetEvent {
  return {
    schemaVersion:
      1,

    eventKey:
      `organic_content_event:${index}`,

    source:
      "organic_content_event",

    sourceEventId:
      `event-${index}`,

    signalType:
      "impression",

    occurredAt:
      new Date(
        Date.parse(
          SOURCE_CUTOFF
        ) -
        (
          index +
          1
        ) *
        1000
      ).toISOString(),

    surface:
      "home",

    reasonId:
      null,

    reportStatus:
      null,

    bookmarkActive:
      null,

    content: {
      contentId:
        `content-${index % CONTENT_COUNT}`,

      sourceKey:
        "source-one",

      publisherName:
        "Publisher",

      title:
        `Content ${index}`,

      excerpt:
        "Poster Brain learning content.",

      mediaType:
        "article",

      languageCode:
        "en",

      regionCode:
        null,

      category:
        "Technology",

      canonicalTopicIds: [
        "topic-ai",
      ],

      evolvingTopicIds:
        [],

      tags: [
        "ai",
      ],

      searchKeywords: [
        "artificial intelligence",
      ],

      aiClassification: {
        primaryCategory:
          "Technology",
      },

      qualityScore:
        0.8,

      publishedAt:
        "2026-08-09T10:00:00.000Z",

      contentStatus:
        "active",
    },
  };
}

function createSnapshotRepository():
  PosterBrainAiLearningDatasetSnapshotReadRepository {
  const firstPage =
    Array.from(
      {
        length:
          5000,
      },
      (
        _,
        index
      ) =>
        createEvent(
          index
        )
    );

  const secondPage =
    Array.from(
      {
        length:
          5000,
      },
      (
        _,
        index
      ) =>
        createEvent(
          index +
          5000
        )
    );

  return {
    async getReadySnapshot(
      _datasetId
    ) {
      return createSnapshot();
    },

    async listReadySnapshotPage(
      query
    ) {
      if (
        query.cursor ===
          null ||
        query.cursor ===
          undefined
      ) {
        return {
          events:
            firstPage,

          nextCursor:
            "2026-08-09T14:36:40.000Z|cursor-one",
        };
      }

      return {
        events:
          secondPage,

        nextCursor:
          null,
      };
    },
  };
}

function createTrainingCandidate() {
  return {
    modelId:
      MODEL_ID,

    modelType:
      "hashed_logistic_engagement_v1",

    trainingEngineVersion:
      "hashed-logistic-engagement-v1",

    featureVersion:
      "poster-content-features-v1",

    featureDimension:
      512,

    datasetId:
      DATASET_ID,

    datasetChecksum:
      DATASET_CHECKSUM,

    trainedAt:
      "2026-08-10T06:45:00.000Z",

    materializedEventCount:
      EVENT_COUNT,

    labeledEventCount:
      500,

    trainingEventCount:
      400,

    trainingPositiveCount:
      240,

    trainingNegativeCount:
      160,

    intercept:
      0.125,

    weights:
      Array.from(
        {
          length:
            512,
        },
        (
          _,
          index
        ) =>
          index ===
            7
            ? 0.75
            : 0
      ),

    metrics: {
      validationEventCount:
        100,

      validationPositiveCount:
        60,

      validationNegativeCount:
        40,

      accuracy:
        0.84,

      logLoss:
        0.42,

      rocAuc:
        0.88,
    },

    modelChecksum:
      MODEL_CHECKSUM,
  };
}

function createTrainingResponse() {
  return {
    status:
      "trained",

    accepted:
      true,

    datasetId:
      DATASET_ID,

    schemaVersion:
      1,

    datasetChecksum:
      DATASET_CHECKSUM,

    sourceCutoffAt:
      SOURCE_CUTOFF,

    pageCount:
      2,

    eventCount:
      EVENT_COUNT,

    contentCount:
      CONTENT_COUNT,

    labeledEventCount:
      500,

    positiveEventCount:
      300,

    negativeEventCount:
      200,

    skippedEventCount:
      9500,

    reason:
      "candidate_model_trained",

    trainingAttempted:
      true,

    candidateCreated:
      true,

    candidate:
      createTrainingCandidate(),

    promoted:
      false,
  };
}

function createPersistedModel(
  input:
    CreatePosterBrainAiModelCandidateInput
): PosterBrainAiModelVersion {
  return {
    modelId:
      input.modelId,

    state:
      "candidate",

    modelType:
      input.modelType,

    trainingEngineVersion:
      input.trainingEngineVersion,

    featureVersion:
      input.featureVersion,

    featureDimension:
      input.featureDimension,

    datasetId:
      input.datasetId,

    datasetChecksum:
      input.datasetChecksum,

    modelChecksum:
      input.modelChecksum,

    trainedAt:
      input.trainedAt,

    materializedEventCount:
      input.materializedEventCount,

    labeledEventCount:
      input.labeledEventCount,

    trainingEventCount:
      input.trainingEventCount,

    trainingPositiveCount:
      input.trainingPositiveCount,

    trainingNegativeCount:
      input.trainingNegativeCount,

    metrics:
      input.metrics,

    artifact:
      input.artifact,

    evaluationStatus:
      "pending",

    evaluationReason:
      null,

    evaluationPayload:
      null,

    evaluatedAt:
      null,

    activatedAt:
      null,

    rejectedAt:
      null,

    previousActiveModelId:
      null,

    createdAt:
      "2026-08-10T06:46:00.000Z",

    updatedAt:
      "2026-08-10T06:46:00.000Z",

    rowVersion:
      1,
  };
}

function createRegistry() {
  const persistedInputs:
    CreatePosterBrainAiModelCandidateInput[] =
      [];

  const repository:
    PosterBrainAiModelRegistryRepository = {
      async createCandidate(
        input
      ) {
        persistedInputs.push(
          input
        );

        return createPersistedModel(
          input
        );
      },

      async getModel() {
        return null;
      },

      async getActiveModel() {
        return null;
      },
    };

  return {
    repository,
    persistedInputs,
  };
}

async function consumeBody(
  body:
    ReadableStream<
      Uint8Array
    >
): Promise<void> {
  const reader =
    body.getReader();

  while (true) {
    const result =
      await reader.read();

    if (result.done) {
      return;
    }
  }
}

describe(
  "Poster Brain AI trained candidate persistence",
  () => {

    it(
      "persists a validated trained candidate as pending",
      async () => {

        const registry =
          createRegistry();

        const fetchImplementation:
          PosterBrainAiLearningDatasetHandoffFetch =
          async (
            url,
            request
          ) => {

            expect(
              url
            ).toBe(
              "http://poster-ai.internal/v1/training-dataset/train"
            );

            expect(
              request.duplex
            ).toBe(
              "half"
            );

            expect(
              request.headers[
                "content-type"
              ]
            ).toBe(
              "application/x-ndjson"
            );

            await consumeBody(
              request.body
            );

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return createTrainingResponse();
              },
            };
          };

        const service =
          createPosterBrainAiTrainingCandidateService({
            snapshotRepository:
              createSnapshotRepository(),

            modelRegistryRepository:
              registry.repository,

            endpointUrl:
              "http://poster-ai.internal/v1/training-dataset/train",

            timeoutMs:
              120000,

            pageSize:
              5000,

            fetchImplementation,
          });

        const result =
          await service.trainReadySnapshot(
            DATASET_ID
          );

        expect(
          registry.persistedInputs
        ).toHaveLength(
          1
        );

        const persisted =
          registry.persistedInputs[0]!;

        expect(
          persisted.modelId
        ).toBe(
          MODEL_ID
        );

        expect(
          persisted.modelChecksum
        ).toBe(
          MODEL_CHECKSUM
        );

        expect(
          persisted.datasetId
        ).toBe(
          DATASET_ID
        );

        expect(
          persisted.materializedEventCount
        ).toBe(
          EVENT_COUNT
        );

        expect(
          persisted.trainingPositiveCount
        ).toBe(
          240
        );

        expect(
          persisted.metrics
            .validationPositiveCount
        ).toBe(
          60
        );

        expect(
          (
            persisted.artifact
              .weights as readonly number[]
          )
        ).toHaveLength(
          512
        );

        expect(
          result.status
        ).toBe(
          "trained"
        );

        expect(
          result.candidateCreated
        ).toBe(
          true
        );

        expect(
          result.candidatePersisted
        ).toBe(
          true
        );

        expect(
          result.candidate?.state
        ).toBe(
          "candidate"
        );

        expect(
          result.candidate?.evaluationStatus
        ).toBe(
          "pending"
        );

        expect(
          result.promoted
        ).toBe(
          false
        );
      }
    );

    it(
      "does not persist anything for a valid not_trainable response",
      async () => {

        const registry =
          createRegistry();

        const fetchImplementation:
          PosterBrainAiLearningDatasetHandoffFetch =
          async (
            _url,
            request
          ) => {

            await consumeBody(
              request.body
            );

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return {
                  status:
                    "not_trainable",

                  accepted:
                    true,

                  datasetId:
                    DATASET_ID,

                  schemaVersion:
                    1,

                  datasetChecksum:
                    DATASET_CHECKSUM,

                  sourceCutoffAt:
                    SOURCE_CUTOFF,

                  pageCount:
                    2,

                  eventCount:
                    EVENT_COUNT,

                  contentCount:
                    CONTENT_COUNT,

                  labeledEventCount:
                    0,

                  positiveEventCount:
                    0,

                  negativeEventCount:
                    0,

                  skippedEventCount:
                    EVENT_COUNT,

                  reason:
                    "insufficient_labeled_events",

                  trainingAttempted:
                    true,

                  candidateCreated:
                    false,

                  candidate:
                    null,

                  promoted:
                    false,
                };
              },
            };
          };

        const service =
          createPosterBrainAiTrainingCandidateService({
            snapshotRepository:
              createSnapshotRepository(),

            modelRegistryRepository:
              registry.repository,

            endpointUrl:
              "http://poster-ai.internal/v1/training-dataset/train",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        const result =
          await service.trainReadySnapshot(
            DATASET_ID
          );

        expect(
          registry.persistedInputs
        ).toHaveLength(
          0
        );

        expect(
          result.status
        ).toBe(
          "not_trainable"
        );

        expect(
          result.candidateCreated
        ).toBe(
          false
        );

        expect(
          result.candidatePersisted
        ).toBe(
          false
        );

        expect(
          result.candidate
        ).toBeNull();

        expect(
          result.promoted
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects mismatched candidate provenance before persistence",
      async () => {

        const registry =
          createRegistry();

        const fetchImplementation:
          PosterBrainAiLearningDatasetHandoffFetch =
          async (
            _url,
            request
          ) => {

            await consumeBody(
              request.body
            );

            const response =
              createTrainingResponse();

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return {
                  ...response,

                  candidate: {
                    ...response.candidate,

                    datasetId:
                      "22222222-2222-4222-8222-222222222222",
                  },
                };
              },
            };
          };

        const service =
          createPosterBrainAiTrainingCandidateService({
            snapshotRepository:
              createSnapshotRepository(),

            modelRegistryRepository:
              registry.repository,

            endpointUrl:
              "http://poster-ai.internal/v1/training-dataset/train",

            timeoutMs:
              120000,

            fetchImplementation,
          });

        await expect(
          service.trainReadySnapshot(
            DATASET_ID
          )
        ).rejects.toMatchObject({
          code:
            "response_invalid",
        });

        expect(
          registry.persistedInputs
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "keeps runtime training disabled when URL is absent",
      () => {

        const configuration =
          createPosterBrainAiTrainingCandidateRuntimeConfiguration(
            {}
          );

        expect(
          configuration
        ).toEqual({
          endpointUrl:
            null,

          timeoutMs:
            120000,

          pageSize:
            5000,
        });

        const database = {
          async query<Row>() {
            return {
              rows:
                [] as readonly Row[],
            };
          },
        };

        const service =
          createPosterBrainAiTrainingCandidateServiceFromRuntimeEnv({
            database,

            environment:
              {},
          });

        expect(
          service
        ).toBeNull();
      }
    );

    it(
      "caps runtime training page size at 5000",
      () => {

        const configuration =
          createPosterBrainAiTrainingCandidateRuntimeConfiguration({
            POSTER_AI_TRAINING_URL:
              "http://127.0.0.1:8080/v1/training-dataset/train",

            POSTER_AI_TRAINING_TIMEOUT_MS:
              "90000",

            POSTER_AI_TRAINING_PAGE_SIZE:
              "9000",
          });

        expect(
          configuration.endpointUrl
        ).toBe(
          "http://127.0.0.1:8080/v1/training-dataset/train"
        );

        expect(
          configuration.timeoutMs
        ).toBe(
          90000
        );

        expect(
          configuration.pageSize
        ).toBe(
          5000
        );
      }
    );
  }
);