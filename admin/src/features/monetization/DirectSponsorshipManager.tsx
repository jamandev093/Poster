"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import styles from "./DirectSponsorshipManager.module.css";

type SponsorshipStatus =
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

interface SponsorshipRecord {
  id: string;

  name: string;
  advertiser: string;

  destinationUrl: string;

  placement: Placement;

  status: SponsorshipStatus;

  startAt: string;
  endAt: string;

  contractValue: number;

  deliveryTarget: number;
  delivered: number;

  clicks: number;
  conversions: number;

  audit: AuditEntry[];
}

const INITIAL_SPONSORSHIPS: SponsorshipRecord[] = [
  {
    id: "CMP-3001",

    name:
      "Cloud Skills Direct Sponsorship",

    advertiser:
      "Example Cloud",

    destinationUrl:
      "https://example.com/cloud-skills",

    placement:
      "Trending",

    status:
      "active",

    startAt:
      "17 Jul 2026",

    endAt:
      "31 Jul 2026",

    contractValue:
      500000,

    deliveryTarget:
      1000000,

    delivered:
      728000,

    clicks:
      18240,

    conversions:
      620,

    audit: [
      {
        id:
          "sponsor-3001-2",

        action:
          "Delivery reached 70% of contracted target",

        actor:
          "System",

        timestamp:
          "20 Jul 2026 · 09:15",
      },

      {
        id:
          "sponsor-3001-1",

        action:
          "Direct sponsorship activated",

        actor:
          "Admin",

        timestamp:
          "17 Jul 2026 · 12:15",
      },
    ],
  },

  {
    id: "CMP-3010",

    name:
      "Professional Learning Campaign",

    advertiser:
      "Example University",

    destinationUrl:
      "https://example.edu/professional-learning",

    placement:
      "Home",

    status:
      "scheduled",

    startAt:
      "25 Jul 2026",

    endAt:
      "15 Aug 2026",

    contractValue:
      320000,

    deliveryTarget:
      600000,

    delivered:
      0,

    clicks:
      0,

    conversions:
      0,

    audit: [
      {
        id:
          "sponsor-3010-1",

        action:
          "Direct sponsorship scheduled",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 14:40",
      },
    ],
  },

  {
    id: "CMP-3011",

    name:
      "Developer Certification Campaign",

    advertiser:
      "Example Academy",

    destinationUrl:
      "https://example.org/developer-certification",

    placement:
      "Search",

    status:
      "paused",

    startAt:
      "10 Jul 2026",

    endAt:
      "30 Jul 2026",

    contractValue:
      210000,

    deliveryTarget:
      420000,

    delivered:
      188000,

    clicks:
      4860,

    conversions:
      210,

    audit: [
      {
        id:
          "sponsor-3011-2",

        action:
          "Campaign paused for advertiser review",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 16:05",
      },

      {
        id:
          "sponsor-3011-1",

        action:
          "Direct sponsorship activated",

        actor:
          "Admin",

        timestamp:
          "10 Jul 2026 · 08:00",
      },
    ],
  },
];

