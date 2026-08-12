import {
  z,
} from "zod";

import type {
  MediaAssetStorageProvider,
} from "../domains/media/index.js";

const MediaStorageEnvironmentSchema =
  z
    .object({
      POSTER_MEDIA_STORAGE_PROVIDER:
        z
          .literal(
            "gcs"
          ),

      POSTER_MEDIA_GCS_BUCKET:
        z
          .string()
          .trim()
          .min(
            1
          ),

      POSTER_MEDIA_OBJECT_PREFIX:
        z
          .string()
          .trim()
          .min(
            1
          )
          .default(
            "poster/media-assets"
          ),
    })
    .strict();

export interface MediaStorageConfiguration {
  provider:
    MediaAssetStorageProvider;

  bucket:
    string;

  objectPrefix:
    string;
}

/*
 * Media storage configuration is intentionally lazy.
 *
 * Merely starting the Backend does not require media
 * storage to be configured while the feature remains
 * unused.
 *
 * The production storage adapter must call this
 * function before performing media operations.
 */
export function getMediaStorageConfiguration():
  MediaStorageConfiguration {
  const result =
    MediaStorageEnvironmentSchema
      .safeParse({
        POSTER_MEDIA_STORAGE_PROVIDER:
          process.env
            .POSTER_MEDIA_STORAGE_PROVIDER,

        POSTER_MEDIA_GCS_BUCKET:
          process.env
            .POSTER_MEDIA_GCS_BUCKET,

        POSTER_MEDIA_OBJECT_PREFIX:
          process.env
            .POSTER_MEDIA_OBJECT_PREFIX,
      });

  if (!result.success) {
    const details =
      result
        .error
        .issues
        .map(
          issue =>
            `${issue.path.join(".")}: ${issue.message}`
        )
        .join(
          "; "
        );

    throw new Error(
      `Invalid Poster media storage configuration: ${details}`
    );
  }

  return {
    provider:
      result.data
        .POSTER_MEDIA_STORAGE_PROVIDER,

    bucket:
      result.data
        .POSTER_MEDIA_GCS_BUCKET,

    objectPrefix:
      result.data
        .POSTER_MEDIA_OBJECT_PREFIX,
  };
}