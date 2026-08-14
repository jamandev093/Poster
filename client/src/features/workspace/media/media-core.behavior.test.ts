import { describe, expect, it } from "vitest";

import {
  validateCreativeMediaAsset,
  validateCreativeVersion,
} from "./media.validation";

import {
  createDefaultLegacyMigrationActor,
  migrateLegacyCreative,
} from "../adapters/legacy-media.adapter";

import type {
  CreativeMediaAsset,
  CreativeVersion,
} from "./media.types";

function imageAsset(): CreativeMediaAsset {
  return {
    id: "AST-IMAGE-1",
    organizationId: "ORG-1",
    requestId: "ADV-1",
    campaignId: "CMP-1",
    creativeId: "CRV-1",
    creativeVersionId: "CRV-1-V1",
    role: "primary",
    type: "image",
    frameProfile: "standard_media",
    altText: "Advertising creative",
    file: {
      originalFileName: "creative.jpg",
      declaredMimeType: "image/jpeg",
      detectedMimeType: "image/jpeg",
      sizeBytes: 1024,
    },
    dimensions: {
      width: 1280,
      height: 720,
      aspectRatio: 1280 / 720,
    },
    storage: {
      provider: "google_cloud_storage",
      visibility: "public_cdn",
      deliveryUrl: "https://cdn.example/creative.jpg",
    },
    processing: {
      uploadStatus: "uploaded",
      inspectionStatus: "passed",
      transcodingStatus: "not_required",
      moderationStatus: "approved",
      approvalStatus: "approved",
    },
    createdBy: {
      actorType: "system",
      actorId: "SYSTEM-TEST",
      displayName: "Test actor",
    },
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  } as unknown as CreativeMediaAsset;
}

function videoAsset(): CreativeMediaAsset {
  return {
    ...imageAsset(),
    id: "AST-VIDEO-1",
    type: "video",
    altText: undefined,
    file: {
      originalFileName: "creative.mp4",
      declaredMimeType: "video/mp4",
      detectedMimeType: "video/mp4",
      sizeBytes: 2 * 1024 * 1024,
    },
    video: {
      durationMilliseconds: 9000,
      framesPerSecond: 30,
      bitrateBitsPerSecond: 1_000_000,
      hasAudio: false,
    },
  } as unknown as CreativeMediaAsset;
}

function creativeVersion(): CreativeVersion {
  return {
    id: "CRV-1-V1",
    creativeId: "CRV-1",
    version: 1,
    organizationId: "ORG-1",
    requestId: "ADV-1",
    campaignId: "CMP-1",
    layout: "standard",
    content: {
      headline: "Knowledge discovery",
      body: "Discover useful knowledge.",
      callToAction: "Learn more",
      destinationUrl: "https://publisher.example/story",
    },
    requestedPlacements: ["home"],
    primaryMediaAssetId: "AST-IMAGE-1",
    approvalStatus: "submitted",
    submittedBy: {
      actorType: "system",
      actorId: "SYSTEM-TEST",
      displayName: "Test actor",
    },
    submittedAt: "2026-08-14T00:00:00.000Z",
  } as unknown as CreativeVersion;
}

