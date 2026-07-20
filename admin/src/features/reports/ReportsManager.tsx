"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import styles from "./ReportsManager.module.css";

type ReportStatus =
  | "needs_action"
  | "resolved"
  | "dismissed";

type ReportType =
  | "misleading_content"
  | "broken_link"
  | "inappropriate_content"
  | "publisher_issue"
  | "commercial_report"
  | "copyright";

type ReportAction =
  | "resolve"
  | "dismiss"
  | "route_copyright";

type AffectedKind =
  | "Content"
  | "Source"
  | "Campaign";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface ReportRecord {
  id: string;

  type: ReportType;

  reporter: string;
  reporterReference: string;

  affectedKind:
    AffectedKind;

  affectedId: string;

  affectedTitle: string;
  affectedMeta: string;

  reason: string;

  receivedAt: string;

  status:
    ReportStatus;

  routedToCopyright:
    boolean;

  audit:
    AuditEntry[];
}

const INITIAL_REPORTS:
  ReportRecord[] = [
  {
    id: "RPT-2046",

    type:
      "misleading_content",

    reporter:
      "Aarav S.",

    reporterReference:
      "User U-8250",

    affectedKind:
      "Content",

    affectedId:
      "CNT-2003",

    affectedTitle:
      "AI agents are changing software workflows",

    affectedMeta:
      "Example Tech · Article record",

    reason:
      "The report says the headline overstates the source material and may give readers a misleading impression of the underlying research.",

    receivedAt:
      "19 Jul 2026 · 12:14",

    status:
      "needs_action",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2046-1",

        action:
          "Report received",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 12:14",
      },
    ],
  },

  {
    id: "RPT-2045",

    type:
      "broken_link",

    reporter:
      "Meera K.",

    reporterReference:
      "User U-7811",

    affectedKind:
      "Content",

    affectedId:
      "CNT-2002",

    affectedTitle:
      "New climate research explained",

    affectedMeta:
      "Example Science · External URL",

    reason:
      "The original publisher URL returns an unavailable page and the content can no longer be opened from Poster.",

    receivedAt:
      "19 Jul 2026 · 11:42",

    status:
      "needs_action",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2045-1",

        action:
          "Broken-link report received",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 11:42",
      },
    ],
  },

  {
    id: "RPT-2044",

    type:
      "publisher_issue",

    reporter:
      "Publisher representative",

    reporterReference:
      "Example News · publisher contact",

    affectedKind:
      "Source",

    affectedId:
      "SRC-1003",

    affectedTitle:
      "Example News",

    affectedMeta:
      "Authorized RSS · Sync requires review",

    reason:
      "The publisher reported that its feed configuration has changed and requested that Poster verify the current source before further synchronization.",

    receivedAt:
      "19 Jul 2026 · 10:31",

    status:
      "needs_action",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2044-1",

        action:
          "Publisher issue received",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 10:31",
      },
    ],
  },

  {
    id: "RPT-2043",

    type:
      "commercial_report",

    reporter:
      "Nisha P.",

    reporterReference:
      "User U-6504",

    affectedKind:
      "Campaign",

    affectedId:
      "CMP-3001",

    affectedTitle:
      "Cloud Skills Direct Sponsorship",

    affectedMeta:
      "Direct sponsorship · Home placement",

    reason:
      "The user reported that the commercial destination appeared unrelated to the disclosure shown on the card.",

    receivedAt:
      "19 Jul 2026 · 09:48",

    status:
      "needs_action",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2043-1",

        action:
          "Commercial report received",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 09:48",
      },
    ],
  },

  {
    id: "RPT-2042",

    type:
      "copyright",

    reporter:
      "Rights contact",

    reporterReference:
      "BBC · rights department",

    affectedKind:
      "Content",

    affectedId:
      "CNT-2001",

    affectedTitle:
      "AI regulation story",

    affectedMeta:
      "BBC · Copyright concern",

    reason:
      "The reporter states that the content preview may be subject to a publisher removal request and should be reviewed through the dedicated copyright workflow.",

    receivedAt:
      "19 Jul 2026 · 09:22",

    status:
      "needs_action",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2042-1",

        action:
          "Potential copyright report received",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 09:22",
      },
    ],
  },

  {
    id: "RPT-2041",

    type:
      "inappropriate_content",

    reporter:
      "Rohan D.",

    reporterReference:
      "User U-5410",

    affectedKind:
      "Content",

    affectedId:
      "CNT-2041",

    affectedTitle:
      "Historical conflict documentary",

    affectedMeta:
      "Example Documentary · Content record",

    reason:
      "The report was reviewed and the content was found to be legitimate educational and historical material rather than prohibited content.",

    receivedAt:
      "18 Jul 2026 · 18:16",

    status:
      "dismissed",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2041-2",

        action:
          "Dismissed — legitimate educational context",

        actor:
          "Admin",

        timestamp:
          "18 Jul 2026 · 18:29",
      },

      {
        id:
          "RPT-2041-1",

        action:
          "Inappropriate-content report received",

        actor:
          "System",

        timestamp:
          "18 Jul 2026 · 18:16",
      },
    ],
  },

  {
    id: "RPT-2040",

    type:
      "broken_link",

    reporter:
      "System-assisted report",

    reporterReference:
      "User U-4108",

    affectedKind:
      "Content",

    affectedId:
      "CNT-2040",

    affectedTitle:
      "Research publication archive",

    affectedMeta:
      "Example Research · External URL",

    reason:
      "The affected URL was checked and the destination was restored by the publisher.",

    receivedAt:
      "18 Jul 2026 · 15:03",

    status:
      "resolved",

    routedToCopyright:
      false,

    audit: [
      {
        id:
          "RPT-2040-2",

        action:
          "Resolved — destination available again",

        actor:
          "Admin",

        timestamp:
          "18 Jul 2026 · 15:20",
      },

      {
        id:
          "RPT-2040-1",

        action:
          "Broken-link report received",

        actor:
          "System",

        timestamp:
          "18 Jul 2026 · 15:03",
      },
    ],
  },
];

