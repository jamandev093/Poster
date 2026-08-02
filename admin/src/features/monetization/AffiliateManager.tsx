"use client";

import Link from "next/link";

import AffiliateMetadataAction from "./affiliate/AffiliateMetadataAction";

import {
  useMemo,
  useState,
} from "react";

import type {
  AffiliateCampaign,
  AffiliateCampaignStatus,
  AffiliateDetailResponse,
} from "./affiliate";

import {
  countAffiliateStatuses,
  filterAffiliateCampaigns,
  formatAffiliateDate,
  formatAffiliatePlacement,
  formatAffiliateStatus,
  formatAffiliateTimestamp,
  getAffiliateErrorMessage,
  useAffiliateCampaigns,
  useAffiliateDetail,
} from "./affiliate";

import styles from "./AffiliateManager.module.css";

type StatusFilter =
  | "all"
  | AffiliateCampaignStatus;

const STATUS_FILTERS: {
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

function statusClassName(
  status:
    AffiliateCampaignStatus
): string {
  switch (
    status
  ) {
    case "active":
      return `${styles.status} ${styles.statusActive}`;

    case "paused":
      return `${styles.status} ${styles.statusPaused}`;

    case "scheduled":
      return `${styles.status} ${styles.statusScheduled}`;

    case "draft":
      return `${styles.status} ${styles.statusDraft}`;

    case "disabled":
      return `${styles.status} ${styles.statusDisabled}`;

    case "ended":
      return `${styles.status} ${styles.statusEnded}`;
  }
}

function formatPlacements(
  campaign:
    AffiliateCampaign
): string {
  return campaign
    .placements
    .map(
      formatAffiliatePlacement
    )
    .join(
      ", "
    );
}

function formatSchedule(
  campaign:
    AffiliateCampaign
): string {
  return `${formatAffiliateDate(
    campaign.scheduledStartDate
  )} - ${formatAffiliateDate(
    campaign.scheduledEndDate
  )}`;
}

function formatCommissionModel(
  value:
    string
): string {
  switch (
    value
  ) {
    case "cpa":
      return "CPA";

    case "cpc":
      return "CPC";

    case "revenue_share":
      return "Revenue share";

    case "flat_fee":
      return "Flat fee";

    case "hybrid":
      return "Hybrid";

    default:
      return value;
  }
}

function formatJson(
  value:
    Record<
      string,
      unknown
    >
): string {
  if (
    Object.keys(
      value
    ).length ===
    0
  ) {
    return "Not set";
  }

  return JSON.stringify(
    value,
    null,
    2
  );
}

function AffiliateDrawer(
  props: {
    campaign:
      AffiliateCampaign;

    detail:
      AffiliateDetailResponse | null;

    isLoading:
      boolean;

    error:
      unknown;

    onClose:
      () => void;

    onRefresh:
      () => void;

    onSaved:
      () => void;
  }
) {
  const campaign =
    props.detail?.campaign ??
    props.campaign;

  const metadata =
    props.detail?.metadata ??
    null;

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
        aria-label="Close affiliate details"
        onClick={
          props.onClose
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
              props.onClose
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
          {props.isLoading ? (
            <div
              className={
                styles.empty
              }
            >
              Loading affiliate metadata...
            </div>
          ) : props.error ? (
            <div
              className={
                styles.empty
              }
              role="alert"
            >
              {getAffiliateErrorMessage(
                props.error
              )}
            </div>
          ) : null}

          <section
            className={
              styles.detailSection
            }
          >
            <h4>
              Affiliate campaign
            </h4>

            <dl
              className={
                styles.detailList
              }
            >
              <div>
                <dt>
                  Campaign ID
                </dt>

                <dd>
                  {
                    campaign.id
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Reference
                </dt>

                <dd>
                  {
                    campaign.campaignReference
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Placement
                </dt>

                <dd>
                  {formatPlacements(
                    campaign
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Status
                </dt>

                <dd>
                  {formatAffiliateStatus(
                    campaign.status
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Schedule
                </dt>

                <dd>
                  {formatSchedule(
                    campaign
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Readiness
                </dt>

                <dd>
                  {
                    campaign.readinessStatus
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Commercial status
                </dt>

                <dd>
                  {
                    campaign.commercialStatus
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Delivery eligible
                </dt>

                <dd>
                  {campaign.deliveryEligible
                    ? "Yes"
                    : "No"}
                </dd>
              </div>

              <div>
                <dt>
                  Campaign row version
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
              Affiliate metadata
            </h4>

            {metadata ? (
              <dl
                className={
                  styles.detailList
                }
              >
                <div>
                  <dt>
                    Partner
                  </dt>

                  <dd>
                    {
                      metadata.partnerName
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Offer
                  </dt>

                  <dd>
                    {
                      metadata.offerName
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Disclosure
                  </dt>

                  <dd>
                    {
                      metadata.disclosure
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Destination
                  </dt>

                  <dd
                    className={
                      styles.breakText
                    }
                  >
                    {
                      metadata.destinationUrl
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Commission model
                  </dt>

                  <dd>
                    {formatCommissionModel(
                      metadata.commissionModel
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Tracking status
                  </dt>

                  <dd>
                    {
                      metadata.trackingStatus
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Tracking URL
                  </dt>

                  <dd
                    className={
                      styles.breakText
                    }
                  >
                    {
                      metadata.trackingUrl ??
                      "Not configured"
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Payout readiness
                  </dt>

                  <dd>
                    {
                      metadata.payoutReadinessStatus
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Metadata row version
                  </dt>

                  <dd>
                    {
                      metadata.rowVersion
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Commission terms
                  </dt>

                  <dd>
                    <pre
                      className={
                        styles.jsonBlock
                      }
                    >
                      {formatJson(
                        metadata.commissionTerms
                      )}
                    </pre>
                  </dd>
                </div>
              </dl>
            ) : (
              <p
                className={
                  styles.integrityNote
                }
              >
                No affiliate metadata is configured for this campaign yet.
                Create/edit metadata will be connected in A14E2.
              </p>
            )}
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
              Affiliate commission and conversion value are commercial analytics
              only. They must not alter Poster&apos;s organic knowledge, search,
              trending, or recommendation ranking.
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
              styles.footerNote
            }
          >
            Metadata is saved through the protected Affiliate Backend API.
            Lifecycle actions remain in the shared Campaigns workspace.
          </span>

          {props.detail ? (
            <AffiliateMetadataAction
              detail={
                props.detail
              }
              onSaved={() =>
                props.onSaved()
              }
            />
          ) : null}

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              props.onRefresh
            }
          >
            Refresh
          </button>

          <Link
            href={`/monetization/campaigns?record=${encodeURIComponent(
              campaign.id
            )}`}
            className={
              styles.secondaryButton
            }
          >
            Open in Campaigns
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default function AffiliateManager() {
  const {
    campaigns,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } =
    useAffiliateCampaigns();

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
      string | null
    >(
      null
    );

  const {
    detail,
    isLoading:
      detailLoading,
    error:
      detailError,
    refresh:
      refreshDetail,
  } =
    useAffiliateDetail(
      selectedId
    );

  const visibleCampaigns =
    useMemo(
      () =>
        filterAffiliateCampaigns(
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

  const counts =
    useMemo(
      () =>
        countAffiliateStatuses(
          campaigns
        ),
      [
        campaigns,
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
            Affiliate
          </h2>

          <p>
            Manage authoritative affiliate campaigns and metadata from the
            Backend. Demo commission, conversion, audit, and local lifecycle data
            have been removed.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          disabled={
            isRefreshing
          }
          onClick={() =>
            void refresh()
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Affiliate summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total affiliate campaigns
          </span>

          <strong>
            {
              counts.all
            }
          </strong>

          <small>
            Authoritative Backend records
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
            Currently running affiliate placements
          </small>
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
            {
              counts.scheduled
            }
          </strong>

          <small>
            Waiting for configured start date
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
              Affiliate campaigns could not be loaded.
            </strong>

            <p>
              {getAffiliateErrorMessage(
                error
              )}
            </p>
          </div>
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
            placeholder="Search campaign ID, reference, offer, placement, or status..."
            aria-label="Search affiliate campaigns"
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
            {STATUS_FILTERS.map(
              item => (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  className={
                    filter ===
                    item.key
                      ? styles.filterActive
                      : styles.filter
                  }
                  onClick={() =>
                    setFilter(
                      item.key
                    )
                  }
                >
                  {
                    item.label
                  }

                  <span>
                    {
                      counts[
                        item.key
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
        >
          <table
            className={
              styles.table
            }
          >
            <thead>
              <tr>
                <th>
                  Offer
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Schedule
                </th>

                <th>
                  Status
                </th>

                <th>
                  Readiness
                </th>

                <th>
                  Commercial status
                </th>

                <th>
                  Updated
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
                        {" · Affiliate"}
                      </span>
                    </td>

                    <td>
                      {formatPlacements(
                        campaign
                      )}
                    </td>

                    <td>
                      {formatSchedule(
                        campaign
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          statusClassName(
                            campaign.status
                          )
                        }
                      >
                        {formatAffiliateStatus(
                          campaign.status
                        )}
                      </span>
                    </td>

                    <td>
                      {
                        campaign.readinessStatus
                      }
                    </td>

                    <td>
                      {
                        campaign.commercialStatus
                      }
                    </td>

                    <td>
                      {formatAffiliateTimestamp(
                        campaign.updatedAt
                      )}
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

          {isLoading ? (
            <div
              className={
                styles.empty
              }
            >
              Loading affiliate campaigns...
            </div>
          ) : visibleCampaigns.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No authoritative affiliate campaigns found.
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
            Affiliate value never controls organic ranking.
          </strong>

          <p>
            Commission amount, conversion value, or partner payment must not
            increase a result&apos;s organic ranking. Affiliate placements
            remain separately selected and clearly disclosed.
          </p>
        </div>
      </section>

      {selectedCampaign ? (
        <AffiliateDrawer
          campaign={
            selectedCampaign
          }
          detail={
            detail
          }
          isLoading={
            detailLoading
          }
          error={
            detailError
          }
          onClose={() =>
            setSelectedId(
              null
            )
          }
          onRefresh={() =>
            void refreshDetail()
          }
          onSaved={() => {
            void refreshDetail();
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}
