"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  formatClientCurrency,
  formatClientNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getPlacementLabel,
  getTrackingStatusLabel,
} from "@/features/workspace/workspace.formatters";

import {
  getCampaignPerformanceSnapshot,
  getPerformanceWindowLabel,
  placementPerformanceSnapshots,
} from "@/features/workspace/workspace.performance";

import type {
  PerformanceWindow,
  PerformanceWindowMetrics,
} from "@/features/workspace/workspace.performance";

import {
  getOrganizationCampaigns,
} from "@/features/workspace/workspace.selectors";

import {
  calculateConversionRate,
  calculateCtr,
} from "@/features/workspace/workspace.types";

import type {
  CampaignStatus,
  ClientCampaign,
} from "@/features/workspace/workspace.types";

import styles from "./PerformanceDashboard.module.css";

type CampaignSelection =
  | "all"
  | string;

const campaigns =
  getOrganizationCampaigns();

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
  status: CampaignStatus
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
    case "disabled":
      return `statusBadge ${styles.statusNeutral}`;
  }
}

function getMetricsForCampaign(
  campaign: ClientCampaign,
  window: PerformanceWindow
): PerformanceWindowMetrics {
  /*
   * For all-time reporting, the canonical campaign record
   * remains authoritative.
   */
  if (
    window ===
    "all"
  ) {
    return {
      impressions:
        campaign.performance.impressions,

      clicks:
        campaign.performance.clicks,

      conversions:
        campaign.performance.conversions,

      commission:
        campaign.financials.commission,

      revenue:
        campaign.financials.revenue,
    };
  }

  const snapshot =
    getCampaignPerformanceSnapshot(
      campaign.id
    );

  const metrics =
    snapshot?.windows[
      window
    ];

  if (metrics) {
    return metrics;
  }

  /*
   * Missing analytics data is not treated as a real zero
   * conversion count.
   */
  return {
    impressions: 0,
    clicks: 0,
    conversions: null,
  };
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
          return campaigns;
        }

        return campaigns.filter(
          (
            campaign
          ) =>
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
          (
            campaign
          ) => {
            const metrics =
              getMetricsForCampaign(
                campaign,
                selectedWindow
              );

            const ctr =
              calculateCtr(
                metrics.impressions,
                metrics.clicks
              );

            const conversionRate =
              calculateConversionRate(
                metrics.clicks,
                metrics.conversions
              );

            const commission =
              metrics.commission ??
              0;

            const revenuePerClick =
              metrics.revenue !==
                undefined &&
              metrics.clicks >
                0
                ? metrics.revenue /
                  metrics.clicks
                : null;

            return {
              campaign,
              metrics,
              ctr,
              conversionRate,
              commission,
              revenuePerClick,
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
              row.commission;

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
            calculateCtr(
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

            {campaigns.map(
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
        {getPerformanceWindowLabel(
          selectedWindow
        )}
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
            {formatClientNumber(
              totals.impressions
            )}
          </strong>

          <small>
            Content displays
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
            {formatClientNumber(
              totals.clicks
            )}
          </strong>

          <small>
            Recorded visits
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
            {totals.ctr.toFixed(
              2
            )}
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
              : formatClientNumber(
                  totals.conversions
                )}
          </strong>

          <small>
            {totals.conversionRate ===
            null
              ? "Tracking unavailable"
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
            {formatClientCurrency(
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
          Conversion results are unavailable for
          {" "}
          {
            totals.untrackedCampaigns
          }
          {" "}
          {totals.untrackedCampaigns ===
          1
            ? "campaign"
            : "campaigns"}
          {" "}
          because tracking is not currently connected.
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
              Campaign performance
            </h2>

            <p className="sectionDescription">
              Compare delivery, engagement, conversion results,
              and tracking.
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
                  {formatClientNumber(
                    row.metrics.impressions
                  )}
                </strong>

                <div
                  className={
                    styles.compactMetric
                  }
                >
                  <strong>
                    {formatClientNumber(
                      row.metrics.clicks
                    )}
                  </strong>

                  <span>
                    {row.ctr.toFixed(
                      2
                    )}
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
                      : formatClientNumber(
                          row.metrics.conversions
                        )}
                  </strong>

                  <span>
                    {row.conversionRate ===
                    null
                      ? "—"
                      : `${row.conversionRate.toFixed(
                          2
                        )}% conversion rate`}

                    {row.campaign.type ===
                      "affiliate" &&
                    row.commission >
                      0
                      ? ` · ${formatClientCurrency(
                          row.commission
                        )} commission`
                      : ""}
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
                Where performance came from
              </h2>

              <p className="sectionDescription">
                Results across Poster Home, Search, and Trending.
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
                  calculateCtr(
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
                        {getPlacementLabel(
                          placement.placement
                        )}
                      </strong>

                      <span>
                        {formatClientNumber(
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
                        {formatClientNumber(
                          metrics.clicks
                        )}
                        {" clicks"}
                      </strong>

                      <span>
                        {ctr.toFixed(
                          2
                        )}
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
        Development reporting data · Production analytics will
        use authenticated organization-scoped reporting APIs.
      </p>
    </>
  );
}