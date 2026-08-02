import type {
  PosterPromotionCreateRequest,
  PosterPromotionDetailResponse,
  PosterPromotionSaveMode,
  PosterPromotionUpdateRequest,
} from "./poster-promotion.api-types";

import type {
  PosterPromotionDraft,
  PosterPromotionMedia,
} from "./poster-promotion.types";

import {
  mapPosterPromotionPlacementToApi,
} from "./poster-promotion.mappers";

function requireScheduleDates(
  draft:
    PosterPromotionDraft
): void {
  if (
    !draft.startAt ||
    !draft.endAt
  ) {
    throw new Error(
      "Start and end dates are required before saving to the Backend."
    );
  }
}

function mapPersistedMedia(
  media:
    PosterPromotionMedia | null,
  mode:
    PosterPromotionSaveMode
) {
  if (
    !media
  ) {
    if (
      mode ===
      "schedule"
    ) {
      throw new Error(
        "A persisted promotion image or video is required before scheduling."
      );
    }

    return null;
  }

  if (
    !media.assetId
  ) {
    throw new Error(
      "This media is only a local browser preview. Connect the storage upload API before saving it to the Backend."
    );
  }

  return {
    assetId:
      media.assetId,

    type:
      media.type,

    fileName:
      media.fileName,

    mimeType:
      media.mimeType,

    sizeBytes:
      media.sizeBytes,
  };
}

export function mapDraftToCreatePosterPromotionRequest(
  draft:
    PosterPromotionDraft,
  organizationId:
    string,
  mode:
    PosterPromotionSaveMode
): PosterPromotionCreateRequest {
  requireScheduleDates(
    draft
  );

  return {
    organizationId,

    name:
      draft.name.trim(),

    placements:
      draft.placements.map(
        mapPosterPromotionPlacementToApi
      ),

    scheduledStartDate:
      draft.startAt,

    scheduledEndDate:
      draft.endAt,

    mode,

    purpose:
      draft.purpose.trim(),

    headline:
      draft.creative.headline.trim(),

    body:
      draft.creative.body.trim(),

    callToAction:
      draft.creative.callToAction.trim(),

    destinationUrl:
      draft.creative.destinationUrl.trim(),

    media:
      mapPersistedMedia(
        draft.creative.media,
        mode
      ),
  };
}

export function mapDraftToUpdatePosterPromotionRequest(
  draft:
    PosterPromotionDraft,
  detail:
    PosterPromotionDetailResponse,
  mode:
    PosterPromotionSaveMode
): PosterPromotionUpdateRequest {
  requireScheduleDates(
    draft
  );

  return {
    expectedCampaignRowVersion:
      detail.campaign.rowVersion,

    expectedCreativeRowVersion:
      detail.creative.rowVersion,

    name:
      draft.name.trim(),

    placements:
      draft.placements.map(
        mapPosterPromotionPlacementToApi
      ),

    scheduledStartDate:
      draft.startAt,

    scheduledEndDate:
      draft.endAt,

    mode,

    purpose:
      draft.purpose.trim(),

    headline:
      draft.creative.headline.trim(),

    body:
      draft.creative.body.trim(),

    callToAction:
      draft.creative.callToAction.trim(),

    destinationUrl:
      draft.creative.destinationUrl.trim(),

    media:
      mapPersistedMedia(
        draft.creative.media,
        mode
      ),
  };
}