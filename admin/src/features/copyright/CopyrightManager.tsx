"use client";

import {
  useMemo,
  useState,
} from "react";

import styles from "./CopyrightManager.module.css";

type CopyrightStatus =
  | "needs_action"
  | "removed"
  | "resolved";

type CopyrightAction =
  | "remove"
  | "remove_prevent_reimport"
  | "dismiss"
  | "restore";

type CopyrightRequestType =
  | "copyright_strike"
  | "copyright_request"
  | "publisher_removal";

type AcquisitionMethod =
  | "API"
  | "RSS"
  | "Embed"
  | "Agreement"
  | "Link-only";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface CopyrightCase {
  id: string;

  requestType:
    CopyrightRequestType;

  claimant: string;
  claimantType: string;
  claimantContact?: string;
  reference?: string;

  contentId: string;
  contentTitle: string;
  publisher: string;
  originalUrl: string;

  acquisitionMethod:
    AcquisitionMethod;

  reason: string;
  receivedAt: string;

  status: CopyrightStatus;

  preventReimport: boolean;

  actionTaken?: string;

  audit: AuditEntry[];
}

const INITIAL_CASES: CopyrightCase[] = [
  {
    id: "CR-1001",

    requestType:
      "copyright_strike",

    claimant: "BBC",

    claimantType:
      "Publisher / rights holder",

    claimantContact:
      "rights@example-bbc.test",

    reference:
      "BBC-RIGHTS-2026-0719",

    contentId:
      "CNT-2001",

    contentTitle:
      "AI regulation story",

    publisher:
      "BBC",

    originalUrl:
      "https://example.com/bbc/ai-regulation",

    acquisitionMethod:
      "RSS",

    reason:
      "Rights holder requested that this specific content record no longer be displayed by Poster.",

    receivedAt:
      "19 Jul 2026",

    status:
      "needs_action",

    preventReimport:
      false,

    audit: [
      {
        id:
          "audit-1001-1",

        action:
          "Copyright strike received from BBC",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 09:20",
      },
    ],
  },

  {
    id: "CR-1000",

    requestType:
      "publisher_removal",

    claimant:
      "Example Media",

    claimantType:
      "Publisher",

    claimantContact:
      "legal@example-media.test",

    reference:
      "EM-4471",

    contentId:
      "CNT-2000",

    contentTitle:
      "Market analysis article",

    publisher:
      "Example Media",

    originalUrl:
      "https://example.com/market-analysis",

    acquisitionMethod:
      "API",

    reason:
      "Publisher requested removal and exclusion from future ingestion.",

    receivedAt:
      "18 Jul 2026",

    status:
      "removed",

    preventReimport:
      true,

    actionTaken:
      "Removed from Poster + prevent re-import",

    audit: [
      {
        id:
          "audit-1000-2",

        action:
          "Removed from Poster + prevent re-import",

        actor:
          "Admin",

        timestamp:
          "18 Jul 2026 · 16:42",
      },

      {
        id:
          "audit-1000-1",

        action:
          "Copyright request received from Example Media",

        actor:
          "System",

        timestamp:
          "18 Jul 2026 · 16:31",
      },
    ],
  },
];

function statusLabel(
  status: CopyrightStatus
): string {
  switch (status) {
    case "needs_action":
      return "Needs action";

    case "removed":
      return "Removed";

    case "resolved":
      return "Resolved";
  }
}

function requestTypeLabel(
  type: CopyrightRequestType
): string {
  switch (type) {
    case "copyright_strike":
      return "Copyright strike";

    case "copyright_request":
      return "Copyright request";

    case "publisher_removal":
      return "Publisher removal request";
  }
}

function requestHeadline(
  item: CopyrightCase
): string {
  switch (item.requestType) {
    case "copyright_strike":
      return `Copyright strike by ${item.claimant}`;

    case "copyright_request":
      return `Copyright request by ${item.claimant}`;

    case "publisher_removal":
      return `Publisher removal request by ${item.claimant}`;
  }
}

function acquisitionMethodLabel(
  method: AcquisitionMethod
): string {
  switch (method) {
    case "API":
      return "Official API";

    case "RSS":
      return "Authorized RSS";

    case "Embed":
      return "Official Embed/oEmbed";

    case "Agreement":
      return "Publisher Agreement";

    case "Link-only":
      return "Link-only";
  }
}

