import assert from "node:assert/strict";

import {
  createPosterBrainAiClassificationProviderFromRuntimeEnv,
} from "../dist/application/poster-brain/ai-runtime-classification-provider.service.js";

const liveClassificationUrl =
  process.env.POSTER_AI_SMOKE_CLASSIFICATION_URL ??
  "http://127.0.0.1:18080/v1/classify";

const request = {
  sourceKey:
    "poster-ai-smoke",

  url:
    "https://publisher.example/ai-cloud-infrastructure",

  title:
    "AI infrastructure expands across cloud platforms",

  excerpt:
    "Cloud providers are expanding AI infrastructure and compute capacity.",

  categories: [
    "AI",
    "Technology",
  ],

  publishedAt:
    "2026-08-09T13:30:00.000Z",
};

const liveProvider =
  createPosterBrainAiClassificationProviderFromRuntimeEnv({
    environment: {
      POSTER_AI_CLASSIFICATION_URL:
        liveClassificationUrl,

      POSTER_AI_CLASSIFICATION_TIMEOUT_MS:
        "3000",
    },
  });

const liveResult =
  await liveProvider.classifyContent(
    request
  );

assert.notEqual(
  liveResult.provider,
  "poster_rule_seed",
  "Expected the live classification to come from the Python AI HTTP service, but Backend used the rule fallback."
);

assert.equal(
  typeof liveResult.primaryCategory,
  "string"
);

assert.ok(
  liveResult.primaryCategory.trim().length > 0,
  "Python AI response must contain a primary category."
);

assert.equal(
  typeof liveResult.confidence,
  "number"
);

assert.ok(
  liveResult.confidence >= 0 &&
    liveResult.confidence <= 1,
  "Python AI confidence must be between 0 and 1."
);

const fallbackProvider =
  createPosterBrainAiClassificationProviderFromRuntimeEnv({
    environment: {
      POSTER_AI_CLASSIFICATION_URL:
        "http://127.0.0.1:1/v1/classify",

      POSTER_AI_CLASSIFICATION_TIMEOUT_MS:
        "250",
    },
  });

const fallbackResult =
  await fallbackProvider.classifyContent(
    request
  );

assert.equal(
  fallbackResult.provider,
  "poster_rule_seed",
  "Expected Backend to use the rule fallback when the Python AI service is unavailable."
);

console.log("");
console.log("========== POSTER AI RUNTIME HTTP SMOKE ==========");

console.log(
  JSON.stringify(
    {
      livePythonAi: {
        passed:
          true,

        provider:
          liveResult.provider,

        model:
          liveResult.model ?? null,

        primaryCategory:
          liveResult.primaryCategory,

        confidence:
          liveResult.confidence,
      },

      unavailablePythonAiFallback: {
        passed:
          true,

        provider:
          fallbackResult.provider,

        primaryCategory:
          fallbackResult.primaryCategory,
      },
    },
    null,
    2
  )
);

console.log("");
console.log("REAL BACKEND -> PYTHON AI HTTP: PASS");
console.log("BACKEND RULE FALLBACK: PASS");