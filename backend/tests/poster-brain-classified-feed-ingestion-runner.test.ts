import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainClassifiedFeedIngestionRunner,
} from "../src/application/poster-brain/classified-feed-ingestion-runner.service.js";

import type {
  PosterBrainFeedIngestionService,
} from "../src/application/poster-brain/feed-ingestion-orchestrator.service.js";

import type {
  PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const SOURCE =
  {
    sourceKey:
      "source-one",

    displayName:
      "Source One",

    feedUrl:
      "https://source-one.example/rss.xml",

    status:
      "active",

    priority:
      50,
  } as unknown as PosterBrainRssSource;

describe(
  "Poster Brain classified feed ingestion runner",
  () => {
    it(
      "adapts classified feed ingestion calls to the feed XML ingestion service",
      async () => {
        const ingestFeedXml =
          vi
            .fn<
              PosterBrainFeedIngestionService["ingestFeedXml"]
            >()
            .mockResolvedValue({
              acceptedCount:
                3,

              rejectedCount:
                1,

              accepted: [],

              rejected: [],

              persistence: {
                sourceId:
                  "source-id",

                publisherDomainIds:
                  [],

                contentItemIds:
                  [
                    "content-one",
                    "content-two",
                  ],

                persistedContentCount:
                  2,
              },
            } as unknown as Awaited<
              ReturnType<
                PosterBrainFeedIngestionService["ingestFeedXml"]
              >
            >);

        const runner =
          createPosterBrainClassifiedFeedIngestionRunner({
            feedIngestionService: {
              ingestFeedXml,
            },
          });

        const result =
          await runner.ingestClassifiedFeed({
            source:
              SOURCE,

            feedXml:
              "<rss><channel><title>Feed</title></channel></rss>",

            discoveredAt:
              "2026-08-09T05:10:00.000Z",
          });

        expect(
          ingestFeedXml
        ).toHaveBeenCalledWith({
          source:
            SOURCE,

          xml:
            "<rss><channel><title>Feed</title></channel></rss>",

          discoveredAt:
            "2026-08-09T05:10:00.000Z",
        });

        expect(
          result
        ).toEqual({
          acceptedCount:
            3,

          rejectedCount:
            1,

          persistedCount:
            2,

          persistencePlan:
            null,
        });
      }
    );
  }
);