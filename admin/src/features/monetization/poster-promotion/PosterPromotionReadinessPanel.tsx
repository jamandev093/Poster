"use client";

import type {
  PosterPromotionDetailResponse,
} from "./poster-promotion.api-types";

import styles from "./PosterPromotionReadinessPanel.module.css";

interface PosterPromotionReadinessPanelProps {
  detail:
    PosterPromotionDetailResponse;
}

interface PosterPromotionReadinessCheck {
  label:
    string;

  value:
    string;

  healthy:
    boolean;

  note:
    string;
}

const REQUIRED_DISCLOSURE =
  "Promoted by Poster";

function formatValue(
  value:
    string | null | undefined
): string {
  if (!value) {
    return "Missing";
  }

  return value
    .replaceAll("_", " ")
    .trim();
}

function hasSchedule(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return Boolean(
    detail.campaign.scheduledStartDate &&
    detail.campaign.scheduledEndDate
  );
}

function hasPlacements(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return detail.campaign.placements.length > 0;
}

function hasCreativeText(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return Boolean(
    detail.creative.purpose.trim() &&
    detail.creative.headline.trim() &&
    detail.creative.body.trim() &&
    detail.creative.callToAction.trim()
  );
}

function hasDestination(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return Boolean(
    detail.creative.destinationUrl.trim()
  );
}

function hasMedia(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return detail.creative.media !== null;
}

function requiresMediaForCurrentState(
  detail:
    PosterPromotionDetailResponse
): boolean {
  return detail.campaign.status === "scheduled" ||
    detail.campaign.status === "active";
}

function getChecks(
  detail:
    PosterPromotionDetailResponse
): PosterPromotionReadinessCheck[] {
  const mediaPresent =
    hasMedia(
      detail
    );

  const mediaRequired =
    requiresMediaForCurrentState(
      detail
    );

  return [
    {
      label:
        "Campaign status",

      value:
        formatValue(
          detail.campaign.status
        ),

      healthy:
        detail.campaign.status !== "disabled" &&
        detail.campaign.status !== "ended",

      note:
        "Lifecycle state comes from the authoritative Backend campaign record.",
    },
    {
      label:
        "Poster-owned origin",

      value:
        formatValue(
          detail.campaign.origin
        ),

      healthy:
        detail.campaign.origin === "admin_internal" &&
        detail.campaign.campaignType === "poster_promotion",

      note:
        "Poster Promotion must remain internal and must not be submitted by external advertisers.",
    },
    {
      label:
        "Disclosure",

      value:
        detail.creative.disclosure,

      healthy:
        detail.creative.disclosure === REQUIRED_DISCLOSURE,

      note:
        "Every Poster Promotion must display the fixed Promoted by Poster disclosure.",
    },
    {
      label:
        "Readiness",

      value:
        formatValue(
          detail.campaign.readinessStatus
        ),

      healthy:
        detail.campaign.readinessStatus === "ready",

      note:
        "Backend readiness controls whether this promotion can move toward delivery.",
    },
    {
      label:
        "Delivery eligibility",

      value:
        detail.campaign.deliveryEligible
          ? "Eligible"
          : "Needs attention",

      healthy:
        detail.campaign.deliveryEligible,

      note:
        "Delivery eligibility is Backend-owned and should not be recalculated in Admin UI.",
    },
    {
      label:
        "Schedule",

      value:
        hasSchedule(
          detail
        )
          ? "Configured"
          : "Missing",

      healthy:
        hasSchedule(
          detail
        ),

      note:
        "Start and end dates are required before scheduled delivery.",
    },
    {
      label:
        "Placements",

      value:
        hasPlacements(
          detail
        )
          ? `${detail.campaign.placements.length} placement${
              detail.campaign.placements.length === 1
                ? ""
                : "s"
            }`
          : "Missing",

      healthy:
        hasPlacements(
          detail
        ),

      note:
        "Poster Promotion may use only Poster-controlled approved placement areas.",
    },
    {
      label:
        "Creative text",

      value:
        hasCreativeText(
          detail
        )
          ? "Complete"
          : "Incomplete",

      healthy:
        hasCreativeText(
          detail
        ),

      note:
        "Purpose, headline, body, and call to action must be clear before delivery.",
    },
    {
      label:
        "Destination",

      value:
        hasDestination(
          detail
        )
          ? "Present"
          : "Missing",

      healthy:
        hasDestination(
          detail
        ),

      note:
        "Destination URL must be explicit and reviewable.",
    },
    {
      label:
        "Media",

      value:
        mediaPresent
          ? `${detail.creative.media?.fileName ?? "Attached"}`
          : "Missing",

      healthy:
        mediaPresent || !mediaRequired,

      note:
        mediaRequired
          ? "Scheduled or active Poster Promotions require persisted image or video media."
          : "Drafts can be prepared before media is attached, but media is required before scheduling.",
    },
    {
      label:
        "Concurrency",

      value:
        `Campaign ${detail.campaign.rowVersion} / Creative ${detail.creative.rowVersion}`,

      healthy:
        Boolean(
          detail.campaign.rowVersion &&
          detail.creative.rowVersion
        ),

      note:
        "Both row versions are sent during edit to prevent stale updates.",
    },
  ];
}

export default function PosterPromotionReadinessPanel(
  props:
    PosterPromotionReadinessPanelProps
) {
  const checks =
    getChecks(
      props.detail
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
          <h3>
            Poster Promotion readiness
          </h3>

          <p>
            Internal origin, disclosure, schedule, placements, creative package,
            media, delivery eligibility, and row-version checks.
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