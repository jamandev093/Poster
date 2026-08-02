export type PosterPromotionApiStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled";

export type PosterPromotionApiPlacement =
  | "home"
  | "search"
  | "trending";

export type PosterPromotionSaveMode =
  | "draft"
  | "schedule";

export type PosterPromotionApiMediaType =
  | "image"
  | "video";

export interface PosterPromotionApiMedia {
  assetId:
    string;

  type:
    PosterPromotionApiMediaType;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;
}

export interface PosterPromotionCampaign {
  id:
    string;

  campaignReference:
    string;

  sourceRequestId:
    string | null;

  organizationId:
    string;

  name:
    string;

  campaignType:
    "poster_promotion";

  origin:
    "admin_internal";

  status:
    PosterPromotionApiStatus;

  placements:
    PosterPromotionApiPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  readinessStatus:
    string;

  commercialStatus:
    string;

  deliveryEligible:
    boolean;

  createdByUserId:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface PosterPromotionCreativeRecord {
  campaignId:
    string;

  purpose:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  disclosure:
    "Promoted by Poster";

  media:
    PosterPromotionApiMedia | null;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface PosterPromotionDetailResponse {
  campaign:
    PosterPromotionCampaign;

  creative:
    PosterPromotionCreativeRecord;
}

export interface PosterPromotionCampaignListResponse {
  items:
    PosterPromotionCampaign[];

  total:
    number;

  limit:
    number;

  offset:
    number;
}

export interface PosterPromotionCreateRequest {
  organizationId:
    string;

  name:
    string;

  placements:
    PosterPromotionApiPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  mode:
    PosterPromotionSaveMode;

  purpose:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  media:
    PosterPromotionApiMedia | null;
}

export interface PosterPromotionUpdateRequest {
  expectedCampaignRowVersion:
    string;

  expectedCreativeRowVersion:
    string;

  name:
    string;

  placements:
    PosterPromotionApiPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  mode:
    PosterPromotionSaveMode;

  purpose:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  media:
    PosterPromotionApiMedia | null;
}

export interface PosterPromotionApiIssue {
  path:
    string;

  message:
    string;
}

export interface PosterPromotionApiErrorBody {
  error?: {
    code?:
      string;

    message?:
      string;

    requestId?:
      string;

    details?:
      PosterPromotionApiIssue[];
  };
}