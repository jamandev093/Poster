import type {
  ClientCampaign,
  ClientOrganization,
  CommercialRequest,
} from "./workspace.types";

export const currentOrganization: ClientOrganization = {
  id: "ORG-1001",

  name: "Example Cloud",

  primaryContactName:
    "Aarav Mehta",

  primaryContactEmail:
    "marketing@examplecloud.com",

  website:
    "https://examplecloud.com",
};

export const commercialRequests: CommercialRequest[] = [
  {
    id: "ADV-1001",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    type:
      "direct_sponsorship",

    status:
      "pending_review",

    campaignName:
      "Cloud Skills Campaign",

    submittedAt:
      "2026-07-20T10:30:00Z",

    updatedAt:
      "2026-07-20T10:30:00Z",

    requestedPlacements: [
      "home",
      "search",
    ],

    requestedStartDate:
      "2026-08-01",

    requestedEndDate:
      "2026-08-31",

    proposedContractValue:
      500000,

    contactName:
      "Aarav Mehta",

    businessEmail:
      "marketing@examplecloud.com",

    website:
      "https://examplecloud.com",

    rightsConfirmed:
      true,

    creative: {
      layout:
        "standard",

      headline:
        "Build your cloud skills",

      body:
        "Professional cloud learning for teams and individuals.",

      callToAction:
        "Explore courses",

      destinationUrl:
        "https://examplecloud.com/cloud-skills",

      primaryMedia: {
        role:
          "primary",

        type:
          "image",

        frameProfile:
          "standard_media",

        fileName:
          "cloud-skills-campaign.jpg",

        mimeType:
          "image/jpeg",

        sizeBytes:
          2180000,

        width:
          1280,

        height:
          720,

        altText:
          "Professionals learning cloud technology together",

        url:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
      },

      logoMedia: {
        role:
          "logo",

        type:
          "image",

        fileName:
          "example-cloud-logo.png",

        mimeType:
          "image/png",

        sizeBytes:
          184000,

        width:
          512,

        height:
          512,

        altText:
          "Example Cloud logo",
      },

      imageName:
        "cloud-skills-campaign.jpg",

      logoName:
        "example-cloud-logo.png",
    },
  },

  {
    id: "ADV-1002",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    type:
      "affiliate",

    status:
      "changes_requested",

    campaignName:
      "Learning Partner Offer",

    submittedAt:
      "2026-07-18T09:15:00Z",

    updatedAt:
      "2026-07-21T07:40:00Z",

    requestedPlacements: [
      "search",
      "trending",
    ],

    requestedStartDate:
      "2026-08-05",

    requestedEndDate:
      "2026-09-05",

    commissionModel:
      "12% commission per completed purchase",

    conversionDefinition:
      "Completed paid course enrollment",

    contactName:
      "Aarav Mehta",

    businessEmail:
      "marketing@examplecloud.com",

    website:
      "https://examplecloud.com",

    rightsConfirmed:
      true,

    creative: {
      layout:
        "sliding",

      headline:
        "Advance your professional skills",

      body:
        "Explore practical learning paths for career growth.",

      callToAction:
        "View learning paths",

      destinationUrl:
        "https://examplecloud.com/learning",

      slidingCards: [
        {
          slot:
            1,

          title:
            "Professional Learning",

          media: {
            role:
              "slide",

            type:
              "image",

            frameProfile:
              "sliding_card_media",

            fileName:
              "professional-learning.jpg",

            mimeType:
              "image/jpeg",

            sizeBytes:
              1640000,

            width:
              720,

            height:
              720,

            altText:
              "Professionals collaborating during a learning session",

            url:
              "https://images.unsplash.com/photo-1531482615713-2afd69097998",
          },
        },

        {
          slot:
            2,

          title:
            "Learning in Action",

          media: {
            role:
              "slide",

            type:
              "video",

            frameProfile:
              "sliding_card_media",

            fileName:
              "learning-in-action.mp4",

            mimeType:
              "video/mp4",

            sizeBytes:
              8400000,

            width:
              720,

            height:
              720,

            durationSeconds:
              8.4,

            /**
             * Production Backend will verify the actual encoded FPS.
             * This mock represents an already-inspected creative.
             */
            framesPerSecond:
              30,

            altText:
              "Short video showing professional learning activities",
          },
        },

        {
          slot:
            3,

          title:
            "Career Growth",

          media: {
            role:
              "slide",

            type:
              "image",

            frameProfile:
              "sliding_card_media",

            fileName:
              "career-growth.jpg",

            mimeType:
              "image/jpeg",

            sizeBytes:
              1920000,

            width:
              720,

            height:
              720,

            altText:
              "Team collaborating on professional development",

            url:
              "https://images.unsplash.com/photo-1521737711867-e3b97375f902",
          },
        },
      ],

      logoMedia: {
        role:
          "logo",

        type:
          "image",

        fileName:
          "example-cloud-logo.png",

        mimeType:
          "image/png",

        sizeBytes:
          184000,

        width:
          512,

        height:
          512,

        altText:
          "Example Cloud logo",
      },

      logoName:
        "example-cloud-logo.png",
    },

    review: {
      requestedChanges: [
        "Confirm the conversion tracking method.",
        "Replace the campaign video with the final approved creative.",
      ],

      reviewNote:
        "Update these items and resubmit the request for review.",

      reviewedAt:
        "2026-07-21T07:40:00Z",
    },
  },

  {
    id: "ADV-1003",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    type:
      "direct_sponsorship",

    status:
      "approved",

    campaignName:
      "Future Skills Sponsorship",

    submittedAt:
      "2026-07-10T08:00:00Z",

    updatedAt:
      "2026-07-16T13:20:00Z",

    requestedPlacements: [
      "home",
    ],

    requestedStartDate:
      "2026-08-10",

    requestedEndDate:
      "2026-09-10",

    proposedContractValue:
      300000,

    contactName:
      "Aarav Mehta",

    businessEmail:
      "marketing@examplecloud.com",

    website:
      "https://examplecloud.com",

    rightsConfirmed:
      true,

    creative: {
      layout:
        "standard",

      headline:
        "Skills for the future",

      body:
        "Professional learning designed for emerging careers.",

      callToAction:
        "Explore programs",

      destinationUrl:
        "https://examplecloud.com/future-skills",

      primaryMedia: {
        role:
          "primary",

        type:
          "image",

        frameProfile:
          "standard_media",

        fileName:
          "future-skills.jpg",

        mimeType:
          "image/jpeg",

        sizeBytes:
          2460000,

        width:
          1280,

        height:
          720,

        altText:
          "Professionals collaborating on future skills",

        url:
          "https://images.unsplash.com/photo-1521737711867-e3b97375f902",
      },

      imageName:
        "future-skills.jpg",
    },

    linkedCampaignId:
      "CMP-3010",
  },
];

