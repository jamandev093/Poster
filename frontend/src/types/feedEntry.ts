import {
  DirectSponsoredCampaign,
  GoogleNativeAdPlaceholder,
  PosterAffiliatePromotion,
  PosterPromotion,
} from "../components/ads";

import { Article } from "./article";

export interface ArticleFeedEntry {
  id: string;

  type: "article";

  article: Article;
}

export interface PosterPromotionFeedEntry {
  id: string;

  type: "poster_promotion";

  promotion: PosterPromotion;
}

export interface PosterAffiliateFeedEntry {
  id: string;

  type: "poster_affiliate";

  promotion:
    PosterAffiliatePromotion;
}

export interface DirectSponsorshipFeedEntry {
  id: string;

  type: "direct_sponsorship";

  campaign:
    DirectSponsoredCampaign;
}

export interface GoogleNativeAdFeedEntry {
  id: string;

  type: "google_native_ad";

  ad:
    GoogleNativeAdPlaceholder;
}

export type FeedEntry =
  | ArticleFeedEntry
  | PosterPromotionFeedEntry
  | PosterAffiliateFeedEntry
  | DirectSponsorshipFeedEntry
  | GoogleNativeAdFeedEntry;