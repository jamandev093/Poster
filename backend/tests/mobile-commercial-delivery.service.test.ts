import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMobileCommercialDeliveryService,
} from "../src/application/monetization/mobile-commercial-delivery.service.js";

import type {
  MobileCommercialDeliverySourceRecord,
} from "../src/domains/monetization/mobile-commercial-delivery.repository.js";

function createDirectSource(
  overrides:
    Partial<
      MobileCommercialDeliverySourceRecord
    > =
    {}
): MobileCommercialDeliverySourceRecord {
  return {
    campaignId:
      "11111111-1111-4111-8111-111111111111",

    campaignType:
      "direct_sponsorship",

    campaignName:
      "Research Cloud",

    placements: [
      "home",
      "search",
      "trending",
    ],

    scheduledStartDate:
      "2026-08-01",

    scheduledEndDate:
      "2026-08-31",

    sourceRequestId:
      "22222222-2222-4222-8222-222222222222",

    requestTitle:
      "Research collaboration for modern teams",

    requestObjective:
      "Help knowledge workers organize research.",

    requestDestinationUrl:
      "https://researchcloud.example/product",

    requestCreativeSpec: {
      advertiserName:
        "Research Cloud",

      advertiserDomain:
        "researchcloud.example",

      headline:
        "Research collaboration built for modern teams",

      body:
        "Organize sources and collaborate across research projects.",

      callToAction:
        "Explore",

      creativeFormat:
        "standard",

      mediaType:
        "video",

      videoUrl:
        "https://cdn.researchcloud.example/ad.mp4",

      thumbnailUrl:
        "https://cdn.researchcloud.example/ad.jpg",
    },

    affiliatePartnerName:
      null,

    affiliateOfferName:
      null,

    affiliateDestinationUrl:
      null,

    affiliateDisclosure:
      null,

    affiliateTrackingStatus:
      null,

    affiliateTrackingUrl:
      null,

    affiliatePayoutReadinessStatus:
      null,

    ...overrides,
  };
}

function createAffiliateSource(
  overrides:
    Partial<
      MobileCommercialDeliverySourceRecord
    > =
    {}
): MobileCommercialDeliverySourceRecord {
  return {
    campaignId:
      "33333333-3333-4333-8333-333333333333",

    campaignType:
      "affiliate",

    campaignName:
      "Knowledge Academy Affiliate",

    placements: [
      "search",
      "trending",
    ],

    scheduledStartDate:
      "2026-08-01",

    scheduledEndDate:
      "2026-08-31",

    sourceRequestId:
      "44444444-4444-4444-8444-444444444444",

    requestTitle:
      "Knowledge Academy",

    requestObjective:
      "Promote relevant learning offers.",

    requestDestinationUrl:
      "https://academy.example/course",

    requestCreativeSpec: {
      imageUrl:
        "https://cdn.academy.example/course.jpg",

      callToAction:
        "View Course",
    },

    affiliatePartnerName:
      "Knowledge Academy",

    affiliateOfferName:
      "AI Foundations",

    affiliateDestinationUrl:
      "https://academy.example/course",

    affiliateDisclosure:
      "Affiliate · Poster may earn a commission",

    affiliateTrackingStatus:
      "active",

    affiliateTrackingUrl:
      "https://track.academy.example/poster-ai",

    affiliatePayoutReadinessStatus:
      "ready",

    ...overrides,
  };
}

describe(
  "Mobile commercial delivery service",
  () => {
    it(
      "projects an eligible direct sponsorship from approved request data",
      async () => {
        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async () => [
                createDirectSource(),
              ],
          });

        const result =
          await service
            .listForPlacement({
              placement:
                "home",
            });

        expect(result)
          .toHaveLength(1);

        expect(result[0])
          .toMatchObject({
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

            status:
              "active",

            title:
              "Research collaboration built for modern teams",

            description:
              "Organize sources and collaborate across research projects.",

            destinationUrl:
              "https://researchcloud.example/product",

            callToAction:
              "Explore",

            advertiserName:
              "Research Cloud",

            advertiserDomain:
              "researchcloud.example",

            disclosure:
              "Sponsored by Research Cloud",

            creativeFormat:
              "standard",

            mediaType:
              "video",

            videoUrl:
              "https://cdn.researchcloud.example/ad.mp4",

            thumbnailUrl:
              "https://cdn.researchcloud.example/ad.jpg",
          });
      }
    );

    it(
      "never projects unsafe or non-http media URLs",
      async () => {
        const source =
          createDirectSource({
            requestCreativeSpec: {
              headline:
                "Safe sponsored content",

              imageUrl:
                "javascript:alert(1)",

              videoUrl:
                "file:///C:/private/video.mp4",

              thumbnailUrl:
                "data:image/png;base64,AAAA",
            },
          });

        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async () => [
                source,
              ],
          });

        const [
          item,
        ] =
          await service
            .listForPlacement({
              placement:
                "home",
            });

        expect(item)
          .toBeDefined();

        expect(
          item?.imageUrl
        )
          .toBeNull();

        expect(
          item?.videoUrl
        )
          .toBeNull();

        expect(
          item?.thumbnailUrl
        )
          .toBeNull();

        expect(
          item?.mediaType
        )
          .toBeNull();
      }
    );

    it(
      "uses an active affiliate tracking URL as the mobile destination",
      async () => {
        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async () => [
                createAffiliateSource(),
              ],
          });

        const result =
          await service
            .listForPlacement({
              placement:
                "search",
            });

        expect(result)
          .toHaveLength(1);

        expect(result[0])
          .toMatchObject({
            kind:
              "commercial",

            commercialType:
              "affiliate_promotion",

            campaignId:
              "33333333-3333-4333-8333-333333333333",

            placement:
              "search",

            partnerName:
              "Knowledge Academy",

            title:
              "AI Foundations",

            destinationUrl:
              "https://track.academy.example/poster-ai",

            trackingUrl:
              "https://track.academy.example/poster-ai",

            canonicalDestinationUrl:
              "https://academy.example/course",

            callToAction:
              "View Course",

            imageUrl:
              "https://cdn.academy.example/course.jpg",
          });
      }
    );

    it(
      "does not deliver an affiliate campaign when tracking is inactive",
      async () => {
        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async () => [
                createAffiliateSource({
                  affiliateTrackingStatus:
                    "paused",
                }),
              ],
          });

        const result =
          await service
            .listForPlacement({
              placement:
                "search",
            });

        expect(result)
          .toEqual([]);
      }
    );

    it(
      "does not project a source onto a placement the campaign does not allow",
      async () => {
        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async () => [
                createDirectSource({
                  placements: [
                    "home",
                  ],
                }),
              ],
          });

        const result =
          await service
            .listForPlacement({
              placement:
                "trending",
            });

        expect(result)
          .toEqual([]);
      }
    );

    it(
      "passes the normalized placement and limit to the repository operation",
      async () => {
        let received:
          {
            placement:
              "home" |
              "search" |
              "trending";

            limit?:
              number;
          } |
          null =
          null;

        const service =
          createMobileCommercialDeliveryService({
            listSources:
              async (
                input
              ) => {
                received =
                  input;

                return [];
              },
          });

        await service
          .listForPlacement({
            placement:
              "trending",

            limit:
              3,
          });

        expect(received)
          .toEqual({
            placement:
              "trending",

            limit:
              3,
          });
      }
    );
  }
);