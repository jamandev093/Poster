import type {
  ExternalPromotionRecord,
} from "./external-promotion.types";

export const INITIAL_EXTERNAL_PROMOTIONS:
  ExternalPromotionRecord[] = [
  {
    id: "external-promotion-example-1",

    programId:
      "program-example-approved",

    name:
      "Example Technology Product Promotion",

    externalOfferId:
      "EXAMPLE-OFFER-001",

    offerType:
      "physical_product",

    conversionGoal:
      "sale",

    category:
      "Technology",

    headline:
      "Explore a useful technology product",

    description:
      "A demonstration external affiliate promotion selected and managed by Poster Admin.",

    callToAction:
      "View product",

    mediaType:
      "image",

    mediaUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",

    destinationUrl:
      "https://example.com/product",

    trackingUrl:
      "https://example.com/product?ref=poster-example",

    referralCode:
      "",

    disclosure:
      "Affiliate · Poster may earn a commission when users complete an eligible action through this link.",

    placements: [
      "home",
      "search",
    ],

    startDate:
      "2026-07-20",

    endDate:
      "2026-08-20",

    status:
      "active",

    metrics: {
      impressions: 18420,
      validClicks: 746,
      conversions: 23,
    },

    notes:
      "Demonstration promotion. Replace with a real approved product or service.",

    createdAt:
      "20 Jul 2026, 09:30",

    updatedAt:
      "28 Jul 2026, 14:10",

    auditHistory: [
      {
        id:
          "external-promotion-audit-1",

        action:
          "created",

        message:
          "External promotion created.",

        actor:
          "Admin",

        occurredAt:
          "20 Jul 2026, 09:30",
      },

      {
        id:
          "external-promotion-audit-2",

        action:
          "activated",

        message:
          "Promotion activated for Home and Search.",

        actor:
          "Admin",

        occurredAt:
          "20 Jul 2026, 10:00",
      },
    ],
  },

  {
    id: "external-promotion-example-2",

    programId:
      "program-example-approved",

    name:
      "Example Software Subscription",

    externalOfferId:
      "EXAMPLE-SUBSCRIPTION-002",

    offerType:
      "subscription",

    conversionGoal:
      "subscription",

    category:
      "Software",

    headline:
      "Discover a professional software subscription",

    description:
      "A demonstration subscription offer prepared for a future scheduled promotion.",

    callToAction:
      "Start subscription",

    mediaType:
      "none",

    mediaUrl:
      "",

    destinationUrl:
      "https://example.com/software",

    trackingUrl:
      "https://example.com/software?partner=poster",

    referralCode:
      "POSTER20",

    disclosure:
      "Affiliate · Poster may earn a commission when users complete an eligible action through this link.",

    placements: [
      "trending",
    ],

    startDate:
      "2026-08-05",

    endDate:
      "2026-09-05",

    status:
      "scheduled",

    metrics: {
      impressions: 0,
      validClicks: 0,
      conversions: 0,
    },

    notes:
      "Scheduled demonstration record.",

    createdAt:
      "29 Jul 2026, 11:45",

    updatedAt:
      "29 Jul 2026, 11:45",

    auditHistory: [
      {
        id:
          "external-promotion-audit-3",

        action:
          "created",

        message:
          "External promotion created as scheduled.",

        actor:
          "Admin",

        occurredAt:
          "29 Jul 2026, 11:45",
      },
    ],
  },
];
