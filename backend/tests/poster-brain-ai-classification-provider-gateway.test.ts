import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainAiClassificationProviderGateway,
  createPosterBrainAiClassificationProviderGatewayWithResult,
  PosterBrainAiClassificationProviderTimeoutError,
  type PosterBrainAiClassificationProvider,
  type PosterBrainAiClassificationRequest,
} from "../src/application/poster-brain/ai-classification-provider-gateway.service.js";

const NOW =
  "2026-08-09T05:45:00.000Z";

const REQUEST:
  PosterBrainAiClassificationRequest = {
    sourceKey:
      "source-one",

    url:
      "https://publisher.example/story",

    title:
      "AI infrastructure market expands",

    excerpt:
      "Research labs and cloud providers expand AI infrastructure.",

    categories: [
      "Technology",
      "AI",
    ],

    publishedAt:
      "2026-08-09T05:30:00.000Z",
  };

function createClassification(input: {
  readonly provider: string;
  readonly primaryCategory?: string;
  readonly topics?: readonly string[];
  readonly confidence?: number;
}) {
  return {
    primaryCategory:
      input.primaryCategory ??
      "technology",

    topics:
      input.topics ??
      [
        "AI",
        "Infrastructure",
      ],

    confidence:
      input.confidence ??
      0.82,

    provider:
      input.provider,

    classifiedAt:
      NOW,
  };
}

describe(
  "Poster Brain AI classification provider gateway",
  () => {
    it(
      "uses the primary provider when it succeeds",
      async () => {
        const primaryClassify =
          vi.fn(
            async (_input: PosterBrainAiClassificationRequest) =>
              createClassification({
                provider:
                  "primary-ai",
                topics: [
                  "AI",
                  "AI",
                  "Infrastructure",
                ],
                confidence:
                  1.4,
              })
          );

        const fallbackClassify =
          vi.fn(
            async (_input: PosterBrainAiClassificationRequest) =>
              createClassification({
                provider:
                  "fallback-rules",
              })
          );

        const gateway =
          createPosterBrainAiClassificationProviderGatewayWithResult({
            primaryProvider: {
              classifyContent:
                primaryClassify,
            },

            fallbackProvider: {
              classifyContent:
                fallbackClassify,
            },

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
          primaryClassify
        ).toHaveBeenCalledWith(
          REQUEST
        );

        expect(
          fallbackClassify
        ).not.toHaveBeenCalled();

        expect(
          result
        ).toEqual({
          providerPath:
            "primary",

          classification: {
            primaryCategory:
              "technology",

            topics: [
              "AI",
              "Infrastructure",
            ],

            confidence:
              1,

            provider:
              "primary-ai",

            classifiedAt:
              NOW,
          },
        });
      }
    );

    it(
      "falls back when the primary provider throws",
      async () => {
        const failureRecorder =
          vi.fn();

        const primaryProvider:
          PosterBrainAiClassificationProvider = {
          async classifyContent() {
            throw new Error(
              "provider unavailable"
            );
          },
        };

        const fallbackProvider:
          PosterBrainAiClassificationProvider = {
          async classifyContent() {
            return createClassification({
              provider:
                "fallback-rules",
              confidence:
                0.4,
            });
          },
        };

        const gateway =
          createPosterBrainAiClassificationProviderGatewayWithResult({
            primaryProvider,
            fallbackProvider,
            timeoutMs:
              50,
            now:
              () =>
                NOW,
            onPrimaryProviderFailure:
              failureRecorder,
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
          "fallback-rules"
        );

        expect(
          failureRecorder
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            input:
              REQUEST,
            failedAt:
              NOW,
            reason:
              "error",
          })
        );
      }
    );

    it(
      "falls back when the primary provider times out",
      async () => {
        const primaryProvider:
          PosterBrainAiClassificationProvider = {
          async classifyContent() {
            return await new Promise(
              () => {}
            );
          },
        };

        const fallbackProvider:
          PosterBrainAiClassificationProvider = {
          async classifyContent() {
            return createClassification({
              provider:
                "fallback-rules",
            });
          },
        };

        const gateway =
          createPosterBrainAiClassificationProviderGatewayWithResult({
            primaryProvider,
            fallbackProvider,
            timeoutMs:
              1,
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
          "timeout"
        );

        expect(
          result.classification.provider
        ).toBe(
          "fallback-rules"
        );
      }
    );

    it(
      "uses fallback directly when no primary provider is configured",
      async () => {
        const fallbackClassify =
          vi.fn(
            async (_input: PosterBrainAiClassificationRequest) =>
              createClassification({
                provider:
                  "fallback-rules",
                primaryCategory:
                  "",
                topics:
                  [],
                confidence:
                  -1,
              })
          );

        const gateway =
          createPosterBrainAiClassificationProviderGatewayWithResult({
            fallbackProvider: {
              classifyContent:
                fallbackClassify,
            },

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
          result
        ).toEqual({
          providerPath:
            "fallback",

          fallbackReason:
            "missing-primary",

          classification: {
            primaryCategory:
              "general",

            topics: [
              "general",
            ],

            confidence:
              0,

            provider:
              "fallback-rules",

            classifiedAt:
              NOW,
          },
        });
      }
    );

    it(
      "exposes timeout errors for precise failure detection",
      () => {
        const error =
          new PosterBrainAiClassificationProviderTimeoutError(
            100
          );

        expect(
          error.name
        ).toBe(
          "PosterBrainAiClassificationProviderTimeoutError"
        );
      }
    );

    it(
      "can be consumed as a plain classification provider",
      async () => {
        const gateway =
          createPosterBrainAiClassificationProviderGateway({
            fallbackProvider: {
              async classifyContent() {
                return createClassification({
                  provider:
                    "fallback-rules",
                });
              },
            },

            timeoutMs:
              50,

            now:
              () =>
                NOW,
          });

        await expect(
          gateway.classifyContent(
            REQUEST
          )
        ).resolves.toEqual(
          createClassification({
            provider:
              "fallback-rules",
          })
        );
      }
    );
  }
);