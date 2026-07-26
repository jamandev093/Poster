import {
  IMAGE_MEDIA_RULES,
  MEDIA_BYTE_LIMITS,
  SLIDING_CREATIVE_RULE,
  VIDEO_MEDIA_RULES,
  calculateAspectRatio,
  getMediaFrameRule,
  getSlidingCardRule,
  isAcceptedImageMimeType,
  isAcceptedVideoMimeType,
  isAspectRatioWithinTolerance,
} from "./media.rules";

import type {
  CreativeMediaAsset,
  CreativeVersion,
  MediaDimensions,
  SlidingCreativeCard,
} from "./media.types";

export interface MediaValidationResult {
  valid: boolean;

  errors: string[];

  warnings: string[];
}

function createResult(
  errors: string[],
  warnings: string[]
): MediaValidationResult {
  return {
    valid:
      errors.length === 0,

    errors,

    warnings,
  };
}

function isNonEmptyString(
  value:
    string |
    undefined
): boolean {
  return Boolean(
    value?.trim()
  );
}

function isValidHttpUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function isValidTimestamp(
  value:
    string |
    undefined
): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(
    new Date(value).getTime()
  );
}

function validateDimensions(
  dimensions:
    MediaDimensions |
    undefined,
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (!dimensions) {
    if (
      asset.processing
        .inspectionStatus ===
        "passed"
    ) {
      errors.push(
        "Inspected media must include dimensions."
      );
    }

    return errors;
  }

  if (
    !Number.isSafeInteger(
      dimensions.width
    ) ||
    dimensions.width <= 0
  ) {
    errors.push(
      "Media width must be a positive integer."
    );
  }

  if (
    !Number.isSafeInteger(
      dimensions.height
    ) ||
    dimensions.height <= 0
  ) {
    errors.push(
      "Media height must be a positive integer."
    );
  }

  const calculatedRatio =
    calculateAspectRatio(
      dimensions.width,
      dimensions.height
    );

  if (
    calculatedRatio === null
  ) {
    return errors;
  }

  if (
    !Number.isFinite(
      dimensions.aspectRatio
    ) ||
    dimensions.aspectRatio <= 0
  ) {
    errors.push(
      "Media aspect ratio must be a positive number."
    );
  } else if (
    Math.abs(
      calculatedRatio -
      dimensions.aspectRatio
    ) >
      0.0001
  ) {
    errors.push(
      "Stored media aspect ratio does not match its width and height."
    );
  }

  return errors;
}

function validateFrameProfile(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  const rule =
    getMediaFrameRule(
      asset.frameProfile
    );

  if (
    !rule.allowedMediaTypes.includes(
      asset.type
    )
  ) {
    errors.push(
      `${rule.label} does not allow ${asset.type} media.`
    );
  }

  if (!asset.dimensions) {
    return errors;
  }

  const {
    width,
    height,
    aspectRatio,
  } =
    asset.dimensions;

  if (
    width >
      rule.maximumWidth ||
    height >
      rule.maximumHeight
  ) {
    errors.push(
      `${rule.label} must not exceed ${rule.maximumWidth} × ${rule.maximumHeight}.`
    );
  }

  if (
    rule.minimumWidth !==
      undefined &&
    width <
      rule.minimumWidth
  ) {
    errors.push(
      `${rule.label} must be at least ${rule.minimumWidth}px wide.`
    );
  }

  if (
    rule.minimumHeight !==
      undefined &&
    height <
      rule.minimumHeight
  ) {
    errors.push(
      `${rule.label} must be at least ${rule.minimumHeight}px high.`
    );
  }

  if (
    !isAspectRatioWithinTolerance(
      aspectRatio,
      rule.expectedAspectRatio,
      rule.aspectRatioTolerance
    )
  ) {
    errors.push(
      asset.frameProfile ===
        "standard_media"
        ? "Standard advertising media must use a 16:9 landscape frame."
        : asset.frameProfile ===
            "sliding_card_media"
          ? "Sliding-card media must use a square 1:1 frame."
          : "Advertiser logo must use a square frame."
    );
  }

  return errors;
}

