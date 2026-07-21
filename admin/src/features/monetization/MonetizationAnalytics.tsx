"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import styles from "./MonetizationAnalytics.module.css";

type RangeKey =
  | "today"
  | "7d"
  | "30d";

type Placement =
  | "Home"
  | "Search"
  | "Trending";

interface PlacementMetric {
  placement: Placement;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface CampaignMetric {
  id: string;
  name: string;

  type:
    | "Poster Promotion"
    | "Affiliate"
    | "Direct Sponsorship";

  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface AnalyticsSnapshot {
  revenue: number;
  previousRevenue: number;

  impressions: number;
  previousImpressions: number;

  clicks: number;
  previousClicks: number;

  conversions: number;
  previousConversions: number;

  activeCampaigns: number;

  placements: PlacementMetric[];
  campaigns: CampaignMetric[];
}

const ANALYTICS: Record<
  RangeKey,
  AnalyticsSnapshot
> = {
  today: {
    revenue: 18400,
    previousRevenue: 16900,

    impressions: 84200,
    previousImpressions: 78100,

    clicks: 2420,
    previousClicks: 2180,

    conversions: 118,
    previousConversions: 103,

    activeCampaigns: 2,

    placements: [
      {
        placement: "Home",
        impressions: 38200,
        clicks: 1240,
        conversions: 62,
      },
      {
        placement: "Search",
        impressions: 27600,
        clicks: 760,
        conversions: 39,
      },
      {
        placement: "Trending",
        impressions: 18400,
        clicks: 420,
        conversions: 17,
      },
    ],

    campaigns: [
      {
        id: "CMP-3001",
        name:
          "Cloud Skills Direct Sponsorship",
        type:
          "Direct Sponsorship",
        impressions: 34200,
        clicks: 812,
        conversions: 41,
        revenue: 10600,
      },
      {
        id: "CMP-3002",
        name:
          "Learning Partner Offer",
        type:
          "Affiliate",
        impressions: 28100,
        clicks: 968,
        conversions: 52,
        revenue: 7800,
      },
      {
        id: "CMP-3003",
        name:
          "Poster Premium Discovery",
        type:
          "Poster Promotion",
        impressions: 21900,
        clicks: 640,
        conversions: 25,
        revenue: 0,
      },
    ],
  },

  "7d": {
    revenue: 125000,
    previousRevenue: 114800,

    impressions: 624000,
    previousImpressions: 586000,

    clicks: 17840,
    previousClicks: 16220,

    conversions: 846,
    previousConversions: 771,

    activeCampaigns: 2,

    placements: [
      {
        placement: "Home",
        impressions: 284000,
        clicks: 8640,
        conversions: 428,
      },
      {
        placement: "Search",
        impressions: 205000,
        clicks: 5940,
        conversions: 296,
      },
      {
        placement: "Trending",
        impressions: 135000,
        clicks: 3260,
        conversions: 122,
      },
    ],

    campaigns: [
      {
        id: "CMP-3001",
        name:
          "Cloud Skills Direct Sponsorship",
        type:
          "Direct Sponsorship",
        impressions: 248000,
        clicks: 5980,
        conversions: 271,
        revenue: 71000,
      },
      {
        id: "CMP-3002",
        name:
          "Learning Partner Offer",
        type:
          "Affiliate",
        impressions: 192000,
        clicks: 6460,
        conversions: 342,
        revenue: 54000,
      },
      {
        id: "CMP-3003",
        name:
          "Poster Premium Discovery",
        type:
          "Poster Promotion",
        impressions: 184000,
        clicks: 5400,
        conversions: 233,
        revenue: 0,
      },
    ],
  },

  "30d": {
    revenue: 487000,
    previousRevenue: 441000,

    impressions: 2480000,
    previousImpressions: 2260000,

    clicks: 69400,
    previousClicks: 61800,

    conversions: 3210,
    previousConversions: 2870,

    activeCampaigns: 2,

    placements: [
      {
        placement: "Home",
        impressions: 1120000,
        clicks: 32600,
        conversions: 1540,
      },
      {
        placement: "Search",
        impressions: 824000,
        clicks: 24100,
        conversions: 1160,
      },
      {
        placement: "Trending",
        impressions: 536000,
        clicks: 12700,
        conversions: 510,
      },
    ],

    campaigns: [
      {
        id: "CMP-3001",
        name:
          "Cloud Skills Direct Sponsorship",
        type:
          "Direct Sponsorship",
        impressions: 986000,
        clicks: 23100,
        conversions: 1010,
        revenue: 278000,
      },
      {
        id: "CMP-3002",
        name:
          "Learning Partner Offer",
        type:
          "Affiliate",
        impressions: 762000,
        clicks: 25200,
        conversions: 1360,
        revenue: 209000,
      },
      {
        id: "CMP-3003",
        name:
          "Poster Premium Discovery",
        type:
          "Poster Promotion",
        impressions: 732000,
        clicks: 21100,
        conversions: 840,
        revenue: 0,
      },
    ],
  },
};

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

function formatRevenue(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function calculateCtr(
  clicks: number,
  impressions: number
): number {
  if (
    impressions ===
    0
  ) {
    return 0;
  }

  return (
    clicks /
    impressions
  ) * 100;
}

function percentChange(
  current: number,
  previous: number
): number {
  if (
    previous ===
    0
  ) {
    return 0;
  }

  return (
    (
      current -
      previous
    ) /
    previous
  ) * 100;
}

function trendLabel(
  current: number,
  previous: number
): string {
  const value =
    percentChange(
      current,
      previous
    );

  if (
    value ===
    0
  ) {
    return "No change";
  }

  const direction =
    value > 0
      ? "↑"
      : "↓";

  return `${direction} ${Math.abs(
    value
  ).toFixed(
    1
  )}% vs previous period`;
}

function rangeLabel(
  range: RangeKey
): string {
  switch (range) {
    case "today":
      return "Today";

    case "7d":
      return "7 days";

    case "30d":
      return "30 days";
  }
}

export default function MonetizationAnalytics() {
  const [
    range,
    setRange,
  ] =
    useState<RangeKey>(
      "7d"
    );

  const snapshot =
    ANALYTICS[range];

  const currentCtr =
    useMemo(
      () =>
        calculateCtr(
          snapshot.clicks,
          snapshot.impressions
        ),
      [
        snapshot.clicks,
        snapshot.impressions,
      ]
    );

  const previousCtr =
    calculateCtr(
      snapshot.previousClicks,
      snapshot.previousImpressions
    );

  const ctrDifference =
    currentCtr -
    previousCtr;

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
            Analytics
          </h2>

          <p>
            See essential campaign
            performance across Poster
            without turning Admin into
            a large business-intelligence
            dashboard.
          </p>
        </div>

        <div
          className={
            styles.rangeControls
          }
          aria-label="Analytics date range"
        >
          {(
            [
              "today",
              "7d",
              "30d",
            ] as const
          ).map(
            (
              item
            ) => (
              <button
                key={
                  item
                }
                type="button"
                className={
                  range ===
                  item
                    ? styles.rangeActive
                    : styles.rangeButton
                }
                onClick={() =>
                  setRange(
                    item
                  )
                }
              >
                {rangeLabel(
                  item
                )}
              </button>
            )
          )}
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Monetization summary"
      >
        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Revenue / earnings
          </span>

          <strong>
            {formatRevenue(
              snapshot.revenue
            )}
          </strong>

          <small
            className={
              percentChange(
                snapshot.revenue,
                snapshot.previousRevenue
              ) >=
              0
                ? styles.positive
                : styles.negative
            }
          >
            {trendLabel(
              snapshot.revenue,
              snapshot.previousRevenue
            )}
          </small>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatNumber(
              snapshot.impressions
            )}
          </strong>

          <small
            className={
              percentChange(
                snapshot.impressions,
                snapshot.previousImpressions
              ) >=
              0
                ? styles.positive
                : styles.negative
            }
          >
            {trendLabel(
              snapshot.impressions,
              snapshot.previousImpressions
            )}
          </small>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatNumber(
              snapshot.clicks
            )}
          </strong>

          <small
            className={
              percentChange(
                snapshot.clicks,
                snapshot.previousClicks
              ) >=
              0
                ? styles.positive
                : styles.negative
            }
          >
            {trendLabel(
              snapshot.clicks,
              snapshot.previousClicks
            )}
          </small>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            CTR
          </span>

          <strong>
            {currentCtr.toFixed(
              2
            )}
            %
          </strong>

          <small
            className={
              ctrDifference >=
              0
                ? styles.positive
                : styles.negative
            }
          >
            {ctrDifference >=
            0
              ? "↑"
              : "↓"}
            {" "}
            {Math.abs(
              ctrDifference
            ).toFixed(
              2
            )}
            {" pp vs previous period"}
          </small>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {formatNumber(
              snapshot.conversions
            )}
          </strong>

          <small
            className={
              percentChange(
                snapshot.conversions,
                snapshot.previousConversions
              ) >=
              0
                ? styles.positive
                : styles.negative
            }
          >
            {trendLabel(
              snapshot.conversions,
              snapshot.previousConversions
            )}
          </small>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Active campaigns
          </span>

          <strong>
            {
              snapshot.activeCampaigns
            }
          </strong>

          <small>
            Currently running
          </small>
        </article>
      </section>

      <section
        className={
          styles.panel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <h3>
              Placement performance
            </h3>

            <p>
              Compare Home,
              Search, and Trending
              for the selected
              period.
            </p>
          </div>

          <span
            className={
              styles.periodBadge
            }
          >
            {rangeLabel(
              range
            )}
          </span>
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
              </tr>
            </thead>

            <tbody>
              {snapshot.placements.map(
                (
                  placement:
                    PlacementMetric
                ) => (
                  <tr
                    key={
                      placement.placement
                    }
                  >
                    <td>
                      <strong
                        className={
                          styles.primaryText
                        }
                      >
                        {
                          placement.placement
                        }
                      </strong>
                    </td>

                    <td>
                      {formatNumber(
                        placement.impressions
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        placement.clicks
                      )}
                    </td>

                    <td>
                      {calculateCtr(
                        placement.clicks,
                        placement.impressions
                      ).toFixed(
                        2
                      )}
                      %
                    </td>

                    <td>
                      {formatNumber(
                        placement.conversions
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={
          styles.panel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <h3>
              Campaign performance
            </h3>

            <p>
              Essential performance
              across current
              commercial campaign
              types.
            </p>
          </div>

          <Link
            href="/monetization/campaigns"
            className={
              styles.headerLink
            }
          >
            Open Campaigns
          </Link>
        </div>

        <div
          className={
            styles.tableWrap
          }
        >
          <table
            className={`${styles.table} ${styles.campaignTable}`}
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
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody>
              {snapshot.campaigns.map(
                (
                  campaign:
                    CampaignMetric
                ) => (
                  <tr
                    key={
                      campaign.id
                    }
                  >
                    <td>
                      <Link
                        href={`/monetization/campaigns?record=${encodeURIComponent(
                          campaign.id
                        )}`}
                        className={
                          styles.campaignLink
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
                        </span>
                      </Link>
                    </td>

                    <td>
                      {
                        campaign.type
                      }
                    </td>

                    <td>
                      {formatNumber(
                        campaign.impressions
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        campaign.clicks
                      )}
                    </td>

                    <td>
                      {calculateCtr(
                        campaign.clicks,
                        campaign.impressions
                      ).toFixed(
                        2
                      )}
                      %
                    </td>

                    <td>
                      {formatNumber(
                        campaign.conversions
                      )}
                    </td>

                    <td>
                      {campaign.revenue >
                      0
                        ? formatRevenue(
                            campaign.revenue
                          )
                        : "Not applicable"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={
          styles.note
        }
      >
        <div>
          <strong>
            Commercial analytics stay
            separate from organic ranking.
          </strong>

          <p>
            Revenue, sponsorship value,
            affiliate commission, and
            other commercial metrics
            must never influence
            Poster&apos;s organic
            recommendation ranking.
          </p>
        </div>
      </section>
    </div>
  );
}