import type {
  AdvertisingActorReference,
  AdvertisingRequestId,
  CampaignId,
  OrganizationId,
  PlacementSurface,
} from "../advertising/advertising.types";

import type {
  AdvertisingCreative,
  CreativeAssetId,
  CreativeFrameProfile,
  CreativeId,
  CreativeMediaAsset as CanonicalCreativeMediaAsset,
  CreativeMediaRole,
  CreativeVersion,
  CreativeVersionId,
  MediaProcessingState,
  MediaStorageReference,
  SlidingCardSlot,
  SlidingCreativeCard as CanonicalSlidingCreativeCard,
} from "../media/media.types";

import type {
  CommercialCreative as LegacyCommercialCreative,
  CreativeMediaAsset as LegacyCreativeMediaAsset,
  SlidingCreativeCard as LegacySlidingCreativeCard,
} from "../workspace.types";

/**
 * Legacy media migration adapter.
 *
 * Converts existing Client workspace creative records into
 * canonical media-domain contracts.
 *
 * This file is temporary and should be removed after the
 * Client workspace fixtures and API responses use canonical
 * creative/media records directly.
 *
 * It must not:
 *
 * - perform upload operations;
 * - approve or reject media;
 * - inspect real files;
 * - create permanent storage objects;
 * - calculate analytics;
 * - process payments.
 */

export interface LegacyCreativeIdentity {
  organizationId:
    OrganizationId;

  requestId:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  creativeId:
    CreativeId;

  creativeVersionId:
    CreativeVersionId;

  version:
    number;

  submittedAt:
    string;

  submittedBy:
    AdvertisingActorReference;

  reviewedAt?:
    string;

  reviewedBy?:
    AdvertisingActorReference;

  approved:
    boolean;
}

export interface LegacyCreativeMigrationResult {
  creative:
    AdvertisingCreative;

  version:
    CreativeVersion;

  assets:
    CanonicalCreativeMediaAsset[];
}

const DEFAULT_SYSTEM_ACTOR:
  AdvertisingActorReference = {
  actorType:
    "system",

  actorId:
    "SYSTEM-LEGACY-MIGRATION",

  displayName:
    "Legacy workspace migration",
};

function sanitizeIdentifierPart(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return normalized ||
    "UNKNOWN";
}

export function createLegacyCreativeId(
  requestId:
    AdvertisingRequestId
): CreativeId {
  return `CRV-${sanitizeIdentifierPart(
    requestId
  )}`;
}

export function createLegacyCreativeVersionId(
  creativeId:
    CreativeId,
  version:
    number
): CreativeVersionId {
  return `${creativeId}-V${version}`;
}

function createLegacyAssetId(
  creativeVersionId:
    CreativeVersionId,
  suffix:
    string
): CreativeAssetId {
  return `AST-${sanitizeIdentifierPart(
    creativeVersionId
  )}-${sanitizeIdentifierPart(
    suffix
  )}`;
}

function inferLegacyMediaRole(
  media:
    LegacyCreativeMediaAsset,
  fallbackRole:
    CreativeMediaRole
): CreativeMediaRole {
  switch (media.role) {
    case "primary":
    case "logo":
    case "slide":
      return media.role;

    default:
      return fallbackRole;
  }
}

function inferLegacyFrameProfile(
  media:
    LegacyCreativeMediaAsset,
  fallbackProfile:
    CreativeFrameProfile
): CreativeFrameProfile {
  switch (media.frameProfile) {
    case "standard_media":
    case "sliding_card_media":
      return media.frameProfile;

    default:
      return fallbackProfile;
  }
}

function createLegacyProcessingState(
  approved:
    boolean
): MediaProcessingState {
  if (approved) {
    return {
      uploadStatus:
        "uploaded",

      inspectionStatus:
        "passed",

      transcodingStatus:
        "not_required",

      moderationStatus:
        "approved",

      approvalStatus:
        "approved",
    };
  }

  return {
    uploadStatus:
      "uploaded",

    inspectionStatus:
      "pending",

    transcodingStatus:
      "not_required",

    moderationStatus:
      "pending",

    approvalStatus:
      "submitted",
  };
}

function createLegacyStorageReference(
  media:
    LegacyCreativeMediaAsset
): MediaStorageReference {
  const deliveryUrl =
    media.url?.startsWith(
      "http"
    )
      ? media.url
      : undefined;

  return {
    provider:
      "google_cloud_storage",

    visibility:
      deliveryUrl
        ? "public_cdn"
        : "private",

    deliveryUrl,

    cdnUrl:
      deliveryUrl,
  };
}