function validateFileIdentity(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    !isNonEmptyString(
      asset.file
        .originalFileName
    )
  ) {
    errors.push(
      "Media requires an original file name."
    );
  }

  if (
    !Number.isSafeInteger(
      asset.file.sizeBytes
    ) ||
    asset.file.sizeBytes <= 0
  ) {
    errors.push(
      "Media file size must be a positive integer."
    );
  }

  if (
    asset.file.checksum &&
    asset.file
      .checksumAlgorithm !==
      "sha256"
  ) {
    errors.push(
      "Media checksum requires the SHA-256 checksum algorithm."
    );
  }

  if (
    asset.file
      .checksumAlgorithm &&
    !asset.file.checksum
  ) {
    errors.push(
      "Media checksum algorithm requires a checksum value."
    );
  }

  return errors;
}

function validateImageAsset(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    asset.type !==
    "image"
  ) {
    return errors;
  }

  const mimeType =
    asset.file
      .detectedMimeType ??
    asset.file
      .declaredMimeType;

  if (
    mimeType &&
    !isAcceptedImageMimeType(
      mimeType
    )
  ) {
    errors.push(
      "Supported image formats are PNG, JPG/JPEG, and WebP."
    );
  }

  const maximumBytes =
    asset.frameProfile ===
      "advertiser_logo"
      ? MEDIA_BYTE_LIMITS
          .advertiserLogo
      : IMAGE_MEDIA_RULES
          .maximumBytes;

  if (
    asset.file.sizeBytes >
    maximumBytes
  ) {
    errors.push(
      asset.frameProfile ===
        "advertiser_logo"
        ? "Advertiser logo must be 5 MB or smaller."
        : "Advertising image must be 10 MB or smaller."
    );
  }

  if (
    IMAGE_MEDIA_RULES
      .altTextRequired &&
    asset.role !==
      "video_poster" &&
    !isNonEmptyString(
      asset.altText
    )
  ) {
    errors.push(
      "Advertising images require alt text."
    );
  }

  if (asset.video) {
    errors.push(
      "Image assets must not contain video technical metadata."
    );
  }

  return errors;
}

function validateVideoAsset(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    asset.type !==
    "video"
  ) {
    return errors;
  }

  const mimeType =
    asset.file
      .detectedMimeType ??
    asset.file
      .declaredMimeType;

  if (
    mimeType &&
    !isAcceptedVideoMimeType(
      mimeType
    )
  ) {
    errors.push(
      "Supported video formats are MP4 and WebM."
    );
  }

  if (
    asset.file.sizeBytes >
    VIDEO_MEDIA_RULES
      .maximumBytes
  ) {
    errors.push(
      "Advertising video must be 20 MB or smaller."
    );
  }

  if (!asset.video) {
    if (
      asset.processing
        .inspectionStatus ===
        "passed"
    ) {
      errors.push(
        "Inspected video must include technical metadata."
      );
    }

    return errors;
  }

  if (
    !Number.isSafeInteger(
      asset.video
        .durationMilliseconds
    ) ||
    asset.video
      .durationMilliseconds <= 0
  ) {
    errors.push(
      "Video duration must be a positive integer in milliseconds."
    );
  }

  if (
    asset.video
      .durationMilliseconds >
    VIDEO_MEDIA_RULES
      .maximumDurationMilliseconds
  ) {
    errors.push(
      "Advertising video must be 10 seconds or shorter."
    );
  }

  if (
    asset.video
      .framesPerSecond !==
      undefined &&
    (
      !Number.isFinite(
        asset.video
          .framesPerSecond
      ) ||
      asset.video
        .framesPerSecond <
        VIDEO_MEDIA_RULES
          .minimumFramesPerSecond ||
      asset.video
        .framesPerSecond >
        VIDEO_MEDIA_RULES
          .maximumFramesPerSecond
    )
  ) {
    errors.push(
      "Video frame rate must be between 30 and 45 FPS."
    );
  }

  if (
    asset.video
      .bitrateBitsPerSecond !==
      undefined &&
    (
      !Number.isSafeInteger(
        asset.video
          .bitrateBitsPerSecond
      ) ||
      asset.video
        .bitrateBitsPerSecond <=
        0
    )
  ) {
    errors.push(
      "Video bitrate must be a positive integer."
    );
  }

  if (
    asset.video.hasAudio &&
    !VIDEO_MEDIA_RULES
      .audioAllowed
  ) {
    errors.push(
      "Audio is not allowed for this advertising video."
    );
  }

  return errors;
}

