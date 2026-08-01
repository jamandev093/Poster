"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  formatAcquisitionMethod,
  formatCopyrightCaseStatus,
  formatCopyrightRequestType,
  formatCopyrightTimestamp,
  formatVerificationCheckStatus,
  formatVerificationStatus,
  useCopyrightActions,
  useCopyrightCaseDetails,
  useCopyrightCases,
  type AdminCopyrightCaseDetails,
  type AdminCopyrightCaseSummary,
  type CopyrightCaseStatus,
  type DiscoveryContentAcquisitionMethod,
} from "./copyright-api";

import styles from "./CopyrightManager.module.css";

type CopyrightFilter =
  | "all"
  | CopyrightCaseStatus;

type CopyrightAction =
  | "remove"
  | "remove_prevent_reimport"
  | "dismiss"
  | "restore";

function requestHeadline(
  item:
    AdminCopyrightCaseSummary
): string {
  switch (
    item.case.requestType
  ) {
    case "copyright_strike":
      return `Copyright strike by ${item.case.claimantName}`;

    case "copyright_request":
      return `Copyright request by ${item.case.claimantName}`;

    case "publisher_removal":
      return `Publisher removal request by ${item.case.claimantName}`;
  }
}

function detailsHeadline(
  details:
    AdminCopyrightCaseDetails
): string {
  return requestHeadline(
    details
  );
}

function displayPolicyLabel(
  method:
    DiscoveryContentAcquisitionMethod
): string {
  switch (
    method
  ) {
    case "api":
      return "Provider-permitted API fields and preview data only.";

    case "rss":
      return "Fields permitted by the authorized publisher feed only.";

    case "embed":
      return "Provider-controlled official embed or oEmbed.";

    case "agreement":
      return "Display rights defined by the publisher agreement.";

    case "link_only":
      return "Minimal link-only discovery with no extracted preview or media.";
  }
}

function formatActionTaken(
  details:
    AdminCopyrightCaseDetails
): string {
  switch (
    details.case.actionTaken
  ) {
    case "removed":
      return "Removed from Poster";

    case "removed_prevent_reimport":
      return "Removed from Poster + prevent re-import";

    case "dismissed":
      return "Dismissed / no action";

    case "restored":
      return "Content restored";

    case null:
      return "No action taken yet";
  }
}

function selectSummaryFromDetails(
  details:
    AdminCopyrightCaseDetails
): AdminCopyrightCaseSummary {
  return {
    case:
      details.case,

    content:
      details.content,
  };
}

