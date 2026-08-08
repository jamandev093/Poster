import type {
  PosterBrainContentPersistencePlan,
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

export type PosterBrainSourceFeedJobStatus =
  | "succeeded"
  | "failed";

export type PosterBrainSourceFeedJobFailureStage =
  | "fetch"
  | "validation"
  | "ingestion";

export interface PosterBrainFeedXmlFetchResult {
  readonly status: PosterBrainSourceFeedJobStatus;
  readonly feedXml: string | null;
  readonly fetchedAt: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
}

export interface PosterBrainFeedXmlFetcher {
  fetchFeedXml(input: {
    readonly source: PosterBrainRssSource;
  }): Promise<PosterBrainFeedXmlFetchResult>;
}

export interface PosterBrainClassifiedFeedIngestionResult {
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
  readonly persistencePlan: PosterBrainContentPersistencePlan | null;
}

export interface PosterBrainClassifiedFeedIngestionRunner {
  ingestClassifiedFeed(input: {
    readonly source: PosterBrainRssSource;
    readonly feedXml: string;
    readonly discoveredAt: string;
  }): Promise<PosterBrainClassifiedFeedIngestionResult>;
}

export interface PosterBrainSourceFeedJobExecutorInput {
  readonly source: PosterBrainRssSource;
  readonly discoveredAt: string;
}

export interface PosterBrainSourceFeedJobExecutorResult {
  readonly sourceKey: string;
  readonly status: PosterBrainSourceFeedJobStatus;
  readonly failureStage: PosterBrainSourceFeedJobFailureStage | null;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly persistedCount: number;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly fetchedAt: string | null;
  readonly persistencePlan: PosterBrainContentPersistencePlan | null;
}

export interface PosterBrainSourceFeedJobExecutorService {
  executeSourceFeedJob(
    input: PosterBrainSourceFeedJobExecutorInput
  ): Promise<PosterBrainSourceFeedJobExecutorResult>;
}

export interface PosterBrainSourceFeedJobExecutorDependencies {
  readonly feedXmlFetcher: PosterBrainFeedXmlFetcher;
  readonly classifiedFeedIngestionRunner:
    PosterBrainClassifiedFeedIngestionRunner;
}

function createFailedResult(input: {
  readonly sourceKey: string;
  readonly failureStage: PosterBrainSourceFeedJobFailureStage;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly fetchedAt: string | null;
}): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey:
      input.sourceKey,
    status:
      "failed",
    failureStage:
      input.failureStage,
    acceptedCount:
      0,
    rejectedCount:
      0,
    persistedCount:
      0,
    errorCode:
      input.errorCode,
    errorMessage:
      input.errorMessage,
    fetchedAt:
      input.fetchedAt,
    persistencePlan:
      null,
  };
}

function createSucceededResult(input: {
  readonly sourceKey: string;
  readonly fetchedAt: string | null;
  readonly ingestionResult: PosterBrainClassifiedFeedIngestionResult;
}): PosterBrainSourceFeedJobExecutorResult {
  return {
    sourceKey:
      input.sourceKey,
    status:
      "succeeded",
    failureStage:
      null,
    acceptedCount:
      input.ingestionResult.acceptedCount,
    rejectedCount:
      input.ingestionResult.rejectedCount,
    persistedCount:
      input.ingestionResult.persistedCount,
    errorCode:
      null,
    errorMessage:
      null,
    fetchedAt:
      input.fetchedAt,
    persistencePlan:
      input.ingestionResult.persistencePlan,
  };
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown Poster Brain source feed job failure.";
}

export function createPosterBrainSourceFeedJobExecutorService(
  dependencies: PosterBrainSourceFeedJobExecutorDependencies
): PosterBrainSourceFeedJobExecutorService {
  return {
    async executeSourceFeedJob(input) {
      const fetched =
        await dependencies.feedXmlFetcher.fetchFeedXml({
          source:
            input.source,
        });

      if (fetched.status === "failed") {
        return createFailedResult({
          sourceKey:
            input.source.sourceKey,
          failureStage:
            "fetch",
          errorCode:
            fetched.errorCode ?? "feed_fetch_failed",
          errorMessage:
            fetched.errorMessage ?? "Poster Brain feed fetch failed.",
          fetchedAt:
            fetched.fetchedAt,
        });
      }

      const feedXml =
        fetched.feedXml?.trim() ?? "";

      if (!feedXml) {
        return createFailedResult({
          sourceKey:
            input.source.sourceKey,
          failureStage:
            "validation",
          errorCode:
            "empty_feed_xml",
          errorMessage:
            "Poster Brain feed XML was empty.",
          fetchedAt:
            fetched.fetchedAt,
        });
      }

      try {
        const ingestionResult =
          await dependencies
            .classifiedFeedIngestionRunner
            .ingestClassifiedFeed({
              source:
                input.source,
              feedXml,
              discoveredAt:
                input.discoveredAt,
            });

        return createSucceededResult({
          sourceKey:
            input.source.sourceKey,
          fetchedAt:
            fetched.fetchedAt,
          ingestionResult,
        });
      } catch (error) {
        return createFailedResult({
          sourceKey:
            input.source.sourceKey,
          failureStage:
            "ingestion",
          errorCode:
            "classified_feed_ingestion_failed",
          errorMessage:
            normalizeErrorMessage(error),
          fetchedAt:
            fetched.fetchedAt,
        });
      }
    },
  };
}