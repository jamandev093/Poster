"use client";

import type {
  PosterPromotionDraft,
} from "./poster-promotion.types";

import styles from "./PosterPromotionEditorSafetyPanel.module.css";

interface PosterPromotionEditorSafetyPanelProps {
  draft:
    PosterPromotionDraft;

  mode:
    "create" |
    "edit";
}

interface EditorSafetyCheck {
  label:
    string;

  value:
    string;

  healthy:
    boolean;

  note:
    string;
}

function hasText(
  value:
    string
): boolean {
  return value.trim().length > 0;
}

function hasSchedule(
  draft:
    PosterPromotionDraft
): boolean {
  return Boolean(
    draft.startAt &&
    draft.endAt
  );
}

function hasCreativeText(
  draft:
    PosterPromotionDraft
): boolean {
  return hasText(
    draft.creative.headline
  ) &&
    hasText(
      draft.creative.body
    ) &&
    hasText(
      draft.creative.callToAction
    );
}

function hasDestination(
  draft:
    PosterPromotionDraft
): boolean {
  return hasText(
    draft.creative.destinationUrl
  );
}

function hasPersistedMedia(
  draft:
    PosterPromotionDraft
): boolean {
  return Boolean(
    draft.creative.media?.assetId
  );
}

function hasLocalPreviewOnly(
  draft:
    PosterPromotionDraft
): boolean {
  return Boolean(
    draft.creative.media &&
    !draft.creative.media.assetId
  );
}

function getChecks(
  draft:
    PosterPromotionDraft,
  mode:
    "create" |
    "edit"
): EditorSafetyCheck[] {
  const persistedMedia =
    hasPersistedMedia(
      draft
    );

  const localPreviewOnly =
    hasLocalPreviewOnly(
      draft
    );

  return [
    {
      label:
        "Editor mode",

      value:
        mode === "create"
          ? "Create"
          : "Edit",

      healthy:
        true,

      note:
        mode === "create"
          ? "Creation will use the Poster organization identity configured for Admin."
          : "Edit will submit campaign and creative row versions through the Backend update path.",
    },
    {
      label:
        "Fixed disclosure",

      value:
        "Promoted by Poster",

      healthy:
        true,

      note:
        "The disclosure is fixed and cannot be changed in the editor.",
    },
    {
      label:
        "Schedule dates",

      value:
        hasSchedule(
          draft
        )
          ? "Present"
          : "Missing",

      healthy:
        hasSchedule(
          draft
        ),

      note:
        "Backend create/update requests require start and end dates.",
    },
    {
      label:
        "Placements",

      value:
        `${draft.placements.length} selected`,

      healthy:
        draft.placements.length > 0,

      note:
        "Poster Promotion placements are limited to Home, Search, and Trending.",
    },
    {
      label:
        "Creative copy",

      value:
        hasCreativeText(
          draft
        )
          ? "Present"
          : "Incomplete",

      healthy:
        hasCreativeText(
          draft
        ),

      note:
        "Headline, body, and call to action should be ready before publishing.",
    },
    {
      label:
        "Destination",

      value:
        hasDestination(
          draft
        )
          ? "Present"
          : "Missing",

      healthy:
        hasDestination(
          draft
        ),

      note:
        "Destination URL must be reviewable before the promotion is saved.",
    },
    {
      label:
        "Persisted media",

      value:
        persistedMedia
          ? "Ready"
          : localPreviewOnly
            ? "Local preview only"
            : "Missing",

      healthy:
        persistedMedia,

      note:
        persistedMedia
          ? "Media has an asset ID and can be sent to Backend."
          : localPreviewOnly
            ? "This file is only a browser preview. Connect storage upload before saving it to Backend."
            : "Scheduling requires a persisted image or video.",
    },
  ];
}

export default function PosterPromotionEditorSafetyPanel(
  props:
    PosterPromotionEditorSafetyPanelProps
) {
  const checks =
    getChecks(
      props.draft,
      props.mode
    );

  const attentionCount =
    checks.filter(
      check =>
        !check.healthy
    ).length;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h4>
            Editor safety checks
          </h4>

          <p>
            Confirms disclosure, dates, placements, creative text, destination,
            and persisted-media readiness before the Backend request is made.
          </p>
        </div>

        <span
          className={
            attentionCount === 0
              ? styles.readyBadge
              : styles.attentionBadge
          }
        >
          {attentionCount === 0
            ? "Ready"
            : `${attentionCount} checks need attention`}
        </span>
      </header>

      <div className={styles.grid}>
        {checks.map(
          check => (
            <article
              key={check.label}
              className={
                check.healthy
                  ? styles.itemReady
                  : styles.itemAttention
              }
            >
              <span>
                {check.label}
              </span>

              <strong>
                {check.value}
              </strong>

              <p>
                {check.note}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}