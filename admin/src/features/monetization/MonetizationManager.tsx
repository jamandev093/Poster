"use client";

import {
  useMemo,
  useState,
} from "react";

import styles from "./MonetizationManager.module.css";

type CampaignType =
  | "poster_promotion"
  | "affiliate"
  | "direct_sponsorship"
  | "programmatic";

type CampaignStatus =
  | "active"
  | "paused"
  | "ended"
  | "disabled";

type CampaignPlacement =
  | "Home"
  | "Search"
  | "Trending";

interface CampaignAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface CampaignRecord {
  id: string;
  name: string;
  type: CampaignType;
  partner?: string;
  placement: CampaignPlacement;
  status: CampaignStatus;
  startAt: string;
  endAt?: string;
  clicks: number;
  impressions: number;
  audit: CampaignAuditEntry[];
}

const INITIAL_CAMPAIGNS: CampaignRecord[] = [
  {
    id: "CMP-1001",
    name: "Poster Premium Discovery",
    type: "poster_promotion",
    placement: "Home",
    status: "active",
    startAt: "15 Jul 2026",
    clicks: 148,
    impressions: 4210,
    audit: [
      {
        id: "audit-cmp-1001-1",
        action: "Campaign activated",
        actor: "Admin",
        timestamp: "15 Jul 2026 · 09:00",
      },
    ],
  },
  {
    id: "CMP-1002",
    name: "Learning Partner Offer",
    type: "affiliate",
    partner: "Example Learning",
    placement: "Search",
    status: "active",
    startAt: "16 Jul 2026",
    endAt: "31 Jul 2026",
    clicks: 93,
    impressions: 2860,
    audit: [
      {
        id: "audit-cmp-1002-1",
        action: "Affiliate campaign activated",
        actor: "Admin",
        timestamp: "16 Jul 2026 · 10:30",
      },
    ],
  },
  {
    id: "CMP-1003",
    name: "Example Cloud Sponsorship",
    type: "direct_sponsorship",
    partner: "Example Cloud",
    placement: "Trending",
    status: "paused",
    startAt: "17 Jul 2026",
    endAt: "27 Jul 2026",
    clicks: 37,
    impressions: 1180,
    audit: [
      {
        id: "audit-cmp-1003-2",
        action: "Campaign paused",
        actor: "Admin",
        timestamp: "19 Jul 2026 · 08:40",
      },
      {
        id: "audit-cmp-1003-1",
        action: "Direct sponsorship activated",
        actor: "Admin",
        timestamp: "17 Jul 2026 · 12:15",
      },
    ],
  },
  {
    id: "CMP-1004",
    name: "Google Native Ads",
    type: "programmatic",
    placement: "Home",
    status: "disabled",
    startAt: "Not started",
    clicks: 0,
    impressions: 0,
    audit: [
      {
        id: "audit-cmp-1004-1",
        action: "Programmatic ads remain disabled for initial release",
        actor: "System",
        timestamp: "19 Jul 2026 · 00:00",
      },
    ],
  },
];

function campaignTypeLabel(
  type: CampaignType
): string {
  switch (type) {
    case "poster_promotion":
      return "Poster promotion";
    case "affiliate":
      return "Affiliate";
    case "direct_sponsorship":
      return "Direct sponsorship";
    case "programmatic":
      return "Programmatic";
  }
}

function statusLabel(
  status: CampaignStatus
): string {
  switch (status) {
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

function nowLabel(): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date());
}

