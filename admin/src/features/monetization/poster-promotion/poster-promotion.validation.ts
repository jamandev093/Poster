import type {
  PosterPromotionDraft,
  PosterPromotionMedia,
} from "./poster-promotion.types";

export interface PosterPromotionValidationErrors {
  name?:
    string;

  purpose?:
    string;

  placement?:
    string;

  startAt?:
    string;

  endAt?:
    string;

  headline?:
    string;

  body?:
    string;

  callToAction?:
    string;

  destinationUrl?:
    string;

  media?:
    string;
}

const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

const MAX_VIDEO_SIZE_BYTES =
  20 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const ALLOWED_VIDEO_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);

function isValidUrl(
  value:
    string
): boolean {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

export function validatePosterPromotionMedia(
  media:
    PosterPromotionMedia | null
): string | null {
  if (!media) {
    return "A promotion image or video is required.";
  }

  if (
    media.type ===
    "image"
  ) {
    if (
      !ALLOWED_IMAGE_TYPES.has(
        media.mimeType
      )
    ) {
      return "Use a JPG, PNG, or WebP image.";
    }

    if (
      media.sizeBytes >
      MAX_IMAGE_SIZE_BYTES
    ) {
      return "Image size must not exceed 10 MB.";
    }

    return null;
  }

  if (
    !ALLOWED_VIDEO_TYPES.has(
      media.mimeType
    )
  ) {
    return "Use an MP4 or WebM video.";
  }

  if (
    media.sizeBytes >
    MAX_VIDEO_SIZE_BYTES
  ) {
    return "Video size must not exceed 20 MB.";
  }

  return null;
}

export function validatePosterPromotionDraft(
  draft:
    PosterPromotionDraft
): PosterPromotionValidationErrors {
  const errors:
    PosterPromotionValidationErrors = {};

  if (
    draft.name
      .trim()
      .length <
    3
  ) {
    errors.name =
      "Promotion name must contain at least 3 characters.";
  }

  if (
    draft.purpose
      .trim()
      .length <
    10
  ) {
    errors.purpose =
      "Purpose must contain at least 10 characters.";
  }

  if (
    draft.placements.length ===
    0
  ) {
    errors.placement =
      "Select at least one placement.";
  }

  if (
    !draft.startAt
  ) {
    errors.startAt =
      "Start date is required.";
  }

  if (
    draft.endAt &&
    draft.startAt &&
    draft.endAt <
      draft.startAt
  ) {
    errors.endAt =
      "End date must be on or after the start date.";
  }

  if (
    draft.creative.headline
      .trim()
      .length <
    3
  ) {
    errors.headline =
      "Headline must contain at least 3 characters.";
  }

  if (
    draft.creative.body
      .trim()
      .length <
    10
  ) {
    errors.body =
      "Creative body must contain at least 10 characters.";
  }

  if (
    draft.creative.callToAction
      .trim()
      .length <
    2
  ) {
    errors.callToAction =
      "Call to action is required.";
  }

  if (
    !isValidUrl(
      draft.creative.destinationUrl
        .trim()
    )
  ) {
    errors.destinationUrl =
      "Enter a valid HTTP or HTTPS destination URL.";
  }

  const mediaError =
    validatePosterPromotionMedia(
      draft.creative.media
    );

  if (
    mediaError
  ) {
    errors.media =
      mediaError;
  }

  return errors;
}

export function hasPosterPromotionErrors(
  errors:
    PosterPromotionValidationErrors
): boolean {
  return Object.values(
    errors
  ).some(
    Boolean
  );
}

