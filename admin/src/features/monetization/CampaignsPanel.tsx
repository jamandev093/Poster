"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  formatCampaignTimestamp,
  type AdminCampaign,
  type CampaignPlacement,
  type CampaignStatus,
  type CampaignType,
} from "./campaigns/campaign-api";

import {
  useCampaigns,
} from "./campaigns/use-campaigns";

import styles from "./MonetizationManager.module.css";

function campaignTypeLabel(
  type:
    CampaignType
): string {
  switch (
    type
  ) {
    case "poster_promotion":
      return "Poster Promotion";

    case "affiliate":
      return "Affiliate";

    case "direct_sponsorship":
      return "Direct Sponsorship";

    case "programmatic":
      return "Programmatic";
  }
}

function statusLabel(
  status:
    CampaignStatus
): string {
  switch (
    status
  ) {
    case "draft":
      return "Draft";

    case "scheduled":
      return "Scheduled";

    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "ended":
      return "Ended";

    case "disabled":
      return "Disabled";
  }
}

function placementLabel(
  placement:
    CampaignPlacement
): string {
  switch (
    placement
  ) {
    case "home":
      return "Home";

    case "search":
      return "Search";

    case "trending":
      return "Trending";
  }
}

function placementsLabel(
  placements:
    CampaignPlacement[]
): string {
  return placements
    .map(
      placementLabel
    )
    .join(
      ", "
    );
}

function titleCaseStatus(
  value: string
): string {
  return value
    .split(
      "_"
    )
    .map(
      part =>
        part.length > 0
          ? `${part[0]?.toUpperCase()}${part.slice(
              1
            )}`
          : part
    )
    .join(
      " "
    );
}

