import type {
  PosterBrainContentPersistencePlan,
  PosterBrainDiscoveryContentPersistenceInput,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainAiContentEmbeddingService,
} from "./ai-content-embedding.service.js";

import type {
  PosterBrainContentPersistenceRepository,
  PosterBrainContentPersistenceRepositoryResult,
} from "./content-persistence.repository.js";

const DEFAULT_EMBEDDING_CONCURRENCY =
  4;

const MAX_EMBEDDING_CONCURRENCY =
  16;

const MAX_EMBEDDING_TEXT_LENGTH =
  20000;

export interface PosterBrainAutomaticEmbeddingFailure {
  readonly contentId:
    string;

  readonly externalContentId:
    string;

  readonly error:
    unknown;
}

export interface PosterBrainEmbeddingContentPersistenceDependencies {
  readonly contentPersistenceRepository:
    PosterBrainContentPersistenceRepository;

  readonly embeddingService:
    PosterBrainAiContentEmbeddingService |
    null;

  readonly concurrency?:
    number;

  readonly onEmbeddingFailure?:
    (
      failure:
        PosterBrainAutomaticEmbeddingFailure
    ) => void;
}

interface EmbeddingJob {
  readonly contentId:
    string;

  readonly content:
    PosterBrainDiscoveryContentPersistenceInput;
}

function cleanSegment(
  value:
    string |
    null |
    undefined
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return value
    .normalize("NFKC")
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function uniqueSegments(
  values:
    readonly string[]
): readonly string[] {
  const result:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (const value of values) {
    const cleaned =
      cleanSegment(
        value
      );

    if (!cleaned) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    result.push(
      cleaned
    );
  }

  return result;
}

export function createPosterBrainContentEmbeddingText(
  content:
    PosterBrainDiscoveryContentPersistenceInput
): string {
  const topics =
    uniqueSegments([
      ...content.canonicalTopicIds,
      ...content.evolvingTopicIds,
    ]);

  const keywords =
    uniqueSegments([
      ...content.tags,
      ...content.searchKeywords,
    ]);

  const sections =
    [
      cleanSegment(
        content.title
      ),

      cleanSegment(
        content.excerpt
      ),

      cleanSegment(
        content.publisherName
      ),

      cleanSegment(
        content.category
      ),

      topics.length === 0
        ? ""
        : `Topics: ${topics.join(", ")}`,

      keywords.length === 0
        ? ""
        : `Keywords: ${keywords.join(", ")}`,
    ]
      .filter(
        value =>
          value.length > 0
      )
      .join(
        "\n"
      );

  return sections.slice(
    0,
    MAX_EMBEDDING_TEXT_LENGTH
  );
}

function isEligibleForEmbedding(
  content:
    PosterBrainDiscoveryContentPersistenceInput
): boolean {
  if (
    content.status !==
    "active"
  ) {
    return false;
  }

  const safetyStatus =
    content.aiClassification[
      "safetyStatus"
    ];

  if (
    safetyStatus ===
    "blocked"
  ) {
    return false;
  }

  return (
    createPosterBrainContentEmbeddingText(
      content
    ).length > 0
  );
}

function normalizeConcurrency(
  value:
    number |
    undefined
): number {
  if (
    value ===
    undefined
  ) {
    return DEFAULT_EMBEDDING_CONCURRENCY;
  }

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 1
  ) {
    throw new Error(
      "Poster Brain embedding concurrency must be a positive safe integer."
    );
  }

  return Math.min(
    value,
    MAX_EMBEDDING_CONCURRENCY
  );
}

async function embedJobs(input: {
  readonly jobs:
    readonly EmbeddingJob[];

  readonly service:
    PosterBrainAiContentEmbeddingService;

  readonly concurrency:
    number;

  readonly onEmbeddingFailure?:
    (
      failure:
        PosterBrainAutomaticEmbeddingFailure
    ) => void;
}): Promise<void> {
  if (
    input.jobs.length ===
    0
  ) {
    return;
  }

  let nextIndex =
    0;

  const workerCount =
    Math.min(
      input.concurrency,
      input.jobs.length
    );

  const workers =
    Array.from(
      {
        length:
          workerCount,
      },
      async () => {
        while (true) {
          const index =
            nextIndex;

          nextIndex +=
            1;

          const job =
            input.jobs[
              index
            ];

          if (
            job ===
            undefined
          ) {
            return;
          }

          try {
            await input.service.embedContent({
              contentId:
                job.contentId,

              text:
                createPosterBrainContentEmbeddingText(
                  job.content
                ),
            });
          }
          catch (error) {
            input.onEmbeddingFailure?.({
              contentId:
                job.contentId,

              externalContentId:
                job.content.externalContentId,

              error,
            });
          }
        }
      }
    );

  await Promise.all(
    workers
  );
}

export function createPosterBrainEmbeddingContentPersistenceRepository(
  dependencies:
    PosterBrainEmbeddingContentPersistenceDependencies
): PosterBrainContentPersistenceRepository {
  const concurrency =
    normalizeConcurrency(
      dependencies.concurrency
    );

  return {
    async persistPlan(
      plan:
        PosterBrainContentPersistencePlan
    ): Promise<
      PosterBrainContentPersistenceRepositoryResult
    > {
      const persistence =
        await dependencies
          .contentPersistenceRepository
          .persistPlan(
            plan
          );

      if (
        dependencies.embeddingService ===
        null
      ) {
        return persistence;
      }

      const jobs:
        EmbeddingJob[] =
        [];

      const count =
        Math.min(
          persistence
            .contentItemIds
            .length,

          plan
            .contentItems
            .length
        );

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const content =
          plan.contentItems[
            index
          ];

        const contentId =
          persistence.contentItemIds[
            index
          ];

        if (
          content ===
            undefined ||
          contentId ===
            undefined ||
          !isEligibleForEmbedding(
            content
          )
        ) {
          continue;
        }

        jobs.push({
          contentId,
          content,
        });
      }

      await embedJobs({
        jobs,

        service:
          dependencies.embeddingService,

        concurrency,

        ...(dependencies.onEmbeddingFailure ===
        undefined
          ? {}
          : {
              onEmbeddingFailure:
                dependencies.onEmbeddingFailure,
            }),
      });

      return persistence;
    },
  };
}