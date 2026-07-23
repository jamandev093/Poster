import type {
  CommercialCreative,
  CreativeFrameProfile,
  CreativeMediaAsset,
  SlidingCreativeCard,
  SlidingCardSlot,
} from "./workspace.types";

interface CreativeFrameRule {
  label: string;

  aspectRatio: number;

  /**
   * Small tolerance for exported media whose dimensions
   * differ slightly from the mathematical ratio.
   */
  aspectRatioTolerance: number;

  maxVideoWidth: number;

  maxVideoHeight: number;
}

/**
 * These profiles come directly from the finalized Poster
 * mobile advertising UI.
 *
 * Creative must fit the UI.
 * The UI must not adapt to unsupported advertiser ratios.
 */
export const CREATIVE_FRAME_RULES: Record<
  CreativeFrameProfile,
  CreativeFrameRule
> = {
  standard_media: {
    label:
      "Poster standard ad frame",

    aspectRatio:
      16 / 9,

    aspectRatioTolerance:
      0.02,

    maxVideoWidth:
      1280,

    maxVideoHeight:
      720,
  },

  sliding_card_media: {
    label:
      "Poster sliding-card frame",

    aspectRatio:
      1,

    aspectRatioTolerance:
      0.02,

    maxVideoWidth:
      720,

    maxVideoHeight:
      720,
  },
};

export const CREATIVE_RULES = {
  video: {
    maximumDurationSeconds:
      10,

    maximumBytes:
      20 *
      1024 *
      1024,

    minimumFramesPerSecond:
      30,

    maximumFramesPerSecond:
      45,

    preferredFramesPerSecond:
      30,

    acceptedMimeTypes: [
      "video/mp4",
      "video/webm",
    ] as const,
  },

  image: {
    acceptedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
    ] as const,
  },

  sliding: {
    totalCards:
      3,

    /**
     * Locked finalized media order.
     */
    videoSlot:
      1 as SlidingCardSlot,

    imageSlots: [
      2,
      3,
    ] as readonly SlidingCardSlot[],
  },
} as const;

export interface CreativeValidationResult {
  valid: boolean;

  errors: string[];
}

function isAspectRatioValid(
  width: number,
  height: number,
  expectedRatio: number,
  tolerance: number
): boolean {
  if (
    width <=
      0 ||
    height <=
      0
  ) {
    return false;
  }

  const actualRatio =
    width /
    height;

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

function validateMediaFrame(
  media:
    CreativeMediaAsset,

  requiredProfile:
    CreativeFrameProfile
): string[] {
  const errors:
    string[] = [];

  const rule =
    CREATIVE_FRAME_RULES[
      requiredProfile
    ];

  if (
    media.frameProfile &&
    media.frameProfile !==
      requiredProfile
  ) {
    errors.push(
      `Media must use the ${rule.label}.`
    );
  }

  if (
    media.width !==
      undefined &&
    media.height !==
      undefined
  ) {
    const ratioValid =
      isAspectRatioValid(
        media.width,
        media.height,
        rule.aspectRatio,
        rule.aspectRatioTolerance
      );

    if (
      !ratioValid
    ) {
      errors.push(
        requiredProfile ===
          "standard_media"
          ? "Standard ad media must use a 16:9 landscape frame."
          : "Sliding-card media must use Poster’s square 1:1 card frame."
      );
    }

    if (
      media.type ===
        "video" &&
      (
        media.width >
          rule.maxVideoWidth ||
        media.height >
          rule.maxVideoHeight
      )
    ) {
      errors.push(
        requiredProfile ===
          "standard_media"
          ? "Standard video must not exceed 1280 × 720."
          : "Sliding-card video must not exceed 720 × 720."
      );
    }
  }

  return errors;
}

function validateVideoBasics(
  media:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    media.type !==
    "video"
  ) {
    return errors;
  }

  if (
    media.mimeType &&
    !CREATIVE_RULES
      .video
      .acceptedMimeTypes
      .includes(
        media.mimeType as
          | "video/mp4"
          | "video/webm"
      )
  ) {
    errors.push(
      "Supported video formats are MP4 and WebM."
    );
  }

  if (
    media.durationSeconds !==
      undefined &&
    media.durationSeconds >
      CREATIVE_RULES
        .video
        .maximumDurationSeconds
  ) {
    errors.push(
      `Video must be ${CREATIVE_RULES.video.maximumDurationSeconds} seconds or shorter.`
    );
  }

  if (
    media.sizeBytes !==
      undefined &&
    media.sizeBytes >
      CREATIVE_RULES
        .video
        .maximumBytes
  ) {
    errors.push(
      "Video must be 20 MB or smaller."
    );
  }

  /**
   * Browser APIs do not reliably expose true FPS.
   *
   * This validation runs when FPS is known, such as
   * after Backend media inspection.
   */
  if (
    media.framesPerSecond !==
      undefined &&
    (
      media.framesPerSecond <
        CREATIVE_RULES
          .video
          .minimumFramesPerSecond ||
      media.framesPerSecond >
        CREATIVE_RULES
          .video
          .maximumFramesPerSecond
    )
  ) {
    errors.push(
      "Video frame rate must be between 30 and 45 FPS."
    );
  }

  return errors;
}

