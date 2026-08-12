import {
  GoogleNativeAdPlaceholder,
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
  googleNativeAdPlaceholder,
] as const;