function statusLabel(
  status: SponsorshipStatus
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

function deliveryProgress(
  delivered: number,
  target: number
): number {
  if (
    target ===
    0
  ) {
    return 0;
  }

  return Math.min(
    100,
    (
      delivered /
      target
    ) *
      100
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

export default function DirectSponsorshipManager() {
  const [
    sponsorships,
    setSponsorships,
  ] = useState<
    SponsorshipRecord[]
  >(
    INITIAL_SPONSORSHIPS
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
      SponsorshipStatus
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

  const visibleSponsorships =
    useMemo(() => {
      return sponsorships.filter(
        (
          sponsorship
        ) => {
          if (
            filter !==
              "all" &&
            sponsorship.status !==
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
            sponsorship.id,
            sponsorship.name,
            sponsorship.advertiser,
            sponsorship.placement,
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
      sponsorships,
      filter,
      normalizedQuery,
    ]);

  const selectedSponsorship =
    useMemo(
      () =>
        sponsorships.find(
          (
            sponsorship
          ) =>
            sponsorship.id ===
            selectedId
        ) ?? null,

      [
        sponsorships,
        selectedId,
      ]
    );

  const endTarget =
    useMemo(
      () =>
        sponsorships.find(
          (
            sponsorship
          ) =>
            sponsorship.id ===
            endTargetId
        ) ?? null,

      [
        sponsorships,
        endTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          sponsorships.length,

        scheduled:
          sponsorships.filter(
            (
              sponsorship
            ) =>
              sponsorship.status ===
              "scheduled"
          ).length,

        active:
          sponsorships.filter(
            (
              sponsorship
            ) =>
              sponsorship.status ===
              "active"
          ).length,

        paused:
          sponsorships.filter(
            (
              sponsorship
            ) =>
              sponsorship.status ===
              "paused"
          ).length,

        ended:
          sponsorships.filter(
            (
              sponsorship
            ) =>
              sponsorship.status ===
              "ended"
          ).length,
      }),

      [
        sponsorships,
      ]
    );

  const updateStatus = (
    id: string,
    status: SponsorshipStatus,
    action: string
  ) => {
    setSponsorships(
      (
        current
      ) =>
        current.map(
          (
            sponsorship
          ) =>
            sponsorship.id ===
            id
              ? {
                  ...sponsorship,

                  status,

                  audit: [
                    {
                      id:
                        `${sponsorship.id}-${Date.now()}`,

                      action,

                      actor:
                        "Admin",

                      timestamp:
                        nowLabel(),
                    },

                    ...sponsorship.audit,
                  ],
                }
              : sponsorship
        )
    );
  };

  const pauseCampaign = (
    sponsorship:
      SponsorshipRecord
  ) => {
    if (
      sponsorship.status !==
      "active"
    ) {
      return;
    }

    updateStatus(
      sponsorship.id,
      "paused",
      "Direct sponsorship paused"
    );
  };

  const resumeCampaign = (
    sponsorship:
      SponsorshipRecord
  ) => {
    if (
      sponsorship.status !==
      "paused"
    ) {
      return;
    }

    updateStatus(
      sponsorship.id,
      "active",
      "Direct sponsorship resumed"
    );
  };

  const requestEnd = (
    sponsorship:
      SponsorshipRecord
  ) => {
    if (
      sponsorship.status !==
        "active" &&
      sponsorship.status !==
        "paused"
    ) {
      return;
    }

    setEndTargetId(
      sponsorship.id
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
        "Direct sponsorship ended"
      );

      setEndTargetId(
        null
      );
    };

  const activeContractValue =
    useMemo(
      () =>
        sponsorships
          .filter(
            (
              sponsorship
            ) =>
              sponsorship.status ===
              "active"
          )
          .reduce(
            (
              total,
              sponsorship
            ) =>
              total +
              sponsorship.contractValue,
            0
          ),
      [
        sponsorships,
      ]
    );

  const totalDelivered =
    useMemo(
      () =>
        sponsorships.reduce(
          (
            total,
            sponsorship
          ) =>
            total +
            sponsorship.delivered,
          0
        ),
      [
        sponsorships,
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
            Track advertiser campaigns,
            contracted delivery, placement,
            performance, and campaign status
            without introducing a self-service
            advertising marketplace.
          </p>
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Direct sponsorship summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Active sponsorships
          </span>

          <strong>
            {
              counts.active
            }
          </strong>

          <small>
            Currently running
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Active contract value
          </span>

          <strong>
            {formatMoney(
              activeContractValue
            )}
          </strong>

          <small>
            Demonstration contract values
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total delivered
          </span>

          <strong>
            {formatNumber(
              totalDelivered
            )}
          </strong>

          <small>
            Contracted impressions delivered
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
            placeholder="Search campaign ID, advertiser or campaign..."
            aria-label="Search direct sponsorships"
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
                  Campaign
                </th>

                <th>
                  Advertiser
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Delivery
                </th>

                <th>
                  Contract
                </th>

                <th>
                  CTR
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
              {visibleSponsorships.map(
                (
                  sponsorship
                ) => {
                  const progress =
                    deliveryProgress(
                      sponsorship.delivered,
                      sponsorship.deliveryTarget
                    );

                  return (
                    <tr
                      key={
                        sponsorship.id
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
                              sponsorship.id
                            )
                          }
                        >
                          {
                            sponsorship.name
                          }
                        </button>

                        <span
                          className={
                            styles.secondaryText
                          }
                        >
                          {
                            sponsorship.id
                          }
                        </span>
                      </td>

                      <td>
                        {
                          sponsorship.advertiser
                        }
                      </td>

                      <td>
                        {
                          sponsorship.placement
                        }
                      </td>

                      <td>
                        <strong
                          className={
                            styles.deliveryPrimary
                          }
                        >
                          {progress.toFixed(
                            0
                          )}
                          %
                        </strong>

                        <span
                          className={
                            styles.secondaryText
                          }
                        >
                          {formatNumber(
                            sponsorship.delivered
                          )}
                          {" / "}
                          {formatNumber(
                            sponsorship.deliveryTarget
                          )}
                        </span>
                      </td>

                      <td>
                        {formatMoney(
                          sponsorship.contractValue
                        )}
                      </td>

                      <td>
                        {calculateCtr(
                          sponsorship.clicks,
                          sponsorship.delivered
                        )}
                      </td>

                      <td>
                        <span
                          className={`${styles.status} ${
                            sponsorship.status ===
                            "active"
                              ? styles.statusActive
                              : sponsorship.status ===
                                "paused"
                              ? styles.statusPaused
                              : sponsorship.status ===
                                "scheduled"
                              ? styles.statusScheduled
                              : styles.statusEnded
                          }`}
                        >
                          {statusLabel(
                            sponsorship.status
                          )}
                        </span>
                      </td>

                      <td>
                        {sponsorship.status ===
                        "active" ? (
                          <button
                            type="button"
                            className={
                              styles.actionButton
                            }
                            onClick={() =>
                              pauseCampaign(
                                sponsorship
                              )
                            }
                          >
                            Pause
                          </button>
                        ) : sponsorship.status ===
                          "paused" ? (
                          <button
                            type="button"
                            className={
                              styles.actionButton
                            }
                            onClick={() =>
                              resumeCampaign(
                                sponsorship
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
                                sponsorship.id
                              )
                            }
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {visibleSponsorships.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No direct sponsorships found.
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
            Poster manually approves every direct sponsorship.
          </strong>

          <p>
            Advertisers cannot publish campaigns
            automatically. Contract value or commercial
            payment must never influence organic
            recommendation ranking.
          </p>
        </div>
      </section>

      {selectedSponsorship ? (
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
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  {
                    selectedSponsorship.id
                  }
                </span>

                <h3>
                  {
                    selectedSponsorship.name
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
                  Sponsorship
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
                        selectedSponsorship.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Advertiser
                    </dt>

                    <dd>
                      {
                        selectedSponsorship.advertiser
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Disclosure
                    </dt>

                    <dd>
                      Sponsored by{" "}
                      {
                        selectedSponsorship.advertiser
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {
                        selectedSponsorship.placement
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {statusLabel(
                        selectedSponsorship.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Start
                    </dt>

                    <dd>
                      {
                        selectedSponsorship.startAt
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      End
                    </dt>

                    <dd>
                      {
                        selectedSponsorship.endAt
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
                        selectedSponsorship.destinationUrl
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
                  Contract & delivery
                </h4>

                <div
                  className={
                    styles.metrics
                  }
                >
                  <div>
                    <span>
                      Contract value
                    </span>

                    <strong>
                      {formatMoney(
                        selectedSponsorship.contractValue
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivery target
                    </span>

                    <strong>
                      {formatNumber(
                        selectedSponsorship.deliveryTarget
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivered
                    </span>

                    <strong>
                      {formatNumber(
                        selectedSponsorship.delivered
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Remaining
                    </span>

                    <strong>
                      {formatNumber(
                        Math.max(
                          0,
                          selectedSponsorship.deliveryTarget -
                            selectedSponsorship.delivered
                        )
                      )}
                    </strong>
                  </div>
                </div>

                <div
                  className={
                    styles.progressBlock
                  }
                >
                  <div
                    className={
                      styles.progressHeader
                    }
                  >
                    <span>
                      Delivery progress
                    </span>

                    <strong>
                      {deliveryProgress(
                        selectedSponsorship.delivered,
                        selectedSponsorship.deliveryTarget
                      ).toFixed(
                        1
                      )}
                      %
                    </strong>
                  </div>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span
                      style={{
                        width: `${deliveryProgress(
                          selectedSponsorship.delivered,
                          selectedSponsorship.deliveryTarget
                        )}%`,
                      }}
                    />
                  </div>
                </div>
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
                        selectedSponsorship.delivered
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Clicks
                    </span>

                    <strong>
                      {formatNumber(
                        selectedSponsorship.clicks
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CTR
                    </span>

                    <strong>
                      {calculateCtr(
                        selectedSponsorship.clicks,
                        selectedSponsorship.delivered
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversions
                    </span>

                    <strong>
                      {formatNumber(
                        selectedSponsorship.conversions
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
                  Audit history
                </h4>

                <div
                  className={
                    styles.auditList
                  }
                >
                  {selectedSponsorship.audit.map(
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
                  selectedSponsorship.id
                )}`}
                className={
                  styles.secondaryButton
                }
              >
                Open in Campaigns
              </Link>

              {selectedSponsorship.status ===
              "active" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      pauseCampaign(
                        selectedSponsorship
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
                        selectedSponsorship
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedSponsorship.status ===
                "paused" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      resumeCampaign(
                        selectedSponsorship
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
                        selectedSponsorship
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
            aria-label="Cancel end sponsorship"
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
            aria-labelledby="end-sponsorship-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Sponsorship action
            </span>

            <h3
              id="end-sponsorship-title"
            >
              End this sponsorship?
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
              Ending preserves the
              sponsorship and delivery
              history as a permanent
              campaign record.
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
                End sponsorship
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}