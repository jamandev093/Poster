"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useAdminAnalytics,
} from "./analytics";

import type {
  AdminAnalyticsQuery,
  AnalyticsCampaignRecord,
  AnalyticsMetricTotals,
  AnalyticsPlacement,
  AnalyticsPlacementRecord,
} from "./analytics";

import styles from "./MonetizationAnalytics.module.css";

interface AnalyticsFilters {
  startDate: string;

  endDate: string;

  campaignId: string;

  organizationId: string;
}

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "en-IN"
  );

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );

const DAY_MILLISECONDS =
  24 *
  60 *
  60 *
  1000;

function formatIsoDate(
  date: Date
): string {
  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function createInitialFilters():
  AnalyticsFilters {
  const end =
    new Date();

  const start =
    new Date(
      end.getTime() -
      29 *
        DAY_MILLISECONDS
    );

  return {
    startDate:
      formatIsoDate(
        start
      ),

    endDate:
      formatIsoDate(
        end
      ),

    campaignId:
      "",

    organizationId:
      "",
  };
}

function toQuery(
  filters:
    AnalyticsFilters
): AdminAnalyticsQuery {
  return {
    startDate:
      filters.startDate,

    endDate:
      filters.endDate,

    campaignId:
      filters
        .campaignId
        .trim() ||
      null,

    organizationId:
      filters
        .organizationId
        .trim() ||
      null,
  };
}

function formatCount(
  value: string
): string {
  try {
    return NUMBER_FORMATTER.format(
      BigInt(
        value
      )
    );
  } catch {
    return value;
  }
}

function formatCtr(
  value: number
): string {
  return `${(
    value *
    100
  ).toFixed(
    2
  )}%`;
}

function formatTimestamp(
  value:
    string |
    null
): string {
  if (
    !value
  ) {
    return "No validated event watermark";
  }

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

  return DATE_FORMATTER.format(
    date
  );
}

function formatLabel(
  value: string
): string {
  return value
    .split(
      "_"
    )
    .filter(
      Boolean
    )
    .map(
      part =>
        part
          .charAt(
            0
          )
          .toUpperCase() +
        part.slice(
          1
        )
    )
    .join(
      " "
    );
}

function placementLabel(
  placement:
    AnalyticsPlacement
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

function totalInvalidEvents(
  totals:
    AnalyticsMetricTotals
): bigint {
  return (
    BigInt(
      totals.invalidImpressions
    ) +
    BigInt(
      totals.invalidClicks
    ) +
    BigInt(
      totals.invalidConversions
    )
  );
}

function totalDuplicateEvents(
  totals:
    AnalyticsMetricTotals
): bigint {
  return (
    BigInt(
      totals.duplicateImpressions
    ) +
    BigInt(
      totals.duplicateClicks
    ) +
    BigInt(
      totals.duplicateConversions
    )
  );
}

function formatBigInt(
  value: bigint
): string {
  return NUMBER_FORMATTER.format(
    value
  );
}

function finalizationLabel(
  finalizedRows: number,
  totalRows: number
): string {
  if (
    totalRows ===
    0
  ) {
    return "No metric rows";
  }

  if (
    finalizedRows ===
    totalRows
  ) {
    return "Fully finalized";
  }

  if (
    finalizedRows ===
    0
  ) {
    return "Open";
  }

  return "Partially finalized";
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;

  value: string;

  detail: string;
}) {
  return (
    <article
      className={
        styles.metricCard
      }
    >
      <span
        className={
          styles.metricLabel
        }
      >
        {label}
      </span>

      <strong
        className={
          styles.metricValue
        }
      >
        {value}
      </strong>

      <span
        className={
          styles.metricDetail
        }
      >
        {detail}
      </span>
    </article>
  );
}

function PlacementTable({
  placements,
}: {
  placements:
    AnalyticsPlacementRecord[];
}) {
  if (
    placements.length ===
    0
  ) {
    return (
      <div
        className={
          styles.emptySection
        }
      >
        No placement metrics exist for
        the selected date range.
      </div>
    );
  }

  return (
    <div
      className={
        styles.tableViewport
      }
    >
      <table
        className={
          styles.dataTable
        }
      >
        <thead>
          <tr>
            <th>
              Placement
            </th>

            <th>
              Impressions
            </th>

            <th>
              Clicks
            </th>

            <th>
              CTR
            </th>

            <th>
              Conversions
            </th>

            <th>
              Invalid
            </th>

            <th>
              Duplicate
            </th>
          </tr>
        </thead>

        <tbody>
          {placements.map(
            placement => (
              <tr
                key={
                  placement
                    .placement
                }
              >
                <td>
                  <strong>
                    {placementLabel(
                      placement
                        .placement
                    )}
                  </strong>
                </td>

                <td>
                  {formatCount(
                    placement
                      .validImpressions
                  )}
                </td>

                <td>
                  {formatCount(
                    placement
                      .validClicks
                  )}
                </td>

                <td>
                  {formatCtr(
                    placement.ctr
                  )}
                </td>

                <td>
                  {formatCount(
                    placement
                      .validConversions
                  )}
                </td>

                <td>
                  {formatBigInt(
                    totalInvalidEvents(
                      placement
                    )
                  )}
                </td>

                <td>
                  {formatBigInt(
                    totalDuplicateEvents(
                      placement
                    )
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function CampaignTable({
  campaigns,
}: {
  campaigns:
    AnalyticsCampaignRecord[];
}) {
  if (
    campaigns.length ===
    0
  ) {
    return (
      <div
        className={
          styles.emptySection
        }
      >
        No campaign metrics exist for
        the selected filters.
      </div>
    );
  }

  return (
    <div
      className={
        styles.tableViewport
      }
    >
      <table
        className={
          styles.dataTable
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
              Status
            </th>

            <th>
              Impressions
            </th>

            <th>
              Clicks
            </th>

            <th>
              CTR
            </th>

            <th>
              Conversions
            </th>

            <th>
              Finalization
            </th>
          </tr>
        </thead>

        <tbody>
          {campaigns.map(
            campaign => (
              <tr
                key={
                  campaign
                    .campaignId
                }
              >
                <td>
                  <div
                    className={
                      styles.campaignIdentity
                    }
                  >
                    <strong>
                      {
                        campaign
                          .campaignName
                      }
                    </strong>

                    <span>
                      {
                        campaign
                          .campaignReference
                      }
                    </span>
                  </div>
                </td>

                <td>
                  {formatLabel(
                    campaign
                      .campaignType
                  )}
                </td>

                <td>
                  <span
                    className={
                      styles.statusBadge
                    }
                  >
                    {formatLabel(
                      campaign
                        .campaignStatus
                    )}
                  </span>
                </td>

                <td>
                  {formatCount(
                    campaign
                      .validImpressions
                  )}
                </td>

                <td>
                  {formatCount(
                    campaign
                      .validClicks
                  )}
                </td>

                <td>
                  {formatCtr(
                    campaign.ctr
                  )}
                </td>

                <td>
                  {formatCount(
                    campaign
                      .validConversions
                  )}
                </td>

                <td>
                  <div
                    className={
                      styles.finalizationCell
                    }
                  >
                    <strong>
                      {finalizationLabel(
                        campaign
                          .finalizedMetricRows,
                        campaign
                          .totalMetricRows
                      )}
                    </strong>

                    <span>
                      {
                        campaign
                          .finalizedMetricRows
                      }
                      /
                      {
                        campaign
                          .totalMetricRows
                      }{" "}
                      rows
                    </span>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function MonetizationAnalytics() {
  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<
      AnalyticsFilters
    >(
      createInitialFilters
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<
      AnalyticsFilters
    >(
      createInitialFilters
    );

  const query =
    useMemo(
      () =>
        toQuery(
          appliedFilters
        ),
      [
        appliedFilters,
      ]
    );

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useAdminAnalytics(
      query
    );

  const hasMetrics =
    data !==
      null &&
    (
      data.totalMetricRows >
        0 ||
      data.placements.length >
        0 ||
      data.campaigns.length >
        0
    );

  const applyFilters = () => {
    setAppliedFilters({
      ...draftFilters,
    });
  };

  const resetFilters = () => {
    const initial =
      createInitialFilters();

    setDraftFilters(
      initial
    );

    setAppliedFilters(
      initial
    );
  };

  return (
    <main
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
          <span
            className={
              styles.eyebrow
            }
          >
            Monetization
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Authoritative campaign
            delivery performance from
            validated Poster events.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
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
      </header>

      <section
        className={
          styles.filterPanel
        }
        aria-label="Analytics filters"
      >
        <div
          className={
            styles.filterGrid
          }
        >
          <label
            className={
              styles.field
            }
          >
            <span>
              Start date
            </span>

            <input
              type="date"
              value={
                draftFilters
                  .startDate
              }
              max={
                draftFilters
                  .endDate
              }
              onChange={
                event =>
                  setDraftFilters(
                    current => ({
                      ...current,

                      startDate:
                        event
                          .target
                          .value,
                    })
                  )
              }
            />
          </label>

          <label
            className={
              styles.field
            }
          >
            <span>
              End date
            </span>

            <input
              type="date"
              value={
                draftFilters
                  .endDate
              }
              min={
                draftFilters
                  .startDate
              }
              onChange={
                event =>
                  setDraftFilters(
                    current => ({
                      ...current,

                      endDate:
                        event
                          .target
                          .value,
                    })
                  )
              }
            />
          </label>

          <label
            className={
              styles.field
            }
          >
            <span>
              Campaign ID
            </span>

            <input
              type="text"
              value={
                draftFilters
                  .campaignId
              }
              placeholder="Optional UUID"
              autoComplete="off"
              onChange={
                event =>
                  setDraftFilters(
                    current => ({
                      ...current,

                      campaignId:
                        event
                          .target
                          .value,
                    })
                  )
              }
            />
          </label>

          <label
            className={
              styles.field
            }
          >
            <span>
              Organization ID
            </span>

            <input
              type="text"
              value={
                draftFilters
                  .organizationId
              }
              placeholder="Optional UUID"
              autoComplete="off"
              onChange={
                event =>
                  setDraftFilters(
                    current => ({
                      ...current,

                      organizationId:
                        event
                          .target
                          .value,
                    })
                  )
              }
            />
          </label>
        </div>

        <div
          className={
            styles.filterActions
          }
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              resetFilters
            }
            disabled={
              isLoading ||
              isRefreshing
            }
          >
            Reset
          </button>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              applyFilters
            }
            disabled={
              isLoading ||
              isRefreshing ||
              !draftFilters
                .startDate ||
              !draftFilters
                .endDate
            }
          >
            Apply filters
          </button>
        </div>
      </section>

      <div
        className={
          styles.srStatus
        }
        role="status"
        aria-live="polite"
      >
        {isLoading
          ? "Loading Monetization Analytics."
          : isRefreshing
            ? "Refreshing Monetization Analytics."
            : error
              ? "Monetization Analytics failed to load."
              : "Monetization Analytics are current."}
      </div>

      {isLoading &&
      !data ? (
        <section
          className={
            styles.statePanel
          }
          aria-busy="true"
        >
          <strong>
            Loading Analytics
          </strong>

          <p>
            Retrieving validated
            campaign delivery metrics.
          </p>
        </section>
      ) : null}

      {error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <div>
            <strong>
              Analytics unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            className={
              styles.retryButton
            }
            onClick={
              refresh
            }
            disabled={
              isRefreshing
            }
          >
            Retry
          </button>
        </section>
      ) : null}

      {data ? (
        <>
          <section
            className={
              styles.snapshotBar
            }
          >
            <div>
              <span>
                Date range
              </span>

              <strong>
                {data.startDate}
                {" — "}
                {data.endDate}
              </strong>
            </div>

            <div>
              <span>
                Latest event watermark
              </span>

              <strong>
                {formatTimestamp(
                  data
                    .latestSourceEventWatermark
                )}
              </strong>
            </div>

            <div>
              <span>
                Metric state
              </span>

              <strong>
                {finalizationLabel(
                  data
                    .finalizedMetricRows,
                  data
                    .totalMetricRows
                )}
              </strong>
            </div>

            <div>
              <span>
                Finalized rows
              </span>

              <strong>
                {
                  data
                    .finalizedMetricRows
                }
                /
                {
                  data
                    .totalMetricRows
                }
              </strong>
            </div>
          </section>

          <section
            className={
              styles.metricGrid
            }
            aria-label="Analytics overview"
          >
            <MetricCard
              label="Valid impressions"
              value={
                formatCount(
                  data
                    .validImpressions
                )
              }
              detail="Validated delivery events"
            />

            <MetricCard
              label="Valid clicks"
              value={
                formatCount(
                  data
                    .validClicks
                )
              }
              detail="Validated click events"
            />

            <MetricCard
              label="CTR"
              value={
                formatCtr(
                  data.ctr
                )
              }
              detail="Valid clicks divided by valid impressions"
            />

            <MetricCard
              label="Valid conversions"
              value={
                formatCount(
                  data
                    .validConversions
                )
              }
              detail="Validated conversion events"
            />
          </section>

          <section
            className={
              styles.qualityGrid
            }
            aria-label="Traffic quality"
          >
            <article
              className={
                styles.qualityCard
              }
            >
              <span>
                Invalid events
              </span>

              <strong>
                {formatBigInt(
                  totalInvalidEvents(
                    data
                  )
                )}
              </strong>

              <p>
                Events rejected by
                trusted validation.
              </p>
            </article>

            <article
              className={
                styles.qualityCard
              }
            >
              <span>
                Duplicate events
              </span>

              <strong>
                {formatBigInt(
                  totalDuplicateEvents(
                    data
                  )
                )}
              </strong>

              <p>
                Repeated immutable
                delivery events.
              </p>
            </article>

            <article
              className={
                styles.qualityCard
              }
            >
              <span>
                Unattributed conversions
              </span>

              <strong>
                {formatCount(
                  data
                    .unattributedConversions
                )}
              </strong>

              <p>
                Valid conversions without
                an attribution record.
              </p>
            </article>
          </section>

          {!hasMetrics ? (
            <section
              className={
                styles.statePanel
              }
            >
              <strong>
                No Analytics data
              </strong>

              <p>
                No aggregated campaign
                metrics match the selected
                filters.
              </p>
            </section>
          ) : (
            <>
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <h2>
                      Placement performance
                    </h2>

                    <p>
                      Validated delivery
                      across Home, Search,
                      and Trending.
                    </p>
                  </div>
                </div>

                <PlacementTable
                  placements={
                    data.placements
                  }
                />
              </section>

              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <h2>
                      Campaign performance
                    </h2>

                    <p>
                      Campaign-level
                      validated metrics and
                      finalization state.
                    </p>
                  </div>

                  <span
                    className={
                      styles.recordCount
                    }
                  >
                    {
                      data
                        .campaigns
                        .length
                    }{" "}
                    campaign
                    {data.campaigns
                      .length ===
                    1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <CampaignTable
                  campaigns={
                    data.campaigns
                  }
                />
              </section>
            </>
          )}

          <section
            className={
              styles.scopeNote
            }
          >
            <strong>
              Delivery analytics only
            </strong>

            <p>
              Financial values remain
              unavailable while payment,
              Wallet, settlement, refund,
              and ledger integrations are
              paused.
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}