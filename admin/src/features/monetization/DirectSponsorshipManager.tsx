"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  DirectSponsorshipActions,
  filterDirectSponsorships,
  findDirectSponsorship,
  formatDirectSponsorshipDate,
  formatDirectSponsorshipPlacements,
  formatDirectSponsorshipStatus,
  getDirectSponsorshipCounts,
  useDirectSponsorships,
  type DirectSponsorshipStatus,
} from "./direct-sponsorship";

import styles from "./DirectSponsorshipManager.module.css";

type StatusFilter =
  | "all"
  | DirectSponsorshipStatus;

const STATUS_FILTERS:
  readonly {
    key:
      StatusFilter;

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

function statusClass(
  status:
    DirectSponsorshipStatus
): string {
  switch (
    status
  ) {
    case "active":
      return styles.statusActive;

    case "paused":
      return styles.statusPaused;

    case "scheduled":
      return styles.statusScheduled;

    case "draft":
    case "ended":
    case "disabled":
      return styles.statusEnded;
  }
}

function readinessLabel(
  status:
    string
): string {
  switch (
    status
  ) {
    case "ready":
      return "Ready";

    case "pending_setup":
      return "Pending setup";

    case "blocked":
      return "Blocked";

    default:
      return status;
  }
}

function commercialStatusLabel(
  status:
    string
): string {
  return status
    .split(
      "_"
    )
    .map(
      part =>
        part.length > 0
          ? part[0]
              .toUpperCase() +
            part.slice(
              1
            )
          : part
    )
    .join(
      " "
    );
}

function formatTimestamp(
  value:
    string
): string {
  const date =
    new Date(
      value
    );

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
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

export default function DirectSponsorshipManager() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useDirectSponsorships();

  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );

  const [
    filter,
    setFilter,
  ] =
    useState<
      StatusFilter
    >(
      "all"
    );

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const campaigns =
    useMemo(
      () =>
        data?.items ??
        [],
      [
        data?.items,
      ]
    );

  const counts =
    useMemo(
      () =>
        getDirectSponsorshipCounts(
          campaigns
        ),
      [
        campaigns,
      ]
    );

  const visibleCampaigns =
    useMemo(
      () =>
        filterDirectSponsorships(
          campaigns,
          {
            query,
            status:
              filter,
          }
        ),
      [
        campaigns,
        filter,
        query,
      ]
    );

  const selectedCampaign =
    useMemo(
      () =>
        findDirectSponsorship(
          campaigns,
          selectedId
        ),
      [
        campaigns,
        selectedId,
      ]
    );

  const deliveryEligibleCount =
    useMemo(
      () =>
        campaigns.filter(
          campaign =>
            campaign.deliveryEligible
        ).length,
      [
        campaigns,
      ]
    );

  const readyCount =
    useMemo(
      () =>
        campaigns.filter(
          campaign =>
            campaign.readinessStatus ===
            "ready"
        ).length,
      [
        campaigns,
      ]
    );

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            Monetization
          </div>

          <h2>
            Direct Sponsorship
          </h2>

          <p>
            Review and operate manually approved
            Direct Sponsorship campaigns using
            authoritative Backend campaign records.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          disabled={
            isLoading ||
            isRefreshing
          }
          onClick={
            refresh
          }
        >
          {isRefreshing
            ? "Refreshing…"
            : "Refresh"}
        </button>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Direct sponsorship summary"
        aria-busy={
          isLoading ||
          isRefreshing
        }
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Direct sponsorships
          </span>

          <strong>
            {
              campaigns.length
            }
          </strong>

          <small>
            Authoritative campaign records
          </small>
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
            {
              counts.active
            }
          </strong>

          <small>
            Campaigns currently active
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Delivery eligible
          </span>

          <strong>
            {
              deliveryEligibleCount
            }
          </strong>

          <small>
            {
              readyCount
            }
            {" ready for operation"}
          </small>
        </article>
      </section>

      {error ? (
        <section
          className={
            styles.note
          }
          role="alert"
        >
          <div>
            <strong>
              Direct sponsorship data could not be refreshed.
            </strong>

            <p>
              {
                error
              }
            </p>

            {campaigns.length >
            0 ? (
              <p>
                The last successfully loaded
                campaign snapshot remains visible.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            disabled={
              isRefreshing
            }
            onClick={
              refresh
            }
          >
            Retry
          </button>
        </section>
      ) : null}

      <section
        className={
          styles.panel
        }
      >
        <div
          className={
            styles.toolbar
          }
        >
          <input
            className={
              styles.search
            }
            value={
              query
            }
            placeholder="Search campaign reference, name, organization or placement…"
            aria-label="Search direct sponsorships"
            disabled={
              isLoading
            }
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
          />

          <div
            className={
              styles.filters
            }
            aria-label="Filter direct sponsorships by status"
          >
            {STATUS_FILTERS.map(
              option => (
                <button
                  key={
                    option.key
                  }
                  type="button"
                  className={
                    filter ===
                    option.key
                      ? styles.filterActive
                      : styles.filter
                  }
                  disabled={
                    isLoading
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

                  <span>
                    {
                      counts[
                        option.key
                      ]
                    }
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        <div
          className={
            styles.tableWrap
          }
          aria-busy={
            isLoading ||
            isRefreshing
          }
        >
          {isLoading ? (
            <div
              className={
                styles.empty
              }
              role="status"
            >
              Loading authoritative Direct Sponsorship campaigns…
            </div>
          ) : (
            <>
              <table
                className={
                  styles.table
                }
              >
                <thead>
                  <tr>
                    <th>
                      Campaign
                    </th>

                    <th>
                      Organization
                    </th>

                    <th>
                      Placement
                    </th>

                    <th>
                      Schedule
                    </th>

                    <th>
                      Readiness
                    </th>

                    <th>
                      Commercial
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCampaigns.map(
                    campaign => (
                      <tr
                        key={
                          campaign.id
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className={
                              styles.nameButton
                            }
                            onClick={() =>
                              setSelectedId(
                                campaign.id
                              )
                            }
                          >
                            {
                              campaign.name
                            }
                          </button>

                          <span
                            className={
                              styles.secondaryText
                            }
                          >
                            {
                              campaign.campaignReference
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.breakText
                            }
                          >
                            {
                              campaign.organizationId
                            }
                          </span>
                        </td>

                        <td>
                          {formatDirectSponsorshipPlacements(
                            campaign.placements
                          )}
                        </td>

                        <td>
                          <strong
                            className={
                              styles.deliveryPrimary
                            }
                          >
                            {formatDirectSponsorshipDate(
                              campaign.scheduledStartDate
                            )}
                          </strong>

                          <span
                            className={
                              styles.secondaryText
                            }
                          >
                            to{" "}
                            {formatDirectSponsorshipDate(
                              campaign.scheduledEndDate
                            )}
                          </span>
                        </td>

                        <td>
                          {readinessLabel(
                            campaign.readinessStatus
                          )}
                        </td>

                        <td>
                          {commercialStatusLabel(
                            campaign.commercialStatus
                          )}
                        </td>

                        <td>
                          <span
                            className={`${styles.status} ${statusClass(
                              campaign.status
                            )}`}
                          >
                            {formatDirectSponsorshipStatus(
                              campaign.status
                            )}
                          </span>

                          <span
                            className={
                              styles.secondaryText
                            }
                          >
                            {campaign.deliveryEligible
                              ? "Delivery eligible"
                              : "Not delivery eligible"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              styles.actionButton
                            }
                            onClick={() =>
                              setSelectedId(
                                campaign.id
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {visibleCampaigns.length ===
              0 ? (
                <div
                  className={
                    styles.empty
                  }
                >
                  {campaigns.length ===
                  0
                    ? "No authoritative Direct Sponsorship campaigns exist yet."
                    : "No Direct Sponsorship campaigns match the current search and status filter."}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section
        className={
          styles.note
        }
      >
        <div>
          <strong>
            Poster manually approves every Direct Sponsorship.
          </strong>

          <p>
            Advertisers cannot publish campaigns
            automatically. Financial values are
            intentionally excluded until the Wallet,
            billing, settlement, and ledger systems
            are implemented.
          </p>
        </div>
      </section>

      {selectedCampaign ? (
        <div
          className={
            styles.drawerLayer
          }
        >
          <button
            type="button"
            className={
              styles.backdrop
            }
            aria-label="Close sponsorship details"
            onClick={() =>
              setSelectedId(
                null
              )
            }
          />

          <aside
            className={
              styles.drawer
            }
            aria-label="Direct Sponsorship details"
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  {
                    selectedCampaign.campaignReference
                  }
                </span>

                <h3>
                  {
                    selectedCampaign.name
                  }
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={() =>
                  setSelectedId(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div
              className={
                styles.drawerBody
              }
            >
              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Campaign identity
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Campaign reference
                    </dt>

                    <dd>
                      {
                        selectedCampaign.campaignReference
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Internal campaign ID
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedCampaign.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Organization ID
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedCampaign.organizationId
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Source request
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedCampaign.sourceRequestId ??
                        "Internal campaign"
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Origin
                    </dt>

                    <dd>
                      {commercialStatusLabel(
                        selectedCampaign.origin
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Operations
                </h4>

                <div
                  className={
                    styles.metrics
                  }
                >
                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {formatDirectSponsorshipStatus(
                        selectedCampaign.status
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Readiness
                    </span>

                    <strong>
                      {readinessLabel(
                        selectedCampaign.readinessStatus
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Commercial
                    </span>

                    <strong>
                      {commercialStatusLabel(
                        selectedCampaign.commercialStatus
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivery
                    </span>

                    <strong>
                      {selectedCampaign.deliveryEligible
                        ? "Eligible"
                        : "Not eligible"}
                    </strong>
                  </div>
                </div>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Placement and schedule
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Placements
                    </dt>

                    <dd>
                      {formatDirectSponsorshipPlacements(
                        selectedCampaign.placements
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Scheduled start
                    </dt>

                    <dd>
                      {formatDirectSponsorshipDate(
                        selectedCampaign.scheduledStartDate
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Scheduled end
                    </dt>

                    <dd>
                      {formatDirectSponsorshipDate(
                        selectedCampaign.scheduledEndDate
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Record metadata
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Created
                    </dt>

                    <dd>
                      {formatTimestamp(
                        selectedCampaign.createdAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Last updated
                    </dt>

                    <dd>
                      {formatTimestamp(
                        selectedCampaign.updatedAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Created by
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedCampaign.createdByUserId
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Row version
                    </dt>

                    <dd>
                      {
                        selectedCampaign.rowVersion
                      }
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <div
              className={
                styles.drawerFooter
              }
            >
              <Link
                href={`/monetization/campaigns?record=${encodeURIComponent(
                  selectedCampaign.id
                )}`}
                className={
                  styles.secondaryButton
                }
              >
                Open in Campaigns
              </Link>

              <DirectSponsorshipActions
                campaign={
                  selectedCampaign
                }
                refresh={
                  refresh
                }
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}