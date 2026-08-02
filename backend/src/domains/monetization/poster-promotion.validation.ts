import {
  POSTER_PROMOTION_DISCLOSURE,
} from "./poster-promotion.types.js";

import type {
  CreatePosterPromotionCreativeInput,
  PosterPromotionCreative,
  PosterPromotionMediaReference,
  PosterPromotionValidationIssue,
  PosterPromotionValidationMode,
  UpdatePosterPromotionCreativeInput,
} from "./poster-promotion.types.js";

const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

const MAX_VIDEO_SIZE_BYTES =
  20 * 1024 * 1024;

const IMAGE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const VIDEO_MIME_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);

function isHttpUrl(
  value:
    string
): boolean {
  try {
    const parsed =
      new URL(
        value
      );

    return (
      parsed.protocol ===
        "https:" ||
      parsed.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

function hasControlCharacters(
  value:
    string
): boolean {
  return /[\u0000-\u001F\u007F]/.test(
    value
  );
}

function validateRequiredText(
  input: {
    path: string;

    value: string;

    minimum: number;

    maximum: number;

    label: string;
  }
): PosterPromotionValidationIssue[] {
  const value =
    input.value.trim();

  if (
    value.length <
    input.minimum
  ) {
    return [
      {
        path:
          input.path,

        message:
          `${input.label} must contain at least ${input.minimum} characters.`,
      },
    ];
  }

  if (
    value.length >
    input.maximum
  ) {
    return [
      {
        path:
          input.path,

        message:
          `${input.label} must contain no more than ${input.maximum} characters.`,
      },
    ];
  }

  if (
    hasControlCharacters(
      value
    )
  ) {
    return [
      {
        path:
          input.path,

        message:
          `${input.label} contains unsupported control characters.`,
      },
    ];
  }

  return [];
}

export function validatePosterPromotionMediaReference(
  media:
    PosterPromotionMediaReference |
    null,
  mode:
    PosterPromotionValidationMode
): PosterPromotionValidationIssue[] {
  if (
    !media
  ) {
    return mode ===
      "schedule"
      ? [
          {
            path:
              "media",

            message:
              "A persisted Poster Promotion image or video is required before scheduling.",
          },
        ]
      : [];
  }

  const issues:
    PosterPromotionValidationIssue[] =
      [];

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      media.assetId
    )
  ) {
    issues.push({
      path:
        "media.assetId",

      message:
        "Media asset ID must be a valid UUID.",
    });
  }

  if (
    media.fileName.trim().length <
      1 ||
    media.fileName.trim().length >
      255
  ) {
    issues.push({
      path:
        "media.fileName",

      message:
        "Media file name must contain between 1 and 255 characters.",
    });
  }

  if (
    !Number.isSafeInteger(
      media.sizeBytes
    ) ||
    media.sizeBytes <=
      0
  ) {
    issues.push({
      path:
        "media.sizeBytes",

      message:
        "Media size must be a positive whole number.",
    });

    return issues;
  }

  if (
    media.type ===
    "image"
  ) {
    if (
      !IMAGE_MIME_TYPES.has(
        media.mimeType
      )
    ) {
      issues.push({
        path:
          "media.mimeType",

        message:
          "Poster Promotion images must use JPG, PNG, or WebP.",
      });
    }

    if (
      media.sizeBytes >
      MAX_IMAGE_SIZE_BYTES
    ) {
      issues.push({
        path:
          "media.sizeBytes",

        message:
          "Poster Promotion images must not exceed 10 MB.",
      });
    }

    return issues;
  }

  if (
    media.type ===
    "video"
  ) {
    if (
      !VIDEO_MIME_TYPES.has(
        media.mimeType
      )
    ) {
      issues.push({
        path:
          "media.mimeType",

        message:
          "Poster Promotion videos must use MP4 or WebM.",
      });
    }

    if (
      media.sizeBytes >
      MAX_VIDEO_SIZE_BYTES
    ) {
      issues.push({
        path:
          "media.sizeBytes",

        message:
          "Poster Promotion videos must not exceed 20 MB.",
      });
    }

    return issues;
  }

  issues.push({
    path:
      "media.type",

    message:
      "Poster Promotion media type must be image or video.",
  });

  return issues;
}

export function validatePosterPromotionCreative(
  creative:
    PosterPromotionCreative,
  mode:
    PosterPromotionValidationMode
): PosterPromotionValidationIssue[] {
  const issues:
    PosterPromotionValidationIssue[] =
      [];

  issues.push(
    ...validateRequiredText({
      path:
        "purpose",

      value:
        creative.purpose,

      minimum:
        10,

      maximum:
        2000,

      label:
        "Purpose",
    })
  );

  issues.push(
    ...validateRequiredText({
      path:
        "headline",

      value:
        creative.headline,

      minimum:
        3,

      maximum:
        120,

      label:
        "Headline",
    })
  );

  issues.push(
    ...validateRequiredText({
      path:
        "body",

      value:
        creative.body,

      minimum:
        10,

      maximum:
        500,

      label:
        "Creative body",
    })
  );

  issues.push(
    ...validateRequiredText({
      path:
        "callToAction",

      value:
        creative.callToAction,

      minimum:
        2,

      maximum:
        40,

      label:
        "Call to action",
    })
  );

  const destinationUrl =
    creative.destinationUrl.trim();

  if (
    !isHttpUrl(
      destinationUrl
    )
  ) {
    issues.push({
      path:
        "destinationUrl",

      message:
        "Destination URL must use HTTP or HTTPS.",
    });
  } else if (
    destinationUrl.length >
    2048
  ) {
    issues.push({
      path:
        "destinationUrl",

      message:
        "Destination URL must contain no more than 2048 characters.",
    });
  }

  if (
    creative.disclosure !==
    POSTER_PROMOTION_DISCLOSURE
  ) {
    issues.push({
      path:
        "disclosure",

      message:
        'Poster Promotion disclosure must be "Promoted by Poster".',
    });
  }

  issues.push(
    ...validatePosterPromotionMediaReference(
      creative.media,
      mode
    )
  );

  return issues;
}

export function normalizePosterPromotionCreative(
  input:
    CreatePosterPromotionCreativeInput |
    UpdatePosterPromotionCreativeInput
): PosterPromotionCreative {
  return {
    purpose:
      input.purpose.trim(),

    headline:
      input.headline.trim(),

    body:
      input.body.trim(),

    callToAction:
      input.callToAction.trim(),

    destinationUrl:
      input.destinationUrl.trim(),

    disclosure:
      POSTER_PROMOTION_DISCLOSURE,

    media:
      input.media
        ? {
            assetId:
              input.media.assetId,

            type:
              input.media.type,

            fileName:
              input.media.fileName.trim(),

            mimeType:
              input.media.mimeType.trim().toLowerCase(),

            sizeBytes:
              input.media.sizeBytes,
          }
        : null,
  };
}