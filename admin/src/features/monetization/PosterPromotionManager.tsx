"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import styles from "./PosterPromotionManager.module.css";

type PromotionStatus =
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

interface PosterPromotionRecord {
  id: string;

  name: string;
  purpose: string;

  destinationUrl: string;

  placement: Placement;

  status: PromotionStatus;

  startAt: string;
  endAt?: string;

  impressions: number;
  clicks: number;
  conversions: number;

  audit: AuditEntry[];
}

const INITIAL_PROMOTIONS: PosterPromotionRecord[] = [
  {
    id: "CMP-3003",

    name:
      "Poster Premium Discovery",

    purpose:
      "Introduce users to Poster Premium Discovery and measure interest in the enhanced discovery experience.",

    destinationUrl:
      "https://poster.example/premium-discovery",

    placement:
      "Home",

    status:
      "paused",

    startAt:
      "15 Jul 2026",

    impressions:
      124500,

    clicks:
      4210,

    conversions:
      840,

    audit: [
      {
        id:
          "promotion-3003-2",

        action:
          "Poster promotion paused",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 08:40",
      },

      {
        id:
          "promotion-3003-1",

        action:
          "Poster promotion activated",

        actor:
          "Admin",

        timestamp:
          "15 Jul 2026 · 09:00",
      },
    ],
  },

  {
    id: "CMP-3004",

    name:
      "Career Growth Collection",

    purpose:
      "Promote a curated Poster knowledge collection focused on professional learning and career development.",

    destinationUrl:
      "https://poster.example/career-growth",

    placement:
      "Home",

    status:
      "scheduled",

    startAt:
      "25 Jul 2026",

    endAt:
      "10 Aug 2026",

    impressions:
      0,

    clicks:
      0,

    conversions:
      0,

    audit: [
      {
        id:
          "promotion-3004-1",

        action:
          "Poster promotion scheduled",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 14:10",
      },
    ],
  },
];

