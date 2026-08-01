"use client";

import Link from "next/link";

import {
  formatAffectedKind,
  formatReportStatus,
  formatReportTimestamp,
  formatReportType,
  type AdminReport,
} from "./reports-api";

import {
  useReportsManager,
} from "./use-reports-manager";

import styles from "./ReportsManager.module.css";

function affectedRecordHref(
  report:
    AdminReport
): string {
  const encodedId =
    encodeURIComponent(
      report.affectedRecordId
    );

  switch (
    report.affectedKind
  ) {
    case "content":
      return `/content?record=${encodedId}`;

    case "source":
      return `/sources?record=${encodedId}`;

    case "campaign":
      return `/monetization?record=${encodedId}`;
  }
}

export default function ReportsManager() {
  const {
    reportList,
    visibleReports,
    counts,

    activeFilter,
    setActiveFilter,

    selectedReport,
    selectedDetails,

    pendingAction,
    runningAction,

    matchingCopyrightCase,

    listError,
    detailsError,
    actionError,
    routingError,
    copyrightListError,

    isListLoading,
    isListRefreshing,
    isDetailsLoading,
    isDetailsRefreshing,
    isActionRunning,
    isCopyrightListLoading,
    isCopyrightListRefreshing,

    listStatus,

    refreshList,
    refreshDetails,
    refreshCopyrightList,

    openReport,
    beginAction,
    cancelAction,
    closeDrawer,
    executeAction,
    clearActionErrors,
  } =
    useReportsManager();

  const displayedError =
    actionError ??
    routingError;

  return (
    <div
      className={
        styles.page
      }
    >
      <p
        role="status"
        aria-live="polite"
        style={{
          position:
            "absolute",

          width:
            1,

          height:
            1,

          overflow:
            "hidden",

          clip:
            "rect(0 0 0 0)",
        }}
      >
        {listStatus}
      </p>

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
            See only reports that
            may need action. Every
            report keeps its exact
            affected record and
            immutable operational
            history.
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
            Copyright stays in the
            dedicated legal workflow.
          </strong>

          <p>
            Copyright reports link
            to an authoritative
            Copyright case instead
            of creating a parallel
            takedown process.
          </p>
        </div>
      </section>

      {listError ? (
        <section
          className={
            styles.notice
          }
          role="alert"
        >
          <div
            className={
              styles.noticeMark
            }
          >
            !
          </div>

          <div>
            <strong>
              Reports could not be
              refreshed
            </strong>

            <p>
              {listError}

              {reportList
                ? " The last successful snapshot remains visible."
                : ""}
            </p>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                refreshList
              }
              disabled={
                isListLoading ||
                isListRefreshing
              }
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section
        className={
          styles.panel
        }
        aria-busy={
          isListLoading ||
          isListRefreshing
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
                key={
                  key
                }
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

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              refreshList
            }
            disabled={
              isListLoading ||
              isListRefreshing
            }
          >
            {isListRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <div
          className={
            styles.reportList
          }
        >
          {isListLoading &&
          !reportList ? (
            <div
              className={
                styles.empty
              }
            >
              Loading authoritative
              reports...
            </div>
          ) : visibleReports.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              {listError &&
              !reportList
                ? "Reports are unavailable."
                : "No reports in this view."}
            </div>
          ) : (
            visibleReports.map(
              item => {
                const report =
                  item.report;

                return (
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
                              report.publicId
                            }
                            {" · "}
                            {
                              report.affectedRecordId
                            }
                          </span>

                          <span
                            className={
                              report.reportType ===
                              "copyright"
                                ? styles.typeCopyright
                                : styles.typeTag
                            }
                          >
                            {formatReportType(
                              report.reportType
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
                              report.reporterName
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
                        {formatReportStatus(
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
                          {formatReportType(
                            report.reportType
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Record ID
                        </span>

                        <strong>
                          {
                            report.affectedRecordId
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Received
                        </span>

                        <strong>
                          {formatReportTimestamp(
                            report.receivedAt
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Copyright
                        </span>

                        <strong>
                          {report.routedToCopyright
                            ? "Routed"
                            : report.reportType ===
                              "copyright"
                              ? "Applicable"
                              : "No"}
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
                        Open affected record
                      </Link>

                      {report.status ===
                      "needs_action" ? (
                        report.reportType ===
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
                            Send to Copyright
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
                );
              }
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
            disabled={
              isActionRunning
            }
          />

          <aside
            className={
              styles.drawer
            }
            aria-label={`Report ${selectedReport.publicId}`}
            aria-busy={
              isDetailsLoading ||
              isDetailsRefreshing
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
                    selectedReport.publicId
                  }
                  {" · "}
                  {
                    selectedReport.affectedRecordId
                  }
                </span>

                <h3>
                  {formatReportType(
                    selectedReport.reportType
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
                disabled={
                  isActionRunning
                }
              >
                ×
              </button>
            </div>

            {detailsError ? (
              <section
                className={
                  styles.notice
                }
                role="alert"
              >
                <div
                  className={
                    styles.noticeMark
                  }
                >
                  !
                </div>

                <div>
                  <strong>
                    Report details
                    could not be loaded
                  </strong>

                  <p>
                    {
                      detailsError
                    }
                  </p>

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      refreshDetails
                    }
                  >
                    Retry
                  </button>
                </div>
              </section>
            ) : null}

            {displayedError ? (
              <section
                className={
                  styles.notice
                }
                role="alert"
              >
                <div
                  className={
                    styles.noticeMark
                  }
                >
                  !
                </div>

                <div>
                  <strong>
                    Report action failed
                  </strong>

                  <p>
                    {
                      displayedError
                    }
                  </p>

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      clearActionErrors
                    }
                  >
                    Dismiss message
                  </button>
                </div>
              </section>
            ) : null}

            {isDetailsLoading &&
            !selectedDetails ? (
              <div
                className={
                  styles.empty
                }
              >
                Loading authoritative
                report details...
              </div>
            ) : selectedDetails ? (
              <>
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
                            selectedDetails
                              .report
                              .reporterName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Reference
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .report
                              .reporterReference
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Received
                        </dt>

                        <dd>
                          {formatReportTimestamp(
                            selectedDetails
                              .report
                              .receivedAt
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
                          selectedDetails.report
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
                            selectedDetails
                              .report
                              .affectedRecordId
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Record type
                        </dt>

                        <dd>
                          {formatAffectedKind(
                            selectedDetails
                              .report
                              .affectedKind
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Record
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .report
                              .affectedTitle
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Context
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .report
                              .affectedMetadata
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
                        selectedDetails
                          .report
                          .reason
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
                          {formatReportStatus(
                            selectedDetails
                              .report
                              .status
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Copyright workflow
                        </span>

                        <strong>
                          {selectedDetails
                            .report
                            .routedToCopyright
                            ? "Routed"
                            : selectedDetails
                                .report
                                .reportType ===
                              "copyright"
                              ? "Needs routing"
                              : "Not applicable"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {selectedDetails
                    .report
                    .reportType ===
                  "copyright" ? (
                    <section
                      className={
                        styles.copyrightNotice
                      }
                    >
                      <strong>
                        Dedicated Copyright
                        handling
                      </strong>

                      <p>
                        {matchingCopyrightCase
                          ? `Matched authoritative case ${matchingCopyrightCase.case.publicId} for ${matchingCopyrightCase.content.publicId}.`
                          : "No matching authoritative Copyright case is currently available for this affected content."}
                      </p>

                      {copyrightListError ? (
                        <p>
                          {
                            copyrightListError
                          }
                        </p>
                      ) : null}

                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={
                          refreshCopyrightList
                        }
                        disabled={
                          isCopyrightListLoading ||
                          isCopyrightListRefreshing
                        }
                      >
                        {isCopyrightListRefreshing
                          ? "Refreshing..."
                          : "Refresh Copyright cases"}
                      </button>

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
                      {selectedDetails
                        .audit
                        .length ===
                      0 ? (
                        <p
                          className={
                            styles.reason
                          }
                        >
                          No audit events
                          were recorded.
                        </p>
                      ) : (
                        selectedDetails
                          .audit
                          .map(
                            entry => (
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
                                  aria-hidden="true"
                                />

                                <div>
                                  <strong>
                                    {
                                      entry.action
                                    }
                                  </strong>

                                  <span>
                                    {
                                      entry.actorLabel
                                    }
                                    {" · "}
                                    {formatReportTimestamp(
                                      entry.occurredAt
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
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
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      refreshDetails
                    }
                    disabled={
                      isDetailsRefreshing ||
                      isActionRunning
                    }
                  >
                    {isDetailsRefreshing
                      ? "Refreshing..."
                      : "Refresh details"}
                  </button>

                  <Link
                    href={affectedRecordHref(
                      selectedDetails.report
                    )}
                    className={
                      styles.secondaryLink
                    }
                  >
                    Open affected record
                  </Link>

                  {selectedDetails
                    .report
                    .status ===
                  "needs_action" ? (
                    selectedDetails
                      .report
                      .reportType ===
                    "copyright" ? (
                      <>
                        <button
                          type="button"
                          className={
                            styles.dismissButton
                          }
                          onClick={() =>
                            beginAction(
                              selectedDetails
                                .report
                                .id,
                              "dismiss"
                            )
                          }
                          disabled={
                            isActionRunning
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
                              selectedDetails
                                .report
                                .id,
                              "route_copyright"
                            )
                          }
                          disabled={
                            isActionRunning
                          }
                        >
                          Send to Copyright
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
                            beginAction(
                              selectedDetails
                                .report
                                .id,
                              "dismiss"
                            )
                          }
                          disabled={
                            isActionRunning
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
                              selectedDetails
                                .report
                                .id,
                              "resolve"
                            )
                          }
                          disabled={
                            isActionRunning
                          }
                        >
                          Resolve
                        </button>
                      </>
                    )
                  ) : selectedDetails
                      .report
                      .routedToCopyright ? (
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
              </>
            ) : null}
          </aside>
        </div>
      ) : null}

      {selectedDetails &&
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
            onClick={
              cancelAction
            }
            disabled={
              isActionRunning
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
                  selectedDetails
                    .report
                    .publicId
                }
              </strong>
              {" · "}
              {
                selectedDetails
                  .report
                  .affectedRecordId
              }
              {" · "}
              {formatReportType(
                selectedDetails
                  .report
                  .reportType
              )}
            </p>

            {pendingAction ===
            "resolve" ? (
              <p>
                This records an
                authoritative resolved
                decision and immutable
                audit event.
              </p>
            ) : null}

            {pendingAction ===
            "dismiss" ? (
              <p>
                Use dismissal only
                when no further
                operational action is
                required.
              </p>
            ) : null}

            {pendingAction ===
            "route_copyright" ? (
              <p
                className={
                  styles.confirmWarning
                }
              >
                {matchingCopyrightCase
                  ? `This will link the report to authoritative Copyright case ${matchingCopyrightCase.case.publicId}.`
                  : "Routing is blocked until an authoritative Copyright case matches the affected content."}
              </p>
            ) : null}

            {displayedError ? (
              <p
                className={
                  styles.confirmWarning
                }
                role="alert"
              >
                {
                  displayedError
                }
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
                onClick={
                  cancelAction
                }
                disabled={
                  isActionRunning
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
                disabled={
                  isActionRunning ||
                  (
                    pendingAction ===
                      "route_copyright" &&
                    !matchingCopyrightCase
                  )
                }
              >
                {isActionRunning
                  ? runningAction ===
                    "resolve"
                    ? "Resolving..."
                    : runningAction ===
                      "dismiss"
                      ? "Dismissing..."
                      : "Routing..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}