function validateSlidingSlot(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    asset.frameProfile !==
      "sliding_card_media"
  ) {
    if (
      asset.slidingCardSlot !==
      undefined
    ) {
      errors.push(
        "Only sliding-card media may define a sliding-card slot."
      );
    }

    return errors;
  }

  if (
    asset.slidingCardSlot ===
      undefined
  ) {
    errors.push(
      "Sliding-card media requires a card slot."
    );

    return errors;
  }

  const slotRule =
    getSlidingCardRule(
      asset.slidingCardSlot
    );

  if (
    asset.type !==
    slotRule.requiredMediaType
  ) {
    errors.push(
      `Sliding Card ${slotRule.slot} must use ${slotRule.requiredMediaType} media.`
    );
  }

  return errors;
}

function validateProcessingState(
  asset:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    asset.processing
      .approvalStatus ===
      "approved" &&
    (
      asset.processing
        .inspectionStatus !==
        "passed" ||
      asset.processing
        .moderationStatus !==
        "approved"
    )
  ) {
    errors.push(
      "Approved media must pass inspection and moderation."
    );
  }

  if (
    asset.processing
      .uploadStatus ===
      "uploaded" &&
    !asset.storage.objectKey &&
    !asset.storage.deliveryUrl &&
    !asset.storage.cdnUrl
  ) {
    errors.push(
      "Uploaded media requires a permanent storage reference."
    );
  }

  if (
    asset.storage
      .signedUrlExpiresAt &&
    !isValidTimestamp(
      asset.storage
        .signedUrlExpiresAt
    )
  ) {
    errors.push(
      "Signed media URL expiry timestamp is invalid."
    );
  }

  if (
    asset.storage
      .deliveryUrl &&
    !isValidHttpUrl(
      asset.storage
        .deliveryUrl
    )
  ) {
    errors.push(
      "Media delivery URL is invalid."
    );
  }

  if (
    asset.storage
      .cdnUrl &&
    !isValidHttpUrl(
      asset.storage
        .cdnUrl
    )
  ) {
    errors.push(
      "Media CDN URL is invalid."
    );
  }

  return errors;
}

export function validateCreativeMediaAsset(
  asset:
    CreativeMediaAsset
): MediaValidationResult {
  const errors:
    string[] = [];

  const warnings:
    string[] = [];

  if (
    !asset.id.startsWith(
      "AST-"
    )
  ) {
    errors.push(
      "Creative asset ID must start with AST-."
    );
  }

  if (
    !asset.creativeId.startsWith(
      "CRV-"
    )
  ) {
    errors.push(
      "Creative ID must start with CRV-."
    );
  }

  if (
    !asset.creativeVersionId.startsWith(
      `${asset.creativeId}-V`
    )
  ) {
    errors.push(
      "Creative version ID must belong to the referenced creative."
    );
  }

  errors.push(
    ...validateFileIdentity(
      asset
    ),

    ...validateDimensions(
      asset.dimensions,
      asset
    ),

    ...validateFrameProfile(
      asset
    ),

    ...validateImageAsset(
      asset
    ),

    ...validateVideoAsset(
      asset
    ),

    ...validateSlidingSlot(
      asset
    ),

    ...validateProcessingState(
      asset
    )
  );

  if (
    asset.file
      .declaredMimeType &&
    asset.file
      .detectedMimeType &&
    asset.file
      .declaredMimeType !==
      asset.file
        .detectedMimeType
  ) {
    warnings.push(
      "Declared MIME type differs from the Backend-detected MIME type."
    );
  }

  if (
    asset.processing
      .inspectionStatus ===
      "pending" ||
    asset.processing
      .inspectionStatus ===
      "processing"
  ) {
    warnings.push(
      "Media inspection is not yet complete."
    );
  }

  if (
    asset.processing
      .moderationStatus ===
      "manual_review"
  ) {
    warnings.push(
      "Media requires manual moderation review."
    );
  }

  if (
    !isValidTimestamp(
      asset.createdAt
    )
  ) {
    errors.push(
      "Media creation timestamp is invalid."
    );
  }

  if (
    !isValidTimestamp(
      asset.updatedAt
    )
  ) {
    errors.push(
      "Media update timestamp is invalid."
    );
  }

  if (
    asset.reviewedAt &&
    !isValidTimestamp(
      asset.reviewedAt
    )
  ) {
    errors.push(
      "Media review timestamp is invalid."
    );
  }

  return createResult(
    errors,
    warnings
  );
}

