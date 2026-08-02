export type MonetizationEntryType =
  | "poster_promotion"
  | "poster_affiliate"
  | "direct_sponsorship"
  | "google_native_ad";

export type MonetizationPlacement =
  | "home"
  | "search"
  | "trending";

export type MonetizationStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed";

export type MonetizationMediaType =
  | "image"
  | "video";

/**
 * Creative format is independent from commercial type.
 *
 * Every Poster-controlled commercial type can use:
 *
 * standard
 * - one 16:9 image
 * - or one 16:9 video
 *
 * sliding
 * - Card 1 video
 * - Card 2 image
 * - Card 3 image
 * - existing finalized 1:1 card frame
 */
export type MonetizationCreativeFormat =
  | "standard"
  | "sliding";

export interface MonetizationMediaItem {
  id: string;

  /**
   * Optional for backward compatibility.
   *
   * If omitted:
   * - videoUrl means video
   * - otherwise image is assumed.
   */
  mediaType?:
    MonetizationMediaType;

  imageUrl?: string;

  videoUrl?: string;

  /**
   * Poster/preview image shown before the first
   * video frame becomes available.
   */
  thumbnailUrl?: string;

  title?: string;

  destinationUrl?: string;

  accessibilityLabel?: string;
}

export interface BaseMonetizationItem {
  id: string;

  type:
    MonetizationEntryType;

  /**
   * Resolved/current delivery surface.
   *
   * MonetizationService resolves this value for the
   * actual Home, Search, or Trending feed instance.
   *
   * Analytics use this field so placement performance
   * remains separated.
   */
  placement:
    MonetizationPlacement;

  /**
   * All discovery surfaces where this campaign
   * is eligible to appear.
   *
   * When omitted, the item remains eligible only for
   * its singular `placement` value.
   */
  placements?:
    readonly MonetizationPlacement[];

  status:
    MonetizationStatus;

  /**
   * Explicit creative format.
   *
   * Optional during migration so older records remain
   * compatible while Client/Admin/backend models are
   * moved to the new shared format.
   *
   * When omitted, AdMedia continues to infer:
   *
   * mediaItems present -> sliding
   * otherwise         -> standard
   */
  creativeFormat?:
    MonetizationCreativeFormat;

  title: string;

  description?: string;

  /**
   * STANDARD CREATIVE
   *
   * One image or one video rendered in the existing
   * finalized landscape 16:9 frame.
   */
  mediaType?:
    MonetizationMediaType;

  imageUrl?: string;

  videoUrl?: string;

  thumbnailUrl?: string;

  /**
   * SLIDING CREATIVE
   *
   * Existing finalized 1:1 horizontal cards.
   *
   * Locked initial advertising structure:
   *
   * Card 1 -> video
   * Card 2 -> image
   * Card 3 -> image
   */
  mediaItems?:
    readonly MonetizationMediaItem[];

  destinationUrl: string;

  callToAction: string;

  startAt?: string;

  endAt?: string;
}

export interface PosterPromotion
  extends BaseMonetizationItem {
  type:
    "poster_promotion";

  sourceName:
    "Poster";

  disclosure:
    "Promoted by Poster";
}

export interface PosterAffiliatePromotion
  extends BaseMonetizationItem {
  type:
    "poster_affiliate";

  sourceName:
    "Poster";

  partnerName: string;

  partnerLogoUrl?: string;

  disclosure:
    "Affiliate by Poster · Poster may earn a commission";

  affiliateProgram?: string;

  trackingUrl?: string;
}

export interface DirectSponsoredCampaign
  extends BaseMonetizationItem {
  type:
    "direct_sponsorship";

  advertiserName: string;

  advertiserDomain: string;

  advertiserLogoUrl?: string;

  disclosure: string;

  campaignId: string;
}

/**
 * Programmatic / Google advertising is provider-controlled.
 *
 * It does not use Poster's advertiser-uploaded standard/sliding
 * creative-format rules.
 */
export interface GoogleNativeAdPlaceholder {
  id: string;

  type:
    "google_native_ad";

  placement:
    MonetizationPlacement;

  adUnitId?: string;

  status:
    | "idle"
    | "loading"
    | "loaded"
    | "no_fill"
    | "failed";
}

export type MonetizationItem =
  | PosterPromotion
  | PosterAffiliatePromotion
  | DirectSponsoredCampaign
  | GoogleNativeAdPlaceholder;
