"use client";

import type {
  AffiliateCampaign,
  AffiliateDetailResponse,
} from "./affiliate.types";

import styles from "./AffiliateReadinessPanel.module.css";

interface AffiliateReadinessPanelProps {
  campaign:
    AffiliateCampaign;

  metadata:
    AffiliateDetailResponse["metadata"];
}

interface AffiliateReadinessCheck {
  label:
    string;

  value:
    string;

  healthy:
    boolean;

  note:
    string;
}

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
  campaign:
    AffiliateCampaign
): boolean {
  return Boolean(
    campaign.scheduledStartDate &&
    campaign.scheduledEndDate
  );
}

function hasPlacement(
  campaign:
    AffiliateCampaign
): boolean {
  return campaign.placements.length > 0;
}

function hasMetadata(
  metadata:
    AffiliateDetailResponse["metadata"]
): boolean {
  return Boolean(
    metadata
  );
}

function hasTrackingReady(
  metadata:
    AffiliateDetailResponse["metadata"]
): boolean {
  if (!metadata) {
    return false;
  }

  return metadata.trackingStatus === "active";
}

function hasDisclosure(
  metadata:
    AffiliateDetailResponse["metadata"]
): boolean {
  return Boolean(
    metadata?.disclosure?.trim()
  );
}

function hasDestination(
  metadata:
    AffiliateDetailResponse["metadata"]
): boolean {
  return Boolean(
    metadata?.destinationUrl?.trim()
  );
}

function getChecks(
  campaign:
    AffiliateCampaign,
  metadata:
    AffiliateDetailResponse["metadata"]
): AffiliateReadinessCheck[] {
  return [
    {
      label:
        "Campaign status",

      value:
        formatValue(
          campaign.status
        ),

      healthy:
        campaign.status !== "disabled" &&
        campaign.status !== "ended",

      note:
        "Lifecycle remains controlled through the shared Campaigns workspace.",
    },
    {
      label:
        "Commercial approval",

      value:
        formatValue(
          campaign.commercialStatus
        ),

      healthy:
        campaign.commercialStatus === "approved",

      note:
        "Affiliate campaigns should be commercially approved before delivery.",
    },
    {
      label:
        "Readiness",

      value:
        formatValue(
          campaign.readinessStatus
        ),

      healthy:
        campaign.readinessStatus === "ready",

      note:
        "Backend readiness decides whether the placement can move toward delivery.",
    },
    {
      label:
        "Delivery eligibility",

      value:
        campaign.deliveryEligible
          ? "Eligible"
          : "Needs attention",

      healthy:
        campaign.deliveryEligible,

      note:
        "Delivery eligibility is Backend-owned and not calculated in the browser.",
    },
    {
      label:
        "Schedule",

      value:
        hasSchedule(
          campaign
        )
          ? "Configured"
          : "Missing",

      healthy:
        hasSchedule(
          campaign
        ),

      note:
        "Start and end dates should be present before activation.",
    },
    {
      label:
        "Placement",

      value:
        hasPlacement(
          campaign
        )
          ? `${campaign.placements.length} placement${
              campaign.placements.length === 1
                ? ""
                : "s"
            }`
          : "Missing",

      healthy:
        hasPlacement(
          campaign
        ),

      note:
        "Affiliate placement must remain clearly disclosed and separate from organic ranking.",
    },
    {
      label:
        "Metadata",

      value:
        hasMetadata(
          metadata
        )
          ? "Configured"
          : "Missing",

      healthy:
        hasMetadata(
          metadata
        ),

      note:
        "Partner, offer, destination, commission terms, tracking, and payout readiness live in Affiliate metadata.",
    },
    {
      label:
        "Tracking",

      value:
        formatValue(
          metadata?.trackingStatus
        ),

      healthy:
        hasTrackingReady(
          metadata
        ),

      note:
        "Tracking must be active before relying on affiliate performance data.",
    },
    {
      label:
        "Disclosure",

      value:
        hasDisclosure(
          metadata
        )
          ? "Present"
          : "Missing",

      healthy:
        hasDisclosure(
          metadata
        ),

      note:
        "Affiliate disclosure must stay visible wherever the placement appears.",
    },
    {
      label:
        "Destination",

      value:
        hasDestination(
          metadata
        )
          ? "Present"
          : "Missing",

      healthy:
        hasDestination(
          metadata
        ),

      note:
        "Destination URL is required for an operational affiliate offer.",
    },
  ];
}

export default function AffiliateReadinessPanel(
  props:
    AffiliateReadinessPanelProps
) {
  const checks =
    getChecks(
      props.campaign,
      props.metadata
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
            Affiliate operational readiness
          </h4>

          <p>
            Campaign, metadata, disclosure, tracking, and delivery checks for this
            affiliate placement.
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