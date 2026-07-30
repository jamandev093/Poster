"use client";

import Image from "next/image";

import {
  useMemo,
  useState,
} from "react";

import PosterPromotionMediaField from "./PosterPromotionMediaField";

import {
  EMPTY_POSTER_PROMOTION_DRAFT,
} from "./poster-promotion.types";

import type {
  PosterPromotionDraft,
} from "./poster-promotion.types";

import {
  hasPosterPromotionErrors,
  validatePosterPromotionDraft,
} from "./poster-promotion.validation";

import styles from "./PosterPromotionEditor.module.css";

interface PosterPromotionEditorProps {
  initialDraft?:
    PosterPromotionDraft;

  mode:
    | "create"
    | "edit";

  onClose:
    () => void;

  onSaveDraft:
    (
      draft:
        PosterPromotionDraft
    ) => void;

  onSchedule:
    (
      draft:
        PosterPromotionDraft
    ) => void;
}

function cloneDraft(
  draft:
    PosterPromotionDraft
): PosterPromotionDraft {
  return {
    ...draft,

    creative: {
      ...draft.creative,

      media:
        draft.creative.media
          ? {
              ...draft.creative.media,
            }
          : null,
    },
  };
}

export default function PosterPromotionEditor(
  props:
    PosterPromotionEditorProps
) {
  const [
    draft,
    setDraft,
  ] =
    useState<
      PosterPromotionDraft
    >(
      cloneDraft(
        props.initialDraft ??
        EMPTY_POSTER_PROMOTION_DRAFT
      )
    );

  const [
    submitted,
    setSubmitted,
  ] =
    useState(
      false
    );

  const errors =
    useMemo(
      () =>
        submitted
          ? validatePosterPromotionDraft(
              draft
            )
          : {},
      [
        draft,
        submitted,
      ]
    );

  const updateDraft = <
    TKey extends
      keyof PosterPromotionDraft
  >(
    key:
      TKey,
    value:
      PosterPromotionDraft[TKey]
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  };

  const updateCreative = <
    TKey extends
      keyof PosterPromotionDraft["creative"]
  >(
    key:
      TKey,
    value:
      PosterPromotionDraft["creative"][TKey]
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,

        creative: {
          ...current.creative,

          [key]:
            value,
        },
      })
    );
  };

  const submit = (
    action:
      "draft"
      | "schedule"
  ) => {
    if (
      action ===
      "draft"
    ) {
      props.onSaveDraft(
        cloneDraft(
          draft
        )
      );

      return;
    }

    setSubmitted(
      true
    );

    const nextErrors =
      validatePosterPromotionDraft(
        draft
      );

    if (
      hasPosterPromotionErrors(
        nextErrors
      )
    ) {
      return;
    }

    props.onSchedule(
      cloneDraft(
        draft
      )
    );
  };

  return (
    <div
      className={
        styles.editorLayer
      }
    >
      <button
        type="button"
        className={
          styles.backdrop
        }
        aria-label="Close Poster promotion editor"
        onClick={
          props.onClose
        }
      />

      <aside
        className={
          styles.editor
        }
        aria-label={
          props.mode ===
          "create"
            ? "Create Poster promotion"
            : "Edit Poster promotion"
        }
      >
        <header
          className={
            styles.header
          }
        >
          <div>
            <span>
              Poster Promotion
            </span>

            <h3>
              {props.mode ===
              "create"
                ? "Create promotion"
                : "Edit promotion"}
            </h3>

            <p>
              Build a clearly disclosed Poster-owned placement.
            </p>
          </div>

          <button
            type="button"
            className={
              styles.closeButton
            }
            aria-label="Close"
            onClick={
              props.onClose
            }
          >
            ×
          </button>
        </header>

        <div
          className={
            styles.body
          }
        >
          <section
            className={
              styles.section
            }
          >
            <h4>
              Promotion details
            </h4>

            <label
              className={
                styles.field
              }
            >
              <span>
                Promotion name
              </span>

              <input
                value={
                  draft.name
                }
                placeholder="Example: Poster Career Discovery"
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "name",
                    event.target.value
                  )
                }
              />

              {errors.name ? (
                <small>
                  {
                    errors.name
                  }
                </small>
              ) : null}
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Purpose
              </span>

              <textarea
                value={
                  draft.purpose
                }
                rows={
                  4
                }
                placeholder="Explain why Poster is running this promotion."
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "purpose",
                    event.target.value
                  )
                }
              />

              {errors.purpose ? (
                <small>
                  {
                    errors.purpose
                  }
                </small>
              ) : null}
            </label>

            <div
              className={
                styles.twoColumn
              }
            >
              <div
                className={
                  styles.field
                }
              >
                <span>
                  Placements
                </span>

                <div
                  className={
                    styles.placementOptions
                  }
                >
                  {(
                    [
                      "Home",
                      "Search",
                      "Trending",
                    ] as const
                  ).map(
                    (
                      placement
                    ) => {
                      const checked =
                        draft.placements.includes(
                          placement
                        );

                      return (
                        <label
                          key={
                            placement
                          }
                          className={
                            checked
                              ? styles.placementSelected
                              : styles.placementOption
                          }
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() => {
                              updateDraft(
                                "placements",
                                checked
                                  ? draft.placements.filter(
                                      (
                                        current
                                      ) =>
                                        current !==
                                        placement
                                    )
                                  : [
                                      ...draft.placements,
                                      placement,
                                    ]
                              );
                            }}
                          />

                          <span>
                            {
                              placement
                            }
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>

                {errors.placement ? (
                  <small>
                    {
                      errors.placement
                    }
                  </small>
                ) : null}
              </div>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Disclosure
                </span>

                <input
                  value="Promoted by Poster"
                  readOnly
                />
              </label>
            </div>

            <div
              className={
                styles.twoColumn
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Start date
                </span>

                <input
                  type="date"
                  value={
                    draft.startAt
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "startAt",
                      event.target.value
                    )
                  }
                />

                {errors.startAt ? (
                  <small>
                    {
                      errors.startAt
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  End date
                </span>

                <input
                  type="date"
                  value={
                    draft.endAt
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "endAt",
                      event.target.value
                    )
                  }
                />

                {errors.endAt ? (
                  <small>
                    {
                      errors.endAt
                    }
                  </small>
                ) : null}
              </label>
            </div>
          </section>

          <section
            className={
              styles.section
            }
          >
            <h4>
              Creative
            </h4>

            <label
              className={
                styles.field
              }
            >
              <span>
                Headline
              </span>

              <input
                value={
                  draft.creative.headline
                }
                placeholder="Discover something valuable"
                onChange={(
                  event
                ) =>
                  updateCreative(
                    "headline",
                    event.target.value
                  )
                }
              />

              {errors.headline ? (
                <small>
                  {
                    errors.headline
                  }
                </small>
              ) : null}
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Body
              </span>

              <textarea
                value={
                  draft.creative.body
                }
                rows={
                  4
                }
                placeholder="Describe the promoted Poster experience."
                onChange={(
                  event
                ) =>
                  updateCreative(
                    "body",
                    event.target.value
                  )
                }
              />

              {errors.body ? (
                <small>
                  {
                    errors.body
                  }
                </small>
              ) : null}
            </label>

            <div
              className={
                styles.twoColumn
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Call to action
                </span>

                <input
                  value={
                    draft.creative.callToAction
                  }
                  placeholder="Explore now"
                  onChange={(
                    event
                  ) =>
                    updateCreative(
                      "callToAction",
                      event.target.value
                    )
                  }
                />

                {errors.callToAction ? (
                  <small>
                    {
                      errors.callToAction
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Destination URL
                </span>

                <input
                  type="url"
                  value={
                    draft.creative.destinationUrl
                  }
                  placeholder="https://getpostar.com/..."
                  onChange={(
                    event
                  ) =>
                    updateCreative(
                      "destinationUrl",
                      event.target.value
                    )
                  }
                />

                {errors.destinationUrl ? (
                  <small>
                    {
                      errors.destinationUrl
                    }
                  </small>
                ) : null}
              </label>
            </div>

            <PosterPromotionMediaField
              media={
                draft.creative.media
              }
              error={
                errors.media
              }
              onChange={(
                media
              ) =>
                updateCreative(
                  "media",
                  media
                )
              }
            />
          </section>

          <section
            className={
              styles.section
            }
          >
            <h4>
              Preview
            </h4>

            <article
              className={
                styles.previewCard
              }
            >
              {draft.creative.media ? (
                draft.creative.media.type ===
                "image" ? (
                  <Image
                    src={
                      draft.creative.media.previewUrl
                    }
                    alt=""
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
                      draft.creative.media.previewUrl
                    }
                    muted
                    controls
                  />
                )
              ) : (
                <div
                  className={
                    styles.previewPlaceholder
                  }
                >
                  Promotion media preview
                </div>
              )}

              <div
                className={
                  styles.previewBody
                }
              >
                <span>
                  Promoted by Poster
                </span>

                <strong>
                  {draft.creative.headline ||
                    "Promotion headline"}
                </strong>

                <p>
                  {draft.creative.body ||
                    "Promotion description will appear here."}
                </p>

                <button
                  type="button"
                  disabled
                >
                  {draft.creative.callToAction ||
                    "Call to action"}
                </button>
              </div>
            </article>
          </section>
        </div>

        <footer
          className={
            styles.footer
          }
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              props.onClose
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              submit(
                "draft"
              )
            }
          >
            Save draft
          </button>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={() =>
              submit(
                "schedule"
              )
            }
          >
            Schedule promotion
          </button>
        </footer>
      </aside>
    </div>
  );
}



