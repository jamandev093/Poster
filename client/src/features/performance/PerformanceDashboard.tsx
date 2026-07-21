"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  calculateCampaignCtr,
  calculateConversionRate,
  clientCampaigns,
  formatCampaignCurrency,
  formatCampaignNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getTrackingStatusLabel,
} from "@/features/campaigns/campaign.mock";

import type {
  ClientCampaignStatus,
} from "@/features/campaigns/campaign.types";

import {
  
  getCampaignPerformanceSnapshot,
  getPerformanceWindowLabel,
  placementPerformanceSnapshots,
} from "./performance.mock";

import type {
  PerformanceWindow,
} from "./performance.mock";

import styles from "./PerformanceDashboard.module.css";

type CampaignSelection =
  | "all"
  | string;

const windowOptions: {
  value: PerformanceWindow;
  label: string;
}[] = [
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "all",
    label: "All time",
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

    case "paused":
      return "statusBadge statusAttention";

    case "draft":
    case "ended":
      return `statusBadge ${styles.statusNeutral}`;
  }
}

export default function PerformanceDashboard() {
  const [
    selectedWindow,
    setSelectedWindow,
  ] =
    useState<PerformanceWindow>(
      "30d"
    );

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] =
    useState<CampaignSelection>(
      "all"
    );

  const visibleCampaigns =
    useMemo(
      () => {
        if (
          selectedCampaign ===
          "all"
        ) {
          return clientCampaigns;
        }

        return clientCampaigns.filter(
          (campaign) =>
            campaign.id ===
            selectedCampaign
        );
      },
      [
        selectedCampaign,
      ]
    );

  const campaignRows =
    useMemo(
      () =>
        visibleCampaigns.map(
          (campaign) => {
            const snapshot =
              getCampaignPerformanceSnapshot(
                campaign.id
              );

            const metrics =
              snapshot?.windows[
                selectedWindow
              ] ?? {
                impressions:
                  0,

                clicks:
                  0,

                conversions:
                  null,
              };

            const ctr =
              calculateCampaignCtr(
                metrics.impressions,
                metrics.clicks
              );

            const conversionRate =
              calculateConversionRate(
                metrics.clicks,
                metrics.conversions
              );

            return {
              campaign,
              metrics,
              ctr,
              conversionRate,
            };
          }
        ),
      [
        selectedWindow,
        visibleCampaigns,
      ]
    );

  const totals =
    useMemo(
      () => {
        let impressions =
          0;

        let clicks =
          0;

        let trackedClicks =
          0;

        let conversions =
          0;

        let trackedCampaigns =
          0;

        let untrackedCampaigns =
          0;

        let commission =
          0;

        campaignRows.forEach(
          (
            row
          ) => {
            impressions +=
              row.metrics.impressions;

            clicks +=
              row.metrics.clicks;

            commission +=
              row.metrics.commission ??
              0;

            if (
              row.metrics.conversions ===
              null
            ) {
              untrackedCampaigns +=
                1;

              return;
            }

            trackedCampaigns +=
              1;

            trackedClicks +=
              row.metrics.clicks;

            conversions +=
              row.metrics.conversions;
          }
        );

        return {
          impressions,
          clicks,

          ctr:
            calculateCampaignCtr(
              impressions,
              clicks
            ),

          conversions:
            trackedCampaigns >
            0
              ? conversions
              : null,

          conversionRate:
            trackedCampaigns >
            0
              ? calculateConversionRate(
                  trackedClicks,
                  conversions
                )
              : null,

          commission,
          untrackedCampaigns,
        };
      },
      [
        campaignRows,
      ]
    );

  const maximumPlacementImpressions =
    Math.max(
      ...placementPerformanceSnapshots.map(
        (
          placement
        ) =>
          placement.windows[
            selectedWindow
          ].impressions
      ),
      1
    );

  return (
    <>
      <section
        className={
          styles.controls
        }
      >
        <div
          className={
            styles.windowFilters
          }
          aria-label="Performance date range"
        >
          {windowOptions.map(
            (
              option
            ) => (
              <button
                key={
                  option.value
                }
                type="button"
                className={
                  selectedWindow ===
                  option.value
                    ? styles.windowButtonActive
                    : styles.windowButton
                }
                onClick={() =>
                  setSelectedWindow(
                    option.value
                  )
                }
              >
                {
                  option.label
                }
              </button>
            )
          )}
        </div>

        <label
          className={
            styles.campaignFilter
          }
        >
          <span>
            Campaign
          </span>

          <select
            value={
              selectedCampaign
            }
            onChange={(
              event
            ) =>
              setSelectedCampaign(
                event.target.value
              )
            }
          >
            <option value="all">
              All campaigns
            </option>

            {clientCampaigns.map(
              (
                campaign
              ) => (
                <option
                  key={
                    campaign.id
                  }
                  value={
                    campaign.id
                  }
                >
                  {
                    campaign.id
                  }
                  {" · "}
                  {
                    campaign.name
                  }
                </option>
              )
            )}
          </select>
        </label>
      </section>

      <div
        className={
          styles.periodLabel
        }
      >
        {
          getPerformanceWindowLabel(
            selectedWindow
          )
        }
      </div>

      <section
        className={
          styles.metrics
        }
      >
        <article
          className={
            styles.metric
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatCampaignNumber(
              totals.impressions
            )}
          </strong>

          <small>
            Recorded delivery
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatCampaignNumber(
              totals.clicks
            )}
          </strong>

          <small>
            Recorded engagement
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            CTR
          </span>

          <strong>
            {
              totals.ctr.toFixed(
                2
              )
            }
            %
          </strong>

          <small>
            Click-through rate
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {totals.conversions ===
            null
              ? "Not tracked"
              : formatCampaignNumber(
                  totals.conversions
                )}
          </strong>

          <small>
            {totals.conversionRate ===
            null
              ? "No connected tracking"
              : `${totals.conversionRate.toFixed(
                  2
                )}% conversion rate`}
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Affiliate commission
          </span>

          <strong>
            {formatCampaignCurrency(
              totals.commission
            )}
          </strong>

          <small>
            Recorded commission
          </small>
        </article>
      </section>

      {totals.untrackedCampaigns >
      0 ? (
        <div
          className={
            styles.trackingNotice
          }
        >
          {
            totals.untrackedCampaigns
          }
          {" "}
          {totals.untrackedCampaigns ===
          1
            ? "campaign does"
            : "campaigns do"}
          {" "}
          not currently have conversion tracking.
        </div>
      ) : null}

      <section className="contentCard">
        <div
          className={
            styles.cardHeader
          }
        >
          <div>
            <h2 className="sectionTitle">
              Campaign comparison
            </h2>

            <p className="sectionDescription">
              Performance and tracking by campaign.
            </p>
          </div>
        </div>

        <div
          className={
            styles.table
          }
        >
          <div
            className={
              styles.tableHeader
            }
          >
            <span>
              Campaign
            </span>

            <span>
              Impressions
            </span>

            <span>
              Clicks / CTR
            </span>

            <span>
              Conversions
            </span>

            <span>
              Tracking
            </span>

            <span>
              Status
            </span>
          </div>

          {campaignRows.map(
            (
              row
            ) => (
              <Link
                key={
                  row.campaign.id
                }
                href={`/campaigns/${row.campaign.id}`}
                className={
                  styles.tableRow
                }
              >
                <div
                  className={
                    styles.campaignInfo
                  }
                >
                  <strong>
                    {
                      row.campaign.name
                    }
                  </strong>

                  <span>
                    {
                      row.campaign.id
                    }
                    {" · "}
                    {getCampaignTypeLabel(
                      row.campaign.type
                    )}
                  </span>
                </div>

                <strong>
                  {formatCampaignNumber(
                    row.metrics.impressions
                  )}
                </strong>

                <div
                  className={
                    styles.compactMetric
                  }
                >
                  <strong>
                    {formatCampaignNumber(
                      row.metrics.clicks
                    )}
                  </strong>

                  <span>
                    {
                      row.ctr.toFixed(
                        2
                      )
                    }
                    % CTR
                  </span>
                </div>

                <div
                  className={
                    styles.compactMetric
                  }
                >
                  <strong>
                    {row.metrics.conversions ===
                    null
                      ? "Not tracked"
                      : formatCampaignNumber(
                          row.metrics.conversions
                        )}
                  </strong>

                  <span>
                    {row.conversionRate ===
                    null
                      ? "—"
                      : `${row.conversionRate.toFixed(
                          2
                        )}%`}
                  </span>
                </div>

                <span
                  className={
                    styles.tracking
                  }
                >
                  {getTrackingStatusLabel(
                    row.campaign.trackingStatus
                  )}
                </span>

                <span
                  className={getStatusClass(
                    row.campaign.status
                  )}
                >
                  {getCampaignStatusLabel(
                    row.campaign.status
                  )}
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      {selectedCampaign ===
      "all" ? (
        <section className="contentCard">
          <div
            className={
              styles.cardHeader
            }
          >
            <div>
              <h2 className="sectionTitle">
                Placement performance
              </h2>

              <p className="sectionDescription">
                Home, Search, and Trending results.
              </p>
            </div>
          </div>

          <div
            className={
              styles.placementList
            }
          >
            {placementPerformanceSnapshots.map(
              (
                placement
              ) => {
                const metrics =
                  placement.windows[
                    selectedWindow
                  ];

                const ctr =
                  calculateCampaignCtr(
                    metrics.impressions,
                    metrics.clicks
                  );

                const width =
                  (
                    metrics.impressions /
                    maximumPlacementImpressions
                  ) *
                  100;

                return (
                  <article
                    key={
                      placement.placement
                    }
                    className={
                      styles.placementRow
                    }
                  >
                    <div
                      className={
                        styles.placementName
                      }
                    >
                      <strong>
                        {
                          placement.placement
                        }
                      </strong>

                      <span>
                        {formatCampaignNumber(
                          metrics.impressions
                        )}
                        {" impressions"}
                      </span>
                    </div>

                    <div
                      className={
                        styles.placementBar
                      }
                    >
                      <span
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>

                    <div
                      className={
                        styles.placementMetrics
                      }
                    >
                      <strong>
                        {formatCampaignNumber(
                          metrics.clicks
                        )}
                        {" clicks"}
                      </strong>

                      <span>
                        {
                          ctr.toFixed(
                            2
                          )
                        }
                        % CTR
                      </span>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      ) : null}

      <p
        className={
          styles.demoNote
        }
      >
        Frontend demonstration snapshots · Real reporting will use
        organization-scoped campaign analytics APIs.
      </p>
    </>
  );
}