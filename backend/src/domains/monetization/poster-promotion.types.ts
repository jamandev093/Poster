import type {
  MonetizationCampaignRecord,
} from "./commercial.types.js";

export const POSTER_PROMOTION_DISCLOSURE =
  "Promoted by Poster" as const;

export type PosterPromotionDisclosure =
  typeof POSTER_PROMOTION_DISCLOSURE;

export type PosterPromotionMediaType =
  | "image"
  | "video";

export interface PosterPromotionMediaReference {
  assetId:
    string;

  type:
    PosterPromotionMediaType;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;
}

export interface PosterPromotionCreative {
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
    PosterPromotionDisclosure;

  media:
    PosterPromotionMediaReference |
    null;
}

export interface PosterPromotionCreativeRecord
  extends PosterPromotionCreative {
  campaignId:
    string;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface PosterPromotionRecord {
  campaign:
    MonetizationCampaignRecord;

  creative:
    PosterPromotionCreativeRecord;
}

export interface CreatePosterPromotionCreativeInput {
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

  media:
    PosterPromotionMediaReference |
    null;
}

export interface UpdatePosterPromotionCreativeInput {
  campaignId:
    string;

  expectedRowVersion:
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

  media:
    PosterPromotionMediaReference |
    null;
}

export type PosterPromotionValidationMode =
  | "draft"
  | "schedule";

export interface PosterPromotionValidationIssue {
  path:
    string;

  message:
    string;
}
export type PosterPromotionCreativeUpdateResult =
  | {
      status:
        "updated";

      creative:
        PosterPromotionCreativeRecord;
    }
  | {
      status:
        "conflict";

      current:
        PosterPromotionCreativeRecord;
    }
  | {
      status:
        "not_found";
    };

export interface PosterPromotionRepository {
  findCreativeByCampaignId:
    (
      campaignId:
        string,
      executor?:
        import("../../database/database.pool.js").DatabaseQueryExecutor
    ) =>
      Promise<
        PosterPromotionCreativeRecord |
        null
      >;

  createCreative:
    (
      input:
        CreatePosterPromotionCreativeInput,
      executor?:
        import("../../database/database.pool.js").DatabaseQueryExecutor
    ) =>
      Promise<
        PosterPromotionCreativeRecord
      >;

  updateCreative:
    (
      input:
        UpdatePosterPromotionCreativeInput,
      executor?:
        import("../../database/database.pool.js").DatabaseQueryExecutor
    ) =>
      Promise<
        PosterPromotionCreativeUpdateResult
      >;
}
