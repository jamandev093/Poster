import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainRuleBasedAiClassificationProvider,
} from "../src/application/poster-brain/rule-based-ai-classification-provider.service.js";

import type {
  PosterBrainContentClassificationResult,
} from "../src/domains/poster-brain/index.js";

const NOW =
  "2026-08-09T06:15:00.000Z";

describe(
  "Poster Brain rule-based AI classification provider",
  () => {
    it(
      "adapts the existing rule classifier into the AI provider contract",
      async () => {
        const provider =
          createPosterBrainRuleBasedAiClassificationProvider({
            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent({
            sourceKey:
              "example-news",

            url:
              "https://publisher.example/ai-policy",

            title:
              "AI policy infrastructure expands",

            excerpt:
              "AI labs and cloud providers expand policy and infrastructure planning.",

            categories: [
              "AI",
              "Policy",
            ],

            publishedAt:
              "2026-08-09T05:55:00.000Z",
          });

        expect(
          result.primaryCategory
        ).toBe(
          "AI"
        );

        expect(
          result.topics
        ).toContain(
          "ai"
        );

        expect(
          result.topics
        ).toContain(
          "policy"
        );

        expect(
          result.confidence
        ).toBeGreaterThan(
          0.5
        );

        expect(
          result.provider
        ).toBe(
          "poster_rule_seed"
        );

        expect(
          result.model
        ).toBe(
          "s02m"
        );

        expect(
          result.classifiedAt
        ).toBe(
          NOW
        );
      }
    );

    it(
      "keeps unknown safe content valid for fallback AI classification",
      async () => {
        const provider =
          createPosterBrainRuleBasedAiClassificationProvider({
            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent({
            sourceKey:
              "local-news",

            url:
              "https://publisher.example/community-garden",

            title:
              "Local community garden opens",

            excerpt:
              "Residents opened a new community garden.",

            categories:
              [],

            publishedAt:
              null,
          });

        expect(
          result.primaryCategory
        ).toBe(
          "general"
        );

        expect(
          result.topics
        ).toEqual([
          "general",
        ]);

        expect(
          result.confidence
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          result.provider
        ).toBe(
          "poster_rule_seed"
        );
      }
    );

    it(
      "supports injected classification services for gateway tests and future AI composition",
      async () => {
        const classifyItem =
          vi
            .fn()
            .mockReturnValue({
              category:
                "Science",

              canonicalTopicIds: [
                "science",
              ],

              evolvingTopicIds: [
                "space",
              ],

              confidence:
                0.7,

              qualityScore:
                0.8,

              safetyStatus:
                "safe",

              reasons:
                [],

              aiClassification: {
                provider:
                  "poster_rule_seed",

                version:
                  "test-model",

                status:
                  "classified",

                category:
                  "Science",

                safetyStatus:
                  "safe",

                qualityScore:
                  0.8,
              },
            } as unknown as PosterBrainContentClassificationResult);

        const provider =
          createPosterBrainRuleBasedAiClassificationProvider({
            contentClassificationService: {
              classifyItem,
            },

            now:
              () =>
                NOW,
          });

        const result =
          await provider.classifyContent({
            sourceKey:
              "science-news",

            url:
              "https://publisher.example/space",

            title:
              "Space telescope detects new signal",
          });

        expect(
          classifyItem
        ).toHaveBeenCalledOnce();

        expect(
          result
        ).toEqual({
          primaryCategory:
            "Science",

          topics: [
            "science",
            "space",
          ],

          confidence:
            0.7,

          provider:
            "poster_rule_seed",

          model:
            "test-model",

          classifiedAt:
            NOW,
        });
      }
    );
  }
);