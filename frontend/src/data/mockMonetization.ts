import {
  DirectSponsoredCampaign,
  GoogleNativeAdPlaceholder,
  PosterAffiliatePromotion,
  PosterPromotion,
} from "../components/ads";

export const posterPromotion:
  PosterPromotion = {
  id:
    "poster-promotion-weekly-digest",

  type:
    "poster_promotion",

  placement:
    "home",

  status:
    "active",

  sourceName:
    "Poster",

  disclosure:
    "Promoted by Poster",

  title:
    "Turn your reading into a personalized weekly knowledge digest",

  description:
    "Review the most valuable stories you discovered this week, organized around your interests.",

  imageUrl:
    "https://images.unsplash.com/photo-1456324504439-367cee3b3c32",

  destinationUrl:
    "https://poster.app/weekly-digest",

  callToAction:
    "Explore Digest",
};

export const posterAffiliatePromotion:
  PosterAffiliatePromotion = {
  id:
    "poster-affiliate-learning-platform",

  type:
    "poster_affiliate",

  placement:
    "search",

  status:
    "active",

  sourceName:
    "Poster",

  partnerName:
    "Knowledge Academy",

  disclosure:
    "Affiliate by Poster · Poster may earn a commission",

  title:
    "Build practical artificial-intelligence skills through guided projects",

  description:
    "Explore curated learning programs selected for readers interested in AI, technology and professional development.",

  imageUrl:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",

  mediaItems: [
    {
      id:
        "affiliate-ai-foundations",

      mediaType:
        "image",

      imageUrl:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",

      title:
        "AI Foundations",

      accessibilityLabel:
        "AI Foundations learning course",
    },

    {
      id:
        "affiliate-machine-learning",

      mediaType:
        "image",

      imageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",

      title:
        "Machine Learning Projects",

      accessibilityLabel:
        "Machine Learning Projects course",
    },

    {
      id:
        "affiliate-data-skills",

      mediaType:
        "image",

      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71",

      title:
        "Practical Data Skills",

      accessibilityLabel:
        "Practical Data Skills course",
    },
  ],

  destinationUrl:
    "https://example.com/knowledge-academy",

  trackingUrl:
    "https://example.com/knowledge-academy?ref=poster",

  callToAction:
    "View Courses",

  affiliateProgram:
    "Knowledge Academy Partner Program",
};

/**
 * DEVELOPMENT GLOBAL-PLACEMENT TEST
 *
 * The same approved Research Cloud campaign is eligible
 * on Home, Search, and Trending.
 *
 * MonetizationService creates a placement-resolved copy
 * before rendering so analytics record the real surface.
 *
 * Current creative:
 * standard landscape video in the finalized 16:9 frame.
 */
export const directSponsoredCampaign:
  DirectSponsoredCampaign = {
  id:
    "direct-sponsorship-research-cloud",

  type:
    "direct_sponsorship",

  /**
   * Default/fallback placement.
   *
   * MonetizationService resolves this dynamically to
   * "home", "search", or "trending" when composing
   * each feed.
   */
  placement:
    "home",

  /**
   * Campaign-level eligible delivery surfaces.
   */
  placements: [
    "home",
    "search",
    "trending",
  ],

  status:
    "active",

  campaignId:
    "campaign-research-cloud-001",

  advertiserName:
    "Research Cloud",

  advertiserDomain:
    "researchcloud.example",

  disclosure:
    "Sponsored by Research Cloud",

  title:
    "Research collaboration built for modern teams",

  description:
    "Organize sources, review findings and collaborate across research projects from one connected workspace.",

  /**
   * Standard landscape video creative.
   *
   * AdMedia keeps the existing finalized:
   *
   * aspectRatio: 16 / 9
   */
  mediaType:
    "video",

  videoUrl:
    "https://res.cloudinary.com/demo/video/upload/so_0,eo_8/c_fill,w_1280,h_720/dog.mp4",

  thumbnailUrl:
    "https://res.cloudinary.com/demo/video/upload/so_1,c_fill,w_1280,h_720/dog.jpg",

  imageUrl:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998",

  destinationUrl:
    "https://example.com/research-cloud",

  callToAction:
    "Learn More",
};

export const googleNativeAdPlaceholder:
  GoogleNativeAdPlaceholder = {
  id:
    "google-native-home-placeholder",

  type:
    "google_native_ad",

  placement:
    "home",

  status:
    "idle",

  adUnitId:
    undefined,
};

export const mockMonetizationItems = [
  posterPromotion,
  posterAffiliatePromotion,
  directSponsoredCampaign,
  googleNativeAdPlaceholder,
] as const;
