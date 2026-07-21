"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  calculateCampaignCtr,
  calculateDeliveryProgress,
  clientCampaigns,
  formatCampaignNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
} from "./campaign.mock";

import type {
  ClientCampaignStatus,
} from "./campaign.types";

import styles from "./CampaignsManager.module.css";

type CampaignFilter =
  | "all"
  | ClientCampaignStatus;

interface FilterOption {
  key: CampaignFilter;
  label: string;
}

const filters: FilterOption[] = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "draft",
    label: "Draft",
  },
  {
    key: "scheduled",
    label: "Scheduled",
  },
  {
    key: "active",
    label: "Active",
  },
  {
    key: "paused",
    label: "Paused",
  },
  {
    key: "ended",
    label: "Ended",
  },
];

function getStatusClass(
  status: ClientCampaignStatus
): string {
  switch (status) {
    case "active":
      return "statusBadge statusActive";

    case "scheduled":
      return "statusBadge statusScheduled";

    case "draft":
      return `statusBadge ${styles.statusDraft}`;

    case "paused":
      return "statusBadge statusAttention";

    case "ended":
      return `statusBadge ${styles.statusEnded}`;
  }
}

export default function CampaignsManager() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<CampaignFilter>("all");

  const visibleCampaigns = useMemo(
    () => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return clientCampaigns.filter(
        (campaign) => {
          if (
            filter !== "all" &&
            campaign.status !== filter
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            campaign.id,
            campaign.requestId,
            campaign.name,
            getCampaignTypeLabel(campaign.type),
            getCampaignStatusLabel(campaign.status),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(normalizedSearch);
        }
      );
    },
    [
      filter,
      search,
    ]
  );

  const activeCount =
    clientCampaigns.filter(
      (campaign) =>
        campaign.status === "active"
    ).length;

  const scheduledCount =
    clientCampaigns.filter(
      (campaign) =>
        campaign.status === "scheduled"
    ).length;

  const totalImpressions =
    clientCampaigns.reduce(
      (total, campaign) =>
        total + campaign.performance.impressions,
      0
    );

  const totalClicks =
    clientCampaigns.reduce(
      (total, campaign) =>
        total + campaign.performance.clicks,
      0
    );

  return (
    <>
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Active campaigns</span>
          <strong>{activeCount}</strong>
          <small>Currently delivering</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Scheduled</span>
          <strong>{scheduledCount}</strong>
          <small>Waiting to start</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Total impressions</span>
          <strong>
            {formatCampaignNumber(totalImpressions)}
          </strong>
          <small>Across all campaigns</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Total clicks</span>
          <strong>
            {formatCampaignNumber(totalClicks)}
          </strong>
          <small>Recorded engagement</small>
        </article>
      </section>

      <section className="contentCard">
        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search campaign ID, name or request..."
            aria-label="Search campaigns"
          />

          <div className={styles.filters}>
            {filters.map((option) => {
              const active =
                filter === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  className={
                    active
                      ? styles.filterButtonActive
                      : styles.filterButton
                  }
                  onClick={() =>
                    setFilter(option.key)
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Campaign</span>
            <span>Type</span>
            <span>Delivery</span>
            <span>Performance</span>
            <span>Status</span>
          </div>

          {visibleCampaigns.length > 0 ? (
            visibleCampaigns.map((campaign) => {
              const delivery =
                calculateDeliveryProgress(
                  campaign.financials.deliveryTarget,
                  campaign.financials.delivered
                );

              const ctr =
                calculateCampaignCtr(
                  campaign.performance.impressions,
                  campaign.performance.clicks
                );

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className={styles.row}
                >
                  <div className={styles.campaignInfo}>
                    <strong>{campaign.name}</strong>

                    <span>
                      {campaign.id} · {campaign.requestId}
                    </span>
                  </div>

                  <span className={styles.typeLabel}>
                    {getCampaignTypeLabel(campaign.type)}
                  </span>

                  <div className={styles.delivery}>
                    <strong>
                      {delivery === null
                        ? "Not applicable"
                        : `${delivery.toFixed(1)}%`}
                    </strong>

                    {delivery !== null ? (
                      <div className={styles.progressTrack}>
                        <span
                          style={{
                            width: `${delivery}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.performance}>
                    <strong>{ctr.toFixed(2)}% CTR</strong>

                    <span>
                      {formatCampaignNumber(
                        campaign.performance.impressions
                      )}
                      {" impressions"}
                    </span>
                  </div>

                  <span className={getStatusClass(campaign.status)}>
                    {getCampaignStatusLabel(campaign.status)}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className={styles.empty}>
              No campaigns match the current search and filter.
            </div>
          )}
        </div>
      </section>

      <p className={styles.note}>
        Campaign setup, scheduling, activation, pausing, and completion are
        controlled by Poster Admin.
      </p>
    </>
  );
}