function getLegacyDimensions(
  media:
    LegacyCreativeMediaAsset
):
  CanonicalCreativeMediaAsset["dimensions"] {
  if (
    media.width ===
      undefined ||
    media.height ===
      undefined ||
    media.width <=
      0 ||
    media.height <=
      0
  ) {
    return undefined;
  }

  return {
    width:
      media.width,

    height:
      media.height,

    aspectRatio:
      media.width /
      media.height,
  };
}

function getLegacyVideoMetadata(
  media:
    LegacyCreativeMediaAsset
):
  CanonicalCreativeMediaAsset["video"] {
  if (
    media.type !==
    "video" ||
    media.durationSeconds ===
      undefined
  ) {
    return undefined;
  }

  return {
    durationMilliseconds:
      Math.round(
        media.durationSeconds *
          1000
      ),

    framesPerSecond:
      media.framesPerSecond,
  };
}

interface ConvertLegacyMediaInput {
  media:
    LegacyCreativeMediaAsset;

  identity:
    LegacyCreativeIdentity;

  suffix:
    string;

  fallbackRole:
    CreativeMediaRole;

  fallbackFrameProfile:
    CreativeFrameProfile;

  slidingCardSlot?:
    SlidingCardSlot;

  title?:
    string;
}

function convertLegacyMediaAsset(
  input:
    ConvertLegacyMediaInput
): CanonicalCreativeMediaAsset {
  const {
    media,
    identity,
  } =
    input;

  const assetId =
    createLegacyAssetId(
      identity.creativeVersionId,
      input.suffix
    );

  return {
    id:
      assetId,

    organizationId:
      identity.organizationId,

    requestId:
      identity.requestId,

    campaignId:
      identity.campaignId,

    creativeId:
      identity.creativeId,

    creativeVersionId:
      identity.creativeVersionId,

    role:
      inferLegacyMediaRole(
        media,
        input.fallbackRole
      ),

    type:
      media.type,

    frameProfile:
      inferLegacyFrameProfile(
        media,
        input.fallbackFrameProfile
      ),

    slidingCardSlot:
      input.slidingCardSlot,

    title:
      input.title,

    altText:
      media.altText,

    file: {
      originalFileName:
        media.fileName,

      declaredMimeType:
        media.mimeType,

      detectedMimeType:
        media.mimeType,

      sizeBytes:
        media.sizeBytes ??
        1,
    },

    dimensions:
      getLegacyDimensions(
        media
      ),

    video:
      getLegacyVideoMetadata(
        media
      ),

    storage:
      createLegacyStorageReference(
        media
      ),

    processing:
      createLegacyProcessingState(
        identity.approved
      ),

    createdBy:
      identity.submittedBy,

    reviewedBy:
      identity.reviewedBy,

    createdAt:
      identity.submittedAt,

    updatedAt:
      identity.reviewedAt ??
      identity.submittedAt,

    reviewedAt:
      identity.reviewedAt,
  };
}

function createFallbackLegacyMedia(
  input: {
    fileName:
      string;

    role:
      "primary" |
      "logo";

    frameProfile:
      CreativeFrameProfile;
  }
): LegacyCreativeMediaAsset {
  return {
    role:
      input.role,

    type:
      "image",

    frameProfile:
      input.frameProfile ===
        "advertiser_logo"
        ? undefined
        : input.frameProfile,

    fileName:
      input.fileName,

    mimeType:
      undefined,

    sizeBytes:
      undefined,

    altText:
      input.role ===
        "logo"
        ? "Advertiser logo"
        : "Advertising creative",
  };
}

function getLegacyPrimaryMedia(
  creative:
    LegacyCommercialCreative
): LegacyCreativeMediaAsset | undefined {
  if (
    creative.primaryMedia
  ) {
    return creative.primaryMedia;
  }

  if (
    creative.imageName
  ) {
    return createFallbackLegacyMedia({
      fileName:
        creative.imageName,

      role:
        "primary",

      frameProfile:
        "standard_media",
    });
  }

  return undefined;
}

function getLegacyLogoMedia(
  creative:
    LegacyCommercialCreative
): LegacyCreativeMediaAsset | undefined {
  if (
    creative.logoMedia
  ) {
    return creative.logoMedia;
  }

  if (
    creative.logoName
  ) {
    return createFallbackLegacyMedia({
      fileName:
        creative.logoName,

      role:
        "logo",

      frameProfile:
        "advertiser_logo",
    });
  }

  return undefined;
}

function sortLegacySlidingCards(
  cards:
    LegacySlidingCreativeCard[]
): LegacySlidingCreativeCard[] {
  return [
    ...cards,
  ].sort(
    (
      first,
      second
    ) =>
      first.slot -
      second.slot
  );
}

