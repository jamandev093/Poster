import type {
  MediaStorageConfiguration,
} from "../../config/media-storage.config.js";

import type {
  MediaAssetStorageLocator,
} from "../../domains/media/media-asset.types.js";

import type {
  MediaAssetStorageLocatorFactory,
} from "./media-asset-lifecycle.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeBucket(
  value:
    string
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      "Media storage bucket must not be blank."
    );
  }

  return normalized;
}

function normalizePrefix(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      );

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      "Media storage object prefix must not be blank."
    );
  }

  const segments =
    normalized.split(
      "/"
    );

  for (
    const segment
    of segments
  ) {
    if (
      segment.length ===
        0 ||
      segment ===
        "." ||
      segment ===
        ".." ||
      segment.includes(
        "\\"
      )
    ) {
      throw new Error(
        "Media storage object prefix contains an invalid path segment."
      );
    }
  }

  return segments.join(
    "/"
  );
}

/*
 * Physical storage identity is Backend-owned.
 *
 * User-controlled filenames and MIME values are excluded
 * from the object key.
 */
export function createMediaAssetStorageLocatorFactory(
  configuration:
    MediaStorageConfiguration
): MediaAssetStorageLocatorFactory {
  if (
    configuration.provider !==
    "gcs"
  ) {
    throw new Error(
      "Poster media storage currently requires GCS."
    );
  }

  const bucket =
    normalizeBucket(
      configuration.bucket
    );

  const objectPrefix =
    normalizePrefix(
      configuration.objectPrefix
    );

  return input => {
    const assetId =
      input.assetId
        .trim()
        .toLowerCase();

    if (
      !UUID_PATTERN.test(
        assetId
      )
    ) {
      throw new Error(
        "Media asset storage identity requires a valid UUID assetId."
      );
    }

    const objectKey =
      [
        objectPrefix,
        input.purpose,
        assetId,
      ].join(
        "/"
      );

    const locator:
      MediaAssetStorageLocator = {
      provider:
        "gcs",

      bucket,

      objectKey,
    };

    return locator;
  };
}