export default function MonetizationManager() {
  const [
    campaigns,
    setCampaigns,
  ] = useState<CampaignRecord[]>(
    INITIAL_CAMPAIGNS
  );

  const [
    filter,
    setFilter,
  ] = useState<
    "all" | CampaignStatus
  >("all");

  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(
    null
  );

  const visibleCampaigns =
    useMemo(() => {
      if (filter === "all") {
        return campaigns;
      }

      return campaigns.filter(
        (campaign) =>
          campaign.status === filter
      );
    }, [
      campaigns,
      filter,
    ]);

  const selectedCampaign =
    useMemo(
      () =>
        campaigns.find(
          (campaign) =>
            campaign.id === selectedId
        ) ?? null,
      [
        campaigns,
        selectedId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all: campaigns.length,
        active:
          campaigns.filter(
            (campaign) =>
              campaign.status === "active"
          ).length,
        paused:
          campaigns.filter(
            (campaign) =>
              campaign.status === "paused"
          ).length,
        ended:
          campaigns.filter(
            (campaign) =>
              campaign.status === "ended"
          ).length,
        disabled:
          campaigns.filter(
            (campaign) =>
              campaign.status === "disabled"
          ).length,
      }),
      [campaigns]
    );

  const updateStatus = (
    campaignId: string,
    status: CampaignStatus,
    action: string
  ) => {
    setCampaigns(
      (current) =>
        current.map(
          (campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  status,
                  audit: [
                    {
                      id:
                        `${campaign.id}-${Date.now()}`,
                      action,
                      actor: "Admin",
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

  const pauseCampaign = (
    campaign: CampaignRecord
  ) => {
    if (
      campaign.status !== "active"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "paused",
      "Campaign paused"
    );
  };

  const enableCampaign = (
    campaign: CampaignRecord
  ) => {
    if (
      campaign.type === "programmatic"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "active",
      "Campaign activated"
    );
  };

  const endCampaign = (
    campaign: CampaignRecord
  ) => {
    if (
      campaign.type === "programmatic"
    ) {
      return;
    }

    updateStatus(
      campaign.id,
      "ended",
      "Campaign ended"
    );
  };

  return (
    <div
      className={styles.page}
    >
      <header
        className={styles.header}
      >
        <div>
          <div
            className={styles.eyebrow}
          >
            Commercial control
          </div>

          <h2>
            Monetization
          </h2>

          <p>
            Keep campaign management simple:
            see what is running, where it appears,
            and pause, enable or end only when needed.
          </p>
        </div>

        <div
          className={styles.summary}
        >
          <strong>
            {counts.active}
          </strong>

          <span>
            active campaigns
          </span>
        </div>
      </header>

      <section
        className={styles.panel}
      >
        <div
          className={styles.filters}
        >
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["paused", "Paused"],
              ["ended", "Ended"],
              ["disabled", "Disabled"],
            ] as const
          ).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                className={
                  filter === key
                    ? styles.filterActive
                    : styles.filter
                }
                onClick={() =>
                  setFilter(key)
                }
              >
                {label}

                <span>
                  {counts[key]}
                </span>
              </button>
            )
          )}
        </div>

        <div
          className={styles.tableWrap}
        >
          <table
            className={styles.table}
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
                  Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleCampaigns.map(
                (campaign) => (
                  <tr
                    key={campaign.id}
                  >
                    <td>
                      <button
                        type="button"
                        className={styles.nameButton}
                        onClick={() =>
                          setSelectedId(
                            campaign.id
                          )
                        }
                      >
                        {campaign.name}
                      </button>

                      {campaign.partner ? (
                        <span
                          className={styles.partner}
                        >
                          {campaign.partner}
                        </span>
                      ) : null}
                    </td>

                    <td>
                      {campaignTypeLabel(
                        campaign.type
                      )}
                    </td>

                    <td>
                      {campaign.placement}
                    </td>

                    <td>
                      {campaign.startAt}
                      {campaign.endAt
                        ? ` → ${campaign.endAt}`
                        : ""}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          campaign.status === "active"
                            ? styles.statusActive
                            : campaign.status === "paused"
                            ? styles.statusPaused
                            : campaign.status === "ended"
                            ? styles.statusEnded
                            : styles.statusDisabled
                        }`}
                      >
                        {statusLabel(
                          campaign.status
                        )}
                      </span>
                    </td>

                    <td>
                      {campaign.status === "active" ? (
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() =>
                            pauseCampaign(
                              campaign
                            )
                          }
                        >
                          Pause
                        </button>
                      ) : campaign.status === "paused" ? (
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() =>
                            enableCampaign(
                              campaign
                            )
                          }
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.actionButton}
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
        </div>
      </section>

      <section
        className={styles.note}
      >
        <div>
          <strong>
            Programmatic ads
          </strong>

          <p>
            Google native ads remain disabled
            until production consent, SDK and
            test-ad requirements are ready.
          </p>
        </div>

        <span
          className={styles.disabledBadge}
        >
          Disabled
        </span>
      </section>

      {selectedCampaign ? (
        <div
          className={styles.drawerLayer}
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close campaign details"
            onClick={() =>
              setSelectedId(null)
            }
          />

          <aside
            className={styles.drawer}
          >
            <div
              className={styles.drawerHeader}
            >
              <div>
                <span>
                  {selectedCampaign.id}
                </span>

                <h3>
                  {selectedCampaign.name}
                </h3>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close"
                onClick={() =>
                  setSelectedId(null)
                }
              >
                ×
              </button>
            </div>

            <div
              className={styles.drawerBody}
            >
              <section
                className={styles.detailSection}
              >
                <h4>
                  Campaign
                </h4>

                <dl
                  className={styles.detailList}
                >
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
                      Partner / advertiser
                    </dt>

                    <dd>
                      {selectedCampaign.partner ??
                        "Poster"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Placement
                    </dt>

                    <dd>
                      {selectedCampaign.placement}
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
                      Start
                    </dt>

                    <dd>
                      {selectedCampaign.startAt}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      End
                    </dt>

                    <dd>
                      {selectedCampaign.endAt ??
                        "No fixed end"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section
                className={styles.detailSection}
              >
                <h4>
                  Basic performance
                </h4>

                <div
                  className={styles.metrics}
                >
                  <div>
                    <span>
                      Impressions
                    </span>

                    <strong>
                      {selectedCampaign.impressions.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Clicks
                    </span>

                    <strong>
                      {selectedCampaign.clicks.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </section>

              <section
                className={styles.detailSection}
              >
                <h4>
                  Audit history
                </h4>

                <div
                  className={styles.auditList}
                >
                  {selectedCampaign.audit.map(
                    (entry) => (
                      <div
                        key={entry.id}
                        className={styles.auditItem}
                      >
                        <span
                          className={styles.auditDot}
                        />

                        <div>
                          <strong>
                            {entry.action}
                          </strong>

                          <span>
                            {entry.actor} · {entry.timestamp}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            <div
              className={styles.drawerFooter}
            >
              {selectedCampaign.type === "programmatic" ? (
                <span
                  className={styles.programmaticNote}
                >
                  Programmatic ads are intentionally
                  disabled for now.
                </span>
              ) : selectedCampaign.status === "active" ? (
                <>
                  <button
                    type="button"
                    className={styles.secondaryButton}
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
                    className={styles.dangerButton}
                    onClick={() =>
                      endCampaign(
                        selectedCampaign
                      )
                    }
                  >
                    End campaign
                  </button>
                </>
              ) : selectedCampaign.status === "paused" ? (
                <>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() =>
                      enableCampaign(
                        selectedCampaign
                      )
                    }
                  >
                    Enable
                  </button>

                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() =>
                      endCampaign(
                        selectedCampaign
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
    </div>
  );
}