function convertLegacySlidingCards(
  cards:
    LegacySlidingCreativeCard[],
  identity:
    LegacyCreativeIdentity
): {
  cards:
    CanonicalSlidingCreativeCard[];

  assets:
    CanonicalCreativeMediaAsset[];
} {
  const canonicalCards:
    CanonicalSlidingCreativeCard[] = [];

  const assets:
    CanonicalCreativeMediaAsset[] = [];

  sortLegacySlidingCards(
    cards
  ).forEach(
    (
      card
    ) => {
      const asset =
        convertLegacyMediaAsset({
          media:
            card.media,

          identity,

          suffix:
            `SLIDE-${card.slot}`,

          fallbackRole:
            "slide",

          fallbackFrameProfile:
            "sliding_card_media",

          slidingCardSlot:
            card.slot,

          title:
            card.title,
        });

      canonicalCards.push({
        slot:
          card.slot,

        title:
          card.title,

        mediaAssetId:
          asset.id,
      });

      assets.push(
        asset
      );
    }
  );

  return {
    cards:
      canonicalCards,

    assets,
  };
}

export function migrateLegacyCreative(
  input: {
    creative:
      LegacyCommercialCreative;

    identity:
      LegacyCreativeIdentity;

    requestedPlacements:
      PlacementSurface[];
  }
): LegacyCreativeMigrationResult {
  const {
    creative,
    identity,
  } =
    input;

  const assets:
    CanonicalCreativeMediaAsset[] = [];

  let primaryMediaAssetId:
    CreativeAssetId |
    undefined;

  let slidingCards:
    CanonicalSlidingCreativeCard[] |
    undefined;

  const layout =
    creative.layout ??
    (
      creative.slidingCards
        ?.length
        ? "sliding"
        : "standard"
    );

  if (
    layout ===
    "standard"
  ) {
    const primaryMedia =
      getLegacyPrimaryMedia(
        creative
      );

    if (
      primaryMedia
    ) {
      const asset =
        convertLegacyMediaAsset({
          media:
            primaryMedia,

          identity,

          suffix:
            "PRIMARY",

          fallbackRole:
            "primary",

          fallbackFrameProfile:
            "standard_media",
        });

      primaryMediaAssetId =
        asset.id;

      assets.push(
        asset
      );
    }
  }

  if (
    layout ===
    "sliding"
  ) {
    const converted =
      convertLegacySlidingCards(
        creative.slidingCards ??
          [],
        identity
      );

    slidingCards =
      converted.cards;

    assets.push(
      ...converted.assets
    );
  }

  const logoMedia =
    getLegacyLogoMedia(
      creative
    );

  let logoAssetId:
    CreativeAssetId |
    undefined;

  if (
    logoMedia
  ) {
    const asset =
      convertLegacyMediaAsset({
        media:
          logoMedia,

        identity,

        suffix:
          "LOGO",

        fallbackRole:
          "logo",

        fallbackFrameProfile:
          "advertiser_logo",
      });

    logoAssetId =
      asset.id;

    assets.push(
      asset
    );
  }

  const approvalStatus =
    identity.approved
      ? "approved"
      : "submitted";

  const version:
    CreativeVersion = {
    id:
      identity.creativeVersionId,

    creativeId:
      identity.creativeId,

    version:
      identity.version,

    organizationId:
      identity.organizationId,

    requestId:
      identity.requestId,

    campaignId:
      identity.campaignId,

    layout,

    content: {
      headline:
        creative.headline,

      body:
        creative.body,

      callToAction:
        creative.callToAction,

      destinationUrl:
        creative.destinationUrl,
    },

    requestedPlacements: [
      ...input.requestedPlacements,
    ],

    primaryMediaAssetId,

    slidingCards,

    logoAssetId,

    approvalStatus,

    submittedBy:
      identity.submittedBy,

    reviewedBy:
      identity.reviewedBy,

    submittedAt:
      identity.submittedAt,

    reviewedAt:
      identity.reviewedAt,
  };

  const canonicalCreative:
    AdvertisingCreative = {
    id:
      identity.creativeId,

    organizationId:
      identity.organizationId,

    requestId:
      identity.requestId,

    campaignId:
      identity.campaignId,

    currentVersionId:
      identity.creativeVersionId,

    approvedVersionId:
      identity.approved
        ? identity
            .creativeVersionId
        : undefined,

    versions: [
      identity.creativeVersionId,
    ],

    createdAt:
      identity.submittedAt,

    updatedAt:
      identity.reviewedAt ??
      identity.submittedAt,
  };

  return {
    creative:
      canonicalCreative,

    version,

    assets,
  };
}

export function createDefaultLegacyMigrationActor():
  AdvertisingActorReference {
  return {
    ...DEFAULT_SYSTEM_ACTOR,
  };
}
