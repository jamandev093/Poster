"use client";

import type {
  DirectSponsorshipCampaign,
} from "./direct-sponsorship.types";

import styles from "./DirectSponsorshipReadinessPanel.module.css";

interface DirectSponsorshipReadinessPanelProps {
  campaign:
    DirectSponsorshipCampaign;
}

interface ReadinessItem {
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

function formatBoolean(
  value:
    boolean
): string {
  return value
    ? "Ready"
    : "Needs attention";
}

function getReadinessItems(
  campaign:
    DirectSponsorshipCampaign
): ReadinessItem[] {
  const hasSchedule =
    Boolean(
      campaign.scheduledStartDate &&
      campaign.scheduledEndDate
    );

  const hasPlacements =
    campaign.placements.length > 0;

  const campaignCanDeliver =
    campaign.deliveryEligible;

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
        "Lifecycle state from the authoritative Backend campaign record.",
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
        "Controls whether the campaign can safely move toward delivery.",
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
        "Direct Sponsorship must remain commercially approved before delivery.",
    },
    {
      label:
        "Delivery eligibility",

      value:
        formatBoolean(
          campaignCanDeliver
        ),

      healthy:
        campaignCanDeliver,

      note:
        "Backend-owned eligibility gate for running the sponsorship.",
    },
    {
      label:
        "Schedule",

      value:
        hasSchedule
          ? "Scheduled"
          : "Missing",

      healthy:
        hasSchedule,

      note:
        "Start and end dates must be present before scheduling or activation.",
    },
    {
      label:
        "Placements",

      value:
        hasPlacements
          ? `${campaign.placements.length} placement${
              campaign.placements.length === 1
                ? ""
                : "s"
            }`
          : "Missing",

      healthy:
        hasPlacements,

      note:
        "Only Poster-approved placements should be used for Direct Sponsorship.",
    },
  ];
}

export default function DirectSponsorshipReadinessPanel(
  props:
    DirectSponsorshipReadinessPanelProps
) {
  const items =
    getReadinessItems(
      props.campaign
    );

  const attentionCount =
    items.filter(
      item =>
        !item.healthy
    ).length;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h3>
            Operational readiness
          </h3>

          <p>
            Backend campaign status, approval, schedule, placement, and delivery
            gates for this Direct Sponsorship.
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
        {items.map(
          item => (
            <article
              key={item.label}
              className={
                item.healthy
                  ? styles.itemReady
                  : styles.itemAttention
              }
            >
              <span className={styles.label}>
                {item.label}
              </span>

              <strong>
                {item.value}
              </strong>

              <p>
                {item.note}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}