export default function CopyrightManager() {
  const {
    data:
      caseList,
    error:
      listError,
    isLoading:
      isListLoading,
    isRefreshing:
      isListRefreshing,
    refresh:
      refreshList,
    replaceCase,
  } =
    useCopyrightCases();

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      CopyrightFilter
    >(
      "needs_action"
    );

  const [
    selectedCaseId,
    setSelectedCaseId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    pendingAction,
    setPendingAction,
  ] =
    useState<
      CopyrightAction |
      null
    >(
      null
    );

  const {
    data:
      selectedDetails,
    error:
      detailsError,
    isLoading:
      isDetailsLoading,
    isRefreshing:
      isDetailsRefreshing,
    refresh:
      refreshDetails,
    replace:
      replaceDetails,
  } =
    useCopyrightCaseDetails(
      selectedCaseId
    );

  const handleCompleted =
    useCallback(
      (
        details:
          AdminCopyrightCaseDetails
      ) => {
        replaceDetails(
          details
        );

        replaceCase(
          selectSummaryFromDetails(
            details
          )
        );

        setPendingAction(
          null
        );
      },
      [
        replaceCase,
        replaceDetails,
      ]
    );

  const {
    action:
      runningAction,
    error:
      actionError,
    isRunning:
      isActionRunning,
    remove,
    dismiss,
    restore,
    clearError,
  } =
    useCopyrightActions({
      onCompleted:
        handleCompleted,
    });

  const cases =
    caseList?.cases ??
    [];

  const visibleCases =
    useMemo(
      () => {
        if (
          activeFilter ===
          "all"
        ) {
          return cases;
        }

        return cases.filter(
          item =>
            item.case.status ===
            activeFilter
        );
      },
      [
        activeFilter,
        cases,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          cases.length,

        needs_action:
          cases.filter(
            item =>
              item.case.status ===
              "needs_action"
          ).length,

        removed:
          cases.filter(
            item =>
              item.case.status ===
              "removed"
          ).length,

        resolved:
          cases.filter(
            item =>
              item.case.status ===
              "resolved"
          ).length,
      }),
      [
        cases,
      ]
    );

  const selectedSummary =
    useMemo(
      () =>
        cases.find(
          item =>
            item.case.id ===
            selectedCaseId
        ) ??
        null,
      [
        cases,
        selectedCaseId,
      ]
    );

  const closeDetails =
    useCallback(
      () => {
        if (
          isActionRunning
        ) {
          return;
        }

        setSelectedCaseId(
          null
        );

        setPendingAction(
          null
        );

        clearError();
      },
      [
        clearError,
        isActionRunning,
      ]
    );

  const openDetails =
    useCallback(
      (
        caseId: string
      ) => {
        clearError();

        setPendingAction(
          null
        );

        setSelectedCaseId(
          caseId
        );
      },
      [
        clearError,
      ]
    );

  const beginAction =
    useCallback(
      (
        caseId: string,
        action:
          CopyrightAction
      ) => {
        clearError();

        setSelectedCaseId(
          caseId
        );

        setPendingAction(
          action
        );
      },
      [
        clearError,
      ]
    );

  const cancelAction =
    useCallback(
      () => {
        if (
          isActionRunning
        ) {
          return;
        }

        clearError();

        setPendingAction(
          null
        );
      },
      [
        clearError,
        isActionRunning,
      ]
    );

  const executeAction =
    useCallback(
      async () => {
        if (
          !selectedDetails ||
          !pendingAction ||
          isActionRunning
        ) {
          return;
        }

        const caseId =
          selectedDetails.case.id;

        if (
          pendingAction ===
          "remove"
        ) {
          await remove(
            caseId,
            {
              expectedRowVersion:
                selectedDetails
                  .case
                  .rowVersion,

              contentExpectedRowVersion:
                selectedDetails
                  .content
                  .rowVersion,

              internalNote:
                null,

              preventReimport:
                false,
            }
          );

          return;
        }

        if (
          pendingAction ===
          "remove_prevent_reimport"
        ) {
          await remove(
            caseId,
            {
              expectedRowVersion:
                selectedDetails
                  .case
                  .rowVersion,

              contentExpectedRowVersion:
                selectedDetails
                  .content
                  .rowVersion,

              internalNote:
                null,

              preventReimport:
                true,
            }
          );

          return;
        }

        if (
          pendingAction ===
          "dismiss"
        ) {
          await dismiss(
            caseId,
            {
              expectedRowVersion:
                selectedDetails
                  .case
                  .rowVersion,
            }
          );

          return;
        }

        await restore(
          caseId,
          {
            expectedRowVersion:
              selectedDetails
                .case
                .rowVersion,

            contentExpectedRowVersion:
              selectedDetails
                .content
                .rowVersion,
          }
        );
      },
      [
        dismiss,
        isActionRunning,
        pendingAction,
        remove,
        restore,
        selectedDetails,
      ]
    );

  const listStatus =
    isListLoading
      ? "Loading Copyright cases"
      : isListRefreshing
        ? "Refreshing Copyright cases"
        : listError
          ? "Copyright case refresh failed"
          : "Copyright cases are current";

  const drawerHeadline =
    selectedDetails
      ? detailsHeadline(
          selectedDetails
        )
      : selectedSummary
        ? requestHeadline(
            selectedSummary
          )
        : "Copyright case";

  const drawerPublicId =
    selectedDetails
      ?.case
      .publicId ??
    selectedSummary
      ?.case
      .publicId ??
    "";

  const drawerContentPublicId =
    selectedDetails
      ?.content
      .publicId ??
    selectedSummary
      ?.content
      .publicId ??
    "";

  const canRestore =
    selectedDetails
      ?.case.status ===
        "removed" &&
    selectedDetails
      .case
      .actionTaken ===
        "removed" &&
    !selectedDetails
      .case
      .preventReimport &&
    selectedDetails
      .content
      .status ===
        "removed" &&
    !selectedDetails
      .content
      .preventReimport;

  return (
    <div
      className={
        styles.page
      }
    >
      <p
        className={
          styles.screenReaderStatus
        }
        role="status"
        aria-live="polite"
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
            Essential control
          </div>

          <h2>
            Copyright
          </h2>

          <p>
            Verify each rights
            request, identify the
            exact Poster content,
            and remove or prevent
            re-import only when
            appropriate.
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

      {listError ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <div>
            <strong>
              Copyright cases could not be refreshed
            </strong>

            <p>
              {listError}

              {caseList
                ? " The last successful snapshot remains visible."
                : ""}
            </p>
          </div>

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
            styles.toolbar
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
                  "removed",
                  "Removed",
                ],

                [
                  "resolved",
                  "Resolved",
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
          </div>

          <div
            className={
              styles.refreshArea
            }
          >
            <span>
              {caseList
                ? `Snapshot ${formatCopyrightTimestamp(
                    caseList.generatedAt
                  )}`
                : isListLoading
                  ? "Loading authoritative cases"
                  : "No successful snapshot"}
            </span>

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
                ? "Refreshing…"
                : "Refresh"}
            </button>
          </div>
        </div>

        <div
          className={
            styles.caseList
          }
        >
          {isListLoading &&
          !caseList ? (
            <div
              className={
                styles.loadingState
              }
            >
              Loading authoritative
              Copyright cases…
            </div>
          ) : visibleCases.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              {listError &&
              !caseList
                ? "Copyright cases are unavailable."
                : "No copyright cases in this view."}
            </div>
          ) : (
            visibleCases.map(
              item => (
                <article
                  key={
                    item.case.id
                  }
                  className={
                    styles.caseCard
                  }
                >
                  <div
                    className={
                      styles.caseTop
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.caseId
                        }
                      >
                        {
                          item.case
                            .publicId
                        }
                        {" · "}
                        {
                          item.content
                            .publicId
                        }
                      </span>

                      <h3>
                        {requestHeadline(
                          item
                        )}
                      </h3>

                      <p>
                        {
                          item.case
                            .claimantType
                        }
                      </p>
                    </div>

                    <span
                      className={`${styles.status} ${
                        item.case.status ===
                        "needs_action"
                          ? styles.statusAttention
                          : item.case.status ===
                            "removed"
                            ? styles.statusRemoved
                            : styles.statusResolved
                      }`}
                    >
                      {formatCopyrightCaseStatus(
                        item.case.status
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
                        Affected
                        content
                      </span>

                      <strong>
                        {
                          item.content
                            .title
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Publisher
                      </span>

                      <strong>
                        {
                          item.content
                            .publisherName
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Verification
                      </span>

                      <strong>
                        {formatVerificationStatus(
                          item.case
                            .verificationStatus
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Received
                      </span>

                      <strong>
                        {formatCopyrightTimestamp(
                          item.case
                            .receivedAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Prevent
                        re-import
                      </span>

                      <strong>
                        {item.case
                          .preventReimport
                          ? "Yes"
                          : "No"}
                      </strong>
                    </div>
                  </div>

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
                        openDetails(
                          item.case.id
                        )
                      }
                    >
                      View details
                    </button>

                    {item.case.status ===
                    "needs_action" ? (
                      <>
                        <button
                          type="button"
                          className={
                            styles.softDangerButton
                          }
                          onClick={() =>
                            beginAction(
                              item.case.id,
                              "remove"
                            )
                          }
                        >
                          Remove
                        </button>

                        <button
                          type="button"
                          className={
                            styles.dangerButton
                          }
                          onClick={() =>
                            beginAction(
                              item.case.id,
                              "remove_prevent_reimport"
                            )
                          }
                        >
                          Remove +
                          prevent
                          re-import
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>

      {selectedCaseId ? (
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
            aria-label="Close copyright details"
            onClick={
              closeDetails
            }
            disabled={
              isActionRunning
            }
          />

          <aside
            className={
              styles.drawer
            }
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
                    drawerPublicId
                  }

                  {drawerPublicId &&
                  drawerContentPublicId
                    ? " · "
                    : ""}

                  {
                    drawerContentPublicId
                  }
                </span>

                <h3>
                  {
                    drawerHeadline
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
                  closeDetails
                }
                disabled={
                  isActionRunning
                }
              >
                ×
              </button>
            </div>

            {detailsError ? (
              <div
                className={
                  styles.drawerError
                }
                role="alert"
              >
                <strong>
                  Copyright details
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
                  disabled={
                    isDetailsLoading ||
                    isDetailsRefreshing
                  }
                >
                  Retry
                </button>
              </div>
            ) : null}

            {actionError ? (
              <div
                className={
                  styles.drawerError
                }
                role="alert"
              >
                <strong>
                  Copyright action
                  failed
                </strong>

                <p>
                  {
                    actionError
                  }
                </p>

                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    clearError
                  }
                >
                  Dismiss message
                </button>
              </div>
            ) : null}

            {isDetailsLoading &&
            !selectedDetails ? (
              <div
                className={
                  styles.drawerLoading
                }
              >
                Loading authoritative
                case details…
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
                      Claimant
                    </h4>

                    <dl
                      className={
                        styles.detailList
                      }
                    >
                      <div>
                        <dt>
                          Issued by
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .case
                              .claimantName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Request type
                        </dt>

                        <dd>
                          {formatCopyrightRequestType(
                            selectedDetails
                              .case
                              .requestType
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Claimant type
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .case
                              .claimantType
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Business email
                        </dt>

                        <dd>
                          {selectedDetails
                            .case
                            .claimantBusinessEmail ??
                            "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Organization
                          website
                        </dt>

                        <dd
                          className={
                            styles.breakText
                          }
                        >
                          {selectedDetails
                            .case
                            .claimantWebsiteUrl ??
                            "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Reference
                        </dt>

                        <dd>
                          {selectedDetails
                            .case
                            .claimantReference ??
                            "Not provided"}
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
                      Cross-verification
                    </h4>

                    <dl
                      className={
                        styles.detailList
                      }
                    >
                      <div>
                        <dt>
                          Verification
                          status
                        </dt>

                        <dd>
                          {formatVerificationStatus(
                            selectedDetails
                              .case
                              .verificationStatus
                          )}
                        </dd>
                      </div>

                      {selectedDetails
                        .verificationChecks
                        .map(
                          check => (
                            <div
                              key={
                                check.id
                              }
                            >
                              <dt>
                                {
                                  check.label
                                }
                              </dt>

                              <dd>
                                {formatVerificationCheckStatus(
                                  check.status
                                )}
                                {" · "}
                                {
                                  check.detail
                                }
                              </dd>
                            </div>
                          )
                        )}
                    </dl>
                  </section>

                  <section
                    className={
                      styles.detailSection
                    }
                  >
                    <h4>
                      Evidence
                    </h4>

                    {selectedDetails
                      .evidence
                      .length ===
                    0 ? (
                      <p
                        className={
                          styles.reason
                        }
                      >
                        No evidence
                        references were
                        recorded.
                      </p>
                    ) : (
                      <dl
                        className={
                          styles.detailList
                        }
                      >
                        {selectedDetails
                          .evidence
                          .map(
                            evidence => (
                              <div
                                key={
                                  evidence.id
                                }
                              >
                                <dt>
                                  {
                                    evidence.label
                                  }
                                </dt>

                                <dd
                                  className={
                                    styles.breakText
                                  }
                                >
                                  {
                                    evidence.referenceValue
                                  }
                                </dd>
                              </div>
                            )
                          )}
                      </dl>
                    )}
                  </section>

                  <section
                    className={
                      styles.detailSection
                    }
                  >
                    <h4>
                      Affected
                      content
                    </h4>

                    <dl
                      className={
                        styles.detailList
                      }
                    >
                      <div>
                        <dt>
                          Poster
                          Content ID
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .content
                              .publicId
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Title
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .content
                              .title
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Publisher
                        </dt>

                        <dd>
                          {
                            selectedDetails
                              .content
                              .publisherName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Acquisition
                          method
                        </dt>

                        <dd>
                          {formatAcquisitionMethod(
                            selectedDetails
                              .content
                              .acquisitionMethod
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Display
                          policy
                        </dt>

                        <dd>
                          {displayPolicyLabel(
                            selectedDetails
                              .content
                              .acquisitionMethod
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Original URL
                        </dt>

                        <dd
                          className={
                            styles.breakText
                          }
                        >
                          {
                            selectedDetails
                              .content
                              .originalUrl
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
                      Request
                    </h4>

                    <p
                      className={
                        styles.reason
                      }
                    >
                      {
                        selectedDetails
                          .case
                          .requestReason
                      }
                    </p>

                    {selectedDetails
                      .case
                      .supportingInformation ? (
                      <p
                        className={
                          styles.supportingInformation
                        }
                      >
                        {
                          selectedDetails
                            .case
                            .supportingInformation
                        }
                      </p>
                    ) : null}

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
                          {formatCopyrightCaseStatus(
                            selectedDetails
                              .case
                              .status
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Verification
                        </span>

                        <strong>
                          {formatVerificationStatus(
                            selectedDetails
                              .case
                              .verificationStatus
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Prevent
                          re-import
                        </span>

                        <strong>
                          {selectedDetails
                            .case
                            .preventReimport
                            ? "Yes"
                            : "No"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Action taken
                        </span>

                        <strong>
                          {formatActionTaken(
                            selectedDetails
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
                      Copyright case
                      audit history
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
                          No case audit
                          events were
                          recorded.
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
                                    {formatCopyrightTimestamp(
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

                  <section
                    className={
                      styles.detailSection
                    }
                  >
                    <h4>
                      Content audit
                      history
                    </h4>

                    <div
                      className={
                        styles.auditList
                      }
                    >
                      {selectedDetails
                        .contentAudit
                        .length ===
                      0 ? (
                        <p
                          className={
                            styles.reason
                          }
                        >
                          No linked
                          content audit
                          events were
                          recorded.
                        </p>
                      ) : (
                        selectedDetails
                          .contentAudit
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
                                    {formatCopyrightTimestamp(
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
                      isActionRunning ||
                      isDetailsRefreshing
                    }
                  >
                    {isDetailsRefreshing
                      ? "Refreshing…"
                      : "Refresh details"}
                  </button>

                  {selectedDetails
                    .case
                    .status ===
                  "needs_action" ? (
                    <>
                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          setPendingAction(
                            "dismiss"
                          )
                        }
                        disabled={
                          isActionRunning
                        }
                      >
                        Dismiss /
                        no action
                      </button>

                      <button
                        type="button"
                        className={
                          styles.softDangerButton
                        }
                        onClick={() =>
                          setPendingAction(
                            "remove"
                          )
                        }
                        disabled={
                          isActionRunning
                        }
                      >
                        Remove
                      </button>

                      <button
                        type="button"
                        className={
                          styles.dangerButton
                        }
                        onClick={() =>
                          setPendingAction(
                            "remove_prevent_reimport"
                          )
                        }
                        disabled={
                          isActionRunning
                        }
                      >
                        Remove +
                        prevent
                        re-import
                      </button>
                    </>
                  ) : canRestore ? (
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        setPendingAction(
                          "restore"
                        )
                      }
                      disabled={
                        isActionRunning
                      }
                    >
                      Restore
                      content
                    </button>
                  ) : selectedDetails
                      .case
                      .status ===
                    "removed" ? (
                    <span
                      className={
                        styles.restoreBlocked
                      }
                    >
                      Restoration is
                      blocked because
                      prevent re-import
                      protection is
                      active.
                    </span>
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
            aria-label="Cancel action"
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
            aria-labelledby="copyright-confirm-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Copyright
              action
            </span>

            <h3
              id="copyright-confirm-title"
            >
              {pendingAction ===
              "remove_prevent_reimport"
                ? "Remove and prevent re-import?"
                : pendingAction ===
                  "remove"
                  ? "Remove this content from Poster?"
                  : pendingAction ===
                    "restore"
                    ? "Restore this content?"
                    : "Dismiss this copyright case?"}
            </h3>

            <p>
              {formatCopyrightRequestType(
                selectedDetails
                  .case
                  .requestType
              )}
              {" by "}
              <strong>
                {
                  selectedDetails
                    .case
                    .claimantName
                }
              </strong>
              .
            </p>

            <p>
              Poster Content ID:{" "}
              <strong>
                {
                  selectedDetails
                    .content
                    .publicId
                }
              </strong>
            </p>

            <p>
              Verification:{" "}
              <strong>
                {formatVerificationStatus(
                  selectedDetails
                    .case
                    .verificationStatus
                )}
              </strong>
            </p>

            {pendingAction ===
            "remove_prevent_reimport" ? (
              <p
                className={
                  styles.confirmWarning
                }
              >
                This authoritative
                decision removes the
                content and blocks
                future re-import of
                the linked discovery
                URL.
              </p>
            ) : null}

            {pendingAction ===
            "restore" ? (
              <p
                className={
                  styles.confirmWarning
                }
              >
                Restoration is allowed
                only for a removable
                copyright decision
                without prevent
                re-import protection.
              </p>
            ) : null}

            {actionError ? (
              <p
                className={
                  styles.confirmError
                }
                role="alert"
              >
                {
                  actionError
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
                    "remove" ||
                  pendingAction ===
                    "remove_prevent_reimport"
                    ? styles.dangerButton
                    : styles.primaryButton
                }
                onClick={
                  executeAction
                }
                disabled={
                  isActionRunning
                }
              >
                {isActionRunning
                  ? runningAction ===
                    "remove"
                    ? "Removing…"
                    : runningAction ===
                      "dismiss"
                      ? "Dismissing…"
                      : "Restoring…"
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}