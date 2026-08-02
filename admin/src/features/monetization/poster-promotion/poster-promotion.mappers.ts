import type {
  PosterPromotionCampaign,
  PosterPromotionDetailResponse,
} from "./poster-promotion.api-types";

import type {
  PosterPromotionDraft,
  PosterPromotionPlacement,
} from "./poster-promotion.types";

const API_TO_UI_PLACEMENT = {
  home:
    "Home",

  search:
    "Search",

  trending:
    "Trending",
} as const;

const UI_TO_API_PLACEMENT = {
  Home:
    "home",

  Search:
    "search",

  Trending:
    "trending",
} as const;

export function mapPosterPromotionPlacementToUi(
  placement:
    PosterPromotionCampaign[
      "placements"
    ][number]
): PosterPromotionPlacement {
  return API_TO_UI_PLACEMENT[
    placement
  ];
}

export function mapPosterPromotionPlacementToApi(
  placement:
    PosterPromotionPlacement
): PosterPromotionCampaign[
  "placements"
][number] {
  return UI_TO_API_PLACEMENT[
    placement
  ];
}

export function mapPosterPromotionDetailToDraft(
  detail:
    PosterPromotionDetailResponse
): PosterPromotionDraft {
  return {
    name:
      detail.campaign.name,

    purpose:
      detail.creative.purpose,

    placements:
      detail.campaign
        .placements
        .map(
          mapPosterPromotionPlacementToUi
        ),

    startAt:
      detail.campaign
        .scheduledStartDate,

    endAt:
      detail.campaign
        .scheduledEndDate,

    creative: {
      headline:
        detail.creative.headline,

      body:
        detail.creative.body,

      callToAction:
        detail.creative
          .callToAction,

      destinationUrl:
        detail.creative
          .destinationUrl,

      media:
        detail.creative.media
          ? {
              assetId:
                detail.creative.media
                  .assetId,

              type:
                detail.creative.media
                  .type,

              fileName:
                detail.creative.media
                  .fileName,

              previewUrl:
                "",

              mimeType:
                detail.creative.media
                  .mimeType,

              sizeBytes:
                detail.creative.media
                  .sizeBytes,
            }
          : null,
    },
  };
}