"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  AdminCampaignWalletAllocationRow,
  AdminWalletMoney,
} from "./admin-wallet-operations.types";

import styles from "./AdminWalletOperationsManager.module.css";

interface AdminCampaignWalletAllocationsPanelProps {
  allocations:
    AdminCampaignWalletAllocationRow[];

  generatedAt:
    string;
}

type AllocationFilter =
  | "all"
  | "active"
  | "paused"
  | "exhausted"
  | "released"
  | "cancelled"
  | "risk";

const FILTERS:
  {
    label:
      string;

    value:
      AllocationFilter;
  }[] = [
  {
    label:
      "All",
    value:
      "all",
  },
  {
    label:
      "Active",
    value:
      "active",
  },
  {
    label:
      "Paused",
    value:
      "paused",
  },
  {
    label:
      "Exhausted",
    value:
      "exhausted",
  },
  {
    label:
      "Released",
    value:
      "released",
  },
  {
    label:
      "Cancelled",
    value:
      "cancelled",
  },
  {
    label:
      "Risk review",
    value:
      "risk",
  },
];

function minorToNumber(
  value:
    string
): number {
  if (!/^-?[0-9]+$/.test(value)) {
    return 0;
  }

  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function minorToMajor(
  value:
    string
): number {
  if (!/^-?[0-9]+$/.test(value)) {
    return 0;
  }

  return Number(value) / 100;
}

function formatMoney(
  money:
    AdminWalletMoney
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

function formatDate(
  value:
    string | null
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll("_", " ")
    .trim();
}

function statusClassName(
  status:
    string
): string {
  if (status === "active") {
    return styles.badgeGood;
  }

  if (
    status === "paused" ||
    status === "exhausted"
  ) {
    return styles.badgeWarn;
  }

  return styles.badge;
}

function isRiskAllocation(
  allocation:
    AdminCampaignWalletAllocationRow
): boolean {
  const allocated =
    minorToNumber(
      allocation.allocated.minorUnits
    );

  const reserved =
    minorToNumber(
      allocation.reserved.minorUnits
    );

  const spent =
    minorToNumber(
      allocation.spent.minorUnits
    );

  const released =
    minorToNumber(
      allocation.released.minorUnits
    );

  const refunded =
    minorToNumber(
      allocation.refunded.minorUnits
    );

  const accounted =
    reserved +
    spent +
    released +
    refunded;

  if (accounted > allocated) {
    return true;
  }

  if (
    allocation.status === "active" &&
    reserved === 0
  ) {
    return true;
  }

  if (
    allocation.status === "released" &&
    reserved > 0
  ) {
    return true;
  }

  if (
    allocation.status === "exhausted" &&
    spent < allocated
  ) {
    return true;
  }

  return false;
}

function getRiskLabel(
  allocation:
    AdminCampaignWalletAllocationRow
): string {
  const allocated =
    minorToNumber(
      allocation.allocated.minorUnits
    );

  const reserved =
    minorToNumber(
      allocation.reserved.minorUnits
    );

  const spent =
    minorToNumber(
      allocation.spent.minorUnits
    );

  const released =
    minorToNumber(
      allocation.released.minorUnits
    );

  const refunded =
    minorToNumber(
      allocation.refunded.minorUnits
    );

  const accounted =
    reserved +
    spent +
    released +
    refunded;

  if (accounted > allocated) {
    return "Over-accounted";
  }

  if (
    allocation.status === "active" &&
    reserved === 0
  ) {
    return "Active with no reserve";
  }

  if (
    allocation.status === "released" &&
    reserved > 0
  ) {
    return "Released but reserved";
  }

  if (
    allocation.status === "exhausted" &&
    spent < allocated
  ) {
    return "Exhausted early";
  }

  return "Healthy";
}

function getProgressPercent(
  allocation:
    AdminCampaignWalletAllocationRow
): number {
  const allocated =
    minorToNumber(
      allocation.allocated.minorUnits
    );

  if (allocated <= 0) {
    return 0;
  }

  const spent =
    minorToNumber(
      allocation.spent.minorUnits
    );

  const percent =
    Number(
      (spent * 10000) /
      allocated
    ) / 100;

  return Math.min(
    100,
    Math.max(
      0,
      percent
    )
  );
}

function filterAllocations(
  allocations:
    AdminCampaignWalletAllocationRow[],
  filter:
    AllocationFilter,
  search:
    string
): AdminCampaignWalletAllocationRow[] {
  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  return allocations.filter(
    allocation => {
      if (
        filter !== "all" &&
        filter !== "risk" &&
        allocation.status !== filter
      ) {
        return false;
      }

      if (
        filter === "risk" &&
        !isRiskAllocation(allocation)
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        allocation.id,
        allocation.campaignId,
        allocation.organizationId,
        allocation.organizationName,
        allocation.walletId,
        allocation.status,
      ].some(
        value =>
          value
            .toLowerCase()
            .includes(
              normalizedSearch
            )
      );
    }
  );
}

export default function AdminCampaignWalletAllocationsPanel(
  props:
    AdminCampaignWalletAllocationsPanelProps
) {
  const [
    filter,
    setFilter,
  ] =
    useState<AllocationFilter>(
      "all"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const filteredAllocations =
    useMemo(
      () =>
        filterAllocations(
          props.allocations,
          filter,
          search
        ),
      [
        filter,
        props.allocations,
        search,
      ]
    );

  const riskCount =
    useMemo(
      () =>
        props.allocations.filter(
          isRiskAllocation
        ).length,
      [
        props.allocations,
      ]
    );

  const activeCount =
    useMemo(
      () =>
        props.allocations.filter(
          allocation =>
            allocation.status ===
            "active"
        ).length,
      [
        props.allocations,
      ]
    );

  const totalReserved =
    useMemo(
      () =>
        props.allocations.reduce(
          (
            total,
            allocation
          ) =>
            total +
            minorToNumber(
              allocation.reserved.minorUnits
            ),
          0
        ),
      [
        props.allocations,
      ]
    );

  const totalSpent =
    useMemo(
      () =>
        props.allocations.reduce(
          (
            total,
            allocation
          ) =>
            total +
            minorToNumber(
              allocation.spent.minorUnits
            ),
          0
        ),
      [
        props.allocations,
      ]
    );

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>
            Campaign Wallet allocations
          </h2>

          <p className={styles.panelMeta}>
            Reserved, spent, released, and refunded funds by campaign.
            Generated {formatDate(props.generatedAt)}.
          </p>
        </div>
      </header>

      <div className={styles.allocationSummary}>
        <article>
          <span className={styles.label}>
            Active allocations
          </span>
          <strong>
            {activeCount}
          </strong>
        </article>

        <article>
          <span className={styles.label}>
            Reserved in campaigns
          </span>
          <strong>
            {formatMoney({
              minorUnits:
                totalReserved.toString(),

              currency:
                "INR",
            })}
          </strong>
        </article>

        <article>
          <span className={styles.label}>
            Campaign spend
          </span>
          <strong>
            {formatMoney({
              minorUnits:
                totalSpent.toString(),

              currency:
                "INR",
            })}
          </strong>
        </article>

        <article>
          <span className={styles.label}>
            Risk review
          </span>
          <strong>
            {riskCount}
          </strong>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {FILTERS.map(
            item => (
              <button
                key={item.value}
                type="button"
                className={
                  filter === item.value
                    ? styles.filterButtonActive
                    : styles.filterButton
                }
                onClick={() => {
                  setFilter(
                    item.value
                  );
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>

        <label className={styles.searchBox}>
          <span>
            Search allocation
          </span>

          <input
            type="search"
            value={search}
            onChange={event => {
              setSearch(
                event.target.value
              );
            }}
            placeholder="Campaign, organization, wallet, status"
          />
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Organization</th>
              <th scope="col">Status</th>
              <th scope="col">Allocated</th>
              <th scope="col">Reserved</th>
              <th scope="col">Spent</th>
              <th scope="col">Progress</th>
              <th scope="col">Risk</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>

          <tbody>
            {filteredAllocations.map(
              allocation => {
                const progress =
                  getProgressPercent(
                    allocation
                  );

                const riskLabel =
                  getRiskLabel(
                    allocation
                  );

                const risky =
                  riskLabel !== "Healthy";

                return (
                  <tr key={allocation.id}>
                    <td>
                      <strong className={styles.recordTitle}>
                        {allocation.campaignId}
                      </strong>

                      <span className={styles.muted}>
                        Allocation {allocation.id}
                      </span>
                    </td>

                    <td>
                      {allocation.organizationName}
                      <span className={styles.muted}>
                        {allocation.organizationId}
                      </span>
                    </td>

                    <td>
                      <span className={statusClassName(allocation.status)}>
                        {formatStatus(allocation.status)}
                      </span>
                    </td>

                    <td>{formatMoney(allocation.allocated)}</td>
                    <td>{formatMoney(allocation.reserved)}</td>
                    <td>{formatMoney(allocation.spent)}</td>

                    <td>
                      <span className={styles.progressText}>
                        {progress.toFixed(1)}%
                      </span>

                      <span className={styles.progressTrack}>
                        <span
                          className={styles.progressFill}
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          risky
                            ? styles.badgeWarn
                            : styles.badgeGood
                        }
                      >
                        {riskLabel}
                      </span>

                      <span className={styles.muted}>
                        Released {formatMoney(allocation.released)} · Refunded {formatMoney(allocation.refunded)}
                      </span>
                    </td>

                    <td>{formatDate(allocation.updatedAt)}</td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {filteredAllocations.length === 0 ? (
        <footer className={styles.footer}>
          No campaign Wallet allocations match this view.
        </footer>
      ) : null}
    </section>
  );
}