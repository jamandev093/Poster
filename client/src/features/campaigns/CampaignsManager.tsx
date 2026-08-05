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
  useClientCampaigns,
} from "./useClientCampaigns";

import type {
  ClientCampaignListItem,
} from "./useClientCampaigns";

import styles from "./CampaignsManager.module.css";

type CampaignFilter =
  | "all"
  | CampaignStatus;

interface FilterOption {
  key:
    CampaignFilter;

  label:
    string;
}

const filters: FilterOption[] = [
  {
    key:
      "all",

    label:
      "All",
  },
  {
    key:
      "draft",

    label:
      "Draft",
  },
  {
    key:
      "scheduled",

    label:
      "Scheduled",
  },
  {
    key:
      "active",

    label:
      "Active",
  },
  {
    key:
      "paused",

    label:
      "Paused",
  },
  {
    key:
      "ended",

    label:
      "Ended",
  },
  {
    key:
      "disabled",

    label:
      "Disabled",
  },
];

function getStatusClass(
  status:
    CampaignStatus
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

    case "disabled":
    default:
      return "statusBadge statusAttention";
  }
}

function formatMoney(
  value:
    number |
    undefined
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

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

function minorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatWalletMoney(
  minorUnits:
    string
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    minorToMajor(
      minorUnits
    )
  );
}

function matchesSearch(
  campaign:
    ClientCampaignListItem,

  query:
    string
): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    campaign.id,
    campaign.requestId,
    campaign.requestReference,
    campaign.name,
    campaign.objective,
    campaign.destinationUrl,
    campaign.linkedCampaignId,
    campaign.status,
    campaign.requestStatus,
    getCampaignTypeLabel(
      campaign.type
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    query
  );
}

function getWalletSummary(
  campaign:
    ClientCampaignListItem,

  walletErrorMessage:
    string |
    null
): string {
  const allocation =
    campaign.walletAllocation;

  if (allocation) {
    return [
      `${formatWalletMoney(allocation.allocated.minorUnits)} allocated`,
      `${formatWalletMoney(allocation.reserved.minorUnits)} reserved`,
      `${formatWalletMoney(allocation.spent.minorUnits)} spent`,
    ].join(" · ");
  }

  if (walletErrorMessage) {
    return "Wallet allocation unavailable";
  }

  if (!campaign.linkedCampaignId) {
    return "Wallet allocation pending campaign setup";
  }

  return "No Wallet allocation";
}

