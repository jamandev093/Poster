import {
  CampaignRecord,
  CommercialRequest,
} from "./monetization.types";

export const commercialRequests: CommercialRequest[] =
  [
    {
      id: "ADV-1001",

      type:
        "direct_sponsorship",

      status:
        "pending_review",

      organization:
        "Example Cloud",

      contactName:
        "Aarav Mehta",

      businessEmail:
        "marketing@examplecloud.com",

      website:
        "https://examplecloud.com",

      campaignName:
        "Cloud Skills Campaign",

      submittedAt:
        "2026-07-20T10:15:00Z",

      requestedPlacements: [
        "home",
        "search",
      ],

      requestedStartDate:
        "2026-07-25",

      requestedEndDate:
        "2026-08-15",

      proposedContractValue:
        500000,

      rightsConfirmed:
        true,

      creative: {
        headline:
          "Build your cloud skills",

        body:
          "Learn practical cloud skills with guided training and certification resources.",

        callToAction:
          "Explore courses",

        destinationUrl:
          "https://examplecloud.com/cloud-training",

        imageName:
          "cloud-skills-campaign.jpg",

        logoName:
          "example-cloud-logo.png",
      },
    },

    {
      id: "ADV-1002",

      type:
        "affiliate",

      status:
        "changes_requested",

      organization:
        "Learning Partner",

      contactName:
        "Priya Sharma",

      businessEmail:
        "partners@learningpartner.example",

      website:
        "https://learningpartner.example",

      campaignName:
        "Professional Learning Offer",

      submittedAt:
        "2026-07-19T08:45:00Z",

      requestedPlacements: [
        "search",
        "trending",
      ],

      requestedStartDate:
        "2026-07-28",

      requestedEndDate:
        "2026-08-31",

      commissionModel:
        "Commission per verified conversion",

      conversionDefinition:
        "Completed paid course enrollment",

      rightsConfirmed:
        true,

      creative: {
        headline:
          "Advance your professional skills",

        body:
          "Explore structured learning programs for professional growth.",

        callToAction:
          "View programs",

        destinationUrl:
          "https://learningpartner.example/programs",

        imageName:
          "professional-learning.jpg",

        logoName:
          "learning-partner-logo.png",
      },

      reviewNote:
        "Please provide the final approved campaign image and confirm the conversion tracking method.",
    },

    {
      id: "ADV-1003",

      type:
        "direct_sponsorship",

      status:
        "approved",

      organization:
        "Future Skills Institute",

      contactName:
        "Rohan Kapoor",

      businessEmail:
        "campaigns@futureskills.example",

      website:
        "https://futureskills.example",

      campaignName:
        "Future Skills Sponsorship",

      submittedAt:
        "2026-07-15T12:30:00Z",

      requestedPlacements: [
        "home",
      ],

      requestedStartDate:
        "2026-08-01",

      requestedEndDate:
        "2026-08-31",

      proposedContractValue:
        300000,

      rightsConfirmed:
        true,

      creative: {
        headline:
          "Prepare for tomorrow's skills",

        body:
          "Discover learning paths designed around emerging professional skills.",

        callToAction:
          "Explore learning",

        destinationUrl:
          "https://futureskills.example/learning",

        imageName:
          "future-skills.jpg",

        logoName:
          "future-skills-logo.png",
      },

      linkedCampaignId:
        "CMP-3010",
    },

    {
      id: "ADV-1004",

      type:
        "affiliate",

      status:
        "approved",

      organization:
        "Knowledge Academy",

      contactName:
        "Maya Singh",

      businessEmail:
        "affiliate@knowledgeacademy.example",

      website:
        "https://knowledgeacademy.example",

      campaignName:
        "Knowledge Academy Partnership",

      submittedAt:
        "2026-07-14T09:20:00Z",

      requestedPlacements: [
        "search",
      ],

      requestedStartDate:
        "2026-07-22",

      requestedEndDate:
        "2026-09-30",

      commissionModel:
        "12% commission per completed purchase",

      conversionDefinition:
        "Completed course purchase",

      rightsConfirmed:
        true,

      creative: {
        headline:
          "Learn from trusted experts",

        body:
          "Explore professional courses and structured learning programs.",

        callToAction:
          "Browse courses",

        destinationUrl:
          "https://knowledgeacademy.example/courses",

        imageName:
          "academy-courses.jpg",

        logoName:
          "knowledge-academy-logo.png",
      },

      linkedCampaignId:
        "CMP-3020",
    },
  ];

