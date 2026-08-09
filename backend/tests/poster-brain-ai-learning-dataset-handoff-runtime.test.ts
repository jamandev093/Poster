import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_PAGE_SIZE,
  POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_TIMEOUT_MS,
  createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration,
  createPosterBrainAiLearningDatasetHandoffServiceFromRuntimeEnv,
} from "../src/application/poster-brain/ai-learning-dataset-handoff-runtime.service.js";

import type {
  PosterBrainAiLearningDatasetSnapshotReadDatabase,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.js";

const database:
  PosterBrainAiLearningDatasetSnapshotReadDatabase =
  {
    async query<Row>() {
      return {
        rows:
          [] as readonly Row[],
      };
    },
  };

describe(
  "Poster Brain learning dataset handoff runtime configuration",
  () => {

    it(
      "uses disabled-safe runtime defaults when the handoff endpoint is not configured",
      () => {

        expect(
          createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration(
            {}
          )
        ).toEqual({
          endpointUrl:
            null,

          timeoutMs:
            POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_TIMEOUT_MS,

          pageSize:
            POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_PAGE_SIZE,
        });

        expect(
          createPosterBrainAiLearningDatasetHandoffServiceFromRuntimeEnv({
            database,

            environment:
              {},
          })
        ).toBeNull();
      }
    );

    it(
      "reads the configured Python training handoff endpoint timeout and page size",
      () => {

        expect(
          createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration({
            POSTER_AI_TRAINING_HANDOFF_URL:
              " http://127.0.0.1:8080/v1/training-dataset/handoff ",

            POSTER_AI_TRAINING_HANDOFF_TIMEOUT_MS:
              "90000",

            POSTER_AI_TRAINING_HANDOFF_PAGE_SIZE:
              "2500",
          })
        ).toEqual({
          endpointUrl:
            "http://127.0.0.1:8080/v1/training-dataset/handoff",

          timeoutMs:
            90000,

          pageSize:
            2500,
        });
      }
    );

    it(
      "uses safe numeric defaults and caps pages at 5000",
      () => {

        expect(
          createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration({
            POSTER_AI_TRAINING_HANDOFF_TIMEOUT_MS:
              "invalid",

            POSTER_AI_TRAINING_HANDOFF_PAGE_SIZE:
              "999999",
          })
        ).toEqual({
          endpointUrl:
            null,

          timeoutMs:
            POSTER_BRAIN_AI_DEFAULT_TRAINING_HANDOFF_TIMEOUT_MS,

          pageSize:
            5000,
        });
      }
    );

    it(
      "rejects invalid handoff URL protocols",
      () => {

        expect(
          () =>
            createPosterBrainAiLearningDatasetHandoffRuntimeConfiguration({
              POSTER_AI_TRAINING_HANDOFF_URL:
                "file:///tmp/poster-ai",
            })
        ).toThrow(
          "POSTER_AI_TRAINING_HANDOFF_URL must use HTTP or HTTPS."
        );
      }
    );

    it(
      "creates the production handoff service only when the endpoint is configured",
      () => {

        const service =
          createPosterBrainAiLearningDatasetHandoffServiceFromRuntimeEnv({
            database,

            environment: {
              POSTER_AI_TRAINING_HANDOFF_URL:
                "http://127.0.0.1:8080/v1/training-dataset/handoff",

              POSTER_AI_TRAINING_HANDOFF_TIMEOUT_MS:
                "120000",

              POSTER_AI_TRAINING_HANDOFF_PAGE_SIZE:
                "5000",
            },
          });

        expect(
          service
        ).not.toBeNull();

        expect(
          service
        ).toHaveProperty(
          "handoffReadySnapshot"
        );
      }
    );
  }
);