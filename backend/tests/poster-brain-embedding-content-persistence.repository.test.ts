import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainContentEmbeddingText,
  createPosterBrainEmbeddingContentPersistenceRepository,
} from "../src/application/poster-brain/embedding-content-persistence.repository.js";

import type {
  PosterBrainAiContentEmbeddingInput,
  PosterBrainAiContentEmbeddingService,
} from "../src/application/poster-brain/ai-content-embedding.service.js";

import type {
  PosterBrainContentPersistenceRepository,
} from "../src/application/poster-brain/content-persistence.repository.js";

import type {
  PosterBrainContentPersistencePlan,
} from "../src/domains/poster-brain/index.js";

const CONTENT_ID =
  "11111111-1111-4111-8111-111111111111";

function createPlan(input?: {
  readonly blocked?:
    boolean;
}): PosterBrainContentPersistencePlan {
  return {
    contentItems: [
      {
        externalContentId:
          "science:story-1",

        title:
          "NASA scientists discover a new exoplanet",

        excerpt:
          "Researchers identified a distant world using new telescope observations.",

        publisherName:
          "Example Science",

        category:
          "Space & Astronomy",

        canonicalTopicIds: [
          "space",
          "astronomy",
        ],

        evolvingTopicIds: [
          "exoplanets",
        ],

        tags: [
          "NASA",
          "science",
        ],

        searchKeywords: [
          "new exoplanet",
        ],

        status:
          "active",

        aiClassification: {
          safetyStatus:
            input?.blocked === true
              ? "blocked"
              : "safe",
        },
      },
    ],
  } as unknown as
    PosterBrainContentPersistencePlan;
}

function createBaseRepository():
  PosterBrainContentPersistenceRepository {
  return {
    async persistPlan() {
      return {
        sourceId:
          "source-1",

        publisherDomainIds: [
          "publisher-1",
        ],

        contentItemIds: [
          CONTENT_ID,
        ],

        persistedContentCount:
          1,
      };
    },
  };
}

function createEmbeddingRecorder() {
  const calls:
    PosterBrainAiContentEmbeddingInput[] =
      [];

  const service:
    PosterBrainAiContentEmbeddingService = {
      async embedContent(
        input
      ) {
        calls.push(
          input
        );

        return {
          contentId:
            input.contentId,

          embedded:
            true,

          persisted:
            true,

          provider:
            "poster-python-ai",

          model:
            "sentence-transformers/all-MiniLM-L6-v2",

          dimensions:
            384,

          generatedAt:
            "2026-08-10T08:00:00.000Z",

          reason:
            null,

          embeddingReference:
            "22222222-2222-4222-8222-222222222222",
        };
      },
    };

  return {
    service,
    calls,
  };
}

describe(
  "Poster Brain automatic content embedding persistence",
  () => {

    it(
      "embeds newly persisted eligible content automatically",
      async () => {
        const embedding =
          createEmbeddingRecorder();

        const repository =
          createPosterBrainEmbeddingContentPersistenceRepository({
            contentPersistenceRepository:
              createBaseRepository(),

            embeddingService:
              embedding.service,
          });

        const result =
          await repository.persistPlan(
            createPlan()
          );

        expect(
          result.persistedContentCount
        ).toBe(
          1
        );

        expect(
          embedding.calls
        ).toHaveLength(
          1
        );

        expect(
          embedding.calls[0]?.contentId
        ).toBe(
          CONTENT_ID
        );

        expect(
          embedding.calls[0]?.text
        ).toContain(
          "NASA scientists discover a new exoplanet"
        );

        expect(
          embedding.calls[0]?.text
        ).toContain(
          "Space & Astronomy"
        );

        expect(
          embedding.calls[0]?.text
        ).toContain(
          "exoplanets"
        );
      }
    );

    it(
      "does not embed blocked content",
      async () => {
        const embedding =
          createEmbeddingRecorder();

        const repository =
          createPosterBrainEmbeddingContentPersistenceRepository({
            contentPersistenceRepository:
              createBaseRepository(),

            embeddingService:
              embedding.service,
          });

        await repository.persistPlan(
          createPlan({
            blocked:
              true,
          })
        );

        expect(
          embedding.calls
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "keeps ingestion successful when embedding fails",
      async () => {
        const failures:
          string[] =
          [];

        const embeddingService:
          PosterBrainAiContentEmbeddingService = {
            async embedContent() {
              throw new Error(
                "AI unavailable"
              );
            },
          };

        const repository =
          createPosterBrainEmbeddingContentPersistenceRepository({
            contentPersistenceRepository:
              createBaseRepository(),

            embeddingService,

            onEmbeddingFailure(
              failure
            ) {
              failures.push(
                failure.contentId
              );
            },
          });

        const result =
          await repository.persistPlan(
            createPlan()
          );

        expect(
          result.persistedContentCount
        ).toBe(
          1
        );

        expect(
          failures
        ).toEqual([
          CONTENT_ID,
        ]);
      }
    );

    it(
      "preserves normal persistence when embedding runtime is disabled",
      async () => {
        const repository =
          createPosterBrainEmbeddingContentPersistenceRepository({
            contentPersistenceRepository:
              createBaseRepository(),

            embeddingService:
              null,
          });

        const result =
          await repository.persistPlan(
            createPlan()
          );

        expect(
          result.persistedContentCount
        ).toBe(
          1
        );
      }
    );

    it(
      "builds bounded semantic text from discovery metadata",
      () => {
        const content =
          createPlan()
            .contentItems[0];

        expect(
          content
        ).toBeDefined();

        if (!content) {
          throw new Error(
            "Expected content."
          );
        }

        const text =
          createPosterBrainContentEmbeddingText(
            content
          );

        expect(
          text
        ).toContain(
          "Topics: space, astronomy, exoplanets"
        );

        expect(
          text
        ).toContain(
          "Keywords: NASA, science, new exoplanet"
        );

        expect(
          text.length
        ).toBeLessThanOrEqual(
          20000
        );
      }
    );
  }
);