function displayPolicyLabel(
  method: AcquisitionMethod
): string {
  switch (method) {
    case "API":
      return "Provider-permitted API fields and preview data only.";

    case "RSS":
      return "Fields permitted by the authorized publisher feed only.";

    case "Embed":
      return "Provider-controlled official embed or oEmbed.";

    case "Agreement":
      return "Display rights defined by the publisher agreement.";

    case "Link-only":
      return "Minimal link-only discovery with no extracted preview or media.";
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

export default function CopyrightManager() {
  const [
    cases,
    setCases,
  ] = useState<CopyrightCase[]>(
    INITIAL_CASES
  );

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<
    "all" | CopyrightStatus
  >("needs_action");

  const [
    selectedCaseId,
    setSelectedCaseId,
  ] = useState<string | null>(
    null
  );

  const [
    pendingAction,
    setPendingAction,
  ] = useState<
    CopyrightAction | null
  >(null);

  const visibleCases =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return cases;
      }

      return cases.filter(
        (item) =>
          item.status ===
          activeFilter
      );
    }, [
      activeFilter,
      cases,
    ]);

  const selectedCase =
    useMemo(
      () =>
        cases.find(
          (item) =>
            item.id ===
            selectedCaseId
        ) ?? null,
      [
        cases,
        selectedCaseId,
      ]
    );

  const updateCase = (
    caseId: string,
    updater: (
      item: CopyrightCase
    ) => CopyrightCase
  ) => {
    setCases(
      (current) =>
        current.map(
          (item) =>
            item.id === caseId
              ? updater(item)
              : item
        )
    );
  };

  const executeAction = () => {
    if (
      !selectedCase ||
      !pendingAction
    ) {
      return;
    }

    const action =
      pendingAction;

    updateCase(
      selectedCase.id,
      (current) => {
        const auditBase = {
          id:
            `${current.id}-${Date.now()}`,

          actor:
            "Admin",

          timestamp:
            nowLabel(),
        };

        if (
          action ===
          "remove"
        ) {
          return {
            ...current,

            status:
              "removed",

            preventReimport:
              false,

            actionTaken:
              "Removed from Poster",

            audit: [
              {
                ...auditBase,

                action:
                  "Removed from Poster",
              },

              ...current.audit,
            ],
          };
        }

        if (
          action ===
          "remove_prevent_reimport"
        ) {
          return {
            ...current,

            status:
              "removed",

            preventReimport:
              true,

            actionTaken:
              "Removed from Poster + prevent re-import",

            audit: [
              {
                ...auditBase,

                action:
                  "Removed from Poster + prevent re-import",
              },

              ...current.audit,
            ],
          };
        }

        if (
          action ===
          "dismiss"
        ) {
          return {
            ...current,

            status:
              "resolved",

            preventReimport:
              false,

            actionTaken:
              "Dismissed / no action",

            audit: [
              {
                ...auditBase,

                action:
                  "Case dismissed with no takedown action",
              },

              ...current.audit,
            ],
          };
        }

        return {
          ...current,

          status:
            "resolved",

          preventReimport:
            false,

          actionTaken:
            "Content restored",

          audit: [
            {
              ...auditBase,

              action:
                "Content restored to Poster",
            },

            ...current.audit,
          ],
        };
      }
    );

    setPendingAction(
      null
    );
  };

  const counts =
    useMemo(
      () => ({
        all:
          cases.length,

        needs_action:
          cases.filter(
            (item) =>
              item.status ===
              "needs_action"
          ).length,

        removed:
          cases.filter(
            (item) =>
              item.status ===
              "removed"
          ).length,

        resolved:
          cases.filter(
            (item) =>
              item.status ===
              "resolved"
          ).length,
      }),
      [cases]
    );

  const closeDetails = () => {
    setSelectedCaseId(
      null
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
            Essential control
          </div>

          <h2>
            Copyright
          </h2>

          <p>
            See who issued each
            copyright or publisher
            removal request, identify
            the exact Poster content,
            and remove or prevent
            re-import when required.
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
                  {counts[key]}
                </span>
              </button>
            )
          )}
        </div>

        <div
          className={
            styles.caseList
          }
        >
          {visibleCases.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No copyright cases
              in this view.
            </div>
          ) : (
            visibleCases.map(
              (
                copyrightCase
              ) => (
                <article
                  key={
                    copyrightCase.id
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
                          copyrightCase.id
                        }
                        {" · "}
                        {
                          copyrightCase.contentId
                        }
                      </span>

                      <h3>
                        {requestHeadline(
                          copyrightCase
                        )}
                      </h3>

                      <p>
                        {
                          copyrightCase.claimantType
                        }
                      </p>
                    </div>

                    <span
                      className={`${styles.status} ${
                        copyrightCase.status ===
                        "needs_action"
                          ? styles.statusAttention
                          : copyrightCase.status ===
                            "removed"
                          ? styles.statusRemoved
                          : styles.statusResolved
                      }`}
                    >
                      {statusLabel(
                        copyrightCase.status
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
                          copyrightCase.contentTitle
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Publisher
                      </span>

                      <strong>
                        {
                          copyrightCase.publisher
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Received
                      </span>

                      <strong>
                        {
                          copyrightCase.receivedAt
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Prevent
                        re-import
                      </span>

                      <strong>
                        {
                          copyrightCase.preventReimport
                            ? "Yes"
                            : "No"
                        }
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
                        setSelectedCaseId(
                          copyrightCase.id
                        )
                      }
                    >
                      View details
                    </button>

                    {copyrightCase.status ===
                    "needs_action" ? (
                      <>
                        <button
                          type="button"
                          className={
                            styles.softDangerButton
                          }
                          onClick={() => {
                            setSelectedCaseId(
                              copyrightCase.id
                            );

                            setPendingAction(
                              "remove"
                            );
                          }}
                        >
                          Remove
                        </button>

                        <button
                          type="button"
                          className={
                            styles.dangerButton
                          }
                          onClick={() => {
                            setSelectedCaseId(
                              copyrightCase.id
                            );

                            setPendingAction(
                              "remove_prevent_reimport"
                            );
                          }}
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

      {selectedCase ? (
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
          />

          <aside
            className={
              styles.drawer
            }
            aria-label={`Copyright case ${selectedCase.id}`}
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  {
                    selectedCase.id
                  }
                  {" · "}
                  {
                    selectedCase.contentId
                  }
                </span>

                <h3>
                  {requestHeadline(
                    selectedCase
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
                  closeDetails
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
                        selectedCase.claimant
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Request type
                    </dt>

                    <dd>
                      {requestTypeLabel(
                        selectedCase.requestType
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Claimant
                      type
                    </dt>

                    <dd>
                      {
                        selectedCase.claimantType
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Contact
                    </dt>

                    <dd>
                      {
                        selectedCase.claimantContact ??
                        "Not provided"
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Reference
                    </dt>

                    <dd>
                      {
                        selectedCase.reference ??
                        "Not provided"
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
                        selectedCase.contentId
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Title
                    </dt>

                    <dd>
                      {
                        selectedCase.contentTitle
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Publisher
                    </dt>

                    <dd>
                      {
                        selectedCase.publisher
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Acquisition
                      method
                    </dt>

                    <dd>
                      {acquisitionMethodLabel(
                        selectedCase.acquisitionMethod
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
                        selectedCase.acquisitionMethod
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Original
                      URL
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedCase.originalUrl
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
                    selectedCase.reason
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
                        selectedCase.status
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Prevent
                      re-import
                    </span>

                    <strong>
                      {
                        selectedCase.preventReimport
                          ? "Yes"
                          : "No"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Action taken
                    </span>

                    <strong>
                      {
                        selectedCase.actionTaken ??
                        "No action taken yet"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Received
                    </span>

                    <strong>
                      {
                        selectedCase.receivedAt
                      }
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
                  {selectedCase.audit.map(
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
              {selectedCase.status ===
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
                  >
                    Remove +
                    prevent
                    re-import
                  </button>
                </>
              ) : selectedCase.status ===
                "removed" ? (
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
                >
                  Restore
                  content
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedCase &&
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
              {requestTypeLabel(
                selectedCase.requestType
              )}
              {" by "}
              <strong>
                {
                  selectedCase.claimant
                }
              </strong>
              .
            </p>

            <p>
              Poster Content ID:{" "}
              <strong>
                {
                  selectedCase.contentId
                }
              </strong>
            </p>

            {pendingAction ===
            "remove_prevent_reimport" ? (
              <p
                className={
                  styles.confirmWarning
                }
              >
                This frontend
                currently records
                the prevent
                re-import decision
                locally. The future
                backend will enforce
                the real exclusion
                registry.
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
                    "remove" ||
                  pendingAction ===
                    "remove_prevent_reimport"
                    ? styles.dangerButton
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