"use client";

import Image from "next/image";

import {
  useState,
  type ChangeEvent,
} from "react";

import type {
  PosterPromotionMedia,
} from "./poster-promotion.types";

import {
  uploadPosterPromotionMedia,
} from "./poster-promotion-media-upload.service";

import {
  validatePosterPromotionMedia,
} from "./poster-promotion.validation";

import styles from "./PosterPromotionEditor.module.css";

interface PosterPromotionMediaFieldProps {
  media:
    PosterPromotionMedia | null;

  error?:
    string;

  onChange:
    (
      media:
        PosterPromotionMedia | null
    ) => void;
}

function mediaTypeFromFile(
  file:
    File
): "image" | "video" | null {
  if (
    file.type.startsWith(
      "image/"
    )
  ) {
    return "image";
  }

  if (
    file.type.startsWith(
      "video/"
    )
  ) {
    return "video";
  }

  return null;
}

export default function PosterPromotionMediaField(
  props:
    PosterPromotionMediaFieldProps
) {
  const [
    uploading,
    setUploading,
  ] =
    useState(
      false
    );

  const [
    uploadMessage,
    setUploadMessage,
  ] =
    useState<string | null>(
      null
    );

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const input =
        event.currentTarget;

      const file =
        input.files?.[0];

      if (!file) {
        return;
      }

      const type =
        mediaTypeFromFile(
          file
        );

      if (!type) {
        props.onChange(
          null
        );

        setUploadMessage(
          "Choose a supported image or video file."
        );

        input.value =
          "";

        return;
      }

      const previewUrl =
        URL.createObjectURL(
          file
        );

      const media:
        PosterPromotionMedia = {
        type,

        fileName:
          file.name,

        previewUrl,

        mimeType:
          file.type,

        sizeBytes:
          file.size,
      };

      const validationError =
        validatePosterPromotionMedia(
          media
        );

      if (validationError) {
        URL.revokeObjectURL(
          previewUrl
        );

        props.onChange(
          null
        );

        setUploadMessage(
          validationError
        );

        input.value =
          "";

        return;
      }

      if (
        props.media?.previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          props.media.previewUrl
        );
      }

      props.onChange(
        media
      );

      setUploading(
        true
      );

      setUploadMessage(
        "Uploading and verifying media..."
      );

      try {
        const verified =
          await uploadPosterPromotionMedia(
            file,
            type
          );

        props.onChange({
          ...media,

          assetId:
            verified.assetId,

          type:
            verified.type,

          fileName:
            verified.fileName,

          mimeType:
            verified.mimeType,

          sizeBytes:
            verified.sizeBytes,
        });

        setUploadMessage(
          "Media upload verified and ready."
        );
      } catch (error: unknown) {
        URL.revokeObjectURL(
          previewUrl
        );

        props.onChange(
          null
        );

        setUploadMessage(
          error instanceof Error
            ? error.message
            : "Poster Promotion media upload failed."
        );
      } finally {
        setUploading(
          false
        );

        input.value =
          "";
      }
    };

  const removeMedia =
    () => {
      if (uploading) {
        return;
      }

      setUploadMessage(
        null
      );

      if (
        props.media?.previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          props.media.previewUrl
        );
      }

      props.onChange(
        null
      );
    };

  return (
    <div
      className={
        styles.mediaField
      }
    >
      <div
        className={
          styles.mediaHeader
        }
      >
        <div>
          <strong>
            Promotion media
          </strong>

          <p>
            {
              uploadMessage ??
              "Upload one landscape image or short landscape video."
            }
          </p>
        </div>

        {props.media ? (
          <button
            type="button"
            className={
              styles.removeMediaButton
            }
            onClick={
              removeMedia
            }
          >
            Remove
          </button>
        ) : null}
      </div>

      <label
        className={
          styles.uploadArea
        }
      >
        <input
          type="file"
          disabled={
            uploading
          }
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={
            handleFileChange
          }
        />

        {props.media ? (
          <div
            className={
              styles.mediaPreview
            }
          >
            {props.media.type ===
            "image" ? (
              <Image
                src={
                  props.media.previewUrl
                }
                alt="Poster promotion preview"
                width={
                  1280
                }
                height={
                  720
                }
                unoptimized
              />
            ) : (
              <video
                src={
                  props.media.previewUrl
                }
                controls
                muted
              />
            )}

            <div>
              <strong>
                {
                  props.media.fileName
                }
              </strong>

              <span>
                {(
                  props.media.sizeBytes /
                  1024 /
                  1024
                ).toFixed(
                  2
                )}
                {" MB · "}
                {props.media.type ===
                "image"
                  ? "Image"
                  : "Video"}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={
              styles.uploadPrompt
            }
          >
            <strong>
              Select media
            </strong>

            <span>
              JPG, PNG, WebP up to 10 MB or MP4, WebM up to 20 MB
            </span>
          </div>
        )}
      </label>

      {props.error ? (
        <span
          className={
            styles.fieldError
          }
        >
          {
            props.error
          }
        </span>
      ) : null}
    </div>
  );
}

