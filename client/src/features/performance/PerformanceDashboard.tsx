"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
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
} from "@/features/workspace/workspace.performance";

import {
  getCurrentOrganization,
  getOrganizationCampaigns,
} from "@/features/workspace/workspace.selectors";

import {
  AnalyticsDashboardPanel,
} from "@/features/workspace/components";

import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  calculateConversionRate,
  calculateCtr,
} from "@/features/workspace/workspace.types";

import type {
  CampaignStatus,
} from "@/features/workspace/workspace.types";

import {
  useClientWalletOverview,
} from "@/features/workspace/hooks/useClientWalletOverview";

import type {
  ClientWalletApiCampaignAllocation,
  ClientWalletApiMoney,
} from "@/features/workspace/services/client-wallet-read.service";
import styles from "./PerformanceDashboard.module.css";

type CampaignSelection =
  | "all"
  | string;

const clientCampaigns =
  getOrganizationCampaigns();

const currentOrganization =
  getCurrentOrganization();

function normalizeOrganizationId(
  value:
    string
): OrganizationId {
  const normalized =
    value.trim();

  if (
    !normalized.startsWith(
      "ORG-"
    )
  ) {
    throw new Error(
      `Invalid organization ID: ${value}`
    );
  }

  return normalized as
    OrganizationId;
}

const organizationId =
  normalizeOrganizationId(
    currentOrganization.id
  );

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

function performanceMinorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatPerformanceWalletMoney(
  money:
    ClientWalletApiMoney
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        money.currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    performanceMinorToMajor(
      money.minorUnits
    )
  );
}

function getPerformanceWalletSummary(
  allocation:
    ClientWalletApiCampaignAllocation |
    undefined,

  isWalletLoading:
    boolean,

  walletErrorMessage:
    string |
    null
): string {
  if (allocation) {
    return [
      "Wallet:",
      `${formatPerformanceWalletMoney(allocation.allocated)} allocated`,
      `${formatPerformanceWalletMoney(allocation.spent)} spent`,
      `${formatPerformanceWalletMoney(allocation.reserved)} reserved`,
    ].join(" ");
  }

  if (isWalletLoading) {
    return "Wallet spend loading...";
  }

  if (walletErrorMessage) {
    return "Wallet spend unavailable";
  }

  return "No Wallet allocation";
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

  const {
    overview:
      walletOverview,
    isLoading:
      isWalletLoading,
    errorMessage:
      walletErrorMessage,
  } =
    useClientWalletOverview(
      100
    );

  const allocationByCampaignId =
    useMemo(
      () => {
        const allocations =
          new Map<
            string,
            ClientWalletApiCampaignAllocation
          >();

        walletOverview?.campaignAllocations.forEach(
          (
            allocation:
              ClientWalletApiCampaignAllocation
          ) => {
            allocations.set(
              allocation.campaignId,
              allocation
            );
          }
        );

        return allocations;
      },
      [
        walletOverview?.campaignAllocations,
      ]
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
              calculateCtr(
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
            <option
              value="all"
            >
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
        {getPerformanceWindowLabel(
          selectedWindow
        )}
      </div>

      <AnalyticsDashboardPanel
        campaignIds={
          selectedCampaign ===
          "all"
            ? undefined
            : [
                selectedCampaign,
              ]
        }
        currency="INR"
        description={
          selectedWindow ===
          "30d"
            ? "Validated delivery, engagement, conversions, spend, and traffic quality for the selected campaign scope."
            : "Validated analytics use the latest canonical reporting snapshot. The campaign comparison and placement sections below continue to follow the selected legacy date range."
        }
        organizationId={
          organizationId
        }
        title="Validated performance"
      />
      <section
        className="contentCard"
      >
        <div
          className={
            styles.cardHeader
          }
        >
          <div>
            <h2
              className="sectionTitle"
            >
              Campaign comparison
            </h2>

            <p
              className="sectionDescription"
            >
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

                  <span
                    className={
                      styles.walletLine
                    }
                  >
                    {getPerformanceWalletSummary(
                      allocationByCampaignId.get(
                        row.campaign.id
                      ),
                      isWalletLoading,
                      walletErrorMessage
                    )}
                  </span>
                </div>

                <strong>
                  {formatClientNumber(
                    row.metrics
                      .impressions
                  )}
                </strong>

                <div
                  className={
                    styles.compactMetric
                  }
                >
                  <strong>
                    {formatClientNumber(
                      row.metrics
                        .clicks
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
                    {row.metrics
                      .conversions ===
                    null
                      ? "Not tracked"
                      : formatClientNumber(
                          row.metrics
                            .conversions
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
                    row.campaign
                      .trackingStatus
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
        <section
          className="contentCard"
        >
          <div
            className={
              styles.cardHeader
            }
          >
            <div>
              <h2
                className="sectionTitle"
              >
                Placement performance
              </h2>

              <p
                className="sectionDescription"
              >
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
                          width:
                            `${width}%`,
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
        Campaign performance updates as validated reporting data becomes available.
      </p>
    </>
  );
}




