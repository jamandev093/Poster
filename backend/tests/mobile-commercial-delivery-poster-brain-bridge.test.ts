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

import type {
  MobileCommercialDeliveryItem,
} from "../src/application/monetization/mobile-commercial-delivery.service.js";

function createRankedFeedService():
  PosterBrainMobileDiscoveryRankedFeedService {
  return {
    readRankedFeed:
      vi.fn(
        async () => ({
          items:
            Array.from(
              {
                length:
                  12,
              },
              (
                _,
                index
              ) => ({
                id:
                  `content-${index + 1}`,

                title:
                  `Ranked article ${index + 1}`,

                originalUrl:
                  `https://publisher.example/article-${index + 1}`,

                publisherName:
                  "Publisher",

                score:
                  1 -
                  index *
                    0.01,

                publishedAt:
                  "2026-08-12T04:00:00.000Z",

                metadata: {
                  sourceId:
                    `source-${index + 1}`,

                  excerpt:
                    `Article ${index + 1} summary`,

                  mediaType:
                    "article",

                  category:
                    "Technology",

                  topics: [
                    "technology",
                  ],

                  tags: [],

                  languageCode:
                    "en",

                  regionCode:
                    "IN",
                },
              })
            ),

          totalItems:
            12,

          generatedAt:
            "2026-08-12T04:30:00.000Z",
        })
      ),
  };
}

const DIRECT_DELIVERY:
  MobileCommercialDeliveryItem = {
  kind:
    "commercial",

  id:
    "direct:11111111-1111-4111-8111-111111111111",

  commercialType:
    "direct_sponsorship",

  campaignId:
    "11111111-1111-4111-8111-111111111111",

  placement:
    "home",

  placements: [
    "home",
    "search",
    "trending",
  ],

  status:
    "active",

  title:
    "Research collaboration",

  description:
    "Research workspace",

  destinationUrl:
    "https://research.example/product",

  callToAction:
    "Learn More",

  startAt:
    "2026-08-01",

  endAt:
    "2026-08-31",

  creativeFormat:
    "standard",

  mediaType:
    "image",

  imageUrl:
    "https://cdn.research.example/ad.jpg",

  videoUrl:
    null,

  thumbnailUrl:
    null,

  mediaItems: [],

  advertiserName:
    "Research",

  advertiserDomain:
    "research.example",

  disclosure:
    "Sponsored by Research",
};

const AFFILIATE_DELIVERY:
  MobileCommercialDeliveryItem = {
  kind:
    "commercial",

  id:
    "affiliate:22222222-2222-4222-8222-222222222222",

  commercialType:
    "affiliate_promotion",

  campaignId:
    "22222222-2222-4222-8222-222222222222",

  placement:
    "home",

  placements: [
    "home",
  ],

  status:
    "active",

  title:
    "AI Foundations",

  description:
    "Relevant learning offer",

  destinationUrl:
    "https://tracking.example/poster-ai",

  callToAction:
    "View Offer",

  startAt:
    "2026-08-01",

  endAt:
    "2026-08-31",

  creativeFormat:
    "standard",

  mediaType:
    null,

  imageUrl:
    null,

  videoUrl:
    null,

  thumbnailUrl:
    null,

  mediaItems: [],

  partnerName:
    "Knowledge Academy",

  disclosure:
    "Affiliate · Poster may earn a commission",

  trackingUrl:
    "https://tracking.example/poster-ai",

  canonicalDestinationUrl:
    "https://academy.example/ai",
};

describe(
  "Poster Brain Mobile commercial delivery bridge",
  () => {
    it(
      "attaches real commercial deliveries to the existing ranked-feed slots",
      async () => {
        const listForPlacement =
          vi.fn(
            async () => [
              DIRECT_DELIVERY,
              AFFILIATE_DELIVERY,
            ]
          );

        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService:
              createRankedFeedService(),

            commercialDeliveryService: {
              listForPlacement,
            },
          });

        const response =
          await service.listFeed({
            surface:
              "home",
          });

        expect(
          response.items
        )
          .toHaveLength(
            12
          );

        expect(
          listForPlacement
        )
          .toHaveBeenCalledWith({
            placement:
              "home",

            limit:
              2,
          });

        expect(
          response.adSlots
        )
          .toHaveLength(
            2
          );

        expect(
          response.adSlots[0]
        )
          .toMatchObject({
            placementKey:
              "home:direct-sponsorship:after-4",

            afterOrganicIndex:
              4,

            commercialType:
              "direct_sponsorship",

            commercialSaveAllowed:
              false,

            delivery: {
              campaignId:
                "11111111-1111-4111-8111-111111111111",

              commercialType:
                "direct_sponsorship",
            },
          });

        expect(
          response.adSlots[1]
        )
          .toMatchObject({
            placementKey:
              "home:affiliate:after-10",

            afterOrganicIndex:
              10,

            commercialType:
              "affiliate_promotion",

            commercialSaveAllowed:
              false,

            delivery: {
              campaignId:
                "22222222-2222-4222-8222-222222222222",

              commercialType:
                "affiliate_promotion",
            },
          });
      }
    );

    it(
      "keeps the organic ranked feed available when commercial delivery fails",
      async () => {
        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService:
              createRankedFeedService(),

            commercialDeliveryService: {
              listForPlacement:
                async () => {
                  throw new Error(
                    "commercial database unavailable"
                  );
                },
            },
          });

        const response =
          await service.listFeed({
            surface:
              "home",
          });

        expect(
          response.items
        )
          .toHaveLength(
            12
          );

        expect(
          response.adSlots
            .map(
              slot =>
                slot.delivery
            )
        )
          .toEqual([
            null,
            null,
          ]);
      }
    );

    it(
      "does not query commercial delivery when too few organic items exist for a slot",
      async () => {
        const rankedFeedService:
          PosterBrainMobileDiscoveryRankedFeedService = {
          readRankedFeed:
            vi.fn(
              async () => ({
                items: [
                  {
                    id:
                      "content-1",

                    title:
                      "One article",

                    originalUrl:
                      "https://publisher.example/one",

                    publisherName:
                      "Publisher",

                    score:
                      1,

                    publishedAt:
                      null,

                    metadata:
                      {},
                  },
                ],

                totalItems:
                  1,

                generatedAt:
                  "2026-08-12T04:30:00.000Z",
              })
            ),
        };

        const listForPlacement =
          vi.fn(
            async () => [
              DIRECT_DELIVERY,
            ]
          );

        const service =
          createPosterBrainMobileDiscoveryService({
            rankedFeedService,

            commercialDeliveryService: {
              listForPlacement,
            },
          });

        const response =
          await service.listFeed({
            surface:
              "home",
          });

        expect(
          response.adSlots
        )
          .toEqual(
            []
          );

        expect(
          listForPlacement
        )
          .not
          .toHaveBeenCalled();
      }
    );
  }
);