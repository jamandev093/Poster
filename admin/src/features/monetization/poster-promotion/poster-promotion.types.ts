export type PosterPromotionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

export type PosterPromotionPlacement =
  | "Home"
  | "Search"
  | "Trending";

export type PosterPromotionMediaType =
  | "image"
  | "video";

export interface PosterPromotionMedia {
  type:
    PosterPromotionMediaType;

  fileName:
    string;

  previewUrl:
    string;

  mimeType:
    string;

  sizeBytes:
    number;
}

export interface PosterPromotionCreative {
  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  media:
    PosterPromotionMedia | null;
}

export interface PosterPromotionAuditEntry {
  id:
    string;

  action:
    string;

  actor:
    string;

  timestamp:
    string;
}

export interface PosterPromotionRecord {
  id:
    string;

  name:
    string;

  purpose:
    string;

  placements:
    PosterPromotionPlacement[];

  status:
    PosterPromotionStatus;

  startAt:
    string;

  endAt?:
    string;

  creative:
    PosterPromotionCreative;

  impressions:
    number;

  clicks:
    number;

  conversions:
    number;

  audit:
    PosterPromotionAuditEntry[];
}

export interface PosterPromotionDraft {
  name:
    string;

  purpose:
    string;

  placements:
    PosterPromotionPlacement[];

  startAt:
    string;

  endAt:
    string;

  creative:
    PosterPromotionCreative;
}

export const EMPTY_POSTER_PROMOTION_DRAFT:
  PosterPromotionDraft = {
  name:
    "",

  purpose:
    "",

  placements: [
    "Home",
  ],

  startAt:
    "",

  endAt:
    "",

  creative: {
    headline:
      "",

    body:
      "",

    callToAction:
      "",

    destinationUrl:
      "",

    media:
      null,
  },
};

