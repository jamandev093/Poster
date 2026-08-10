import type {
  PosterBrainDiscoveryContentPersistenceInput,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainEvolvingTopicLifecycleService,
} from "./evolving-topic-lifecycle.service.js";

import type {
  PosterBrainEvolvingTopicClassificationInput,
} from "./evolving-topic.types.js";

import type {
  PosterBrainClassifiedFeedIngestionRunner,
} from "./source-feed-job-executor.service.js";

export interface PosterBrainEvolvingTopicIngestionFailure {
  readonly externalContentId:
    string;

  readonly error:
    unknown;
}

export interface PosterBrainEvolvingTopicIngestionRunnerDependencies {
  readonly delegate:
    PosterBrainClassifiedFeedIngestionRunner;

  readonly lifecycleService:
    PosterBrainEvolvingTopicLifecycleService;

  readonly onObservationFailure?:
    (
      failure:
        PosterBrainEvolvingTopicIngestionFailure
    ) =>
      void;
}

function record(
  value:
    unknown
): Readonly<Record<string, unknown>> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Readonly<
    Record<string, unknown>
  >;
}

function text(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();

  return cleaned ||
    null;
}

function stringArray(
  value:
    unknown
): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (const item of value) {
    const cleaned =
      text(item);

    if (cleaned === null) {
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

    if (
      result.length >=
      12
    ) {
      break;
    }
  }

  return result;
}

function confidence(
  value:
    unknown
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function createObservationInput(
  content:
    PosterBrainDiscoveryContentPersistenceInput
): PosterBrainEvolvingTopicClassificationInput {
  const ai =
    record(
      content.aiClassification
    );

  const primaryCategory =
    text(
      ai["category"]
    ) ??
    content.category ??
    "general";

  const topics =
    stringArray(
      ai["topics"]
    );

  const classifiedAt =
    text(
      ai["classifiedAt"]
    ) ??
    content.discoveredAt;

  const modelKey =
    text(
      ai["model"]
    ) ??
    text(
      ai["version"]
    );

  return {
    externalContentId:
      content.externalContentId,

    /*
     * Evidence diversity represents independent content
     * sources rather than repeated calls to the same AI model.
     */
    providerKey:
      content.sourceKey,

    ...(modelKey === null
      ? {}
      : {
          modelKey,
        }),

    primaryCategory,

    canonicalTopicIds:
      content.canonicalTopicIds,

    evolvingTopicIds:
      content.evolvingTopicIds,

    topics:
      topics.length > 0
        ? topics
        : content.evolvingTopicIds,

    confidence:
      confidence(
        ai["confidence"]
      ),

    observedAt:
      classifiedAt,
  };
}

export function createPosterBrainEvolvingTopicIngestionRunner(
  dependencies:
    PosterBrainEvolvingTopicIngestionRunnerDependencies
): PosterBrainClassifiedFeedIngestionRunner {
  return {
    async ingestClassifiedFeed(
      input
    ) {
      /*
       * Locked content ingestion remains authoritative and runs
       * first. Evolving-topic state is downstream only.
       */
      const result =
        await dependencies
          .delegate
          .ingestClassifiedFeed(
            input
          );

      const contentItems =
        result.persistencePlan
          ?.contentItems ??
        [];

      for (
        const content
        of contentItems
      ) {
        try {
          await dependencies
            .lifecycleService
            .observeClassification(
              createObservationInput(
                content
              )
            );
        }
        catch (error) {
          /*
           * Taxonomy-learning failure must never cause already
           * persisted discovery content to be reported failed.
           */
          dependencies
            .onObservationFailure
            ?.({
              externalContentId:
                content.externalContentId,

              error,
            });
        }
      }

      return result;
    },
  };
}