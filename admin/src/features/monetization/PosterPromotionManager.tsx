"use client";

import Link from "next/link";

import PosterPromotionCreateAction from "./poster-promotion/PosterPromotionCreateAction";
import PosterPromotionEditAction from "./poster-promotion/PosterPromotionEditAction";

import {
  useMemo,
  useState,
} from "react";

import type {
  PosterPromotionApiStatus,
  PosterPromotionCampaign,
  PosterPromotionDetailResponse,
} from "./poster-promotion";

import {
  countPosterPromotionStatuses,
  filterPosterPromotionCampaigns,
  formatPosterPromotionDate,
  formatPosterPromotionStatus,
  formatPosterPromotionTimestamp,
  getPosterPromotionErrorMessage,

  mapPosterPromotionPlacementToUi,
  usePosterPromotionDetail,
  usePosterPromotions,
} from "./poster-promotion";

import styles from "./PosterPromotionManager.module.css";

type StatusFilter =
  | "all"
  | PosterPromotionApiStatus;

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

const POSTER_ORGANIZATION_ID =
  process.env.NEXT_PUBLIC_POSTER_ORGANIZATION_ID ??
  "";

function statusClassName(
  status:
    PosterPromotionApiStatus
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
    PosterPromotionCampaign
): string {
  return campaign
    .placements
    .map(
      mapPosterPromotionPlacementToUi
    )
    .join(
      ", "
    );
}

function formatSchedule(
  campaign:
    PosterPromotionCampaign
): string {
  return `${formatPosterPromotionDate(
    campaign.scheduledStartDate
  )} - ${formatPosterPromotionDate(
    campaign.scheduledEndDate
  )}`;
}

function renderDetailValue(
  value:
    string | null | undefined
): string {
  return value && value.trim()
    ? value
    : "Not set";
}