export const campaigns: ClientCampaign[] = [
  {
    id:
      "CMP-3001",

    requestId:
      "ADV-0998",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    name:
      "Cloud Skills Campaign",

    type:
      "direct_sponsorship",

    status:
      "active",

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
      "https://examplecloud.com/cloud-skills",

    trackingStatus:
      "connected",

    conversionDefinition:
      "Completed course registration",

    /**
     * Exact approved/running creative snapshot.
     *
     * This is intentionally stored with the campaign rather than
     * dynamically reading the original ADV submission.
     *
     * The original request and approved running creative may differ
     * after Admin-requested corrections.
     */
    creative: {
      layout:
        "standard",

      headline:
        "Build your cloud skills",

      body:
        "Professional cloud learning for teams and individuals.",

      callToAction:
        "Explore courses",

      destinationUrl:
        "https://examplecloud.com/cloud-skills",

      primaryMedia: {
        role:
          "primary",

        type:
          "image",

        frameProfile:
          "standard_media",

        fileName:
          "cloud-skills-approved.jpg",

        mimeType:
          "image/jpeg",

        sizeBytes:
          2260000,

        width:
          1280,

        height:
          720,

        altText:
          "Approved Cloud Skills campaign creative",

        url:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
      },
    },

    performance: {
      impressions:
        728000,

      clicks:
        18240,

      conversions:
        620,
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
    },
  },

  {
    id:
      "CMP-3010",

    requestId:
      "ADV-1003",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    name:
      "Future Skills Sponsorship",

    type:
      "direct_sponsorship",

    status:
      "draft",

    placements: [
      "home",
    ],

    billingModel:
      "fixed_contract",

    startDate:
      "2026-08-10",

    endDate:
      "2026-09-10",

    destinationUrl:
      "https://examplecloud.com/future-skills",

    trackingStatus:
      "not_configured",

    creative: {
      layout:
        "standard",

      headline:
        "Skills for the future",

      body:
        "Professional learning designed for emerging careers.",

      callToAction:
        "Explore programs",

      destinationUrl:
        "https://examplecloud.com/future-skills",

      primaryMedia: {
        role:
          "primary",

        type:
          "image",

        frameProfile:
          "standard_media",

        fileName:
          "future-skills.jpg",

        mimeType:
          "image/jpeg",

        sizeBytes:
          2460000,

        width:
          1280,

        height:
          720,

        altText:
          "Future Skills approved campaign creative",

        url:
          "https://images.unsplash.com/photo-1521737711867-e3b97375f902",
      },
    },

    performance: {
      impressions:
        0,

      clicks:
        0,

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

      delivered:
        0,
    },
  },

  {
    id:
      "CMP-3020",

    requestId:
      "ADV-0995",

    organizationId:
      "ORG-1001",

    organizationName:
      "Example Cloud",

    name:
      "Professional Learning Partnership",

    type:
      "affiliate",

    status:
      "active",

    placements: [
      "search",
      "trending",
    ],

    billingModel:
      "affiliate",

    startDate:
      "2026-07-05",

    endDate:
      "2026-08-05",

    destinationUrl:
      "https://examplecloud.com/professional-learning",

    trackingStatus:
      "connected",

    conversionDefinition:
      "Completed paid enrollment",

    /**
     * Sliding campaign using the exact finalized Poster mobile
     * structure:
     *
     * 3 square cards
     * ├── 2 images
     * └── 1 short video
     */
    creative: {
      layout:
        "sliding",

      headline:
        "Professional learning built for career growth",

      body:
        "Explore practical programs designed for modern professional skills.",

      callToAction:
        "Explore learning",

      destinationUrl:
        "https://examplecloud.com/professional-learning",

      slidingCards: [
        {
          slot:
            1,

          title:
            "Practical Learning",

          media: {
            role:
              "slide",

            type:
              "image",

            frameProfile:
              "sliding_card_media",

            fileName:
              "practical-learning.jpg",

            mimeType:
              "image/jpeg",

            sizeBytes:
              1580000,

            width:
              720,

            height:
              720,

            altText:
              "Professionals learning together",

            url:
              "https://images.unsplash.com/photo-1531482615713-2afd69097998",
          },
        },

        {
          slot:
            2,

          title:
            "Skills in Action",

          media: {
            role:
              "slide",

            type:
              "video",

            frameProfile:
              "sliding_card_media",

            fileName:
              "skills-in-action.mp4",

            mimeType:
              "video/mp4",

            sizeBytes:
              9100000,

            width:
              720,

            height:
              720,

            durationSeconds:
              9.2,

            framesPerSecond:
              30,

            altText:
              "Short video demonstrating practical professional learning",
          },
        },

        {
          slot:
            3,

          title:
            "Grow Your Career",

          media: {
            role:
              "slide",

            type:
              "image",

            frameProfile:
              "sliding_card_media",

            fileName:
              "career-development.jpg",

            mimeType:
              "image/jpeg",

            sizeBytes:
              1870000,

            width:
              720,

            height:
              720,

            altText:
              "Team working together on career development",

            url:
              "https://images.unsplash.com/photo-1521737711867-e3b97375f902",
          },
        },
      ],
    },

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
    },
  },
];