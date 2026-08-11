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
} from "@/features/workspace/workspace.formatters";

import type {
  CampaignStatus,
} from "@/features/workspace/workspace.types";

import {
  useClientPerformanceCampaigns,
} from "./useClientPerformanceCampaigns";

import type {
  ClientCampaignListItem,
} from "@/features/campaigns/useClientCampaigns";

import styles from "./PerformanceDashboard.module.css";

type CampaignSelection =
  | "all"
  | string;

type PerformanceWindow =
  | "7d"
  | "30d"
  | "90d";

const performanceWindows: {
  key:
    PerformanceWindow;

  label:
    string;
}[] = [
  {
    key:
      "7d",

    label:
      "7 days",
  },
  {
    key:
      "30d",

    label:
      "30 days",
  },
  {
    key:
      "90d",

    label:
      "90 days",
  },
];

function getStatusClassName(
  status:
    CampaignStatus
): string {
  switch (status) {
    case "active":
      return `statusBadge ${styles.backendStatusPositive}`;

    case "paused":
    case "disabled":
      return `statusBadge ${styles.backendStatusAttention}`;

    case "draft":
    case "scheduled":
    case "ended":
    default:
      return `statusBadge ${styles.backendStatusNeutral}`;
  }
}

function formatMajorMoney(
  value:
    number |
    undefined,

  currency:
    string =
      "INR"
): string {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

function minorUnitsToMajor(
  minorUnits:
    string |
    undefined
): number {
  if (
    !minorUnits ||
    !/^-?[0-9]+$/.test(
      minorUnits
    )
  ) {
    return 0;
  }

  return Number(
    minorUnits
  ) / 100;
}

function formatMinorMoney(
  minorUnits:
    string |
    undefined,

  currency:
    string =
      "INR"
): string {
  if (
    !minorUnits ||
    !/^-?[0-9]+$/.test(
      minorUnits
    )
  ) {
    return "Not available";
  }

  return formatMajorMoney(
    minorUnitsToMajor(
      minorUnits
    ),
    currency
  );
}

function calculateCtr(
  impressions:
    number,

  clicks:
    number
): string {
  if (impressions <= 0) {
    return "0.00%";
  }

  return `${(
    (
      clicks /
      impressions
    ) *
    100
  ).toFixed(
    2
  )}%`;
}

function calculateConversionRate(
  clicks:
    number,

  conversions:
    number
): string {
  if (clicks <= 0) {
    return "0.00%";
  }

  return `${(
    (
      conversions /
      clicks
    ) *
    100
  ).toFixed(
    2
  )}%`;
}

function getCampaignSpendMajor(
  campaign:
    ClientCampaignListItem
): number {
  return minorUnitsToMajor(
    campaign.walletAllocation?.spent.minorUnits
  );
}

function getCampaignSpendLabel(
  campaign:
    ClientCampaignListItem
): string {
  if (campaign.walletAllocation) {
    return formatMinorMoney(
      campaign.walletAllocation.spent.minorUnits,
      campaign.walletAllocation.spent.currency
    );
  }

  return formatMajorMoney(
    campaign.financials.utilized
  );
}

function getCampaignAllocationLabel(
  campaign:
    ClientCampaignListItem
): string {
  const allocation =
    campaign.walletAllocation;

  if (!allocation) {
    return campaign.linkedCampaignId
      ? "No Backend Wallet allocation"
      : "Campaign setup pending";
  }

  return [
    `${formatMinorMoney(
      allocation.allocated.minorUnits,
      allocation.allocated.currency
    )} allocated`,
    `${formatMinorMoney(
      allocation.reserved.minorUnits,
      allocation.reserved.currency
    )} reserved`,
    `${formatMinorMoney(
      allocation.spent.minorUnits,
      allocation.spent.currency
    )} spent`,
  ].join(
    " · "
  );
}

function getCampaignConversions(
  campaign:
    ClientCampaignListItem
): number {
  return campaign.performance.conversions ??
    0;
}

function getCampaignTrackingState(
  campaign:
    ClientCampaignListItem
): string {
  if (
    campaign.performance.impressions > 0 ||
    campaign.performance.clicks > 0 ||
    getCampaignConversions(
      campaign
    ) > 0
  ) {
    return "Analytics available";
  }

  return "Analytics pending";
}

function sortCampaignsByUpdatedAt(
  campaigns:
    ClientCampaignListItem[]
): ClientCampaignListItem[] {
  return [
    ...campaigns,
  ].sort(
    (
      first,
      second
    ) =>
      new Date(
        second.updatedAt
      ).getTime() -
      new Date(
        first.updatedAt
      ).getTime()
  );
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
    campaigns,
    isLoading,
    isRefreshing,
    errorMessage,
    walletErrorMessage,
    refresh,
  } =
    useClientPerformanceCampaigns(
      selectedWindow,
      100
    );

  const visibleCampaigns =
    useMemo(
      () => {
        const source =
          selectedCampaign === "all"
            ? campaigns
            : campaigns.filter(
                campaign =>
                  campaign.id === selectedCampaign ||
                  campaign.linkedCampaignId === selectedCampaign ||
                  campaign.requestId === selectedCampaign
              );

        return sortCampaignsByUpdatedAt(
          source
        );
      },
      [
        campaigns,
        selectedCampaign,
      ]
    );

  const totalImpressions =
    visibleCampaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.impressions,
      0
    );

  const totalClicks =
    visibleCampaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.clicks,
      0
    );

  const totalConversions =
    visibleCampaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        getCampaignConversions(
          campaign
        ),
      0
    );

  const totalWalletSpend =
    visibleCampaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        getCampaignSpendMajor(
          campaign
        ),
      0
    );

  const campaignsAwaitingAnalytics =
    visibleCampaigns.filter(
      campaign =>
        getCampaignTrackingState(
          campaign
        ) === "Analytics pending"
    ).length;

  return (
    <section
      className={
        styles.backendShell
      }
      aria-labelledby="performance-dashboard-title"
      aria-busy={
        isLoading
      }
    >
      <header
        className={
          styles.backendHeader
        }
      >
        <div>
          <div
            className="pageEyebrow"
          >
            Backend-derived performance
          </div>

          <h2
            id="performance-dashboard-title"
          >
            Campaign delivery snapshot
          </h2>

          <p>
            Performance uses Backend-derived campaign records, validated
            analytics, and Backend Wallet allocations for the selected range.
          </p>
        </div>

        <button
          type="button"
          className="secondaryButton"
          onClick={
            () => {
              void refresh();
            }
          }
          disabled={
            isRefreshing
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      <div
        className={
          styles.backendToolbar
        }
      >
        <div
          className={
            styles.backendFilters
          }
          aria-label="Performance date range"
        >
          {performanceWindows.map(
            option => (
              <button
                key={
                  option.key
                }
                type="button"
                className={
                  selectedWindow === option.key
                    ? styles.backendFilterButtonActive
                    : styles.backendFilterButton
                }
                onClick={
                  () =>
                    setSelectedWindow(
                      option.key
                    )
                }
              >
                {option.label}
              </button>
            )
          )}
        </div>

        <label
          className={
            styles.backendCampaignSelect
          }
        >
          <span>
            Campaign
          </span>

          <select
            value={
              selectedCampaign
            }
            onChange={
              event =>
                setSelectedCampaign(
                  event.target.value
                )
            }
          >
            <option value="all">
              All campaigns
            </option>

            {campaigns.map(
              campaign => (
                <option
                  key={
                    campaign.id
                  }
                  value={
                    campaign.id
                  }
                >
                  {campaign.name}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {errorMessage ||
      walletErrorMessage ? (
        <div
          className="statePanel"
          role="status"
        >
          {errorMessage ? (
            <p>
              Campaigns: {errorMessage}
            </p>
          ) : null}

          {walletErrorMessage ? (
            <p>
              Wallet allocation: {walletErrorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <section
        className={
          styles.backendSummary
        }
        aria-label="Performance summary"
      >
        <article
          className={
            styles.backendSummaryCard
          }
        >
          <span>
            Campaigns in scope
          </span>

          <strong>
            {visibleCampaigns.length}
          </strong>

          <small>
            {selectedWindow} conservative view
          </small>
        </article>

        <article
          className={
            styles.backendSummaryCard
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatClientNumber(
              totalImpressions
            )}
          </strong>

          <small>
            Backend-derived campaign snapshot
          </small>
        </article>

        <article
          className={
            styles.backendSummaryCard
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatClientNumber(
              totalClicks
            )}
          </strong>

          <small>
            CTR {calculateCtr(
              totalImpressions,
              totalClicks
            )}
          </small>
        </article>

        <article
          className={
            styles.backendSummaryCard
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {formatClientNumber(
              totalConversions
            )}
          </strong>

          <small>
            CVR {calculateConversionRate(
              totalClicks,
              totalConversions
            )}
          </small>
        </article>

        <article
          className={
            styles.backendSummaryCard
          }
        >
          <span>
            Wallet spend
          </span>

          <strong>
            {formatMajorMoney(
              totalWalletSpend
            )}
          </strong>

          <small>
            From campaign Wallet allocations
          </small>
        </article>
      </section>

      <section
        className={
          styles.backendPanel
        }
        aria-labelledby="campaign-comparison-title"
      >
        <div
          className={
            styles.backendPanelHeader
          }
        >
          <div>
            <div
              className="pageEyebrow"
            >
              Campaign comparison
            </div>

            <h3
              id="campaign-comparison-title"
            >
              Performance by campaign
            </h3>

            <p>
              Analytics values use validated Client reporting for the selected
              date range.
            </p>
          </div>

          <Link
            href="/campaigns"
            className="secondaryButton"
          >
            View campaigns
          </Link>
        </div>

        {isLoading ? (
          <div
            className={
              styles.backendEmpty
            }
            role="status"
          >
            Loading Backend-derived performance.
          </div>
        ) : visibleCampaigns.length > 0 ? (
          <div
            className={
              styles.backendTable
            }
          >
            <div
              className={
                styles.backendTableHeader
              }
            >
              <span>
                Campaign
              </span>

              <span>
                Status
              </span>

              <span>
                Impressions
              </span>

              <span>
                Clicks
              </span>

              <span>
                Conversions
              </span>

              <span>
                Wallet spend
              </span>
            </div>

            {visibleCampaigns.map(
              campaign => (
                <Link
                  key={
                    campaign.id
                  }
                  href={`/campaigns/${campaign.id}`}
                  className={
                    styles.backendTableRow
                  }
                >
                  <span
                    className={
                      styles.backendCampaignInfo
                    }
                  >
                    <strong>
                      {campaign.name}
                    </strong>

                    <small>
                      {getCampaignTypeLabel(
                        campaign.type
                      )}
                      {" · "}
                      {campaign.requestReference}
                    </small>

                    <small
                      className={
                        styles.backendWalletLine
                      }
                    >
                      {getCampaignAllocationLabel(
                        campaign
                      )}
                    </small>
                  </span>

                  <span
                    className={
                      getStatusClassName(
                        campaign.status
                      )
                    }
                  >
                    {getCampaignStatusLabel(
                      campaign.status
                    )}
                  </span>

                  <strong>
                    {formatClientNumber(
                      campaign.performance.impressions
                    )}
                  </strong>

                  <strong>
                    {formatClientNumber(
                      campaign.performance.clicks
                    )}
                  </strong>

                  <strong>
                    {formatClientNumber(
                      getCampaignConversions(
                        campaign
                      )
                    )}
                  </strong>

                  <strong>
                    {getCampaignSpendLabel(
                      campaign
                    )}
                  </strong>
                </Link>
              )
            )}
          </div>
        ) : (
          <div
            className={
              styles.backendEmpty
            }
          >
            No Backend-derived campaign records are available for this scope.
          </div>
        )}
      </section>

      <section
        className={
          styles.backendPanel
        }
        aria-labelledby="analytics-readiness-title"
      >
        <div
          className={
            styles.backendPanelHeader
          }
        >
          <div>
            <div
              className="pageEyebrow"
            >
              Analytics readiness
            </div>

            <h3
              id="analytics-readiness-title"
            >
              Validated analytics connected
            </h3>

            <p>
              Campaign records, validated analytics, and Wallet allocations now
              load through authenticated Poster Backend services.
            </p>
          </div>
        </div>

        <div
          className={
            styles.backendPendingGrid
          }
        >
          <article
            className={
              styles.backendPendingCard
            }
          >
            <span>
              Data source
            </span>

            <strong>
              Backend commercial requests
            </strong>

            <small>
              Campaign records are derived from A36/A37 Backend request reads.
            </small>
          </article>

          <article
            className={
              styles.backendPendingCard
            }
          >
            <span>
              Spend source
            </span>

            <strong>
              Backend Wallet allocation
            </strong>

            <small>
              Wallet spend is shown only where campaign allocation data exists.
            </small>
          </article>

          <article
            className={
              styles.backendPendingCard
            }
          >
            <span>
              Awaiting analytics
            </span>

            <strong>
              {campaignsAwaitingAnalytics}
            </strong>

            <small>
              Campaigns without validated delivery events yet.
            </small>
          </article>
        </div>

        <p
          className={
            styles.backendNote
          }
        >
          Validated delivery analytics now use organization-scoped Poster
          Backend reporting; campaigns without validated rows remain pending.
        </p>
      </section>
    </section>
  );
}