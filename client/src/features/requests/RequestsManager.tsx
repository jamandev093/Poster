"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  clientRequests,
  formatClientDate,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "./request.mock";

import type {
  ClientRequestRecord,
  ClientRequestStatus,
} from "./request.types";

import styles from "./RequestsManager.module.css";

type RequestFilter =
  | "all"
  | "needs_action"
  | ClientRequestStatus;

interface FilterOption {
  key: RequestFilter;
  label: string;
}

const filters: FilterOption[] = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "needs_action",
    label: "Needs action",
  },
  {
    key: "pending_review",
    label: "Pending review",
  },
  {
    key: "approved",
    label: "Approved",
  },
  {
    key: "rejected",
    label: "Rejected",
  },
];

function matchesFilter(
  request: ClientRequestRecord,
  filter: RequestFilter
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "needs_action") {
    return request.status === "changes_requested";
  }

  return request.status === filter;
}

function getStatusClass(
  status: ClientRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "statusBadge statusScheduled";

    case "changes_requested":
      return "statusBadge statusAttention";

    case "approved":
      return "statusBadge statusActive";

    case "rejected":
      return `statusBadge ${styles.statusRejected}`;
  }
}

export default function RequestsManager() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<RequestFilter>("all");

  const visibleRequests = useMemo(
    () => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return clientRequests.filter(
        (request) => {
          if (
            !matchesFilter(
              request,
              filter
            )
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchable =
            [
              request.id,
              request.campaignName,
              getRequestTypeLabel(request.type),
              getRequestStatusLabel(request.status),
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

  const needsAction =
    clientRequests.filter(
      (request) =>
        request.status === "changes_requested"
    ).length;

  const pending =
    clientRequests.filter(
      (request) =>
        request.status === "pending_review"
    ).length;

  const approved =
    clientRequests.filter(
      (request) =>
        request.status === "approved"
    ).length;

  return (
    <>
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Total requests</span>
          <strong>{clientRequests.length}</strong>
          <small>All submitted requests</small>
        </article>

        <article className={styles.attentionCard}>
          <span>Needs action</span>
          <strong>{needsAction}</strong>
          <small>Admin requested changes</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Pending review</span>
          <strong>{pending}</strong>
          <small>Awaiting Admin review</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Approved</span>
          <strong>{approved}</strong>
          <small>Converted or ready for campaigns</small>
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
            placeholder="Search request ID or campaign..."
            aria-label="Search requests"
          />

          <div
            className={styles.filters}
            aria-label="Request status filters"
          >
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
            <span>Request</span>
            <span>Type</span>
            <span>Submitted</span>
            <span>Status</span>
          </div>

          {visibleRequests.length > 0 ? (
            visibleRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className={styles.row}
              >
                <div className={styles.requestInfo}>
                  <strong>{request.campaignName}</strong>

                  <span>{request.id}</span>
                </div>

                <span className={styles.typeLabel}>
                  {getRequestTypeLabel(request.type)}
                </span>

                <span className={styles.dateCell}>
                  {formatClientDate(request.submittedAt)}
                </span>

                <span className={getStatusClass(request.status)}>
                  {getRequestStatusLabel(request.status)}
                </span>
              </Link>
            ))
          ) : (
            <div className={styles.empty}>
              No requests match the current search and filter.
            </div>
          )}
        </div>
      </section>
    </>
  );
}