export const campaignRecords: CampaignRecord[] =
  [
    {
      id: "CMP-3001",

      name:
        "Cloud Skills Campaign",

      type:
        "direct_sponsorship",

      status:
        "active",

      organization:
        "Example Cloud",

      placements: [
        "home",
        "search",
      ],

      billingModel:
        "fixed_contract",

      startDate:
        "2026-07-01",

      endDate:
        "2026-07-31",

      destinationUrl:
        "https://examplecloud.com/cloud-training",

      trackingStatus:
        "connected",

      conversionDefinition:
        "Completed course registration",

      performance: {
        impressions:
          728000,

        clicks:
          18240,

        conversions:
          620,

        previousImpressions:
          645000,

        previousClicks:
          15350,

        previousConversions:
          548,
      },

      financials: {
        currency:
          "INR",

        contractValue:
          500000,

        deliveryTarget:
          1000000,

        delivered:
          728000,

        revenue:
          500000,

        cost:
          85000,

        netEarnings:
          415000,
      },
    },

    {
      id: "CMP-3002",

      name:
        "Learning Partner Offer",

      type:
        "affiliate",

      status:
        "active",

      organization:
        "Learning Partner",

      placements: [
        "search",
        "trending",
      ],

      billingModel:
        "affiliate",

      startDate:
        "2026-07-01",

      endDate:
        "2026-09-30",

      destinationUrl:
        "https://learningpartner.example/programs",

      trackingStatus:
        "connected",

      conversionDefinition:
        "Completed paid course enrollment",

      performance: {
        impressions:
          120000,

        clicks:
          4800,

        conversions:
          230,

        previousImpressions:
          98000,

        previousClicks:
          3600,

        previousConversions:
          171,
      },

      financials: {
        currency:
          "INR",

        commission:
          92000,

        revenue:
          92000,

        cost:
          8000,

        netEarnings:
          84000,
      },
    },

    {
      id: "CMP-3003",

      name:
        "Poster Learning Discovery",

      type:
        "poster_promotion",

      status:
        "paused",

      organization:
        "Poster",

      placements: [
        "home",
        "trending",
      ],

      billingModel:
        "internal_promotion",

      startDate:
        "2026-07-01",

      endDate:
        "2026-07-31",

      trackingStatus:
        "not_configured",

      performance: {
        impressions:
          86000,

        clicks:
          3268,

        conversions:
          null,

        previousImpressions:
          71000,

        previousClicks:
          2510,

        previousConversions:
          null,
      },

      financials: {
        currency:
          "INR",
      },
    },

    {
      id: "CMP-3004",

      name:
        "Poster Professional Growth",

      type:
        "poster_promotion",

      status:
        "scheduled",

      organization:
        "Poster",

      placements: [
        "search",
      ],

      billingModel:
        "internal_promotion",

      startDate:
        "2026-08-01",

      endDate:
        "2026-08-31",

      trackingStatus:
        "not_configured",

      performance: {
        impressions: 0,

        clicks: 0,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",
      },
    },

    {
      id: "CMP-3005",

      name:
        "Programmatic Advertising",

      type:
        "programmatic",

      status:
        "disabled",

      organization:
        "Programmatic",

      placements: [
        "home",
        "search",
        "trending",
      ],

      billingModel:
        "cpm",

      startDate:
        "2026-01-01",

      endDate:
        "2026-12-31",

      trackingStatus:
        "unavailable",

      performance: {
        impressions: 0,

        clicks: 0,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",
      },
    },

    {
      id: "CMP-3010",

      requestId:
        "ADV-1003",

      name:
        "Future Skills Sponsorship",

      type:
        "direct_sponsorship",

      /**
       * Approved request becomes Draft first.
       * It does not automatically activate.
       */
      status:
        "draft",

      organization:
        "Future Skills Institute",

      placements: [
        "home",
      ],

      billingModel:
        "fixed_contract",

      startDate:
        "2026-08-01",

      endDate:
        "2026-08-31",

      destinationUrl:
        "https://futureskills.example/learning",

      trackingStatus:
        "not_configured",

      performance: {
        impressions: 0,

        clicks: 0,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",

        contractValue:
          300000,

        deliveryTarget:
          600000,

        delivered: 0,

        revenue:
          300000,
      },
    },

    {
      id: "CMP-3011",

      name:
        "Career Growth Sponsorship",

      type:
        "direct_sponsorship",

      status:
        "paused",

      organization:
        "Career Network",

      placements: [
        "home",
        "search",
      ],

      billingModel:
        "fixed_contract",

      startDate:
        "2026-06-15",

      endDate:
        "2026-08-15",

      destinationUrl:
        "https://careernetwork.example/growth",

      trackingStatus:
        "unavailable",

      performance: {
        impressions:
          410000,

        clicks:
          9840,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",

        contractValue:
          350000,

        deliveryTarget:
          700000,

        delivered:
          410000,

        revenue:
          350000,
      },
    },

    {
      id: "CMP-3020",

      requestId:
        "ADV-1004",

      name:
        "Knowledge Academy Partnership",

      type:
        "affiliate",

      status:
        "active",

      organization:
        "Knowledge Academy",

      placements: [
        "search",
      ],

      billingModel:
        "affiliate",

      startDate:
        "2026-07-22",

      endDate:
        "2026-09-30",

      destinationUrl:
        "https://knowledgeacademy.example/courses",

      trackingStatus:
        "connected",

      conversionDefinition:
        "Completed course purchase",

      performance: {
        impressions:
          64000,

        clicks:
          2240,

        conversions:
          104,
      },

      financials: {
        currency:
          "INR",

        commission:
          41600,

        revenue:
          41600,

        cost:
          3500,

        netEarnings:
          38100,
      },
    },

    {
      id: "CMP-3021",

      name:
        "Certification Partner Campaign",

      type:
        "affiliate",

      status:
        "scheduled",

      organization:
        "Certification Partner",

      placements: [
        "trending",
      ],

      billingModel:
        "affiliate",

      startDate:
        "2026-08-05",

      endDate:
        "2026-10-05",

      destinationUrl:
        "https://certificationpartner.example",

      trackingStatus:
        "not_configured",

      conversionDefinition:
        "Completed certification purchase",

      performance: {
        impressions: 0,

        clicks: 0,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",
      },
    },
  ];

export function getCampaignById(
  id: string
): CampaignRecord | undefined {
  return campaignRecords.find(
    (campaign) =>
      campaign.id === id
  );
}

export function getCommercialRequestById(
  id: string
): CommercialRequest | undefined {
  return commercialRequests.find(
    (request) =>
      request.id === id
  );
}