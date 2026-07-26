import type {
  CreativeFrameProfile,
  CreativeMediaType,
  SlidingCardSlot,
} from "./media.types";

/**
 * Canonical Poster advertising-media specifications.
 *
 * These rules must remain aligned across:
 *
 * - Client Web App upload forms
 * - Admin creative review
 * - Mobile App rendering
 * - Backend media inspection
 * - Google Cloud media processing
 *
 * This file contains specifications only.
 * Validation belongs in media.validation.ts.
 */

export interface MediaFrameRule {
  profile:
    CreativeFrameProfile;

  label:
    string;

  expectedAspectRatio:
    number;

  aspectRatioTolerance:
    number;

  minimumWidth?:
    number;

  minimumHeight?:
    number;

  maximumWidth:
    number;

  maximumHeight:
    number;

  allowedMediaTypes:
    readonly CreativeMediaType[];
}

export interface ImageMediaRule {
  acceptedMimeTypes:
    readonly string[];

  maximumBytes:
    number;

  altTextRequired:
    boolean;
}

export interface VideoMediaRule {
  acceptedMimeTypes:
    readonly string[];

  maximumBytes:
    number;

  maximumDurationMilliseconds:
    number;

  minimumFramesPerSecond:
    number;

  maximumFramesPerSecond:
    number;

  preferredFramesPerSecond:
    number;

  audioAllowed:
    boolean;
}

export interface SlidingCardRule {
  slot:
    SlidingCardSlot;

  requiredMediaType:
    CreativeMediaType;

  frameProfile:
    "sliding_card_media";

  titleRequired:
    boolean;
}

export const MEDIA_BYTE_LIMITS = {
  /**
   * Locked advertiser-upload limit for advertising videos.
   */
  advertisingVideo:
    20 *
    1024 *
    1024,

  /**
   * Conservative initial limit for image creatives.
   *
   * Images should still be optimized during Backend processing
   * before CDN delivery.
   */
  advertisingImage:
    10 *
    1024 *
    1024,

  /**
   * Advertiser logos should remain lightweight.
   */
  advertiserLogo:
    5 *
    1024 *
    1024,
} as const;

export const IMAGE_MEDIA_RULES:
  ImageMediaRule = {
  acceptedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
  ],

  maximumBytes:
    MEDIA_BYTE_LIMITS
      .advertisingImage,

  altTextRequired:
    true,
};

export const VIDEO_MEDIA_RULES:
  VideoMediaRule = {
  acceptedMimeTypes: [
    "video/mp4",
    "video/webm",
  ],

  maximumBytes:
    MEDIA_BYTE_LIMITS
      .advertisingVideo,

  maximumDurationMilliseconds:
    10_000,

  minimumFramesPerSecond:
    30,

  maximumFramesPerSecond:
    45,

  preferredFramesPerSecond:
    30,

  audioAllowed:
    true,
};

export const MEDIA_FRAME_RULES: Record<
  CreativeFrameProfile,
  MediaFrameRule
> = {
  standard_media: {
    profile:
      "standard_media",

    label:
      "Poster standard advertising frame",

    expectedAspectRatio:
      16 / 9,

    aspectRatioTolerance:
      0.02,

    maximumWidth:
      1280,

    maximumHeight:
      720,

    allowedMediaTypes: [
      "image",
      "video",
    ],
  },

  sliding_card_media: {
    profile:
      "sliding_card_media",

    label:
      "Poster sliding-card advertising frame",

    expectedAspectRatio:
      1,

    aspectRatioTolerance:
      0.02,

    maximumWidth:
      720,

    maximumHeight:
      720,

    allowedMediaTypes: [
      "image",
      "video",
    ],
  },

  advertiser_logo: {
    profile:
      "advertiser_logo",

    label:
      "Advertiser logo",

    expectedAspectRatio:
      1,

    aspectRatioTolerance:
      0.05,

    maximumWidth:
      1024,

    maximumHeight:
      1024,

    allowedMediaTypes: [
      "image",
    ],
  },
};

export const SLIDING_CARD_RULES: Record<
  SlidingCardSlot,
  SlidingCardRule
> = {
  1: {
    slot:
      1,

    requiredMediaType:
      "video",

    frameProfile:
      "sliding_card_media",

    titleRequired:
      true,
  },

  2: {
    slot:
      2,

    requiredMediaType:
      "image",

    frameProfile:
      "sliding_card_media",

    titleRequired:
      true,
  },

  3: {
    slot:
      3,

    requiredMediaType:
      "image",

    frameProfile:
      "sliding_card_media",

    titleRequired:
      true,
  },
};

export const STANDARD_CREATIVE_RULE = {
  layout:
    "standard" as const,

  requiredPrimaryAssets:
    1,

  frameProfile:
    "standard_media" as const,

  allowedPrimaryMediaTypes: [
    "image",
    "video",
  ] as const,

  logoOptional:
    true,
};

export const SLIDING_CREATIVE_RULE = {
  layout:
    "sliding" as const,

  requiredCardCount:
    3,

  cardOrder: [
    1,
    2,
    3,
  ] as const,

  videoCardSlot:
    1 as const,

  imageCardSlots: [
    2,
    3,
  ] as const,

  frameProfile:
    "sliding_card_media" as const,

  logoOptional:
    true,
};

export function getMediaFrameRule(
  profile:
    CreativeFrameProfile
): MediaFrameRule {
  return MEDIA_FRAME_RULES[
    profile
  ];
}

export function getSlidingCardRule(
  slot:
    SlidingCardSlot
): SlidingCardRule {
  return SLIDING_CARD_RULES[
    slot
  ];
}

export function isAcceptedImageMimeType(
  mimeType:
    string
): boolean {
  return IMAGE_MEDIA_RULES
    .acceptedMimeTypes
    .includes(
      mimeType
    );
}

export function isAcceptedVideoMimeType(
  mimeType:
    string
): boolean {
  return VIDEO_MEDIA_RULES
    .acceptedMimeTypes
    .includes(
      mimeType
    );
}

export function calculateAspectRatio(
  width:
    number,
  height:
    number
): number | null {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return (
    width /
    height
  );
}

export function isAspectRatioWithinTolerance(
  actualRatio:
    number,
  expectedRatio:
    number,
  tolerance:
    number
): boolean {
  if (
    actualRatio <= 0 ||
    expectedRatio <= 0 ||
    tolerance < 0
  ) {
    return false;
  }

  const relativeDifference =
    Math.abs(
      actualRatio -
      expectedRatio
    ) /
    expectedRatio;

  return (
    relativeDifference <=
    tolerance
  );
}
