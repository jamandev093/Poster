"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import type {
  CreativeFrameProfile,
  CreativeMediaAsset,
  CreativeMediaRole,
  CreativeMediaType,
} from "@/features/workspace/workspace.types";

import styles from "./CreativeMediaUploader.module.css";

export interface CreativeMediaSelection {
  /**
   * Local browser File object.
   *
   * Frontend-only preview state.
   * Do not store this object inside canonical request/campaign mock data.
   */
  file: File;

  /**
   * Temporary browser object URL.
   *
   * Never persist this as a production media URL.
   */
  previewUrl: string;

  /**
   * Canonical metadata that may later be sent to Backend/storage.
   */
  asset: CreativeMediaAsset;
}

interface CreativeMediaUploaderProps {
  label: string;

  description: string;

  role: CreativeMediaRole;

  /**
   * Identifies which already-finalized Poster mobile media frame
   * this creative is intended to fit.
   *
   * Exact dimensions/aspect-ratio validation will be added only
   * after reading the existing mobile frame implementation.
   */
  frameProfile?: CreativeFrameProfile;

  accept: string;

  allowVideo?: boolean;

  required?: boolean;

  maxImageBytes?: number;

  maxVideoBytes?: number;

  maxVideoDurationSeconds?: number;

  initialAsset?: CreativeMediaAsset;

  /**
   * Temporary compatibility with older mock records that only
   * contain imageName/logoName.
   */
  initialFileName?: string;

  altTextRequired?: boolean;

  onChange: (
    selection:
      | CreativeMediaSelection
      | null
  ) => void;
}

const DEFAULT_MAX_IMAGE_BYTES =
  10 * 1024 * 1024;

const DEFAULT_MAX_VIDEO_BYTES =
  20 * 1024 * 1024;

const DEFAULT_MAX_VIDEO_DURATION_SECONDS =
  10;

const ACCEPTED_IMAGE_MIME_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

const ACCEPTED_VIDEO_MIME_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);

