import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiModelRegistryRepository,
} from "../src/application/poster-brain/ai-model-registry.repository.js";

import type {
  CreatePosterBrainAiModelCandidateInput,
  PosterBrainAiModelRegistryDatabase,
} from "../src/application/poster-brain/ai-model-registry.repository.js";

interface QueryCall {
  readonly text:
    string;

  readonly values:
    readonly unknown[] |
    undefined;
}

class RecordingDatabase
  implements PosterBrainAiModelRegistryDatabase
{
  readonly calls:
    QueryCall[] =
    [];

  private index =
    0;

  constructor(
    private readonly results:
      readonly (
        readonly unknown[]
      )[]
  ) {}

  async query<Row>(
    text:
      string,
    values?:
      readonly unknown[]
  ): Promise<{
    rows:
      readonly Row[];
  }> {
    this.calls.push({
      text,
      values,
    });

    const rows =
      this.results[
        this.index
      ] ??
      [];

    this.index +=
      1;

    return {
      rows:
        rows as readonly Row[],
    };
  }
}

const DATASET_ID =
  "11111111-1111-4111-8111-111111111111";

const MODEL_ID =
  "poster-engagement-v1-bdbb40250aefc854";

const DATASET_CHECKSUM =
  "sha256:" +
  "a".repeat(
    64
  );

const MODEL_CHECKSUM =
  "sha256:" +
  "b".repeat(
    64
  );

function createArtifact() {
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
      "2026-08-10T02:50:00.000Z",

    materializedEventCount:
      10000,

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
          index === 7
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

function createCandidateInput():
  CreatePosterBrainAiModelCandidateInput {
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

    modelChecksum:
      MODEL_CHECKSUM,

    trainedAt:
      "2026-08-10T02:50:00.000Z",

    materializedEventCount:
      10000,

    labeledEventCount:
      500,

    trainingEventCount:
      400,

    trainingPositiveCount:
      240,

    trainingNegativeCount:
      160,

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

    artifact:
      createArtifact(),
  };
}

function createRow(
  overrides: {
    readonly state?:
      string;

    readonly evaluationStatus?:
      string;

    readonly activatedAt?:
      string |
      null;
  } = {}
) {
  return {
    modelId:
      MODEL_ID,

    state:
      overrides.state ??
      "candidate",

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

    modelChecksum:
      MODEL_CHECKSUM,

    trainedAt:
      "2026-08-10T02:50:00.000Z",

    materializedEventCount:
      10000,

    labeledEventCount:
      500,

    trainingEventCount:
      400,

    trainingPositiveCount:
      240,

    trainingNegativeCount:
      160,

    validationEventCount:
      100,

    validationPositiveCount:
      60,

    validationNegativeCount:
      40,

    validationAccuracy:
      0.84,

    validationLogLoss:
      0.42,

    validationRocAuc:
      0.88,

    artifact:
      createArtifact(),

    evaluationStatus:
      overrides.evaluationStatus ??
      "pending",

    evaluationReason:
      null,

    evaluationPayload:
      null,

    evaluatedAt:
      null,

    activatedAt:
      overrides.activatedAt ??
      null,

    rejectedAt:
      null,

    previousActiveModelId:
      null,

    createdAt:
      "2026-08-10T02:51:00.000Z",

    updatedAt:
      "2026-08-10T02:51:00.000Z",

    rowVersion:
      1,
  };
}

describe(
  "Poster Brain persistent AI model registry repository",
  () => {

    it(
      "persists a complete candidate artifact with evaluation pending",
      async () => {

        const database =
          new RecordingDatabase([
            [
              createRow(),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiModelRegistryRepository(
            database
          );

        const model =
          await repository.createCandidate(
            createCandidateInput()
          );

        expect(
          model.state
        ).toBe(
          "candidate"
        );

        expect(
          model.evaluationStatus
        ).toBe(
          "pending"
        );

        expect(
          model.artifact
        ).toEqual(
          createArtifact()
        );

        expect(
          (
            model.artifact
              .weights as readonly number[]
          )
        ).toHaveLength(
          512
        );

        expect(
          database.calls
        ).toHaveLength(
          1
        );

        const call =
          database.calls[0]!;

        expect(
          call.text
        ).toContain(
          "INSERT INTO app.poster_brain_ai_model_versions"
        );

        expect(
          call.text
        ).toContain(
          "'candidate'"
        );

        expect(
          call.text
        ).toContain(
          "'pending'"
        );

        expect(
          call.text
        ).toContain(
          "$21::jsonb"
        );

        expect(
          call.values?.[5]
        ).toBe(
          DATASET_ID
        );

        expect(
          call.values?.[7]
        ).toBe(
          MODEL_CHECKSUM
        );

        expect(
          JSON.parse(
            String(
              call.values?.[20]
            )
          )
        ).toEqual(
          createArtifact()
        );
      }
    );

    it(
      "makes a same-id same-checksum candidate retry idempotent",
      async () => {

        const database =
          new RecordingDatabase([
            [],
            [
              createRow(),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiModelRegistryRepository(
            database
          );

        const model =
          await repository.createCandidate(
            createCandidateInput()
          );

        expect(
          model.modelId
        ).toBe(
          MODEL_ID
        );

        expect(
          database.calls
        ).toHaveLength(
          2
        );

        expect(
          database.calls[1]?.text
        ).toContain(
          "WHERE"
        );

        expect(
          database.calls[1]?.text
        ).toContain(
          "model_id = $1"
        );
      }
    );

    it(
      "reads the one active persistent model",
      async () => {

        const database =
          new RecordingDatabase([
            [
              createRow({
                state:
                  "active",

                evaluationStatus:
                  "passed",

                activatedAt:
                  "2026-08-10T03:00:00.000Z",
              }),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiModelRegistryRepository(
            database
          );

        const active =
          await repository.getActiveModel();

        expect(
          active?.state
        ).toBe(
          "active"
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "state = 'active'"
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "activated_at DESC"
        );
      }
    );

    it(
      "rejects user identity and arbitrary event metadata inside a model artifact",
      async () => {

        const database =
          new RecordingDatabase(
            []
          );

        const repository =
          createPostgreSqlPosterBrainAiModelRegistryRepository(
            database
          );

        const input =
          createCandidateInput();

        await expect(
          repository.createCandidate({
            ...input,

            artifact: {
              ...input.artifact,

              nested: {
                userId:
                  "user-should-never-be-here",
              },
            },
          })
        ).rejects.toThrow(
          "forbidden field: userId"
        );

        expect(
          database.calls
        ).toHaveLength(
          0
        );

        await expect(
          repository.createCandidate({
            ...input,

            artifact: {
              ...input.artifact,

              metadata: {
                arbitrary:
                  true,
              },
            },
          })
        ).rejects.toThrow(
          "forbidden field: metadata"
        );

        expect(
          database.calls
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "rejects inconsistent training and validation counts before database access",
      async () => {

        const database =
          new RecordingDatabase(
            []
          );

        const repository =
          createPostgreSqlPosterBrainAiModelRegistryRepository(
            database
          );

        const input =
          createCandidateInput();

        await expect(
          repository.createCandidate({
            ...input,

            trainingPositiveCount:
              300,

            trainingNegativeCount:
              200,
          })
        ).rejects.toThrow(
          "training class counts do not reconcile"
        );

        expect(
          database.calls
        ).toHaveLength(
          0
        );
      }
    );
  }
);