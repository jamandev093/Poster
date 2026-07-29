"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  campaignRecords,
} from "./monetization.mock";

import {
  calculateCtr,
  CampaignRecord as SharedCampaignRecord,
  CampaignStatus,
  CampaignType,
  Placement,
  TrackingStatus,
} from "./monetization.types";

import styles from "./MonetizationManager.module.css";

interface CampaignAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface CampaignRecord
  extends SharedCampaignRecord {
  audit: CampaignAuditEntry[];
}

const INITIAL_AUDIT_BY_CAMPAIGN:
  Record<
    string,
    CampaignAuditEntry[]
  > = {
  "CMP-3001": [
    {
      id:
        "audit-cmp-3001-1",

      action:
        "Direct sponsorship activated",

      actor:
        "Admin",

      timestamp:
        "17 Jul 2026 · 12:15",
    },
  ],

  "CMP-3002": [
    {
      id:
        "audit-cmp-3002-1",

      action:
        "Affiliate campaign activated",

      actor:
        "Admin",

      timestamp:
        "16 Jul 2026 · 10:30",
    },
  ],

  "CMP-3003": [
    {
      id:
        "audit-cmp-3003-2",

      action:
        "Campaign paused",

      actor:
        "Admin",

      timestamp:
        "19 Jul 2026 · 08:40",
    },

    {
      id:
        "audit-cmp-3003-1",

      action:
        "Poster promotion activated",

      actor:
        "Admin",

      timestamp:
        "15 Jul 2026 · 09:00",
    },
  ],

  "CMP-3004": [
    {
      id:
        "audit-cmp-3004-1",

      action:
        "Campaign scheduled",

      actor:
        "Admin",

      timestamp:
        "19 Jul 2026 · 14:10",
    },
  ],

  "CMP-3005": [
    {
      id:
        "audit-cmp-3005-1",

      action:
        "Programmatic advertising remains disabled for initial release",

      actor:
        "System",

      timestamp:
        "19 Jul 2026 · 00:00",
    },
  ],

  "CMP-3010": [
    {
      id:
        "audit-cmp-3010-1",

      action:
        "Campaign draft created from approved commercial request ADV-1003",

      actor:
        "Admin",

      timestamp:
        "20 Jul 2026 · 13:10",
    },

    {
      id:
        "audit-cmp-3010-0",

      action:
        "Direct sponsorship request approved",

      actor:
        "Admin",

      timestamp:
        "20 Jul 2026 · 13:08",
    },
  ],

  "CMP-3011": [
    {
      id:
        "audit-cmp-3011-2",

      action:
        "Campaign paused",

      actor:
        "Admin",

      timestamp:
        "19 Jul 2026 · 16:20",
    },

    {
      id:
        "audit-cmp-3011-1",

      action:
        "Direct sponsorship activated",

      actor:
        "Admin",

      timestamp:
        "15 Jun 2026 · 09:00",
    },
  ],

  "CMP-3020": [
    {
      id:
        "audit-cmp-3020-1",

      action:
        "Affiliate campaign activated",

      actor:
        "Admin",

      timestamp:
        "20 Jul 2026 · 11:45",
    },

    {
      id:
        "audit-cmp-3020-0",

      action:
        "Affiliate request ADV-1004 approved",

      actor:
        "Admin",

      timestamp:
        "20 Jul 2026 · 11:40",
    },
  ],

  "CMP-3021": [
    {
      id:
        "audit-cmp-3021-1",

      action:
        "Affiliate campaign scheduled",

      actor:
        "Admin",

      timestamp:
        "20 Jul 2026 · 15:30",
    },
  ],
};

const INITIAL_CAMPAIGNS:
  CampaignRecord[] =
  campaignRecords.map(
    (
      campaign
    ) => ({
      ...campaign,

      placements: [
        ...campaign.placements,
      ],

      performance: {
        ...campaign.performance,
      },

      financials: {
        ...campaign.financials,
      },

      audit:
        INITIAL_AUDIT_BY_CAMPAIGN[
          campaign.id
        ] ?? [
          {
            id:
              `audit-${campaign.id.toLowerCase()}-initial`,

            action:
              "Campaign record created",

            actor:
              "Admin",

            timestamp:
              "Current demonstration state",
          },
        ],
    })
  );