function formatDate(
  value: string
): string {
  const date =
    new Date(
      `${value}T00:00:00Z`
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
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

function statusClass(
  status:
    CampaignStatus
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
      return styles.statusDisabled;
  }
}

export default function CampaignsPanel() {
  return (
    <Suspense
      fallback={
        null
      }
    >
      <CampaignsContent />
    </Suspense>
  );
}

function CampaignsContent() {
  const searchParams =
    useSearchParams();

  const requestedRecordId =
    searchParams.get(
      "record"
    );

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useCampaigns();

  const campaigns =
    useMemo(
      () =>
        data?.items ??
        [],
      [
        data,
      ]
    );

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
      "all" |
      CampaignStatus
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

  useEffect(
    () => {
      if (
        !requestedRecordId ||
        selectedId
      ) {
        return;
      }

      const requestedCampaign =
        campaigns.find(
          campaign =>
            campaign.id ===
              requestedRecordId ||
            campaign.campaignReference ===
              requestedRecordId
        );

      if (
        requestedCampaign
      ) {
        const timeoutId =
          window.setTimeout(
            () => {
              setSelectedId(
                requestedCampaign.id
              );
            },
            0
          );

        return () => {
          window.clearTimeout(
            timeoutId
          );
        };
      }
    },
    [
      campaigns,
      requestedRecordId,
      selectedId,
    ]
  );

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleCampaigns =
    useMemo(
      () =>
        campaigns.filter(
          campaign => {
            if (
              filter !==
                "all" &&
              campaign.status !==
                filter
            ) {
              return false;
            }

            if (
              !normalizedQuery
            ) {
              return true;
            }

            return [
              campaign.id,
              campaign.campaignReference,
              campaign.sourceRequestId ??
                "",
              campaign.name,
              campaign.organizationId,
              campaignTypeLabel(
                campaign.campaignType
              ),
              placementsLabel(
                campaign.placements
              ),
            ].some(
              value =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedQuery
                  )
            );
          }
        ),
      [
        campaigns,
        filter,
        normalizedQuery,
      ]
    );

  const selectedCampaign =
    useMemo(
      () =>
        campaigns.find(
          campaign =>
            campaign.id ===
            selectedId
        ) ??
        null,
      [
        campaigns,
        selectedId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          campaigns.length,

        draft:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "draft"
          ).length,

        scheduled:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "scheduled"
          ).length,

        active:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "active"
          ).length,

        paused:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "paused"
          ).length,

        ended:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "ended"
          ).length,

        disabled:
          campaigns.filter(
            campaign =>
              campaign.status ===
              "disabled"
          ).length,
      }),
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
            Campaigns
          </h2>

          <p>
            Authoritative campaign
            records created from
            approved commercial
            requests. Activation and
            delivery controls remain
            unavailable until readiness
            and funding policies are
            complete.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {
              counts.active
            }
          </strong>

          <span>
            active campaigns
          </span>
        </div>
      </header>

      {error ? (
        <section
          className={
            styles.note
          }
          role="alert"
        >
          <div>
            <strong>
              Campaigns could not be
              refreshed
            </strong>

            <p>
              {error}

              {data
                ? " The last successful snapshot remains visible."
                : ""}
            </p>
          </div>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              refresh
            }
            disabled={
              isLoading ||
              isRefreshing
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
        aria-busy={
          isLoading ||
          isRefreshing
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
            placeholder="Search campaign, request, organization or placement..."
            aria-label="Search campaigns"
            onChange={event =>
              setQuery(
                event.target.value
              )
            }
          />

          <div
            className={
              styles.filters
            }
          >
            {(
              [
                [
                  "all",
                  "All",
                ],
                [
                  "draft",
                  "Draft",
                ],
                [
                  "scheduled",
                  "Scheduled",
                ],
                [
                  "active",
                  "Active",
                ],
                [
                  "paused",
                  "Paused",
                ],
                [
                  "ended",
                  "Ended",
                ],
                [
                  "disabled",
                  "Disabled",
                ],
              ] as const
            ).map(
              ([
                key,
                label,
              ]) => (
                <button
                  key={
                    key
                  }
                  type="button"
                  className={
                    filter ===
                    key
                      ? styles.filterActive
                      : styles.filter
                  }
                  onClick={() =>
                    setFilter(
                      key
                    )
                  }
                >
                  {label}

                  <span>
                    {
                      counts[
                        key
                      ]
                    }
                  </span>
                </button>
              )
            )}

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                refresh
              }
              disabled={
                isLoading ||
                isRefreshing
              }
            >
              {isRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>

        <div
          className={
            styles.tableWrap
          }
        >
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
                  Type
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
                          styles.partner
                        }
                      >
                        {
                          campaign.campaignReference
                        }
                        {" Â· "}
                        {
                          campaign.organizationId
                        }
                      </span>
                    </td>

                    <td>
                      {campaignTypeLabel(
                        campaign.campaignType
                      )}
                    </td>

                    <td>
                      {placementsLabel(
                        campaign.placements
                      )}
                    </td>

                    <td>
                      {formatDate(
                        campaign.scheduledStartDate
                      )}
                      {" â†’ "}
                      {formatDate(
                        campaign.scheduledEndDate
                      )}
                    </td>

                    <td>
                      <strong
                        className={
                          styles.performanceMain
                        }
                      >
                        {titleCaseStatus(
                          campaign.readinessStatus
                        )}
                      </strong>

                      <span
                        className={
                          styles.performanceSub
                        }
                      >
                        {titleCaseStatus(
                          campaign.commercialStatus
                        )}
                        {" Â· "}
                        {campaign.deliveryEligible
                          ? "Delivery eligible"
                          : "Delivery blocked"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${statusClass(
                          campaign.status
                        )}`}
                      >
                        {statusLabel(
                          campaign.status
                        )}
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

          {isLoading &&
          !data ? (
            <div
              className={
                styles.empty
              }
            >
              Loading authoritative
              campaigns...
            </div>
          ) : visibleCampaigns.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              No campaigns found.
            </div>
          ) : null}
        </div>
      </section>

      <section
        className={
          styles.note
        }
      >
        <div>
          <strong>
            Campaign controls remain
            protected
          </strong>

          <p>
            Scheduling, activation,
            pausing, resuming and ending
            require authoritative
            readiness, funding, delivery
            and audit policies. This
            workspace is read-only until
            those workflows are
            implemented.
          </p>
        </div>

        <span
          className={
            styles.disabledBadge
          }
        >
          Read only
        </span>
      </section>

      {selectedCampaign ? (
        <CampaignDrawer
          campaign={
            selectedCampaign
          }
          onClose={() =>
            setSelectedId(
              null
            )
          }
        />
      ) : null}
    </div>
  );
}

function CampaignDrawer({
  campaign,
  onClose,
}: {
  campaign:
    AdminCampaign;

  onClose:
    () => void;
}) {
  return (
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
        aria-label="Close campaign details"
        onClick={
          onClose
        }
      />

      <aside
        className={
          styles.drawer
        }
      >
        <div
          className={
            styles.drawerHeader
          }
        >
          <div>
            <span>
              {
                campaign.campaignReference
              }
            </span>

            <h3>
              {
                campaign.name
              }
            </h3>
          </div>

          <button
            type="button"
            className={
              styles.closeButton
            }
            aria-label="Close"
            onClick={
              onClose
            }
          >
            Ã—
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
                    campaign.campaignReference
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Internal ID
                </dt>

                <dd
                  className={
                    styles.breakText
                  }
                >
                  {
                    campaign.id
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
                    campaign.sourceRequestId ??
                    "Internal campaign"
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Organization
                </dt>

                <dd
                  className={
                    styles.breakText
                  }
                >
                  {
                    campaign.organizationId
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Type
                </dt>

                <dd>
                  {campaignTypeLabel(
                    campaign.campaignType
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Origin
                </dt>

                <dd>
                  {titleCaseStatus(
                    campaign.origin
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Status
                </dt>

                <dd>
                  {statusLabel(
                    campaign.status
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
              Delivery readiness
            </h4>

            <dl
              className={
                styles.detailList
              }
            >
              <div>
                <dt>
                  Placement
                </dt>

                <dd>
                  {placementsLabel(
                    campaign.placements
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Start
                </dt>

                <dd>
                  {formatDate(
                    campaign.scheduledStartDate
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  End
                </dt>

                <dd>
                  {formatDate(
                    campaign.scheduledEndDate
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Readiness
                </dt>

                <dd>
                  {titleCaseStatus(
                    campaign.readinessStatus
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Commercial state
                </dt>

                <dd>
                  {titleCaseStatus(
                    campaign.commercialStatus
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Delivery eligibility
                </dt>

                <dd>
                  {campaign.deliveryEligible
                    ? "Eligible"
                    : "Blocked"}
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
                  {formatCampaignTimestamp(
                    campaign.createdAt
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Updated
                </dt>

                <dd>
                  {formatCampaignTimestamp(
                    campaign.updatedAt
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
                    campaign.createdByUserId
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Row version
                </dt>

                <dd>
                  {
                    campaign.rowVersion
                  }
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
              Commercial integrity
            </h4>

            <p
              className={
                styles.integrityNote
              }
            >
              Commercial status must not
              influence Poster&apos;s
              organic discovery ranking.
              Delivery remains blocked
              until campaign readiness and
              commercial requirements are
              authoritative and complete.
            </p>
          </section>
        </div>

        <div
          className={
            styles.drawerFooter
          }
        >
          <span
            className={
              styles.programmaticNote
            }
          >
            Campaign actions are not
            available in this read-only
            phase.
          </span>
        </div>
      </aside>
    </div>
  );
}