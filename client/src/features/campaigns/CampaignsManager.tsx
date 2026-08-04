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

import {
  getOrganizationCampaigns,
} from "@/features/workspace/workspace.selectors";

import {
  calculateCtr,
  calculateDeliveryProgress,
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
import styles from "./CampaignsManager.module.css";

type CampaignFilter =
  | "all"
  | CampaignStatus;

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
  {
    key: "disabled",
    label: "Disabled",
  },
];

const campaigns =
  getOrganizationCampaigns();

function getStatusClass(
  status: CampaignStatus
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
      return "statusBadge statusAttention";
  }
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
    minorToMajor(
      money.minorUnits
    )
  );
}

function getCampaignWalletSummary(
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
      `${formatWalletMoney(allocation.allocated)} allocated`,
      `${formatWalletMoney(allocation.reserved)} reserved`,
      `${formatWalletMoney(allocation.spent)} spent`,
    ].join(" ");
  }

  if (isWalletLoading) {
    return "Wallet allocation loading...";
  }

  if (walletErrorMessage) {
    return "Wallet allocation unavailable";
  }

  return "No Wallet allocation";
}
export default function CampaignsManager() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<CampaignFilter>(
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
          allocation => {
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
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return campaigns.filter(
          (
            campaign
          ) => {
            if (
              filter !==
                "all" &&
              campaign.status !==
                filter
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            const searchable = [
              campaign.id,
              campaign.requestId,
              campaign.name,
              campaign.organizationName,
              getCampaignTypeLabel(
                campaign.type
              ),
              getCampaignStatusLabel(
                campaign.status
              ),
            ]
              .join(" ")
              .toLowerCase();

            return searchable.includes(
              normalizedSearch
            );
          }
        );
      },
      [
        filter,
        search,
      ]
    );

  const activeCount =
    campaigns.filter(
      (
        campaign
      ) =>
        campaign.status ===
        "active"
    ).length;

  const upcomingCount =
    campaigns.filter(
      (
        campaign
      ) =>
        campaign.status ===
          "draft" ||
        campaign.status ===
          "scheduled"
    ).length;

  const totalImpressions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance
          .impressions,
      0
    );

  const totalClicks =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance
          .clicks,
      0
    );

  return (
    <>
      <section
        className={
          styles.summaryGrid
        }
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Active campaigns
          </span>

          <strong>
            {activeCount}
          </strong>

          <small>
            Currently delivering
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Upcoming
          </span>

          <strong>
            {upcomingCount}
          </strong>

          <small>
            Draft or scheduled
          </small>
        </article>

        <article
          className={
            styles.summaryCard
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
            Across your campaigns
          </small>
        </article>

        <article
          className={
            styles.summaryCard
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
            Recorded engagement
          </small>
        </article>
      </section>

      <section className="contentCard">
        <div
          className={
            styles.toolbar
          }
        >
          <input
            className={
              styles.searchInput
            }
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search campaign, request, or ID"
            aria-label="Search campaigns"
          />

          <div
            className={
              styles.filters
            }
            aria-label="Campaign status filters"
          >
            {filters.map(
              (
                option
              ) => {
                const active =
                  filter ===
                  option.key;

                return (
                  <button
                    key={
                      option.key
                    }
                    type="button"
                    className={
                      active
                        ? styles.filterButtonActive
                        : styles.filterButton
                    }
                    onClick={() =>
                      setFilter(
                        option.key
                      )
                    }
                  >
                    {
                      option.label
                    }
                  </button>
                );
              }
            )}
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
              Type
            </span>

            <span>
              Delivery
            </span>

            <span>
              Performance
            </span>

            <span>
              Status
            </span>
          </div>

          {visibleCampaigns.length >
          0 ? (
            visibleCampaigns.map(
              (
                campaign
              ) => {
                const delivery =
                  calculateDeliveryProgress(
                    campaign
                      .financials
                      .deliveryTarget,
                    campaign
                      .financials
                      .delivered
                  );

                const ctr =
                  calculateCtr(
                    campaign
                      .performance
                      .impressions,
                    campaign
                      .performance
                      .clicks
                  );

                const walletAllocation =
                  allocationByCampaignId.get(
                    campaign.id
                  );

                const walletSummary =
                  getCampaignWalletSummary(
                    walletAllocation,
                    isWalletLoading,
                    walletErrorMessage
                  );

                return (
                  <Link
                    key={
                      campaign.id
                    }
                    href={`/campaigns/${campaign.id}`}
                    className={
                      styles.row
                    }
                  >
                    <div
                      className={
                        styles.campaignInfo
                      }
                    >
                      <strong>
                        {
                          campaign.name
                        }
                      </strong>

                      <span>
                        {
                          campaign.id
                        }
                        {" · "}
                        {
                          campaign.requestId
                        }
                      </span>

                      <span
                        className={
                          styles.walletLine
                        }
                      >
                        {
                          walletSummary
                        }
                      </span>
                    </div>

                    <span
                      className={
                        styles.typeLabel
                      }
                    >
                      {getCampaignTypeLabel(
                        campaign.type
                      )}
                    </span>

                    <div
                      className={
                        styles.delivery
                      }
                    >
                      <strong>
                        {delivery ===
                        null
                          ? campaign.type ===
                            "affiliate"
                            ? "Performance based"
                            : "Not configured"
                          : `${delivery.toFixed(
                              1
                            )}%`}
                      </strong>

                      {delivery !==
                      null ? (
                        <div
                          className={
                            styles.progressTrack
                          }
                        >
                          <span
                            style={{
                              width: `${delivery}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={
                        styles.performance
                      }
                    >
                      <strong>
                        {ctr.toFixed(
                          2
                        )}
                        % CTR
                      </strong>

                      <span>
                        {formatClientNumber(
                          campaign
                            .performance
                            .impressions
                        )}
                        {
                          " impressions"
                        }
                      </span>
                    </div>

                    <span
                      className={getStatusClass(
                        campaign.status
                      )}
                    >
                      {getCampaignStatusLabel(
                        campaign.status
                      )}
                    </span>
                  </Link>
                );
              }
            )
          ) : (
            <div
              className={
                styles.empty
              }
            >
              No campaigns match your search or filter.
            </div>
          )}
        </div>
      </section>

      <p
        className={
          styles.note
        }
      >
        Campaign setup, scheduling, activation, pausing,
        and completion are controlled by Poster Admin.
      </p>
    </>
  );
}
