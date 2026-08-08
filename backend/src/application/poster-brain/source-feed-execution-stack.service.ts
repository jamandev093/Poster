import {
  createPosterBrainFetchFeedHttpClient,
  type PosterBrainFeedFetchImplementation,
} from "./feed-http-client.service.js";

import {
  createPosterBrainFeedXmlHttpFetcher,
  type PosterBrainFeedXmlHttpFetcherOptions,
  type PosterBrainFeedHttpClient,
} from "./feed-xml-http-fetcher.service.js";

import {
  createPosterBrainSourceFeedBatchRunnerService,
  type PosterBrainSourceFeedBatchRunnerService,
} from "./source-feed-batch-runner.service.js";

import {
  createPosterBrainSourceFeedJobExecutorService,
  type PosterBrainClassifiedFeedIngestionRunner,
  type PosterBrainFeedXmlFetcher,
  type PosterBrainSourceFeedJobExecutorService,
} from "./source-feed-job-executor.service.js";

export interface PosterBrainSourceFeedExecutionStackDependencies {
  readonly fetchImplementation: PosterBrainFeedFetchImplementation;
  readonly classifiedFeedIngestionRunner:
    PosterBrainClassifiedFeedIngestionRunner;
  readonly now: () => string;
  readonly feedFetcherOptions?: PosterBrainFeedXmlHttpFetcherOptions;
}

export interface PosterBrainSourceFeedExecutionStack {
  readonly feedHttpClient: PosterBrainFeedHttpClient;
  readonly feedXmlFetcher: PosterBrainFeedXmlFetcher;
  readonly sourceFeedJobExecutor:
    PosterBrainSourceFeedJobExecutorService;
  readonly sourceFeedBatchRunner:
    PosterBrainSourceFeedBatchRunnerService;
}

export function createPosterBrainSourceFeedExecutionStack(
  dependencies: PosterBrainSourceFeedExecutionStackDependencies
): PosterBrainSourceFeedExecutionStack {
  const feedHttpClient =
    createPosterBrainFetchFeedHttpClient({
      fetchImplementation:
        dependencies.fetchImplementation,
    });

  const feedXmlFetcher =
    dependencies.feedFetcherOptions === undefined
      ? createPosterBrainFeedXmlHttpFetcher({
          httpClient:
            feedHttpClient,
          now:
            dependencies.now,
        })
      : createPosterBrainFeedXmlHttpFetcher({
          httpClient:
            feedHttpClient,
          now:
            dependencies.now,
          options:
            dependencies.feedFetcherOptions,
        });

  const sourceFeedJobExecutor =
    createPosterBrainSourceFeedJobExecutorService({
      feedXmlFetcher,
      classifiedFeedIngestionRunner:
        dependencies.classifiedFeedIngestionRunner,
    });

  const sourceFeedBatchRunner =
    createPosterBrainSourceFeedBatchRunnerService({
      sourceFeedJobExecutor,
    });

  return {
    feedHttpClient,
    feedXmlFetcher,
    sourceFeedJobExecutor,
    sourceFeedBatchRunner,
  };
}