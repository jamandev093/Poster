"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import styles from "./AffiliateManager.module.css";

type AffiliateStatus =
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

type Placement =
  | "Home"
  | "Search"
  | "Trending";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface AffiliateRecord {
  id: string;

  name: string;
  partner: string;

  destinationUrl: string;

  placement: Placement;

  status: AffiliateStatus;

  startAt: string;
  endAt?: string;

  impressions: number;
  clicks: number;
  conversions: number;

  commissionEarned: number;

  audit: AuditEntry[];
}

const INITIAL_AFFILIATES: AffiliateRecord[] = [
  {
    id: "CMP-3002",

    name:
      "Learning Partner Offer",

    partner:
      "Example Learning",

    destinationUrl:
      "https://example.com/learning-offer",

    placement:
      "Search",

    status:
      "active",

    startAt:
      "16 Jul 2026",

    endAt:
      "31 Jul 2026",

    impressions:
      82000,

    clicks:
      3400,

    conversions:
      164,

    commissionEarned:
      82000,

    audit: [
      {
        id:
          "affiliate-3002-2",

        action:
          "Affiliate conversion tracking active",

        actor:
          "System",

        timestamp:
          "20 Jul 2026 · 09:10",
      },

      {
        id:
          "affiliate-3002-1",

        action:
          "Affiliate campaign activated",

        actor:
          "Admin",

        timestamp:
          "16 Jul 2026 · 10:30",
      },
    ],
  },

  {
    id: "CMP-3020",

    name:
      "Professional Certification Offer",

    partner:
      "Example Academy",

    destinationUrl:
      "https://example.org/certification",

    placement:
      "Home",

    status:
      "paused",

    startAt:
      "12 Jul 2026",

    endAt:
      "05 Aug 2026",

    impressions:
      46800,

    clicks:
      1860,

    conversions:
      92,

    commissionEarned:
      41400,

    audit: [
      {
        id:
          "affiliate-3020-2",

        action:
          "Affiliate campaign paused for offer review",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 15:20",
      },

      {
        id:
          "affiliate-3020-1",

        action:
          "Affiliate campaign activated",

        actor:
          "Admin",

        timestamp:
          "12 Jul 2026 · 11:00",
      },
    ],
  },

  {
    id: "CMP-3021",

    name:
      "Career Skills Course",

    partner:
      "Example Skills",

    destinationUrl:
      "https://example.net/career-skills",

    placement:
      "Trending",

    status:
      "scheduled",

    startAt:
      "26 Jul 2026",

    endAt:
      "15 Aug 2026",

    impressions:
      0,

    clicks:
      0,

    conversions:
      0,

    commissionEarned:
      0,

    audit: [
      {
        id:
          "affiliate-3021-1",

        action:
          "Affiliate campaign scheduled",

        actor:
          "Admin",

        timestamp:
          "20 Jul 2026 · 11:45",
      },
    ],
  },
];

function statusLabel(
  status: AffiliateStatus
): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";

    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "ended":
      return "Ended";
  }
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

function formatMoney(
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
): string {
  if (
    impressions ===
    0
  ) {
    return "0.00%";
  }

  return `${(
    (
      clicks /
      impressions
    ) *
    100
  ).toFixed(2)}%`;
}

function conversionRate(
  conversions: number,
  clicks: number
): string {
  if (
    clicks ===
    0
  ) {
    return "0.00%";
  }

  return `${(
    (
      conversions /
      clicks
    ) *
    100
  ).toFixed(2)}%`;
}

function revenuePerClick(
  commission: number,
  clicks: number
): string {
  if (
    clicks ===
    0
  ) {
    return formatMoney(0);
  }

  return formatMoney(
    commission /
      clicks
  );
}

function nowLabel(): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    new Date()
  );
}