describe("canonical media behavior", () => {
  it("accepts a valid inspected image", () => {
    const result = validateCreativeMediaAsset(imageAsset());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects malformed image metadata and processing state", () => {
    const broken = {
      ...imageAsset(),
      id: "BAD",
      altText: " ",
      file: {
        originalFileName: "",
        declaredMimeType: "image/gif",
        detectedMimeType: "image/gif",
        sizeBytes: 11 * 1024 * 1024,
      },
      processing: {
        uploadStatus: "uploaded",
        inspectionStatus: "processing",
        transcodingStatus: "not_required",
        moderationStatus: "pending",
        approvalStatus: "approved",
      },
    } as unknown as CreativeMediaAsset;

    const result = validateCreativeMediaAsset(broken);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Creative asset ID must start with AST-."
    );
    expect(result.errors).toContain(
      "Media requires an original file name."
    );
    expect(result.errors).toContain(
      "Supported image formats are PNG, JPG/JPEG, and WebP."
    );
    expect(result.errors).toContain(
      "Advertising image must be 10 MB or smaller."
    );
    expect(result.errors).toContain(
      "Advertising images require alt text."
    );
    expect(result.errors).toContain(
      "Approved media must pass inspection and moderation."
    );
  });

  it("enforces video MIME size duration FPS and bitrate rules", () => {
    expect(
      validateCreativeMediaAsset(videoAsset()).valid
    ).toBe(true);

    const broken = {
      ...videoAsset(),
      file: {
        originalFileName: "creative.mov",
        declaredMimeType: "video/quicktime",
        detectedMimeType: "video/quicktime",
        sizeBytes: 21 * 1024 * 1024,
      },
      video: {
        durationMilliseconds: 11000,
        framesPerSecond: 60,
        bitrateBitsPerSecond: 0,
        hasAudio: false,
      },
    } as unknown as CreativeMediaAsset;

    const result = validateCreativeMediaAsset(broken);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Supported video formats are MP4 and WebM."
    );
    expect(result.errors).toContain(
      "Advertising video must be 20 MB or smaller."
    );
    expect(result.errors).toContain(
      "Advertising video must be 10 seconds or shorter."
    );
    expect(result.errors).toContain(
      "Video frame rate must be between 30 and 45 FPS."
    );
    expect(result.errors).toContain(
      "Video bitrate must be a positive integer."
    );
  });

  it("validates standard and sliding creative versions", () => {
    expect(
      validateCreativeVersion(creativeVersion()).valid
    ).toBe(true);

    const brokenStandard = {
      ...creativeVersion(),
      content: {
        headline: "",
        body: "",
        callToAction: "",
        destinationUrl: "javascript:bad",
      },
      requestedPlacements: ["home", "home"],
      primaryMediaAssetId: undefined,
    } as unknown as CreativeVersion;

    const standard = validateCreativeVersion(brokenStandard);

    expect(standard.valid).toBe(false);
    expect(standard.errors).toContain(
      "Creative headline is required."
    );
    expect(standard.errors).toContain(
      "Creative requested placements must not contain duplicates."
    );
    expect(standard.errors).toContain(
      "Standard creative requires one primary media asset."
    );

    const brokenSliding = {
      ...creativeVersion(),
      layout: "sliding",
      primaryMediaAssetId: "AST-IMAGE-1",
      slidingCards: [
        {
          slot: 1,
          title: "",
          mediaAssetId: "BAD",
        },
        {
          slot: 1,
          title: "Duplicate",
          mediaAssetId: "AST-2",
        },
      ],
    } as unknown as CreativeVersion;

    const sliding = validateCreativeVersion(brokenSliding);

    expect(sliding.valid).toBe(false);
    expect(sliding.errors).toContain(
      "Sliding creative must not include standard primary media."
    );
    expect(sliding.errors).toContain(
      "Sliding creative requires exactly three cards."
    );
    expect(sliding.errors).toContain(
      "Sliding-card positions must be unique."
    );
  });

  it("migrates legacy creative metadata to canonical media identities", () => {
    const actor = createDefaultLegacyMigrationActor();

    const result = migrateLegacyCreative({
      creative: {
        headline: "Legacy creative",
        body: "Legacy body",
        callToAction: "Open",
        destinationUrl: "https://publisher.example/legacy",
        layout: "standard",
        imageName: "legacy-main.jpg",
        logoName: "legacy-logo.png",
      } as unknown as Parameters<
        typeof migrateLegacyCreative
      >[0]["creative"],

      identity: {
        organizationId: "ORG-1",
        requestId: "ADV-1",
        campaignId: "CMP-1",
        creativeId: "CRV-LEGACY",
        creativeVersionId: "CRV-LEGACY-V1",
        version: 1,
        submittedAt: "2026-08-14T00:00:00.000Z",
        submittedBy: actor,
        approved: false,
      } as unknown as Parameters<
        typeof migrateLegacyCreative
      >[0]["identity"],

      requestedPlacements: ["home"] as unknown as Parameters<
        typeof migrateLegacyCreative
      >[0]["requestedPlacements"],
    });

    expect(result.assets).toHaveLength(2);
    expect(
      result.version.primaryMediaAssetId?.startsWith("AST-")
    ).toBe(true);
    expect(
      result.version.logoAssetId?.startsWith("AST-")
    ).toBe(true);
    expect(result.creative.currentVersionId).toBe(
      "CRV-LEGACY-V1"
    );
  });
});