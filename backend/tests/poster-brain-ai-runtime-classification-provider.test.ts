import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_AI_DEFAULT_CLASSIFICATION_TIMEOUT_MS,
  createPosterBrainAiClassificationProviderFromRuntimeEnv,
  createPosterBrainAiRuntimeConfiguration,
} from "../src/application/poster-brain/ai-runtime-classification-provider.service.js";

import type {
  PosterBrainAiClassificationHttpFetch,
} from "../src/application/poster-brain/ai-http-classification-provider.service.js";

const NOW =
  "2026-08-09T12:30:00.000Z";

const REQUEST =
  {
    sourceKey:
      "example-news",

    url:
      "https://publisher.example/ai-infrastructure",

    title:
      "AI infrastructure expands",

    excerpt:
      "Cloud providers expand AI infrastructure.",

    categories: [
      "AI",
      "Technology",
    ],

    publishedAt:
      "2026-08-09T12:00:00.000Z",
  };

describe(
  "Poster Brain AI runtime classification provider",
  () => {
    it(
      "uses safe runtime defaults when the Python AI endpoint is not configured",
      () => {
        expect(
          createPosterBrainAiRuntimeConfiguration({
            POSTER_AI_CLASSIFICATION_URL:
              "  ",

            POSTER_AI_CLASSIFICATION_TIMEOUT_MS:
              "invalid",

            POSTER_AI_API_KEY:
              " ",

            POSTER_AI_DEFAULT_MODEL:
              "",
          })
        ).toEqual({
          endpointUrl:
            null,

          timeoutMs:
            POSTER_BRAIN_AI_DEFAULT_CLASSIFICATION_TIMEOUT_MS,
        });
      }
    );

    it(
      "uses rule-based classification when no Python AI endpoint is configured",
      async () => {
        let fetchCalled =
          false;

        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch =
            async () => {
              fetchCalled =
                true;

              throw new Error(
                "HTTP provider must not run."
              );
            };

        const provider =
          createPosterBrainAiClassificationProviderFromRuntimeEnv({
            environment:
              {},

            fetchImplementation,

            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent(
            REQUEST
          );

        expect(
          fetchCalled
        ).toBe(
          false
        );

        expect(
          result.provider
        ).toBe(
          "poster_rule_seed"
        );
      }
    );

    it(
      "uses the configured Python AI HTTP provider as primary",
      async () => {
        const requestedUrls:
          string[] =
          [];

        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch =
            async url => {
              requestedUrls.push(
                url
              );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return {
                    primaryCategory:
                      "technology",

                    topics: [
                      "AI",
                      "Infrastructure",
                    ],

                    confidence:
                      0.88,

                    provider:
                      "poster-python-ai",

                    model:
                      "poster-rule-classifier-v1",

                    classifiedAt:
                      NOW,
                  };
                },
              };
            };

        const provider =
          createPosterBrainAiClassificationProviderFromRuntimeEnv({
            environment: {
              POSTER_AI_CLASSIFICATION_URL:
                "http://127.0.0.1:8080/v1/classify",

              POSTER_AI_CLASSIFICATION_TIMEOUT_MS:
                "2500",
            },

            fetchImplementation,

            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent(
            REQUEST
          );

        expect(
          requestedUrls
        ).toEqual([
          "http://127.0.0.1:8080/v1/classify",
        ]);

        expect(
          result.provider
        ).toBe(
          "poster-python-ai"
        );

        expect(
          result.primaryCategory
        ).toBe(
          "technology"
        );
      }
    );

    it(
      "falls back to rule classification when the Python AI service fails",
      async () => {
        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch =
            async () => ({
              ok:
                false,

              status:
                503,

              async json() {
                return {};
              },

              async text() {
                return "AI service unavailable";
              },
            });

        const provider =
          createPosterBrainAiClassificationProviderFromRuntimeEnv({
            environment: {
              POSTER_AI_CLASSIFICATION_URL:
                "http://127.0.0.1:8080/v1/classify",

              POSTER_AI_CLASSIFICATION_TIMEOUT_MS:
                "100",
            },

            fetchImplementation,

            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent(
            REQUEST
          );

        expect(
          result.provider
        ).toBe(
          "poster_rule_seed"
        );
      }
    );

    it(
      "rejects invalid configured AI service URLs",
      () => {
        expect(
          () =>
            createPosterBrainAiRuntimeConfiguration({
              POSTER_AI_CLASSIFICATION_URL:
                "file:///tmp/poster-ai",
            })
        ).toThrow(
          "POSTER_AI_CLASSIFICATION_URL must use HTTP or HTTPS."
        );
      }
    );
  }
);