export default function AffiliateManager() {
  const [
    affiliates,
    setAffiliates,
  ] = useState<
    AffiliateRecord[]
  >(
    INITIAL_AFFILIATES
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    "all" |
      AffiliateStatus
  >(
    "all"
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    endTargetId,
    setEndTargetId,
  ] = useState<
    string | null
  >(
    null
  );

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleAffiliates =
    useMemo(() => {
      return affiliates.filter(
        (
          affiliate
        ) => {
          if (
            filter !==
              "all" &&
            affiliate.status !==
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
            affiliate.id,
            affiliate.name,
            affiliate.partner,
            affiliate.placement,
          ].some(
            (
              value
            ) =>
              value
                .toLowerCase()
                .includes(
                  normalizedQuery
                )
          );
        }
      );
    }, [
      affiliates,
      filter,
      normalizedQuery,
    ]);

  const selectedAffiliate =
    useMemo(
      () =>
        affiliates.find(
          (
            affiliate
          ) =>
            affiliate.id ===
            selectedId
        ) ?? null,

      [
        affiliates,
        selectedId,
      ]
    );

  const endTarget =
    useMemo(
      () =>
        affiliates.find(
          (
            affiliate
          ) =>
            affiliate.id ===
            endTargetId
        ) ?? null,

      [
        affiliates,
        endTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          affiliates.length,

        scheduled:
          affiliates.filter(
            (
              affiliate
            ) =>
              affiliate.status ===
              "scheduled"
          ).length,

        active:
          affiliates.filter(
            (
              affiliate
            ) =>
              affiliate.status ===
              "active"
          ).length,

        paused:
          affiliates.filter(
            (
              affiliate
            ) =>
              affiliate.status ===
              "paused"
          ).length,

        ended:
          affiliates.filter(
            (
              affiliate
            ) =>
              affiliate.status ===
              "ended"
          ).length,
      }),

      [
        affiliates,
      ]
    );

  const totalCommission =
    useMemo(
      () =>
        affiliates.reduce(
          (
            total,
            affiliate
          ) =>
            total +
            affiliate.commissionEarned,
          0
        ),

      [
        affiliates,
      ]
    );

  const totalConversions =
    useMemo(
      () =>
        affiliates.reduce(
          (
            total,
            affiliate
          ) =>
            total +
            affiliate.conversions,
          0
        ),

      [
        affiliates,
      ]
    );

  const updateStatus = (
    id: string,

    status:
      AffiliateStatus,

    action: string
  ) => {
    setAffiliates(
      (
        current
      ) =>
        current.map(
          (
            affiliate
          ) =>
            affiliate.id ===
            id
              ? {
                  ...affiliate,

                  status,

                  audit: [
                    {
                      id:
                        `${affiliate.id}-${Date.now()}`,

                      action,

                      actor:
                        "Admin",

                      timestamp:
                        nowLabel(),
                    },

                    ...affiliate.audit,
                  ],
                }
              : affiliate
        )
    );
  };

  const pauseCampaign = (
    affiliate:
      AffiliateRecord
  ) => {
    if (
      affiliate.status !==
      "active"
    ) {
      return;
    }

    updateStatus(
      affiliate.id,
      "paused",
      "Affiliate campaign paused"
    );
  };

  const resumeCampaign = (
    affiliate:
      AffiliateRecord
  ) => {
    if (
      affiliate.status !==
      "paused"
    ) {
      return;
    }

    updateStatus(
      affiliate.id,
      "active",
      "Affiliate campaign resumed"
    );
  };

  const requestEnd = (
    affiliate:
      AffiliateRecord
  ) => {
    if (
      affiliate.status !==
        "active" &&
      affiliate.status !==
        "paused"
    ) {
      return;
    }

    setEndTargetId(
      affiliate.id
    );
  };

  const confirmEnd =
    () => {
      if (
        !endTarget
      ) {
        return;
      }

      updateStatus(
        endTarget.id,
        "ended",
        "Affiliate campaign ended"
      );

      setEndTargetId(
        null
      );
    };

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
            Manage approved affiliate
            partnerships and understand
            clicks, conversions, and
            commission performance while
            keeping commercial incentives
            separate from organic ranking.
          </p>
        </div>
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
            Active campaigns
          </span>

          <strong>
            {
              counts.active
            }
          </strong>

          <small>
            Approved offers currently running
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {formatNumber(
              totalConversions
            )}
          </strong>

          <small>
            Demonstration conversion data
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Commission earned
          </span>

          <strong>
            {formatMoney(
              totalCommission
            )}
          </strong>

          <small>
            Demonstration affiliate revenue
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
            placeholder="Search campaign ID, partner or offer..."
            aria-label="Search affiliate campaigns"
            onChange={(
              event
            ) =>
              setQuery(
                event.target
                  .value
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
                  {
                    label
                  }

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
                  Partner
                </th>

                <th>
                  Placement
                </th>

                <th>
                  CTR
                </th>

                <th>
                  Conversions
                </th>

                <th>
                  Conversion rate
                </th>

                <th>
                  Commission
                </th>

                <th>
                  Revenue / click
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
              {visibleAffiliates.map(
                (
                  affiliate
                ) => (
                  <tr
                    key={
                      affiliate.id
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
                            affiliate.id
                          )
                        }
                      >
                        {
                          affiliate.name
                        }
                      </button>

                      <span
                        className={
                          styles.secondaryText
                        }
                      >
                        {
                          affiliate.id
                        }
                      </span>
                    </td>

                    <td>
                      {
                        affiliate.partner
                      }
                    </td>

                    <td>
                      {
                        affiliate.placement
                      }
                    </td>

                    <td>
                      {calculateCtr(
                        affiliate.clicks,
                        affiliate.impressions
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        affiliate.conversions
                      )}
                    </td>

                    <td>
                      {conversionRate(
                        affiliate.conversions,
                        affiliate.clicks
                      )}
                    </td>

                    <td>
                      {formatMoney(
                        affiliate.commissionEarned
                      )}
                    </td>

                    <td>
                      {revenuePerClick(
                        affiliate.commissionEarned,
                        affiliate.clicks
                      )}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          affiliate.status ===
                          "active"
                            ? styles.statusActive
                            : affiliate.status ===
                              "paused"
                            ? styles.statusPaused
                            : affiliate.status ===
                              "scheduled"
                            ? styles.statusScheduled
                            : styles.statusEnded
                        }`}
                      >
                        {statusLabel(
                          affiliate.status
                        )}
                      </span>
                    </td>

                    <td>
                      {affiliate.status ===
                      "active" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            pauseCampaign(
                              affiliate
                            )
                          }
                        >
                          Pause
                        </button>
                      ) : affiliate.status ===
                        "paused" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            resumeCampaign(
                              affiliate
                            )
                          }
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            setSelectedId(
                              affiliate.id
                            )
                          }
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {visibleAffiliates.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No affiliate campaigns found.
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
            Commission amount, conversion value, or partner
            payment must not increase a result&apos;s organic
            ranking. Affiliate placements remain separately
            selected and clearly disclosed.
          </p>
        </div>
      </section>

      {selectedAffiliate ? (
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
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  {
                    selectedAffiliate.id
                  }
                </span>

                <h3>
                  {
                    selectedAffiliate.name
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
                  Affiliate offer
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
                        selectedAffiliate.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Partner
                    </dt>

                    <dd>
                      {
                        selectedAffiliate.partner
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Disclosure
                    </dt>

                    <dd>
                      Affiliate · Poster may earn a commission
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {
                        selectedAffiliate.placement
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {statusLabel(
                        selectedAffiliate.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Start
                    </dt>

                    <dd>
                      {
                        selectedAffiliate.startAt
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      End
                    </dt>

                    <dd>
                      {
                        selectedAffiliate.endAt ??
                        "No fixed end"
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
                        selectedAffiliate.destinationUrl
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
                  Performance
                </h4>

                <div
                  className={
                    styles.metrics
                  }
                >
                  <div>
                    <span>
                      Impressions
                    </span>

                    <strong>
                      {formatNumber(
                        selectedAffiliate.impressions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Clicks
                    </span>

                    <strong>
                      {formatNumber(
                        selectedAffiliate.clicks
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CTR
                    </span>

                    <strong>
                      {calculateCtr(
                        selectedAffiliate.clicks,
                        selectedAffiliate.impressions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversions
                    </span>

                    <strong>
                      {formatNumber(
                        selectedAffiliate.conversions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversion rate
                    </span>

                    <strong>
                      {conversionRate(
                        selectedAffiliate.conversions,
                        selectedAffiliate.clicks
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Commission earned
                    </span>

                    <strong>
                      {formatMoney(
                        selectedAffiliate.commissionEarned
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Revenue / click
                    </span>

                    <strong>
                      {revenuePerClick(
                        selectedAffiliate.commissionEarned,
                        selectedAffiliate.clicks
                      )}
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
                  Commercial integrity
                </h4>

                <p
                  className={
                    styles.integrityNote
                  }
                >
                  Affiliate commission and conversion value
                  are commercial analytics only. They must
                  not alter Poster&apos;s organic knowledge,
                  search, trending, or recommendation ranking.
                </p>
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Audit history
                </h4>

                <div
                  className={
                    styles.auditList
                  }
                >
                  {selectedAffiliate.audit.map(
                    (
                      entry
                    ) => (
                      <div
                        key={
                          entry.id
                        }
                        className={
                          styles.auditItem
                        }
                      >
                        <span
                          className={
                            styles.auditDot
                          }
                        />

                        <div>
                          <strong>
                            {
                              entry.action
                            }
                          </strong>

                          <span>
                            {
                              entry.actor
                            }
                            {" · "}
                            {
                              entry.timestamp
                            }
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            <div
              className={
                styles.drawerFooter
              }
            >
              <Link
                href={`/monetization/campaigns?record=${encodeURIComponent(
                  selectedAffiliate.id
                )}`}
                className={
                  styles.secondaryButton
                }
              >
                Open in Campaigns
              </Link>

              {selectedAffiliate.status ===
              "active" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      pauseCampaign(
                        selectedAffiliate
                      )
                    }
                  >
                    Pause
                  </button>

                  <button
                    type="button"
                    className={
                      styles.dangerButton
                    }
                    onClick={() =>
                      requestEnd(
                        selectedAffiliate
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedAffiliate.status ===
                "paused" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      resumeCampaign(
                        selectedAffiliate
                      )
                    }
                  >
                    Resume
                  </button>

                  <button
                    type="button"
                    className={
                      styles.dangerButton
                    }
                    onClick={() =>
                      requestEnd(
                        selectedAffiliate
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {endTarget ? (
        <div
          className={
            styles.confirmLayer
          }
        >
          <button
            type="button"
            className={
              styles.confirmBackdrop
            }
            aria-label="Cancel end affiliate campaign"
            onClick={() =>
              setEndTargetId(
                null
              )
            }
          />

          <div
            className={
              styles.confirmDialog
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-affiliate-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Affiliate action
            </span>

            <h3
              id="end-affiliate-title"
            >
              End this affiliate campaign?
            </h3>

            <p>
              <strong>
                {
                  endTarget.id
                }
              </strong>
              {" · "}
              {
                endTarget.name
              }
            </p>

            <p
              className={
                styles.confirmWarning
              }
            >
              Ending preserves the campaign,
              conversion, commission, and audit
              history as a historical record.
            </p>

            <div
              className={
                styles.confirmActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setEndTargetId(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.dangerButton
                }
                onClick={
                  confirmEnd
                }
              >
                End campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}