function campaignTypeLabel(
  type: CampaignType
): string {
  switch (type) {
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
  status: CampaignStatus
): string {
  switch (status) {
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
  placement: Placement
): string {
  switch (placement) {
    case "home":
      return "Home";

    case "search":
      return "Search";

    case "trending":
      return "Trending";
  }
}

function placementsLabel(
  placements: Placement[]
): string {
  return placements
    .map(
      placementLabel
    )
    .join(", ");
}

function trackingStatusLabel(
  status: TrackingStatus
): string {
  switch (status) {
    case "connected":
      return "Connected";

    case "not_configured":
      return "Not configured";

    case "unavailable":
      return "Unavailable";
  }
}

function formatDate(
  value: string
): string {
  if (
    !value
  ) {
    return "Not configured";
  }

  const date =
    new Date(
      `${value}T00:00:00Z`
    );

  if (
    Number.isNaN(
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

function ctr(
  campaign: CampaignRecord
): string {
  return `${calculateCtr(
    campaign.performance
      .impressions,
    campaign.performance
      .clicks
  ).toFixed(
    2
  )}%`;
}

function conversionLabel(
  campaign: CampaignRecord
): string {
  const conversions =
    campaign.performance
      .conversions;

  if (
    conversions ===
    null
  ) {
    return "Not tracked";
  }

  return conversions.toLocaleString();
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

function statusClass(
  status: CampaignStatus
): string {
  switch (status) {
    case "active":
      return styles.statusActive;

    case "paused":
      return styles.statusPaused;

    case "scheduled":
      return styles.statusScheduled;

    /*
     * Draft intentionally uses the existing
     * neutral status style so we do not need
     * to redesign or change the CSS in this
     * migration step.
     */
    case "draft":
      return styles.statusDisabled;

    case "ended":
      return styles.statusEnded;

    case "disabled":
      return styles.statusDisabled;
  }
}

export default function MonetizationManager() {
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

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      CampaignRecord[]
    >(
      INITIAL_CAMPAIGNS
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
      | "all"
      | CampaignStatus
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
      INITIAL_CAMPAIGNS.some(
        (
          campaign
        ) =>
          campaign.id ===
          requestedRecordId
      )
        ? requestedRecordId
        : null
    );

  const [
    endTargetId,
    setEndTargetId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleCampaigns =
    useMemo(
      () => {
        return campaigns.filter(
          (
            campaign
          ) => {
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

              campaign.requestId ??
                "",

              campaign.name,

              campaign.organization,

              campaignTypeLabel(
                campaign.type
              ),

              placementsLabel(
                campaign.placements
              ),
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
      },
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
          (
            campaign
          ) =>
            campaign.id ===
            selectedId
        ) ??
        null,

      [
        campaigns,
        selectedId,
      ]
    );

  const endTarget =
    useMemo(
      () =>
        campaigns.find(
          (
            campaign
          ) =>
            campaign.id ===
            endTargetId
        ) ??
        null,

      [
        campaigns,
        endTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          campaigns.length,

        draft:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "draft"
          ).length,

        scheduled:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "scheduled"
          ).length,

        active:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "active"
          ).length,

        paused:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "paused"
          ).length,

        ended:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "ended"
          ).length,

        disabled:
          campaigns.filter(
            (
              campaign
            ) =>
              campaign.status ===
              "disabled"
          ).length,
      }),

      [
        campaigns,
      ]
    );

  const updateStatus = (
    campaignId: string,

    status:
      CampaignStatus,

    action: string
  ) => {
    setCampaigns(
      (
        current
      ) =>
        current.map(
          (
            campaign
          ) =>
            campaign.id ===
            campaignId
              ? {
                  ...campaign,

                  status,

                  audit: [
                    {
                      id:
                        `${campaign.id}-${Date.now()}`,

                      action,

                      actor:
                        "Admin",

                      timestamp:
                        nowLabel(),
                    },

                    ...campaign.audit,
                  ],
                }
              : campaign
        )
    );
  };

  const scheduleCampaign = (
    campaign:
      CampaignRecord
  ) => {
    if (
      campaign.status !==
        "draft" ||
      campaign.type ===
        "programmatic"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "scheduled",
      "Campaign scheduled after final Admin review"
    );
  };

  const pauseCampaign = (
    campaign:
      CampaignRecord
  ) => {
    if (
      campaign.status !==
      "active"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "paused",
      "Campaign paused"
    );
  };

  const resumeCampaign = (
    campaign:
      CampaignRecord
  ) => {
    if (
      campaign.status !==
        "paused" ||
      campaign.type ===
        "programmatic"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "active",
      "Campaign resumed"
    );
  };

  const requestEnd = (
    campaign:
      CampaignRecord
  ) => {
    if (
      campaign.status !==
        "active" &&
      campaign.status !==
        "paused"
    ) {
      return;
    }

    setEndTargetId(
      campaign.id
    );
  };

  const cancelEnd =
    () => {
      setEndTargetId(
        null
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
        "Campaign ended"
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
            Campaigns
          </h2>

          <p>
            Control every Poster
            commercial campaign from
            one place. Commercial
            placement stays separate
            from organic discovery and
            requires Poster approval.
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
            placeholder="Search campaign ID, request ID, name or partner..."
            aria-label="Search campaigns"
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
                  Type
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Schedule
                </th>

                <th>
                  Performance
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
                (
                  campaign
                ) => (
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
                          campaign.id
                        }

                        {" · "}

                        {
                          campaign.organization
                        }
                      </span>
                    </td>

                    <td>
                      {campaignTypeLabel(
                        campaign.type
                      )}
                    </td>

                    <td>
                      {placementsLabel(
                        campaign.placements
                      )}
                    </td>

                    <td>
                      {formatDate(
                        campaign.startDate
                      )}

                      {" → "}

                      {formatDate(
                        campaign.endDate
                      )}
                    </td>

                    <td>
                      <strong
                        className={
                          styles.performanceMain
                        }
                      >
                        {ctr(
                          campaign
                        )}
                        {" CTR"}
                      </strong>

                      <span
                        className={
                          styles.performanceSub
                        }
                      >
                        {campaign.performance.impressions.toLocaleString()}
                        {" imp · "}
                        {campaign.performance.clicks.toLocaleString()}
                        {" clicks"}
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
                      {campaign.status ===
                      "active" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            pauseCampaign(
                              campaign
                            )
                          }
                        >
                          Pause
                        </button>
                      ) : campaign.status ===
                        "paused" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            resumeCampaign(
                              campaign
                            )
                          }
                        >
                          Resume
                        </button>
                      ) : campaign.status ===
                        "draft" ? (
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
                          Review
                        </button>
                      ) : (
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
                      )}
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
            Programmatic advertising
          </strong>

          <p>
            Programmatic advertising
            remains structurally supported
            but disabled until provider,
            privacy, consent, SDK and
            production requirements are
            ready.
          </p>
        </div>

        <span
          className={
            styles.disabledBadge
          }
        >
          Disabled
        </span>
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
            aria-label="Close campaign details"
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
                    selectedCampaign.id
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
                  Campaign
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
                        selectedCampaign.id
                      }
                    </dd>
                  </div>

                  {selectedCampaign.requestId ? (
                    <div>
                      <dt>
                        Source request
                      </dt>

                      <dd>
                        {
                          selectedCampaign.requestId
                        }
                      </dd>
                    </div>
                  ) : null}

                  <div>
                    <dt>
                      Type
                    </dt>

                    <dd>
                      {campaignTypeLabel(
                        selectedCampaign.type
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Partner /
                      advertiser
                    </dt>

                    <dd>
                      {
                        selectedCampaign.organization
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Disclosure
                    </dt>

                    <dd>
                      {selectedCampaign.type ===
                      "direct_sponsorship"
                        ? `Sponsored by ${selectedCampaign.organization}`
                        : selectedCampaign.type ===
                          "affiliate"
                        ? "Affiliate · Poster may earn a commission"
                        : selectedCampaign.type ===
                          "poster_promotion"
                        ? "Promoted by Poster"
                        : "Programmatic disclosure managed by provider"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {placementsLabel(
                        selectedCampaign.placements
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {statusLabel(
                        selectedCampaign.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Tracking
                    </dt>

                    <dd>
                      {trackingStatusLabel(
                        selectedCampaign.trackingStatus
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Start
                    </dt>

                    <dd>
                      {formatDate(
                        selectedCampaign.startDate
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      End
                    </dt>

                    <dd>
                      {formatDate(
                        selectedCampaign.endDate
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
                        selectedCampaign.destinationUrl ??
                        "Not configured"
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
                  Performance snapshot
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
                      {selectedCampaign.performance.impressions.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Clicks
                    </span>

                    <strong>
                      {selectedCampaign.performance.clicks.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CTR
                    </span>

                    <strong>
                      {ctr(
                        selectedCampaign
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conversions
                    </span>

                    <strong>
                      {conversionLabel(
                        selectedCampaign
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
                  This commercial campaign
                  is separate from Poster&apos;s
                  organic recommendation
                  ranking. Sponsorship value,
                  affiliate commission, or
                  commercial payment must not
                  influence organic knowledge
                  ranking.
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
                  {selectedCampaign.audit.map(
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
              {selectedCampaign.type ===
              "programmatic" ? (
                <span
                  className={
                    styles.programmaticNote
                  }
                >
                  Programmatic advertising
                  is intentionally disabled.
                </span>
              ) : selectedCampaign.status ===
                "draft" ? (
                <>
                  <span
                    className={
                      styles.programmaticNote
                    }
                  >
                    Draft campaigns require
                    final Poster review before
                    they can be scheduled.
                  </span>

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      scheduleCampaign(
                        selectedCampaign
                      )
                    }
                  >
                    Schedule campaign
                  </button>
                </>
              ) : selectedCampaign.status ===
                "active" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      pauseCampaign(
                        selectedCampaign
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
                        selectedCampaign
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedCampaign.status ===
                "paused" ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() =>
                      resumeCampaign(
                        selectedCampaign
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
                        selectedCampaign
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedCampaign.status ===
                "scheduled" ? (
                <span
                  className={
                    styles.programmaticNote
                  }
                >
                  Campaign is scheduled and
                  will begin according to its
                  configured start date.
                </span>
              ) : (
                <span
                  className={
                    styles.programmaticNote
                  }
                >
                  Ended campaigns remain
                  historical records and are
                  not reactivated directly.
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
            aria-label="Cancel end campaign"
            onClick={
              cancelEnd
            }
          />

          <div
            className={
              styles.confirmDialog
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-campaign-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Campaign action
            </span>

            <h3
              id="end-campaign-title"
            >
              End this campaign?
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
              campaign as a historical
              record. It should not be
              resumed directly afterward.
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
                onClick={
                  cancelEnd
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