function statusLabel(
  status: PromotionStatus
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

export default function PosterPromotionManager() {
  const [
    promotions,
    setPromotions,
  ] = useState<
    PosterPromotionRecord[]
  >(
    INITIAL_PROMOTIONS
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
      PromotionStatus
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

  const visiblePromotions =
    useMemo(() => {
      return promotions.filter(
        (
          promotion
        ) => {
          if (
            filter !==
              "all" &&
            promotion.status !==
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
            promotion.id,
            promotion.name,
            promotion.purpose,
            promotion.placement,
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
      promotions,
      filter,
      normalizedQuery,
    ]);

  const selectedPromotion =
    useMemo(
      () =>
        promotions.find(
          (
            promotion
          ) =>
            promotion.id ===
            selectedId
        ) ?? null,

      [
        promotions,
        selectedId,
      ]
    );

  const endTarget =
    useMemo(
      () =>
        promotions.find(
          (
            promotion
          ) =>
            promotion.id ===
            endTargetId
        ) ?? null,

      [
        promotions,
        endTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          promotions.length,

        scheduled:
          promotions.filter(
            (
              promotion
            ) =>
              promotion.status ===
              "scheduled"
          ).length,

        active:
          promotions.filter(
            (
              promotion
            ) =>
              promotion.status ===
              "active"
          ).length,

        paused:
          promotions.filter(
            (
              promotion
            ) =>
              promotion.status ===
              "paused"
          ).length,

        ended:
          promotions.filter(
            (
              promotion
            ) =>
              promotion.status ===
              "ended"
          ).length,
      }),

      [
        promotions,
      ]
    );

  const totalImpressions =
    useMemo(
      () =>
        promotions.reduce(
          (
            total,
            promotion
          ) =>
            total +
            promotion.impressions,
          0
        ),

      [
        promotions,
      ]
    );

  const totalClicks =
    useMemo(
      () =>
        promotions.reduce(
          (
            total,
            promotion
          ) =>
            total +
            promotion.clicks,
          0
        ),

      [
        promotions,
      ]
    );

  const totalConversions =
    useMemo(
      () =>
        promotions.reduce(
          (
            total,
            promotion
          ) =>
            total +
            promotion.conversions,
          0
        ),

      [
        promotions,
      ]
    );

  const updateStatus = (
    id: string,

    status:
      PromotionStatus,

    action: string
  ) => {
    setPromotions(
      (
        current
      ) =>
        current.map(
          (
            promotion
          ) =>
            promotion.id ===
            id
              ? {
                  ...promotion,

                  status,

                  audit: [
                    {
                      id:
                        `${promotion.id}-${Date.now()}`,

                      action,

                      actor:
                        "Admin",

                      timestamp:
                        nowLabel(),
                    },

                    ...promotion.audit,
                  ],
                }
              : promotion
        )
    );
  };

  const pausePromotion = (
    promotion:
      PosterPromotionRecord
  ) => {
    if (
      promotion.status !==
      "active"
    ) {
      return;
    }

    updateStatus(
      promotion.id,
      "paused",
      "Poster promotion paused"
    );
  };

  const resumePromotion = (
    promotion:
      PosterPromotionRecord
  ) => {
    if (
      promotion.status !==
      "paused"
    ) {
      return;
    }

    updateStatus(
      promotion.id,
      "active",
      "Poster promotion resumed"
    );
  };

  const requestEnd = (
    promotion:
      PosterPromotionRecord
  ) => {
    if (
      promotion.status !==
        "active" &&
      promotion.status !==
        "paused"
    ) {
      return;
    }

    setEndTargetId(
      promotion.id
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
        "Poster promotion ended"
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
            Poster Promotion
          </h2>

          <p>
            Manage campaigns created
            and controlled by Poster
            itself, including product,
            collection, learning, and
            strategic discovery
            promotions.
          </p>
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
            Active promotions
          </span>

          <strong>
            {
              counts.active
            }
          </strong>

          <small>
            Poster-controlled campaigns running
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatNumber(
              totalImpressions
            )}
          </strong>

          <small>
            Demonstration exposure data
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatNumber(
              totalClicks
            )}
          </strong>

          <small>
            Demonstration engagement
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
            Goal completions
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
            placeholder="Search campaign ID or promotion..."
            aria-label="Search Poster promotions"
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
                  Promotion
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Schedule
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
                  Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visiblePromotions.map(
                (
                  promotion
                ) => (
                  <tr
                    key={
                      promotion.id
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
                            promotion.id
                          )
                        }
                      >
                        {
                          promotion.name
                        }
                      </button>

                      <span
                        className={
                          styles.secondaryText
                        }
                      >
                        {
                          promotion.id
                        }
                        {" · Promoted by Poster"}
                      </span>
                    </td>

                    <td>
                      {
                        promotion.placement
                      }
                    </td>

                    <td>
                      {
                        promotion.startAt
                      }

                      {promotion.endAt
                        ? ` → ${promotion.endAt}`
                        : ""}
                    </td>

                    <td>
                      {formatNumber(
                        promotion.impressions
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        promotion.clicks
                      )}
                    </td>

                    <td>
                      {calculateCtr(
                        promotion.clicks,
                        promotion.impressions
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        promotion.conversions
                      )}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          promotion.status ===
                          "active"
                            ? styles.statusActive
                            : promotion.status ===
                              "paused"
                            ? styles.statusPaused
                            : promotion.status ===
                              "scheduled"
                            ? styles.statusScheduled
                            : styles.statusEnded
                        }`}
                      >
                        {statusLabel(
                          promotion.status
                        )}
                      </span>
                    </td>

                    <td>
                      {promotion.status ===
                      "active" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            pausePromotion(
                              promotion
                            )
                          }
                        >
                          Pause
                        </button>
                      ) : promotion.status ===
                        "paused" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            resumePromotion(
                              promotion
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
                              promotion.id
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

          {visiblePromotions.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No Poster promotions found.
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
            These campaigns use the disclosure
            “Promoted by Poster”. They remain
            separate from organic ranking and
            should not be disguised as ordinary
            recommendations.
          </p>
        </div>
      </section>

      {selectedPromotion ? (
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
                    selectedPromotion.id
                  }
                </span>

                <h3>
                  {
                    selectedPromotion.name
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
                        selectedPromotion.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Disclosure
                    </dt>

                    <dd>
                      Promoted by Poster
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Purpose
                    </dt>

                    <dd>
                      {
                        selectedPromotion.purpose
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {
                        selectedPromotion.placement
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {statusLabel(
                        selectedPromotion.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Start
                    </dt>

                    <dd>
                      {
                        selectedPromotion.startAt
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      End
                    </dt>

                    <dd>
                      {
                        selectedPromotion.endAt ??
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
                        selectedPromotion.destinationUrl
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
                        selectedPromotion.impressions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Clicks
                    </span>

                    <strong>
                      {formatNumber(
                        selectedPromotion.clicks
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CTR
                    </span>

                    <strong>
                      {calculateCtr(
                        selectedPromotion.clicks,
                        selectedPromotion.impressions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversions
                    </span>

                    <strong>
                      {formatNumber(
                        selectedPromotion.conversions
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversion rate
                    </span>

                    <strong>
                      {conversionRate(
                        selectedPromotion.conversions,
                        selectedPromotion.clicks
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
                  Discovery integrity
                </h4>

                <p
                  className={
                    styles.integrityNote
                  }
                >
                  Poster-controlled promotion
                  remains a separate commercial
                  placement. It must not silently
                  replace or manipulate organic
                  knowledge, search, trending, or
                  recommendation rankings.
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
                  {selectedPromotion.audit.map(
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
                  selectedPromotion.id
                )}`}
                className={
                  styles.secondaryButton
                }
              >
                Open in Campaigns
              </Link>

              {selectedPromotion.status ===
              "active" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      pausePromotion(
                        selectedPromotion
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
                        selectedPromotion
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedPromotion.status ===
                "paused" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      resumePromotion(
                        selectedPromotion
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
                        selectedPromotion
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedPromotion.status ===
                "scheduled" ? (
                <span
                  className={
                    styles.footerNote
                  }
                >
                  Scheduled campaigns begin according
                  to their configured start date.
                </span>
              ) : (
                <span
                  className={
                    styles.footerNote
                  }
                >
                  Ended campaigns remain historical
                  records.
                </span>
              )}
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
            aria-label="Cancel end Poster promotion"
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
            aria-labelledby="end-promotion-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Poster Promotion
            </span>

            <h3
              id="end-promotion-title"
            >
              End this promotion?
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
              Ending preserves campaign
              performance and audit history
              as a historical record.
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
                End promotion
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}