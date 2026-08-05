"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  formatClientDate,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import {
  useClientWalletOverview,
} from "@/features/workspace/hooks/useClientWalletOverview";

import type {
  ClientWalletApiCampaignAllocation,
  ClientWalletApiMoney,
} from "@/features/workspace/services/client-wallet-read.service";

import {
  useClientCommercialRequests,
} from "./useClientCommercialRequests";

import type {
  ClientCommercialRequestApiRecord,
  ClientCommercialRequestStatus,
} from "./client-commercial-request.service";

import styles from "./RequestsManager.module.css";

type RequestFilter =
  | "all"
  | ClientCommercialRequestStatus;

const FILTERS: {
  key:
    RequestFilter;

  label:
    string;
}[] = [
  {
    key:
      "all",

    label:
      "All",
  },
  {
    key:
      "pending_review",

    label:
      "Pending review",
  },
  {
    key:
      "changes_requested",

    label:
      "Changes requested",
  },
  {
    key:
      "approved",

    label:
      "Approved",
  },
  {
    key:
      "rejected",

    label:
      "Rejected",
  },
];

function getRequestType(
  request:
    ClientCommercialRequestApiRecord
) {
  return (
    request.requestType ??
    request.type ??
    "direct_sponsorship"
  );
}

function getRequestCampaignName(
  request:
    ClientCommercialRequestApiRecord
): string {
  return (
    request.campaignName ??
    request.title ??
    "Untitled request"
  );
}

function matchesFilter(
  request:
    ClientCommercialRequestApiRecord,

  filter:
    RequestFilter
): boolean {
  return (
    filter === "all" ||
    request.status === filter
  );
}

function matchesSearch(
  request:
    ClientCommercialRequestApiRecord,

  normalizedSearch:
    string
): boolean {
  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    request.id,
    request.requestReference,
    request.linkedCampaignId,
    request.title,
    request.campaignName,
    request.objective,
    request.destinationUrl,
    getRequestStatusLabel(
      request.status
    ),
    getRequestTypeLabel(
      getRequestType(
        request
      )
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedSearch
  );
}

function getStatusClassName(
  status:
    ClientCommercialRequestStatus
): string {
  switch (status) {
    case "approved":
      return `statusBadge ${styles.statusApproved}`;

    case "changes_requested":
      return `statusBadge ${styles.statusChanges}`;

    case "rejected":
      return `statusBadge ${styles.statusRejected}`;

    case "pending_review":
    default:
      return `statusBadge ${styles.statusPending}`;
  }
}

function requestMinorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatRequestWalletMoney(
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
    requestMinorToMajor(
      money.minorUnits
    )
  );
}

function getRequestWalletSummary(
  request:
    ClientCommercialRequestApiRecord,

  allocationByCampaignId:
    Map<
      string,
      ClientWalletApiCampaignAllocation
    >,

  isWalletLoading:
    boolean,

  walletErrorMessage:
    string |
    null
): string {
  const linkedCampaignId =
    request.linkedCampaignId;

  if (!linkedCampaignId) {
    return "Wallet: pending campaign setup";
  }

  const allocation =
    allocationByCampaignId.get(
      linkedCampaignId
    );

  if (allocation) {
    return [
      "Wallet:",
      `${formatRequestWalletMoney(allocation.allocated)} allocated`,
      `${formatRequestWalletMoney(allocation.spent)} spent`,
      `${formatRequestWalletMoney(allocation.reserved)} reserved`,
    ].join(" ");
  }

  if (isWalletLoading) {
    return "Wallet funding loading...";
  }

  if (walletErrorMessage) {
    return "Wallet funding unavailable";
  }

  return "No Wallet allocation";
}

export default function RequestsManager() {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<RequestFilter>(
      "all"
    );

  const {
    requests,
    isLoading:
      isRequestsLoading,
    isRefreshing:
      isRequestsRefreshing,
    errorMessage:
      requestsErrorMessage,
    refresh:
      refreshRequests,
  } =
    useClientCommercialRequests(
      100
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

  const visibleRequests =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return requests.filter(
          request =>
            matchesFilter(
              request,
              filter
            ) &&
            matchesSearch(
              request,
              normalizedSearch
            )
        );
      },
      [
        requests,
        search,
        filter,
      ]
    );

  const pending =
    requests.filter(
      request =>
        request.status ===
        "pending_review"
    ).length;

  const changesRequested =
    requests.filter(
      request =>
        request.status ===
        "changes_requested"
    ).length;

  const approved =
    requests.filter(
      request =>
        request.status ===
        "approved"
    ).length;

  return (
    <section
      className={
        styles.shell
      }
      aria-labelledby="requests-manager-title"
      aria-busy={
        isRequestsLoading
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
            Backend requests
          </p>

          <h2
            id="requests-manager-title"
            className={
              styles.title
            }
          >
            Submitted requests
          </h2>

          <p
            className={
              styles.description
            }
          >
            Request list is loaded from Poster Backend. Wallet allocation
            visibility remains tied to Backend Wallet data.
          </p>
        </div>

        <button
          type="button"
          className="secondaryButton"
          onClick={
            () => {
              void refreshRequests();
            }
          }
          disabled={
            isRequestsRefreshing
          }
        >
          {isRequestsRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      <div
        className={
          styles.summaryGrid
        }
        aria-label="Request summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total requests
          </span>

          <strong>
            {requests.length}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Pending review
          </span>

          <strong>
            {pending}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Changes requested
          </span>

          <strong>
            {changesRequested}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Approved
          </span>

          <strong>
            {approved}
          </strong>
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
            Search requests
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
            placeholder="Search request, campaign, or ID"
            aria-label="Search requests"
          />
        </label>

        <div
          className={
            styles.filters
          }
          aria-label="Filter requests"
        >
          {FILTERS.map(
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

      {requestsErrorMessage ? (
        <div
          className={
            styles.empty
          }
          role="alert"
        >
          {requestsErrorMessage}
        </div>
      ) : null}

      {isRequestsLoading ? (
        <div
          className={
            styles.empty
          }
          role="status"
        >
          Loading requests from Poster Backend.
        </div>
      ) : visibleRequests.length > 0 ? (
        <div
          className={
            styles.list
          }
        >
          {visibleRequests.map(
            request => (
              <article
                key={
                  request.id
                }
                className={
                  styles.requestCard
                }
              >
                <div
                  className={
                    styles.requestInfo
                  }
                >
                  <strong>
                    {getRequestCampaignName(
                      request
                    )}
                  </strong>

                  <span>
                    {request.requestReference ??
                      request.id}
                    {" · "}
                    {getRequestTypeLabel(
                      getRequestType(
                        request
                      )
                    )}
                    {request.linkedCampaignId
                      ? ` · ${request.linkedCampaignId}`
                      : ""}
                  </span>

                  <span
                    className={
                      styles.walletLine
                    }
                  >
                    {getRequestWalletSummary(
                      request,
                      allocationByCampaignId,
                      isWalletLoading,
                      walletErrorMessage
                    )}
                  </span>
                </div>

                <div
                  className={
                    styles.requestMeta
                  }
                >
                  <span
                    className={
                      getStatusClassName(
                        request.status
                      )
                    }
                  >
                    {getRequestStatusLabel(
                      request.status
                    )}
                  </span>

                  <span>
                    Submitted{" "}
                    {formatClientDate(
                      request.submittedAt
                    )}
                  </span>
                </div>

                <Link
                  href={`/requests/${request.id}`}
                  className="secondaryButton"
                >
                  View request
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
          No requests match your search or filter.
        </div>
      )}
    </section>
  );
}