function statusLabel(
  status: ReportStatus
): string {
  switch (status) {
    case "needs_action":
      return "Needs action";

    case "resolved":
      return "Resolved";

    case "dismissed":
      return "Dismissed";
  }
}

function typeLabel(
  type: ReportType
): string {
  switch (type) {
    case "misleading_content":
      return "Misleading content";

    case "broken_link":
      return "Broken link";

    case "inappropriate_content":
      return "Inappropriate content";

    case "publisher_issue":
      return "Publisher issue";

    case "commercial_report":
      return "Commercial / ad";

    case "copyright":
      return "Copyright";
  }
}

function affectedRecordHref(
  report: ReportRecord
): string {
  const encodedId =
    encodeURIComponent(
      report.affectedId
    );

  switch (
    report.affectedKind
  ) {
    case "Content":
      return `/content?record=${encodedId}`;

    case "Source":
      return `/sources?record=${encodedId}`;

    case "Campaign":
      return `/monetization?record=${encodedId}`;
  }
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

export default function ReportsManager() {
  const [
    reports,
    setReports,
  ] = useState<
    ReportRecord[]
  >(
    INITIAL_REPORTS
  );

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<
    "all" |
      ReportStatus
  >(
    "needs_action"
  );

  const [
    selectedReportId,
    setSelectedReportId,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    pendingAction,
    setPendingAction,
  ] = useState<
    ReportAction | null
  >(
    null
  );

  const visibleReports =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return reports;
      }

      return reports.filter(
        (
          report
        ) =>
          report.status ===
          activeFilter
      );
    }, [
      activeFilter,
      reports,
    ]);

  const selectedReport =
    useMemo(
      () =>
        reports.find(
          (
            report
          ) =>
            report.id ===
            selectedReportId
        ) ?? null,

      [
        reports,
        selectedReportId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          reports.length,

        needs_action:
          reports.filter(
            (
              report
            ) =>
              report.status ===
              "needs_action"
          ).length,

        resolved:
          reports.filter(
            (
              report
            ) =>
              report.status ===
              "resolved"
          ).length,

        dismissed:
          reports.filter(
            (
              report
            ) =>
              report.status ===
              "dismissed"
          ).length,
      }),

      [
        reports,
      ]
    );

  const updateReport = (
    reportId: string,

    updater: (
      report:
        ReportRecord
    ) => ReportRecord
  ) => {
    setReports(
      (
        current
      ) =>
        current.map(
          (
            report
          ) =>
            report.id ===
            reportId
              ? updater(
                  report
                )
              : report
        )
    );
  };

  const openReport = (
    reportId: string
  ) => {
    setSelectedReportId(
      reportId
    );

    setPendingAction(
      null
    );
  };

  const beginAction = (
    reportId: string,

    action:
      ReportAction
  ) => {
    setSelectedReportId(
      reportId
    );

    setPendingAction(
      action
    );
  };

  const closeDrawer =
    () => {
      setSelectedReportId(
        null
      );

      setPendingAction(
        null
      );
    };

  const executeAction =
    () => {
      if (
        !selectedReport ||
        !pendingAction
      ) {
        return;
      }

      const action =
        pendingAction;

      updateReport(
        selectedReport.id,

        (
          current
        ) => {
          const auditBase =
            {
              id:
                `${current.id}-${Date.now()}`,

              actor:
                "Admin",

              timestamp:
                nowLabel(),
            };

          switch (
            action
          ) {
            case "resolve":
              return {
                ...current,

                status:
                  "resolved",

                audit: [
                  {
                    ...auditBase,

                    action:
                      "Report resolved",
                  },

                  ...current.audit,
                ],
              };

            case "dismiss":
              return {
                ...current,

                status:
                  "dismissed",

                audit: [
                  {
                    ...auditBase,

                    action:
                      "Report dismissed — no further action",
                  },

                  ...current.audit,
                ],
              };

            case "route_copyright":
              return {
                ...current,

                status:
                  "resolved",

                routedToCopyright:
                  true,

                audit: [
                  {
                    ...auditBase,

                    action:
                      `Routed ${current.affectedId} to Copyright management`,
                  },

                  ...current.audit,
                ],
              };
          }
        }
      );

      setPendingAction(
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
            Exception handling
          </div>

          <h2>
            Reports
          </h2>

          <p>
            Review only reports
            that may require an
            operator decision.
            Every report keeps an
            exact affected record
            reference.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {
              counts.needs_action
            }
          </strong>

          <span>
            need action
          </span>
        </div>
      </header>

      <section
        className={
          styles.notice
        }
      >
        <div
          className={
            styles.noticeMark
          }
        >
          i
        </div>

        <div>
          <strong>
            Copyright stays in
            the dedicated legal
            workflow.
          </strong>

          <p>
            Copyright-related
            reports are routed to
            Copyright instead of
            creating a second
            parallel takedown
            system.
          </p>
        </div>
      </section>

      <section
        className={
          styles.panel
        }
      >
        <div
          className={
            styles.filters
          }
        >
          {(
            [
              [
                "needs_action",
                "Needs action",
              ],

              [
                "resolved",
                "Resolved",
              ],

              [
                "dismissed",
                "Dismissed",
              ],

              [
                "all",
                "All",
              ],
            ] as const
          ).map(
            ([
              key,
              label,
            ]) => (
              <button
                key={key}
                type="button"
                className={
                  activeFilter ===
                  key
                    ? styles.filterActive
                    : styles.filter
                }
                onClick={() =>
                  setActiveFilter(
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
        </div>

        <div
          className={
            styles.reportList
          }
        >
          {visibleReports.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No reports in this
              view.
            </div>
          ) : (
            visibleReports.map(
              (
                report
              ) => (
                <article
                  key={
                    report.id
                  }
                  className={
                    styles.reportCard
                  }
                >
                  <div
                    className={
                      styles.reportTop
                    }
                  >
                    <div
                      className={
                        styles.reportHeading
                      }
                    >
                      <div
                        className={
                          styles.reportLabels
                        }
                      >
                        <span
                          className={
                            styles.reportId
                          }
                        >
                          {
                            report.id
                          }
                          {" · "}
                          {
                            report.affectedId
                          }
                        </span>

                        <span
                          className={
                            report.type ===
                            "copyright"
                              ? styles.typeCopyright
                              : styles.typeTag
                          }
                        >
                          {typeLabel(
                            report.type
                          )}
                        </span>
                      </div>

                      <h3>
                        {
                          report.affectedTitle
                        }
                      </h3>

                      <p>
                        Reported by{" "}
                        <strong>
                          {
                            report.reporter
                          }
                        </strong>
                      </p>
                    </div>

                    <span
                      className={`${styles.status} ${
                        report.status ===
                        "needs_action"
                          ? styles.statusAttention
                          : report.status ===
                            "resolved"
                          ? styles.statusResolved
                          : styles.statusDismissed
                      }`}
                    >
                      {statusLabel(
                        report.status
                      )}
                    </span>
                  </div>

                  <div
                    className={
                      styles.metaGrid
                    }
                  >
                    <div>
                      <span>
                        Type
                      </span>

                      <strong>
                        {typeLabel(
                          report.type
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Record ID
                      </span>

                      <strong>
                        {
                          report.affectedId
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Received
                      </span>

                      <strong>
                        {
                          report.receivedAt
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Copyright
                      </span>

                      <strong>
                        {
                          report.routedToCopyright
                            ? "Routed"
                            : report.type ===
                              "copyright"
                            ? "Applicable"
                            : "No"
                        }
                      </strong>
                    </div>
                  </div>

                  <p
                    className={
                      styles.reasonPreview
                    }
                  >
                    {
                      report.reason
                    }
                  </p>

                  <div
                    className={
                      styles.cardActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        openReport(
                          report.id
                        )
                      }
                    >
                      View details
                    </button>

                    <Link
                      href={affectedRecordHref(
                        report
                      )}
                      className={
                        styles.secondaryLink
                      }
                    >
                      Open affected
                      record
                    </Link>

                    {report.status ===
                    "needs_action" ? (
                      report.type ===
                      "copyright" ? (
                        <button
                          type="button"
                          className={
                            styles.primaryButton
                          }
                          onClick={() =>
                            beginAction(
                              report.id,
                              "route_copyright"
                            )
                          }
                        >
                          Send to
                          Copyright
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={
                              styles.dismissButton
                            }
                            onClick={() =>
                              beginAction(
                                report.id,
                                "dismiss"
                              )
                            }
                          >
                            Dismiss
                          </button>

                          <button
                            type="button"
                            className={
                              styles.primaryButton
                            }
                            onClick={() =>
                              beginAction(
                                report.id,
                                "resolve"
                              )
                            }
                          >
                            Resolve
                          </button>
                        </>
                      )
                    ) : null}
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>

      {selectedReport ? (
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
            aria-label="Close report details"
            onClick={
              closeDrawer
            }
          />

          <aside
            className={
              styles.drawer
            }
            aria-label={`Report ${selectedReport.id}`}
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  {
                    selectedReport.id
                  }
                  {" · "}
                  {
                    selectedReport.affectedId
                  }
                </span>

                <h3>
                  {typeLabel(
                    selectedReport.type
                  )}
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={
                  closeDrawer
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
                  Reporter
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Reporter
                    </dt>

                    <dd>
                      {
                        selectedReport.reporter
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Reference
                    </dt>

                    <dd>
                      {
                        selectedReport.reporterReference
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Received
                    </dt>

                    <dd>
                      {
                        selectedReport.receivedAt
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
                <div
                  className={
                    styles.sectionTitleRow
                  }
                >
                  <h4>
                    Affected record
                  </h4>

                  <Link
                    href={affectedRecordHref(
                      selectedReport
                    )}
                    className={
                      styles.inlineLink
                    }
                  >
                    Open
                  </Link>
                </div>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Record ID
                    </dt>

                    <dd>
                      {
                        selectedReport.affectedId
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Record type
                    </dt>

                    <dd>
                      {
                        selectedReport.affectedKind
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Record
                    </dt>

                    <dd>
                      {
                        selectedReport.affectedTitle
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Context
                    </dt>

                    <dd>
                      {
                        selectedReport.affectedMeta
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
                  Report reason
                </h4>

                <p
                  className={
                    styles.reason
                  }
                >
                  {
                    selectedReport.reason
                  }
                </p>

                <div
                  className={
                    styles.requestSummary
                  }
                >
                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {statusLabel(
                        selectedReport.status
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Copyright
                      workflow
                    </span>

                    <strong>
                      {
                        selectedReport.routedToCopyright
                          ? "Routed"
                          : selectedReport.type ===
                              "copyright"
                          ? "Needs routing"
                          : "Not applicable"
                      }
                    </strong>
                  </div>
                </div>
              </section>

              {selectedReport.type ===
              "copyright" ? (
                <section
                  className={
                    styles.copyrightNotice
                  }
                >
                  <strong>
                    Dedicated
                    copyright handling
                  </strong>

                  <p>
                    This report
                    identifies{" "}
                    {
                      selectedReport.affectedId
                    }
                    . Copyright
                    ownership,
                    claimant identity,
                    removal,
                    prevent re-import,
                    restoration, and
                    legal audit history
                    remain in the
                    Copyright module.
                  </p>

                  <Link
                    href="/copyright"
                    className={
                      styles.copyrightLink
                    }
                  >
                    Open Copyright
                  </Link>
                </section>
              ) : null}

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
                  {selectedReport.audit.map(
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
                            }{" "}
                            ·{" "}
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
                href={affectedRecordHref(
                  selectedReport
                )}
                className={
                  styles.secondaryLink
                }
              >
                Open affected
                record
              </Link>

              {selectedReport.status ===
              "needs_action" ? (
                selectedReport.type ===
                "copyright" ? (
                  <>
                    <button
                      type="button"
                      className={
                        styles.dismissButton
                      }
                      onClick={() =>
                        setPendingAction(
                          "dismiss"
                        )
                      }
                    >
                      Dismiss
                    </button>

                    <button
                      type="button"
                      className={
                        styles.primaryButton
                      }
                      onClick={() =>
                        setPendingAction(
                          "route_copyright"
                        )
                      }
                    >
                      Send to
                      Copyright
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={
                        styles.dismissButton
                      }
                      onClick={() =>
                        setPendingAction(
                          "dismiss"
                        )
                      }
                    >
                      Dismiss
                    </button>

                    <button
                      type="button"
                      className={
                        styles.primaryButton
                      }
                      onClick={() =>
                        setPendingAction(
                          "resolve"
                        )
                      }
                    >
                      Resolve
                    </button>
                  </>
                )
              ) : selectedReport.routedToCopyright ? (
                <Link
                  href="/copyright"
                  className={
                    styles.primaryLink
                  }
                >
                  Open Copyright
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedReport &&
      pendingAction ? (
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
            aria-label="Cancel report action"
            onClick={() =>
              setPendingAction(
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
            aria-labelledby="report-confirm-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Report action
            </span>

            <h3
              id="report-confirm-title"
            >
              {pendingAction ===
              "resolve"
                ? "Resolve this report?"
                : pendingAction ===
                    "dismiss"
                ? "Dismiss this report?"
                : "Send this report to Copyright?"}
            </h3>

            <p>
              <strong>
                {
                  selectedReport.id
                }
              </strong>
              {" · "}
              {
                selectedReport.affectedId
              }
              {" · "}
              {typeLabel(
                selectedReport.type
              )}
            </p>

            {pendingAction ===
            "resolve" ? (
              <p>
                This marks the
                report as handled
                in the current
                Reports queue.
              </p>
            ) : null}

            {pendingAction ===
            "dismiss" ? (
              <p>
                Use dismissal only
                when no further
                operational action
                is required.
              </p>
            ) : null}

            {pendingAction ===
            "route_copyright" ? (
              <p
                className={
                  styles.confirmWarning
                }
              >
                This frontend
                records the routing
                decision locally for{" "}
                {
                  selectedReport.affectedId
                }
                . The future backend
                will create or link
                the real Copyright
                case and persist the
                shared relationship.
              </p>
            ) : null}

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
                  setPendingAction(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  pendingAction ===
                  "dismiss"
                    ? styles.dismissButton
                    : styles.primaryButton
                }
                onClick={
                  executeAction
                }
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}