function validateSlidingCreativeCards(
  cards:
    SlidingCreativeCard[]
): string[] {
  const errors:
    string[] = [];

  if (
    cards.length !==
    SLIDING_CREATIVE_RULE
      .requiredCardCount
  ) {
    errors.push(
      "Sliding creative requires exactly three cards."
    );
  }

  const slots =
    cards.map(
      (
        card
      ) =>
        card.slot
    );

  if (
    new Set(
      slots
    ).size !==
    slots.length
  ) {
    errors.push(
      "Sliding-card positions must be unique."
    );
  }

  for (
    const requiredSlot of
    SLIDING_CREATIVE_RULE
      .cardOrder
  ) {
    if (
      !slots.includes(
        requiredSlot
      )
    ) {
      errors.push(
        `Sliding creative requires Card ${requiredSlot}.`
      );
    }
  }

  cards.forEach(
    (
      card
    ) => {
      const rule =
        getSlidingCardRule(
          card.slot
        );

      if (
        rule.titleRequired &&
        !card.title.trim()
      ) {
        errors.push(
          `Sliding Card ${card.slot} requires a title.`
        );
      }

      if (
        !card.mediaAssetId.startsWith(
          "AST-"
        )
      ) {
        errors.push(
          `Sliding Card ${card.slot} requires a valid creative asset ID.`
        );
      }
    }
  );

  return errors;
}

export function validateCreativeVersion(
  creative:
    CreativeVersion
): MediaValidationResult {
  const errors:
    string[] = [];

  const warnings:
    string[] = [];

  if (
    !creative.id.startsWith(
      `${creative.creativeId}-V`
    )
  ) {
    errors.push(
      "Creative version ID must belong to the referenced creative."
    );
  }

  if (
    !Number.isSafeInteger(
      creative.version
    ) ||
    creative.version <= 0
  ) {
    errors.push(
      "Creative version number must be a positive integer."
    );
  }

  if (
    !creative.content
      .headline.trim()
  ) {
    errors.push(
      "Creative headline is required."
    );
  }

  if (
    !creative.content
      .body.trim()
  ) {
    errors.push(
      "Creative description is required."
    );
  }

  if (
    !creative.content
      .callToAction.trim()
  ) {
    errors.push(
      "Creative call to action is required."
    );
  }

  if (
    !isValidHttpUrl(
      creative.content
        .destinationUrl
    )
  ) {
    errors.push(
      "Creative destination URL is invalid."
    );
  }

  if (
    creative.requestedPlacements
      .length ===
      0
  ) {
    errors.push(
      "Creative version requires at least one requested placement."
    );
  }

  if (
    new Set(
      creative.requestedPlacements
    ).size !==
    creative.requestedPlacements
      .length
  ) {
    errors.push(
      "Creative requested placements must not contain duplicates."
    );
  }

  if (
    creative.layout ===
      "standard"
  ) {
    if (
      !creative.primaryMediaAssetId
    ) {
      errors.push(
        "Standard creative requires one primary media asset."
      );
    }

    if (
      creative.slidingCards &&
      creative.slidingCards
        .length > 0
    ) {
      errors.push(
        "Standard creative must not include sliding cards."
      );
    }
  }

  if (
    creative.layout ===
      "sliding"
  ) {
    if (
      creative.primaryMediaAssetId
    ) {
      errors.push(
        "Sliding creative must not include standard primary media."
      );
    }

    errors.push(
      ...validateSlidingCreativeCards(
        creative.slidingCards ??
          []
      )
    );
  }

  if (
    creative.approvalStatus ===
      "approved" &&
    !creative.reviewedBy
  ) {
    errors.push(
      "Approved creative version requires a reviewing actor."
    );
  }

  if (
    creative.approvalStatus ===
      "changes_requested" &&
    (
      !creative.requestedChanges ||
      creative.requestedChanges
        .length ===
        0
    )
  ) {
    errors.push(
      "Changes-requested creative requires at least one requested change."
    );
  }

  if (
    !isValidTimestamp(
      creative.submittedAt
    )
  ) {
    errors.push(
      "Creative submission timestamp is invalid."
    );
  }

  if (
    creative.reviewedAt &&
    !isValidTimestamp(
      creative.reviewedAt
    )
  ) {
    errors.push(
      "Creative review timestamp is invalid."
    );
  }

  if (
    creative.approvalStatus ===
      "approved" &&
    !creative.reviewedAt
  ) {
    warnings.push(
      "Approved creative version should include a review timestamp."
    );
  }

  return createResult(
    errors,
    warnings
  );
}

