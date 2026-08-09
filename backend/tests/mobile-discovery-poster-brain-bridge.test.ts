import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainMobileDiscoveryService,
  type PosterBrainMobileDiscoveryRankedFeedService,
} from "../src/application/mobile-discovery/poster-brain-mobile-discovery.service.js";

const GENERATED_AT =
  "2026-08-09T08:20:00.000Z";

describe(
  "Poster Brain Mobile discovery service bridge",
  () => {
    it(
      "maps existing Mobile home feed requests to Poster Brain ranked feed",
      async () => {
        const readRankedFeed =
          vi.fn(
            async () => ({
              totalItems:
                1,

              generatedAt:
                GENERATED_AT,

              items: [
                {
                  id:
                    "content-one",

                  title:
                    "Poster Brain story",

                  originalUrl:
                    "https://publisher.example/story",

                  publisherName:
                    "Publisher Example",

                  score:
                    0.91,

                  publishedAt:
                    "2026-08-09T08:00:00.000Z",

                  metadata: {
                    sourceKey:
                      "publisher-example",

                    publisherDomain:
                      "publisher.example",

                    excerpt:
                      "A ranked Poster Brain item.",

                    category:
                      "technology",

                    topics: [
                      "ai",
                      "ranking",
                    ],

                    tags: [
                      "poster",
                    ],

                    languageCode:
                      "en",

                    regionCode:
                      "IN",

                    imageUrl:
                      "https://publisher.example/image.jpg",
                  },
                },
              ],
            })
          );

        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService: {
              readRankedFeed,
            },
            actorUserId:
              "mobile-user-one",
          });

        const response =
          await service.listFeed({
            surface:
              "home",

            query:
              null,

            category:
              null,

            languageCode:
              "en",

            regionCode:
              "IN",

            limit:
              12,

            cursor:
              null,

            refreshMode:
              "refresh",
          });

        expect(
          readRankedFeed
        ).toHaveBeenCalledWith({
          actorUserId:
            "mobile-user-one",

          surface:
            "home",

          limit:
            12,

          languageCode:
            "en",

          regionCode:
            "IN",
        });

        expect(
          response.items[0]
        ).toMatchObject({
          id:
            "content-one",

          sourceId:
            "publisher-example",

          publisher: {
            name:
              "Publisher Example",

            domain:
              "publisher.example",
          },

          title:
            "Poster Brain story",

          excerpt:
            "A ranked Poster Brain item.",

          originalUrl:
            "https://publisher.example/story",

          category:
            "technology",

          languageCode:
            "en",

          regionCode:
            "IN",

          actions: {
            canOpenOriginal:
              true,

            canSave:
              true,

            canShare:
              true,

            canHide:
              true,

            canReport:
              true,
          },
        });

        expect(
          response.surface
        ).toBe(
          "home"
        );

        expect(
          response.pagination
        ).toEqual({
          nextCursor:
            null,

          hasMore:
            false,

          refreshAfterSeconds:
            90,

          refreshMode:
            "refresh",
        });

        expect(
          response.aiHandoff
        ).toMatchObject({
          apiBackendLanguage:
            "typescript",

          aiServiceLanguage:
            "python",

          classificationReady:
            true,

          embeddingsReady:
            false,
        });
      }
    );

    it(
      "maps search query/category filters without undefined optional properties",
      async () => {
        const readRankedFeed =
          vi.fn(
            async () => ({
              totalItems:
                0,

              generatedAt:
                GENERATED_AT,

              items:
                [],
            })
          );

        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService: {
              readRankedFeed,
            } satisfies PosterBrainMobileDiscoveryRankedFeedService,
          });

        await service.listFeed({
          surface:
            "search",

          query:
            "  AI infrastructure  ",

          category:
            " technology ",

          languageCode:
            null,

          regionCode:
            null,

          limit:
            100,

          cursor:
            null,

          refreshMode:
            null,
        });

        expect(
          readRankedFeed
        ).toHaveBeenCalledWith({
          actorUserId:
            "mobile-discovery-system",

          surface:
            "search",

          limit:
            50,

          searchQuery:
            "AI infrastructure",

          category:
            "technology",
        });
      }
    );

    it(
      "preserves Mobile ad-slot contracts for larger Poster Brain feeds",
      async () => {
        const readRankedFeed =
          vi.fn(
            async () => ({
              totalItems:
                10,

              generatedAt:
                GENERATED_AT,

              items:
                Array
                  .from(
                    {
                      length:
                        10,
                    },
                    (_value, index) => ({
                      id:
                        "content-" + index,

                      title:
                        "Story " + index,

                      originalUrl:
                        "https://publisher.example/story-" + index,

                      publisherName:
                        "Publisher",

                      score:
                        1,

                      publishedAt:
                        null,

                      metadata:
                        {},
                    })
                  ),
            })
          );

        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService: {
              readRankedFeed,
            },
          });

        const response =
          await service.listFeed({
            surface:
              "trending",

            limit:
              10,
          });

        expect(
          response.adSlots.map(
            slot =>
              slot.placementKey
          )
        ).toEqual([
          "trending:direct-sponsorship:after-4",
          "trending:affiliate:after-10",
        ]);

        expect(
          response.pagination.refreshAfterSeconds
        ).toBe(
          60
        );
      }
    );
  }
);
