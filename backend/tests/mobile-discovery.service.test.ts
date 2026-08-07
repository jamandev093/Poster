import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createMobileDiscoveryService,
} from "../src/application/mobile-discovery/mobile-discovery.service.js";

import type {
  DiscoveryContentItem,
} from "../src/domains/mobile-discovery/index.js";

function createContentItem(
  index: number
): DiscoveryContentItem {
  return {
    id:
      `00000000-0000-4000-8000-00000000090${index}`,

    externalContentId:
      `CNT-900${index}`,

    title:
      `Discovery item ${index}`,

    excerpt:
      `Useful discovery item ${index}`,

    originalUrl:
      `https://example.com/discovery-${index}`,

    canonicalUrl:
      `https://example.com/discovery-${index}`,

    imageUrl:
      `https://example.com/discovery-${index}.jpg`,

    mediaType:
      "article",

    languageCode:
      "en",

    regionCode:
      "IN",

    category:
      "technology",

    canonicalTopicIds: [
      "technology",
    ],

    evolvingTopicIds: [
      "ai",
    ],

    tags: [
      "AI",
      "Research",
    ],

    searchKeywords: [
      "artificial intelligence",
    ],

    embeddingReference:
      `embedding-${index}`,

    rankingSignals: {
      qualityScore:
        "0.900000",

      freshnessScore:
        "0.850000",

      popularityScore:
        "0.700000",

      personalizationScore:
        "0.800000",

      trendingScore:
        `0.${70 + index}0000`,

      rankingScore:
        `0.${90 - index}0000`,
    },

    publishedAt:
      new Date(
        `2026-08-07T0${index}:00:00.000Z`
      ),

    discoveredAt:
      new Date(
        `2026-08-07T1${index}:00:00.000Z`
      ),

    status:
      "active",

    source: {
      id:
        `00000000-0000-4000-8000-00000000080${index}`,

      sourceKey:
        "example-source",

      displayName:
        "Example Source",

      homepageUrl:
        "https://example.com",

      primaryDomain:
        "example.com",

      acquisitionMethod:
        "authorized_rss",

      status:
        "active",

      languageCode:
        "en",

      regionCode:
        "IN",
    },

    publisher: {
      id:
        `00000000-0000-4000-8000-00000000070${index}`,

      domain:
        "example.com",

      publisherName:
        "Example Publisher",

      status:
        "active",

      category:
        "technology",

      languageCode:
        "en",

      regionCode:
        "IN",
    },

    rowVersion:
      "1",
  };
}

