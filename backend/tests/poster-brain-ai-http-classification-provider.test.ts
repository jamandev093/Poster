import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainAiClassificationProviderGatewayWithResult,
} from "../src/application/poster-brain/ai-classification-provider-gateway.service.js";

import {
  createPosterBrainAiHttpClassificationProvider,
  PosterBrainAiHttpClassificationProviderError,
  type PosterBrainAiClassificationHttpFetch,
  type PosterBrainAiClassificationHttpFetchRequest,
} from "../src/application/poster-brain/ai-http-classification-provider.service.js";

import {
  createPosterBrainRuleBasedAiClassificationProvider,
} from "../src/application/poster-brain/rule-based-ai-classification-provider.service.js";

const NOW =
  "2026-08-09T06:45:00.000Z";

const REQUEST =
  {
    sourceKey:
      "source-one",

    url:
      "https://publisher.example/ai-story",

    title:
      "AI infrastructure expands",

    excerpt:
      "Cloud providers expand AI infrastructure.",

    categories: [
      "AI",
      "Infrastructure",
    ],

    publishedAt:
      "2026-08-09T06:40:00.000Z",
  };

describe(
  "Poster Brain AI HTTP classification provider",
  () => {
    it(
      "posts classification requests to the configured AI service endpoint",
      async () => {
        const calls:
          {
            readonly url: string;
            readonly init: PosterBrainAiClassificationHttpFetchRequest;
          }[] =
          [];

        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch = async (url, init) => {
            calls.push({
              url,
              init,
            });

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return {
                  primaryCategory:
                    "Technology",

                  topics: [
                    "AI",
                    "Infrastructure",
                    "AI",
                  ],

                  confidence:
                    1.2,

                  provider:
                    "poster-python-ai",

                  model:
                    "poster-ai-v1",

                  classifiedAt:
                    "2026-08-09T06:45:01.000Z",
                };
              },
            };
          };

        const provider =
          createPosterBrainAiHttpClassificationProvider({
            endpointUrl:
              "http://poster-ai.internal/classify",

            apiKey:
              "test-key",

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
          calls
        ).toHaveLength(
          1
        );

        expect(
          calls[0]?.url
        ).toBe(
          "http://poster-ai.internal/classify"
        );

        expect(
          calls[0]?.init.headers.authorization
        ).toBe(
          "Bearer test-key"
        );

        expect(
          JSON.parse(
            calls[0]?.init.body ?? "{}"
          )
        ).toEqual(
          REQUEST
        );

        expect(
          result
        ).toEqual({
          primaryCategory:
            "Technology",

          topics: [
            "AI",
            "Infrastructure",
          ],

          confidence:
            1,

          provider:
            "poster-python-ai",

          model:
            "poster-ai-v1",

          classifiedAt:
            "2026-08-09T06:45:01.000Z",
        });
      }
    );

    it(
      "throws a typed error when the AI service returns a non-success response",
      async () => {
        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch = async () => ({
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
          createPosterBrainAiHttpClassificationProvider({
            endpointUrl:
              "http://poster-ai.internal/classify",

            fetchImplementation,

            now:
              () =>
                NOW,
          });

        await expect(
          provider.classifyContent(
            REQUEST
          )
        ).rejects.toMatchObject({
          name:
            "PosterBrainAiHttpClassificationProviderError",

          status:
            503,
        });
      }
    );

    it(
      "normalizes category aliases and default model metadata",
      async () => {
        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch = async () => ({
            ok:
              true,

            status:
              200,

            async json() {
              return {
                category:
                  "Science",

                topics:
                  [],

                confidence:
                  0.64,
              };
            },
          });

        const provider =
          createPosterBrainAiHttpClassificationProvider({
            endpointUrl:
              "http://poster-ai.internal/classify",

            fetchImplementation,

            now:
              () =>
                NOW,

            providerName:
              "poster-ai-http",

            defaultModel:
              "fallback-model-id",
          });

        await expect(
          provider.classifyContent(
            REQUEST
          )
        ).resolves.toEqual({
          primaryCategory:
            "Science",

          topics: [
            "science",
          ],

          confidence:
            0.64,

          provider:
            "poster-ai-http",

          model:
            "fallback-model-id",

          classifiedAt:
            NOW,
        });
      }
    );

    it(
      "works as the primary provider in the gateway and falls back to rule-based classification on failure",
      async () => {
        const fetchImplementation:
          PosterBrainAiClassificationHttpFetch = async () => ({
            ok:
              false,

            status:
              504,

            async json() {
              return {};
            },

            async text() {
              return "timeout from upstream";
            },
          });

        const primaryProvider =
          createPosterBrainAiHttpClassificationProvider({
            endpointUrl:
              "http://poster-ai.internal/classify",

            fetchImplementation,

            now:
              () =>
                NOW,
          });

        const fallbackProvider =
          createPosterBrainRuleBasedAiClassificationProvider({
            now:
              () =>
                NOW,
          });

        const gateway =
          createPosterBrainAiClassificationProviderGatewayWithResult({
            primaryProvider,
            fallbackProvider,
            timeoutMs:
              50,
            now:
              () =>
                NOW,
          });

        const result =
          await gateway.classifyContent(
            REQUEST
          );

        expect(
          result.providerPath
        ).toBe(
          "fallback"
        );

        expect(
          result.fallbackReason
        ).toBe(
          "error"
        );

        expect(
          result.classification.provider
        ).toBe(
          "poster_rule_seed"
        );
      }
    );

    it(
      "exposes typed provider errors",
      () => {
        const error =
          new PosterBrainAiHttpClassificationProviderError({
            message:
              "failed",
            status:
              500,
          });

        expect(
          error.status
        ).toBe(
          500
        );
      }
    );
  }
);