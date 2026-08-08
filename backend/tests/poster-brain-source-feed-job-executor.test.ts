import { describe, expect, it } from "vitest";

import {
  createPosterBrainSourceFeedJobExecutorService,
  type PosterBrainClassifiedFeedIngestionRunner,
  type PosterBrainFeedXmlFetcher,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainContentPersistencePlan,
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const source: PosterBrainRssSource = {
  sourceKey: "example-news",
  sourceName: "Example News",
  homepageUrl: "https://www.example.com",
  feedUrl: "https://www.example.com/rss.xml",
  publisherName: "Example News",
  defaultLanguage: "en",
  defaultRegion: "IN",
  acquisitionMethod: "authorized_rss",
};

const persistencePlan: PosterBrainContentPersistencePlan = {
  source: {
    sourceKey: "example-news",
    displayName: "Example News",
    homepageUrl: "https://www.example.com",
    primaryDomain: "example.com",
    acquisitionMethod: "authorized_rss",
    status: "active",
    languageCode: "en",
    regionCode: "IN",
    syncPolicy: {
      feedUrl: "https://www.example.com/rss.xml",
    },
    copyrightPolicy: {
      originalPublisherUrlRequired: true,
      fullArticleBodyStorageAllowed: false,
    },
    metadata: {
      publisherName: "Example News",
    },
  },
  publisherDomains: [],
  contentItems: [],
};

class SuccessfulFetcher implements PosterBrainFeedXmlFetcher {
  readonly calls: PosterBrainRssSource[] = [];

  async fetchFeedXml(input: {
    readonly source: PosterBrainRssSource;
  }) {
    this.calls.push(input.source);

    return {
      status: "succeeded" as const,
      feedXml: "<rss><channel><item><title>AI policy</title></item></channel></rss>",
      fetchedAt: "2026-08-08T12:00:00.000Z",
      errorCode: null,
      errorMessage: null,
    };
  }
}

class FailedFetcher implements PosterBrainFeedXmlFetcher {
  async fetchFeedXml() {
    return {
      status: "failed" as const,
      feedXml: null,
      fetchedAt: "2026-08-08T12:00:00.000Z",
      errorCode: "http_500",
      errorMessage: "Publisher feed returned HTTP 500.",
    };
  }
}

class RecordingIngestionRunner
  implements PosterBrainClassifiedFeedIngestionRunner {
  readonly calls: Array<{
    readonly source: PosterBrainRssSource;
    readonly feedXml: string;
    readonly discoveredAt: string;
  }> = [];

  async ingestClassifiedFeed(input: {
    readonly source: PosterBrainRssSource;
    readonly feedXml: string;
    readonly discoveredAt: string;
  }) {
    this.calls.push(input);

    return {
      acceptedCount: 2,
      rejectedCount: 1,
      persistedCount: 2,
      persistencePlan,
    };
  }
}

class FailingIngestionRunner
  implements PosterBrainClassifiedFeedIngestionRunner {
  async ingestClassifiedFeed(): Promise<never> {
    throw new Error("Persistence unavailable.");
  }
}

describe("Poster Brain source feed job executor", () => {
  it("fetches feed XML and runs classified feed ingestion", async () => {
    const fetcher =
      new SuccessfulFetcher();
    const runner =
      new RecordingIngestionRunner();

    const service =
      createPosterBrainSourceFeedJobExecutorService({
        feedXmlFetcher:
          fetcher,
        classifiedFeedIngestionRunner:
          runner,
      });

    const result =
      await service.executeSourceFeedJob({
        source,
        discoveredAt: "2026-08-08T12:30:00.000Z",
      });

    expect(result).toMatchObject({
      sourceKey: "example-news",
      status: "succeeded",
      failureStage: null,
      acceptedCount: 2,
      rejectedCount: 1,
      persistedCount: 2,
      errorCode: null,
    });
    expect(fetcher.calls).toEqual([source]);
    expect(runner.calls[0]).toMatchObject({
      source,
      discoveredAt: "2026-08-08T12:30:00.000Z",
    });
    expect(runner.calls[0]?.feedXml).toContain("<rss>");
  });

  it("returns fetch failure without running ingestion", async () => {
    const runner =
      new RecordingIngestionRunner();

    const service =
      createPosterBrainSourceFeedJobExecutorService({
        feedXmlFetcher:
          new FailedFetcher(),
        classifiedFeedIngestionRunner:
          runner,
      });

    const result =
      await service.executeSourceFeedJob({
        source,
        discoveredAt: "2026-08-08T12:30:00.000Z",
      });

    expect(result).toMatchObject({
      status: "failed",
      failureStage: "fetch",
      errorCode: "http_500",
      errorMessage: "Publisher feed returned HTTP 500.",
      acceptedCount: 0,
      persistedCount: 0,
    });
    expect(runner.calls).toHaveLength(0);
  });

  it("rejects empty feed XML before ingestion", async () => {
    const runner =
      new RecordingIngestionRunner();

    const service =
      createPosterBrainSourceFeedJobExecutorService({
        feedXmlFetcher: {
          async fetchFeedXml() {
            return {
              status: "succeeded" as const,
              feedXml: "   ",
              fetchedAt: "2026-08-08T12:00:00.000Z",
              errorCode: null,
              errorMessage: null,
            };
          },
        },
        classifiedFeedIngestionRunner:
          runner,
      });

    const result =
      await service.executeSourceFeedJob({
        source,
        discoveredAt: "2026-08-08T12:30:00.000Z",
      });

    expect(result).toMatchObject({
      status: "failed",
      failureStage: "validation",
      errorCode: "empty_feed_xml",
    });
    expect(runner.calls).toHaveLength(0);
  });

  it("converts classified ingestion errors into job failures", async () => {
    const service =
      createPosterBrainSourceFeedJobExecutorService({
        feedXmlFetcher:
          new SuccessfulFetcher(),
        classifiedFeedIngestionRunner:
          new FailingIngestionRunner(),
      });

    const result =
      await service.executeSourceFeedJob({
        source,
        discoveredAt: "2026-08-08T12:30:00.000Z",
      });

    expect(result).toMatchObject({
      status: "failed",
      failureStage: "ingestion",
      errorCode: "classified_feed_ingestion_failed",
      errorMessage: "Persistence unavailable.",
      acceptedCount: 0,
      persistedCount: 0,
    });
  });
});