function PosterPromotionDrawer(
  props: {
    selectedId:
      string;

    selectedCampaign:
      PosterPromotionCampaign | null;

    detail:
      PosterPromotionDetailResponse | null;

    isLoading:
      boolean;

    error:
      unknown;

    onClose:
      () => void;

    onRefresh:
      () => void;

    onUpdated:
      () => void;
  }
) {
  const title =
    props.detail?.campaign.name ??
    props.selectedCampaign?.name ??
    props.selectedId;

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
        aria-label="Close Poster promotion details"
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
                props.detail?.campaign.campaignReference ??
                props.selectedCampaign?.campaignReference ??
                props.selectedId
              }
            </span>

            <h3>
              {
                title
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
              Loading Poster Promotion details...
            </div>
          ) : props.error ? (
            <div
              className={
                styles.empty
              }
              role="alert"
            >
              {getPosterPromotionErrorMessage(
                props.error
              )}
            </div>
          ) : props.detail ? (
            <>
              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Promotion
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
                        props.detail.campaign.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Campaign reference
                    </dt>

                    <dd>
                      {
                        props.detail.campaign.campaignReference
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Disclosure
                    </dt>

                    <dd>
                      {
                        props.detail.creative.disclosure
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Purpose
                    </dt>

                    <dd>
                      {
                        props.detail.creative.purpose
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {formatPlacements(
                        props.detail.campaign
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {formatPosterPromotionStatus(
                        props.detail.campaign.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Schedule
                    </dt>

                    <dd>
                      {formatSchedule(
                        props.detail.campaign
                      )}
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
                        props.detail.creative.destinationUrl
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
                  Creative
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Headline
                    </dt>

                    <dd>
                      {
                        props.detail.creative.headline
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Body
                    </dt>

                    <dd>
                      {
                        props.detail.creative.body
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Call to action
                    </dt>

                    <dd>
                      {
                        props.detail.creative.callToAction
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Media
                    </dt>

                    <dd>
                      {props.detail.creative.media
                        ? `${props.detail.creative.media.fileName} · ${props.detail.creative.media.type}`
                        : "No persisted media"}
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
                  Backend state
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Campaign row version
                    </dt>

                    <dd>
                      {
                        props.detail.campaign.rowVersion
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Creative row version
                    </dt>

                    <dd>
                      {
                        props.detail.creative.rowVersion
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Readiness
                    </dt>

                    <dd>
                      {
                        props.detail.campaign.readinessStatus
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Commercial status
                    </dt>

                    <dd>
                      {
                        props.detail.campaign.commercialStatus
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Delivery eligible
                    </dt>

                    <dd>
                      {props.detail.campaign.deliveryEligible
                        ? "Yes"
                        : "No"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Updated
                    </dt>

                    <dd>
                      {formatPosterPromotionTimestamp(
                        props.detail.campaign.updatedAt
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
                  Discovery integrity
                </h4>

                <p
                  className={
                    styles.integrityNote
                  }
                >
                  Poster-controlled promotion remains a separate disclosed
                  placement. It must not silently replace or manipulate organic
                  knowledge, search, trending, or recommendation rankings.
                </p>
              </section>
            </>
          ) : (
            <div
              className={
                styles.empty
              }
            >
              Poster Promotion details were not found.
            </div>
          )}
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
            Create and edit actions connect in A13D3 after persisted media
            handling is blocked safely.
          </span>

          {props.detail ? (
            <PosterPromotionEditAction
              detail={
                props.detail
              }
              disabled={
                props.detail.campaign.status ===
                  "ended" ||
                props.detail.campaign.status ===
                  "disabled"
              }
              onUpdated={() => {
                props.onUpdated();
              }}
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
              props.selectedId
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

export default function PosterPromotionManager() {
  const {
    campaigns,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } =
    usePosterPromotions();

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
    usePosterPromotionDetail(
      selectedId
    );

  const visibleCampaigns =
    useMemo(
      () =>
        filterPosterPromotionCampaigns(
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
        countPosterPromotionStatuses(
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
            Poster Promotion
          </h2>

          <p>
            Manage authoritative Poster-owned campaigns from the Backend. Financial
            records, local audit history, and fake performance metrics have
            been removed.
          </p>
        </div>

          <div
            className={
              styles.headerActions
            }
          >
            <PosterPromotionCreateAction
              organizationId={
                POSTER_ORGANIZATION_ID
              }
              onCreated={record => {
                setSelectedId(
                  record.campaign.id
                );

                void refresh();
              }}
            />

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
          </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Poster promotion summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total promotions
          </span>

          <strong>
            {
              counts.all
            }
          </strong>

          <small>
            Authoritative Backend campaigns
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
            Running Poster-controlled placements
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Drafts
          </span>

          <strong>
            {
              counts.draft
            }
          </strong>

          <small>
            Saved before scheduling
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
              Poster Promotions could not be loaded.
            </strong>

            <p>
              {getPosterPromotionErrorMessage(
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
            placeholder="Search campaign ID, reference, promotion, or placement..."
            aria-label="Search Poster promotions"
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
                  Promotion
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
                        {" · Promoted by Poster"}
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
                        {formatPosterPromotionStatus(
                          campaign.status
                        )}
                      </span>
                    </td>

                    <td>
                      {renderDetailValue(
                        campaign.readinessStatus
                      )}
                    </td>

                    <td>
                      {formatPosterPromotionTimestamp(
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
              Loading Poster Promotions...
            </div>
          ) : visibleCampaigns.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No authoritative Poster Promotions found.
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
            Poster Promotion is always clearly disclosed.
          </strong>

          <p>
            These campaigns use the disclosure “Promoted by Poster”. They remain
            separate from organic ranking and should not be disguised as
            ordinary recommendations.
          </p>
        </div>
      </section>

      {selectedId ? (
        <PosterPromotionDrawer
          selectedId={
            selectedId
          }
          selectedCampaign={
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
          onUpdated={() => {
            void refreshDetail();
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}