function formatBytes(
  bytes: number
): string {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes /
    1024;

  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      1
    )} KB`;
  }

  const megabytes =
    kilobytes /
    1024;

  return `${megabytes.toFixed(
    1
  )} MB`;
}

function getMediaType(
  file: File
): CreativeMediaType | null {
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

function isSupportedImage(
  file: File
): boolean {
  return ACCEPTED_IMAGE_MIME_TYPES.has(
    file.type
  );
}

function isSupportedVideo(
  file: File
): boolean {
  return ACCEPTED_VIDEO_MIME_TYPES.has(
    file.type
  );
}

function readImageMetadata(
  previewUrl: string
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload =
        () => {
          resolve({
            width:
              image.naturalWidth,

            height:
              image.naturalHeight,
          });
        };

      image.onerror =
        () => {
          reject(
            new Error(
              "Unable to read image metadata."
            )
          );
        };

      image.src =
        previewUrl;
    }
  );
}

function readVideoMetadata(
  previewUrl: string
): Promise<{
  width: number;
  height: number;
  durationSeconds: number;
}> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const video =
        document.createElement(
          "video"
        );

      video.preload =
        "metadata";

      video.onloadedmetadata =
        () => {
          const duration =
            Number.isFinite(
              video.duration
            )
              ? video.duration
              : 0;

          resolve({
            width:
              video.videoWidth,

            height:
              video.videoHeight,

            durationSeconds:
              duration,
          });
        };

      video.onerror =
        () => {
          reject(
            new Error(
              "Unable to read video metadata."
            )
          );
        };

      video.src =
        previewUrl;
    }
  );
}

export default function CreativeMediaUploader({
  label,
  description,
  role,
  frameProfile,
  accept,
  allowVideo = false,
  required = false,
  maxImageBytes =
    DEFAULT_MAX_IMAGE_BYTES,
  maxVideoBytes =
    DEFAULT_MAX_VIDEO_BYTES,
  maxVideoDurationSeconds =
    DEFAULT_MAX_VIDEO_DURATION_SECONDS,
  initialAsset,
  initialFileName,
  altTextRequired = false,
  onChange,
}: CreativeMediaUploaderProps) {
  const [
    selection,
    setSelection,
  ] =
    useState<CreativeMediaSelection | null>(
      null
    );

  const [
    existingFileName,
    setExistingFileName,
  ] =
    useState(
      initialAsset?.fileName ??
        initialFileName ??
        ""
    );

  const [
    altText,
    setAltText,
  ] =
    useState(
      initialAsset?.altText ??
        ""
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    reading,
    setReading,
  ] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const previewUrlRef =
    useRef<string | null>(
      null
    );

  useEffect(
    () => {
      return () => {
        if (
          previewUrlRef.current
        ) {
          URL.revokeObjectURL(
            previewUrlRef.current
          );
        }
      };
    },
    []
  );

  const updateParent =
    (
      current:
        CreativeMediaSelection |
        null,
      nextAltText: string
    ) => {
      if (!current) {
        onChange(
          null
        );

        return;
      }

      const updated:
        CreativeMediaSelection = {
        ...current,

        asset: {
          ...current.asset,

          altText:
            nextAltText.trim() ||
            undefined,
        },
      };

      setSelection(
        updated
      );

      onChange(
        updated
      );
    };

  const clearSelection =
    () => {
      if (
        previewUrlRef.current
      ) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current =
          null;
      }

      setSelection(
        null
      );

      setExistingFileName(
        ""
      );

      setAltText(
        ""
      );

      setError(
        ""
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      onChange(
        null
      );
    };

  const chooseFile =
    () => {
      fileInputRef.current?.click();
    };

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError(
        ""
      );

      const mediaType =
        getMediaType(
          file
        );

      if (!mediaType) {
        setError(
          "Choose a supported image or video file."
        );

        event.target.value =
          "";

        return;
      }

      if (
        mediaType ===
          "image" &&
        !isSupportedImage(
          file
        )
      ) {
        setError(
          "Supported images are PNG, JPG/JPEG, and WebP."
        );

        event.target.value =
          "";

        return;
      }

      if (
        mediaType ===
        "video"
      ) {
        if (
          !allowVideo
        ) {
          setError(
            "Video is not supported for this creative slot."
          );

          event.target.value =
            "";

          return;
        }

        if (
          !isSupportedVideo(
            file
          )
        ) {
          setError(
            "Supported video formats are MP4 and WebM."
          );

          event.target.value =
            "";

          return;
        }
      }

      const maximumBytes =
        mediaType ===
        "video"
          ? maxVideoBytes
          : maxImageBytes;

      if (
        file.size >
        maximumBytes
      ) {
        setError(
          `${
            mediaType ===
            "video"
              ? "Video"
              : "Image"
          } must be ${formatBytes(
            maximumBytes
          )} or smaller.`
        );

        event.target.value =
          "";

        return;
      }

      if (
        previewUrlRef.current
      ) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current =
          null;
      }

      const previewUrl =
        URL.createObjectURL(
          file
        );

      previewUrlRef.current =
        previewUrl;

      setReading(
        true
      );

      try {
        let width:
          number | undefined;

        let height:
          number | undefined;

        let durationSeconds:
          number | undefined;

        if (
          mediaType ===
          "image"
        ) {
          const metadata =
            await readImageMetadata(
              previewUrl
            );

          width =
            metadata.width;

          height =
            metadata.height;
        } else {
          const metadata =
            await readVideoMetadata(
              previewUrl
            );

          if (
            metadata.durationSeconds <=
            0
          ) {
            URL.revokeObjectURL(
              previewUrl
            );

            previewUrlRef.current =
              null;

            setError(
              "Poster could not determine the video duration. Choose another video."
            );

            event.target.value =
              "";

            return;
          }

          if (
            metadata.durationSeconds >
            maxVideoDurationSeconds
          ) {
            URL.revokeObjectURL(
              previewUrl
            );

            previewUrlRef.current =
              null;

            setError(
              `Video ads must be ${maxVideoDurationSeconds} seconds or shorter.`
            );

            event.target.value =
              "";

            return;
          }

          width =
            metadata.width;

          height =
            metadata.height;

          durationSeconds =
            metadata.durationSeconds;
        }

        const nextSelection:
          CreativeMediaSelection = {
          file,

          previewUrl,

          asset: {
            role,

            type:
              mediaType,

            frameProfile,

            fileName:
              file.name,

            mimeType:
              file.type,

            sizeBytes:
              file.size,

            width,

            height,

            durationSeconds,

            altText:
              altText.trim() ||
              undefined,
          },
        };

        setSelection(
          nextSelection
        );

        setExistingFileName(
          ""
        );

        onChange(
          nextSelection
        );
      } catch {
        URL.revokeObjectURL(
          previewUrl
        );

        previewUrlRef.current =
          null;

        setError(
          `Poster could not read this ${
            mediaType ===
            "video"
              ? "video"
              : "image"
          }. Choose another file.`
        );

        event.target.value =
          "";
      } finally {
        setReading(
          false
        );
      }
    };

  const displayFileName =
    selection?.asset.fileName ??
    existingFileName;

  return (
    <section
      className={
        styles.uploader
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <strong>
            {label}
            {required
              ? " *"
              : ""}
          </strong>

          <span>
            {description}
          </span>
        </div>

        {displayFileName ? (
          <span
            className={
              styles.selectedStatus
            }
          >
            Selected
          </span>
        ) : null}
      </div>

      {selection ? (
        <div
          className={
            styles.preview
          }
        >
          {selection.asset.type ===
          "image" ? (
            // This is a temporary local browser preview.
            // It is not a permanent production asset URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                selection.previewUrl
              }
              alt={
                altText ||
                "Selected advertising creative preview"
              }
            />
          ) : (
            <video
              src={
                selection.previewUrl
              }
              controls
              muted
              playsInline
              preload="metadata"
            />
          )}
        </div>
      ) : existingFileName ? (
        <div
          className={
            styles.existingAsset
          }
        >
          <span>
            Existing creative
          </span>

          <strong>
            {
              existingFileName
            }
          </strong>

          <small>
            A permanent preview will be available after Backend media storage is connected.
          </small>
        </div>
      ) : (
        <button
          type="button"
          className={
            styles.emptyUpload
          }
          onClick={
            chooseFile
          }
        >
          <span
            className={
              styles.uploadIcon
            }
            aria-hidden="true"
          >
            ↑
          </span>

          <strong>
            Choose media
          </strong>

          <small>
            {allowVideo
              ? "PNG, JPG, WebP, MP4 or WebM"
              : "PNG, JPG or WebP"}
          </small>

          {allowVideo ? (
            <small>
              Video: maximum 10 seconds · 20 MB
            </small>
          ) : null}
        </button>
      )}

      <input
        ref={
          fileInputRef
        }
        type="file"
        accept={
          accept
        }
        className={
          styles.hiddenInput
        }
        onChange={
          handleFileChange
        }
      />

      {reading ? (
        <div
          className={
            styles.reading
          }
          role="status"
        >
          Reading media metadata…
        </div>
      ) : null}

      {selection ? (
        <div
          className={
            styles.metadata
          }
        >
          <div>
            <span>
              File
            </span>

            <strong>
              {
                selection.asset.fileName
              }
            </strong>
          </div>

          <div>
            <span>
              Type
            </span>

            <strong>
              {selection.asset.type ===
              "video"
                ? "Video"
                : "Image"}
            </strong>
          </div>

          <div>
            <span>
              Size
            </span>

            <strong>
              {formatBytes(
                selection.asset.sizeBytes ??
                  0
              )}
            </strong>
          </div>

          <div>
            <span>
              Dimensions
            </span>

            <strong>
              {selection.asset.width &&
              selection.asset.height
                ? `${selection.asset.width} × ${selection.asset.height}`
                : "Unavailable"}
            </strong>
          </div>

          {selection.asset.type ===
          "video" ? (
            <div>
              <span>
                Duration
              </span>

              <strong>
                {selection.asset.durationSeconds !==
                undefined
                  ? `${selection.asset.durationSeconds.toFixed(
                      1
                    )} sec`
                  : "Unavailable"}
              </strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {role ===
      "primary" ||
      role ===
      "slide" ? (
        <div
          className={
            styles.altField
          }
        >
          <label>
            Alt text
            {altTextRequired
              ? " *"
              : ""}
          </label>

          <input
            value={
              altText
            }
            onChange={(
              event
            ) => {
              const value =
                event.target.value;

              setAltText(
                value
              );

              if (
                selection
              ) {
                updateParent(
                  selection,
                  value
                );
              }
            }}
            required={
              altTextRequired &&
              Boolean(
                selection
              )
            }
            placeholder="Describe this creative for accessibility"
          />
        </div>
      ) : null}

      {selection?.asset.type ===
      "video" ? (
        <div
          className={
            styles.reading
          }
        >
          Frame rate must be 30–45 FPS. Final FPS and codec verification will occur during Backend media processing.
        </div>
      ) : null}

      {frameProfile ? (
        <div
          className={
            styles.reading
          }
        >
          Creative must fit Poster&apos;s finalized{" "}
          {frameProfile ===
          "sliding_card_media"
            ? "sliding-card"
            : "standard ad"}{" "}
          media frame.
        </div>
      ) : null}

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div
        className={
          styles.actions
        }
      >
        {displayFileName ? (
          <>
            <button
              type="button"
              className={
                styles.secondaryAction
              }
              onClick={
                chooseFile
              }
            >
              Replace
            </button>

            <button
              type="button"
              className={
                styles.removeAction
              }
              onClick={
                clearSelection
              }
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            className={
              styles.secondaryAction
            }
            onClick={
              chooseFile
            }
          >
            Choose file
          </button>
        )}
      </div>
    </section>
  );
}