describe(
  "MobileDiscoveryService",
  () => {
    it(
      "returns an infinite home feed contract with refresh timing and recommendation metadata",
      async () => {
        const listDiscoveryContentItems =
          vi.fn()
            .mockResolvedValue([
              createContentItem(
                1
              ),
            ]);

        const service =
          createMobileDiscoveryService({
            listDiscoveryContentItems,

            now:
              () =>
                new Date(
                  "2026-08-07T12:00:00.000Z"
                ),
          });

        const response =
          await service.listFeed({
            surface:
              "home",

            languageCode:
              "en",

            regionCode:
              "IN",
          });

        expect(
          response.surface
        ).toBe(
          "home"
        );

        expect(
          response.items[0]
        ).toMatchObject({
          kind:
            "organic",

          sourceId:
            "CNT-9001",

          publisher: {
            name:
              "Example Publisher",

            domain:
              "example.com",
          },

          originalUrl:
            "https://example.com/discovery-1",

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
          response.pagination
        ).toEqual({
          nextCursor:
            null,

          hasMore:
            false,

          refreshAfterSeconds:
            90,

          refreshMode:
            "initial",
        });

        expect(
          response.recommendation
        ).toMatchObject({
          organicRankingFirst:
            true,

          monetizationInsertedAfterOrganicRanking:
            true,
        });

        expect(
          response.aiHandoff
        ).toEqual({
          apiBackendLanguage:
            "typescript",

          aiServiceLanguage:
            "python",

          classificationReady:
            true,

          embeddingsReady:
            true,

          semanticDeduplicationReady:
            true,

          rankingAssistReady:
            true,

          trendIntelligenceReady:
            true,
        });

        expect(
          listDiscoveryContentItems
        ).toHaveBeenCalledWith({
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
            20,

          cursor:
            null,
        });
      }
    );

    it(
      "normalizes search inputs and caps infinite-feed page size",
      async () => {
        const listDiscoveryContentItems =
          vi.fn()
            .mockResolvedValue([]);

        const service =
          createMobileDiscoveryService({
            listDiscoveryContentItems,
          });

        await service.listFeed({
          surface:
            "search",

          query:
            "  artificial   intelligence  ",

          category:
            "  technology  ",

          languageCode:
            " en ",

          regionCode:
            " IN ",

          limit:
            200,

          refreshMode:
            "refresh",
        });

        expect(
          listDiscoveryContentItems
        ).toHaveBeenCalledWith({
          surface:
            "search",

          query:
            "artificial intelligence",

          category:
            "technology",

          languageCode:
            "en",

          regionCode:
            "IN",

          limit:
            50,

          cursor:
            null,
        });
      }
    );

    it(
      "returns cursor pagination for infinite feeds when the requested page is full",
      async () => {
        const items = [
          createContentItem(
            1
          ),
          createContentItem(
            2
          ),
        ];

        const listDiscoveryContentItems =
          vi.fn()
            .mockResolvedValue(
              items
            );

        const service =
          createMobileDiscoveryService({
            listDiscoveryContentItems,
          });

        const response =
          await service.listFeed({
            surface:
              "trending",

            limit:
              2,
          });

        expect(
          response.pagination.hasMore
        ).toBe(
          true
        );

        expect(
          response.pagination.nextCursor
        ).toEqual(
          expect.any(
            String
          )
        );

        expect(
          response.pagination.refreshAfterSeconds
        ).toBe(
          60
        );

        expect(
          response.searchEngine
        ).toMatchObject({
          engine:
            "postgres_full_text",

          fullTextEnabled:
            true,

          semanticSearchReady:
            true,

          publisherSearchReady:
            true,

          topicSearchReady:
            true,
        });
      }
    );

    it(
      "creates ad slot contracts after organic ranking and blocks commercial save",
      async () => {
        const listDiscoveryContentItems =
          vi.fn()
            .mockResolvedValue([
              createContentItem(1),
              createContentItem(2),
              createContentItem(3),
              createContentItem(4),
            ]);

        const service =
          createMobileDiscoveryService({
            listDiscoveryContentItems,
          });

        const response =
          await service.listFeed({
            surface:
              "home",

            limit:
              4,
          });

        expect(
          response.adSlots
        ).toEqual([
          {
            kind:
              "ad_slot",

            placementKey:
              "home:direct-sponsorship:after-4",

            surface:
              "home",

            afterOrganicIndex:
              4,

            commercialType:
              "direct_sponsorship",

            commercialSaveAllowed:
              false,

            allowedActions: {
              canOpen:
                true,

              canShare:
                true,

              canHide:
                true,

              canReport:
                true,
            },
          },
        ]);
      }
    );

    it(
      "passes decoded cursor data back to the repository",
      async () => {
        const listDiscoveryContentItems =
          vi.fn()
            .mockResolvedValue([]);

        const service =
          createMobileDiscoveryService({
            listDiscoveryContentItems,
          });

        const cursor =
          encodeURIComponent(
            JSON.stringify({
              surface:
                "home",

              score:
                "0.810000",

              discoveredAt:
                "2026-08-07T11:00:00.000Z",

              id:
                "00000000-0000-4000-8000-000000000901",
            })
          );

        await service.listFeed({
          surface:
            "home",

          cursor,

          refreshMode:
            "older",
        });

        expect(
          listDiscoveryContentItems
        ).toHaveBeenCalledWith({
          surface:
            "home",

          query:
            null,

          category:
            null,

          languageCode:
            null,

          regionCode:
            null,

          limit:
            20,

          cursor: {
            surface:
              "home",

            score:
              "0.810000",

            discoveredAt:
              "2026-08-07T11:00:00.000Z",

            id:
              "00000000-0000-4000-8000-000000000901",
          },
        });
      }
    );
  }
);