export default function CampaignsManager() {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<CampaignFilter>(
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
    useClientCampaigns(
      100
    );

  const visibleCampaigns =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return campaigns.filter(
          campaign =>
            (
              filter === "all" ||
              campaign.status === filter
            ) &&
            matchesSearch(
              campaign,
              normalizedSearch
            )
        );
      },
      [
        campaigns,
        filter,
        search,
      ]
    );

  const activeCampaigns =
    campaigns.filter(
      campaign =>
        campaign.status === "active"
    ).length;

  const scheduledCampaigns =
    campaigns.filter(
      campaign =>
        campaign.status === "scheduled"
    ).length;

  const totalImpressions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.impressions,
      0
    );

  const totalClicks =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.clicks,
      0
    );

  return (
    <section
      className={
        styles.shell
      }
      aria-labelledby="campaigns-manager-title"
      aria-busy={
        isLoading
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            Backend campaigns
          </p>

          <h2
            id="campaigns-manager-title"
            className={
              styles.title
            }
          >
            Campaigns
          </h2>

          <p
            className={
              styles.description
            }
          >
            Campaign visibility is derived from Poster Backend commercial
            requests and Backend Wallet allocation records.
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
          styles.summaryGrid
        }
        aria-label="Campaign summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total campaigns
          </span>

          <strong>
            {campaigns.length}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Active
          </span>

          <strong>
            {activeCampaigns}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Scheduled
          </span>

          <strong>
            {scheduledCampaigns}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Delivery
          </span>

          <strong>
            {formatClientNumber(
              totalImpressions
            )}
          </strong>

          <small>
            {formatClientNumber(
              totalClicks
            )} clicks
          </small>
        </article>
      </div>

      <div
        className={
          styles.controls
        }
      >
        <label
          className={
            styles.search
          }
        >
          <span>
            Search campaigns
          </span>

          <input
            type="search"
            value={
              search
            }
            onChange={
              event =>
                setSearch(
                  event.target.value
                )
            }
            className={
              styles.searchInput
            }
            placeholder="Search campaign, request, or ID"
            aria-label="Search campaigns"
          />
        </label>

        <div
          className={
            styles.filters
          }
          aria-label="Campaign status filters"
        >
          {filters.map(
            option => (
              <button
                key={
                  option.key
                }
                type="button"
                className={
                  filter === option.key
                    ? styles.filterButtonActive
                    : styles.filterButton
                }
                onClick={
                  () =>
                    setFilter(
                      option.key
                    )
                }
              >
                {option.label}
              </button>
            )
          )}
        </div>
      </div>

      {errorMessage ? (
        <div
          className={
            styles.empty
          }
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div
          className={
            styles.empty
          }
          role="status"
        >
          Loading campaigns from Poster Backend.
        </div>
      ) : visibleCampaigns.length > 0 ? (
        <div
          className={
            styles.grid
          }
        >
          {visibleCampaigns.map(
            campaign => (
              <article
                key={
                  campaign.id
                }
                className={
                  styles.campaignCard
                }
              >
                <div
                  className={
                    styles.cardHeader
                  }
                >
                  <div>
                    <p
                      className={
                        styles.eyebrow
                      }
                    >
                      {campaign.requestReference}
                    </p>

                    <h3>
                      {campaign.name}
                    </h3>

                    <p>
                      {getCampaignTypeLabel(
                        campaign.type
                      )}
                      {" · "}
                      {campaign.linkedCampaignId ??
                        "Pending campaign setup"}
                    </p>
                  </div>

                  <span
                    className={
                      getStatusClass(
                        campaign.status
                      )
                    }
                  >
                    {getCampaignStatusLabel(
                      campaign.status
                    )}
                  </span>
                </div>

                <div
                  className={
                    styles.performance
                  }
                >
                  <div>
                    <strong>
                      {formatClientNumber(
                        campaign.performance.impressions
                      )}
                    </strong>

                    <span>
                      Impressions
                    </span>
                  </div>

                  <div>
                    <strong>
                      {formatClientNumber(
                        campaign.performance.clicks
                      )}
                    </strong>

                    <span>
                      Clicks
                    </span>
                  </div>

                  <div>
                    <strong>
                      {campaign.performance.conversions === null
                        ? "—"
                        : formatClientNumber(
                            campaign.performance.conversions
                          )}
                    </strong>

                    <span>
                      Conversions
                    </span>
                  </div>
                </div>

                <div
                  className={
                    styles.performance
                  }
                >
                  <div>
                    <strong>
                      {formatMoney(
                        campaign.financials.budget ??
                        campaign.financials.contractValue
                      )}
                    </strong>

                    <span>
                      Commercial value
                    </span>
                  </div>

                  <div>
                    <strong>
                      {formatMoney(
                        campaign.financials.utilized
                      )}
                    </strong>

                    <span>
                      Wallet spent
                    </span>
                  </div>
                </div>

                <p
                  className={
                    styles.walletLine
                  }
                >
                  {getWalletSummary(
                    campaign,
                    walletErrorMessage
                  )}
                </p>

                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="secondaryButton"
                >
                  View campaign
                </Link>
              </article>
            )
          )}
        </div>
      ) : (
        <div
          className={
            styles.empty
          }
        >
          No Backend-linked campaigns match your search or filter.
        </div>
      )}
    </section>
  );
}