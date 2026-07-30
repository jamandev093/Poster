"use client";

import Image from "next/image";

import type {
  ChangeEvent,
} from "react";

import type {
  PosterPromotionMedia,
} from "./poster-promotion.types";

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
  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

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

      event.target.value =
        "";

      return;
    }

    const media:
      PosterPromotionMedia = {
      type,

      fileName:
        file.name,

      previewUrl:
        URL.createObjectURL(
          file
        ),

      mimeType:
        file.type,

      sizeBytes:
        file.size,
    };

    const validationError =
      validatePosterPromotionMedia(
        media
      );

    if (
      validationError
    ) {
      URL.revokeObjectURL(
        media.previewUrl
      );

      props.onChange(
        null
      );

      event.target.value =
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
  };

  const removeMedia =
    () => {
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
            Upload one landscape image or short landscape video.
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