function validateImageBasics(
  media:
    CreativeMediaAsset
): string[] {
  const errors:
    string[] = [];

  if (
    media.type !==
    "image"
  ) {
    return errors;
  }

  if (
    media.mimeType &&
    !CREATIVE_RULES
      .image
      .acceptedMimeTypes
      .includes(
        media.mimeType as
          | "image/png"
          | "image/jpeg"
          | "image/webp"
      )
  ) {
    errors.push(
      "Supported images are PNG, JPG/JPEG, and WebP."
    );
  }

  return errors;
}

function validateMedia(
  media:
    CreativeMediaAsset,

  requiredProfile:
    CreativeFrameProfile
): string[] {
  return [
    ...validateMediaFrame(
      media,
      requiredProfile
    ),

    ...validateVideoBasics(
      media
    ),

    ...validateImageBasics(
      media
    ),
  ];
}

function findSlidingCard(
  cards:
    SlidingCreativeCard[],

  slot:
    SlidingCardSlot
):
  SlidingCreativeCard |
  undefined {
  return cards.find(
    (
      card
    ) =>
      card.slot ===
      slot
  );
}

export function validateSlidingCards(
  cards:
    SlidingCreativeCard[]
):
  CreativeValidationResult {
  const errors:
    string[] = [];

  if (
    cards.length !==
    CREATIVE_RULES
      .sliding
      .totalCards
  ) {
    errors.push(
      "Sliding ads require exactly 3 cards."
    );
  }

  const slots =
    new Set(
      cards.map(
        (
          card
        ) =>
          card.slot
      )
    );

  if (
    slots.size !==
    cards.length
  ) {
    errors.push(
      "Sliding-card positions must be unique."
    );
  }

  const card1 =
    findSlidingCard(
      cards,
      1
    );

  const card2 =
    findSlidingCard(
      cards,
      2
    );

  const card3 =
    findSlidingCard(
      cards,
      3
    );

  if (
    !card1
  ) {
    errors.push(
      "Sliding ad requires Card 1."
    );
  }

  if (
    !card2
  ) {
    errors.push(
      "Sliding ad requires Card 2."
    );
  }

  if (
    !card3
  ) {
    errors.push(
      "Sliding ad requires Card 3."
    );
  }

  /**
   * Locked creative contract:
   *
   * Card 1 = video
   * Card 2 = image
   * Card 3 = image
   */
  if (
    card1 &&
    card1.media.type !==
      "video"
  ) {
    errors.push(
      "Sliding ad Card 1 must be a video."
    );
  }

  if (
    card2 &&
    card2.media.type !==
      "image"
  ) {
    errors.push(
      "Sliding ad Card 2 must be an image."
    );
  }

  if (
    card3 &&
    card3.media.type !==
      "image"
  ) {
    errors.push(
      "Sliding ad Card 3 must be an image."
    );
  }

  for (
    const card of
    cards
  ) {
    if (
      !card.title.trim()
    ) {
      errors.push(
        `Card ${card.slot} requires a title.`
      );
    }

    errors.push(
      ...validateMedia(
        card.media,
        "sliding_card_media"
      )
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors,
  };
}

export function validateCommercialCreative(
  creative:
    CommercialCreative
):
  CreativeValidationResult {
  const errors:
    string[] = [];

  if (
    !creative.headline.trim()
  ) {
    errors.push(
      "Headline is required."
    );
  }

  if (
    !creative.body.trim()
  ) {
    errors.push(
      "Description is required."
    );
  }

  if (
    !creative.callToAction.trim()
  ) {
    errors.push(
      "Call to action is required."
    );
  }

  if (
    !creative.destinationUrl.trim()
  ) {
    errors.push(
      "Destination URL is required."
    );
  }

  if (
    creative.layout ===
    "standard"
  ) {
    if (
      !creative.primaryMedia
    ) {
      errors.push(
        "Standard ads require one main media asset."
      );
    } else {
      errors.push(
        ...validateMedia(
          creative.primaryMedia,
          "standard_media"
        )
      );
    }
  }

  if (
    creative.layout ===
    "sliding"
  ) {
    const result =
      validateSlidingCards(
        creative.slidingCards ??
          []
      );

    errors.push(
      ...result.errors
    );
  }

  if (
    !creative.layout
  ) {
    errors.push(
      "Choose a creative layout."
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors,
  };
}
