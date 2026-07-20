"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import styles from "./ContentManager.module.css";

type ContentStatus =
  | "active"
  | "removed";

type RemovalReason =
  | "copyright"
  | "publisher_request"
  | "misleading_unsafe"
  | "broken_unavailable"
  | "other";

interface ContentAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface ContentRecord {
  id: string;
  title: string;
  publisher: string;
  originalUrl: string;

  sourceMethod:
    | "API"
    | "RSS"
    | "Embed"
    | "Agreement"
    | "Link-only";

  status: ContentStatus;

  publishedAt: string;
  addedAt: string;

  removalReason?: RemovalReason;
  removalNote?: string;

  copyrightCaseId?: string;
  copyrightClaimant?: string;

  preventReimport: boolean;

  audit: ContentAuditEntry[];
}

const INITIAL_CONTENT: ContentRecord[] = [
  {
    id: "CNT-2003",

    title:
      "AI agents are changing software workflows",

    publisher:
      "Example Tech",

    originalUrl:
      "https://example.com/ai-agents-workflows",

    sourceMethod:
      "RSS",

    status:
      "active",

    publishedAt:
      "19 Jul 2026",

    addedAt:
      "19 Jul 2026",

    preventReimport:
      false,

    audit: [
      {
        id:
          "audit-2003-1",

        action:
          "Added to Poster from authorized RSS",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 08:40",
      },
    ],
  },

  {
    id: "CNT-2002",

    title:
      "New climate research explained",

    publisher:
      "Example Science",

    originalUrl:
      "https://example.com/climate-research",

    sourceMethod:
      "API",

    status:
      "active",

    publishedAt:
      "18 Jul 2026",

    addedAt:
      "18 Jul 2026",

    preventReimport:
      false,

    audit: [
      {
        id:
          "audit-2002-1",

        action:
          "Added to Poster from official API",

        actor:
          "System",

        timestamp:
          "18 Jul 2026 · 13:10",
      },
    ],
  },

  {
    id: "CNT-2001",

    title:
      "AI regulation story",

    publisher:
      "BBC",

    originalUrl:
      "https://example.com/bbc/ai-regulation",

    sourceMethod:
      "RSS",

    status:
      "removed",

    publishedAt:
      "18 Jul 2026",

    addedAt:
      "18 Jul 2026",

    removalReason:
      "copyright",

    removalNote:
      "Removed after rights-holder request.",

    copyrightCaseId:
      "CR-1001",

    copyrightClaimant:
      "BBC",

    preventReimport:
      true,

    audit: [
      {
        id:
          "audit-2001-2",

        action:
          "Removed from Poster + prevent re-import",

        actor:
          "Admin",

        timestamp:
          "19 Jul 2026 · 09:35",
      },

      {
        id:
          "audit-2001-1",

        action:
          "Copyright strike received from BBC",

        actor:
          "System",

        timestamp:
          "19 Jul 2026 · 09:20",
      },
    ],
  },
];

const REMOVAL_REASONS: Array<{
  value: RemovalReason;
  label: string;
}> = [
  {
    value:
      "copyright",

    label:
      "Copyright complaint",
  },

  {
    value:
      "publisher_request",

    label:
      "Publisher request",
  },

  {
    value:
      "misleading_unsafe",

    label:
      "Misleading / unsafe content",
  },

  {
    value:
      "broken_unavailable",

    label:
      "Broken / unavailable source",
  },

  {
    value:
      "other",

    label:
      "Other",
  },
];

function reasonLabel(
  reason?: RemovalReason
): string {
  return (
    REMOVAL_REASONS.find(
      (item) =>
        item.value ===
        reason
    )?.label ??
    "Not specified"
  );
}

function sourceMethodLabel(
  method:
    ContentRecord["sourceMethod"]
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

export default function ContentManager() {
  return (
    <Suspense fallback={null}>
      <ContentManagerContent />
    </Suspense>
  );
}

function ContentManagerContent() {
  const searchParams =
    useSearchParams();

  const requestedRecordId =
    searchParams.get(
      "record"
    );

  const [
    records,
    setRecords,
  ] = useState<
    ContentRecord[]
  >(
    INITIAL_CONTENT
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    "all" | ContentStatus
  >(
    "all"
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(
    INITIAL_CONTENT.some(
      (record) =>
        record.id ===
        requestedRecordId
    )
      ? requestedRecordId
      : null
  );

  const [
    removeTargetId,
    setRemoveTargetId,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    removeReason,
    setRemoveReason,
  ] = useState<
    RemovalReason
  >(
    "copyright"
  );

  const [
    removeNote,
    setRemoveNote,
  ] = useState("");

  const [
    preventReimport,
    setPreventReimport,
  ] = useState(
    false
  );

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleRecords =
    useMemo(() => {
      return records.filter(
        (record) => {
          if (
            filter !==
              "all" &&
            record.status !==
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
            record.id,
            record.title,
            record.publisher,
            record.originalUrl,
            record.sourceMethod,
            sourceMethodLabel(
              record.sourceMethod
            ),
          ].some(
            (value) =>
              value
                .toLowerCase()
                .includes(
                  normalizedQuery
                )
          );
        }
      );
    }, [
      filter,
      normalizedQuery,
      records,
    ]);

  const selectedRecord =
    useMemo(
      () =>
        records.find(
          (record) =>
            record.id ===
            selectedId
        ) ?? null,

      [
        records,
        selectedId,
      ]
    );

  const removalRecord =
    useMemo(
      () =>
        records.find(
          (record) =>
            record.id ===
            removeTargetId
        ) ?? null,

      [
        records,
        removeTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          records.length,

        active:
          records.filter(
            (record) =>
              record.status ===
              "active"
          ).length,

        removed:
          records.filter(
            (record) =>
              record.status ===
              "removed"
          ).length,
      }),

      [
        records,
      ]
    );

  const beginRemove = (
    record:
      ContentRecord
  ) => {
    setRemoveTargetId(
      record.id
    );

    setRemoveReason(
      record.copyrightCaseId
        ? "copyright"
        : "other"
    );

    setRemoveNote("");

    setPreventReimport(
      Boolean(
        record.copyrightCaseId
      )
    );
  };

  const cancelRemove =
    () => {
      setRemoveTargetId(
        null
      );

      setRemoveNote("");

      setPreventReimport(
        false
      );
    };

  const confirmRemove =
    () => {
      if (
        !removalRecord
      ) {
        return;
      }

      setRecords(
        (current) =>
          current.map(
            (record) => {
              if (
                record.id !==
                removalRecord.id
              ) {
                return record;
              }

              const claimant =
                removeReason ===
                  "copyright"
                  ? record.copyrightClaimant
                  : undefined;

              const action =
                preventReimport
                  ? "Removed from Poster + prevent re-import"
                  : "Removed from Poster";

              return {
                ...record,

                status:
                  "removed",

                removalReason:
                  removeReason,

                removalNote:
                  removeNote
                    .trim() ||
                  undefined,

                preventReimport,

                audit: [
                  {
                    id:
                      `${record.id}-${Date.now()}`,

                    action:
                      claimant
                        ? `${action} · Copyright strike by ${claimant}`
                        : action,

                    actor:
                      "Admin",

                    timestamp:
                      nowLabel(),
                  },

                  ...record.audit,
                ],
              };
            }
          )
      );

      cancelRemove();
    };

  const restoreRecord = (
    record:
      ContentRecord
  ) => {
    setRecords(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            record.id
              ? {
                  ...item,

                  status:
                    "active",

                  removalReason:
                    undefined,

                  removalNote:
                    undefined,

                  preventReimport:
                    false,

                  audit: [
                    {
                      id:
                        `${item.id}-${Date.now()}`,

                      action:
                        "Content restored to Poster",

                      actor:
                        "Admin",

                      timestamp:
                        nowLabel(),
                    },

                    ...item.audit,
                  ],
                }
              : item
        )
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
            Content control
          </div>

          <h2>
            Content
          </h2>

          <p>
            Search what Poster
            displays, verify source
            attribution, and remove
            or restore content only
            when needed.
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
            active records
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
            value={
              query
            }
            className={
              styles.search
            }
            placeholder="Search ID, title, publisher or URL..."
            aria-label="Search content"
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
                  "active",
                  "Active",
                ],

                [
                  "removed",
                  "Removed",
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
                  Content
                </th>

                <th>
                  Source
                </th>

                <th>
                  Method
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
              {visibleRecords.map(
                (
                  record
                ) => (
                  <tr
                    key={
                      record.id
                    }
                  >
                    <td>
                      <button
                        type="button"
                        className={
                          styles.titleButton
                        }
                        onClick={() =>
                          setSelectedId(
                            record.id
                          )
                        }
                      >
                        {
                          record.title
                        }
                      </button>

                      <span
                        className={
                          styles.website
                        }
                      >
                        {
                          record.id
                        }
                      </span>

                      {record.copyrightClaimant ? (
                        <span
                          className={
                            styles.copyrightLink
                          }
                        >
                          Copyright
                          strike by{" "}
                          {
                            record.copyrightClaimant
                          }
                        </span>
                      ) : null}
                    </td>

                    <td>
                      {
                        record.publisher
                      }
                    </td>

                    <td>
                      {sourceMethodLabel(
                        record.sourceMethod
                      )}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          record.status ===
                          "active"
                            ? styles.statusActive
                            : styles.statusRemoved
                        }`}
                      >
                        {
                          record.status ===
                          "active"
                            ? "Active"
                            : "Removed"
                        }
                      </span>
                    </td>

                    <td>
                      {record.status ===
                      "active" ? (
                        <button
                          type="button"
                          className={
                            styles.removeButton
                          }
                          onClick={() =>
                            beginRemove(
                              record
                            )
                          }
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={
                            styles.restoreButton
                          }
                          onClick={() =>
                            restoreRecord(
                              record
                            )
                          }
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {visibleRecords.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No content found.
            </div>
          ) : null}
        </div>
      </section>

      {selectedRecord ? (
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
            aria-label="Close content details"
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
                    selectedRecord.id
                  }
                </span>

                <h3>
                  Content
                  details
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
                  Content
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
                        selectedRecord.id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Title
                    </dt>

                    <dd>
                      {
                        selectedRecord.title
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Publisher
                    </dt>

                    <dd>
                      {
                        selectedRecord.publisher
                      }
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
                        selectedRecord.originalUrl
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Source
                      method
                    </dt>

                    <dd>
                      {sourceMethodLabel(
                        selectedRecord.sourceMethod
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
                <h4>
                  Status
                </h4>

                <div
                  className={
                    styles.statusGrid
                  }
                >
                  <div>
                    <span>
                      Current
                    </span>

                    <strong>
                      {
                        selectedRecord.status ===
                        "active"
                          ? "Active"
                          : "Removed"
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
                        selectedRecord.preventReimport
                          ? "Yes"
                          : "No"
                      }
                    </strong>
                  </div>
                </div>

                {selectedRecord.status ===
                "removed" ? (
                  <div
                    className={
                      styles.removalBox
                    }
                  >
                    <strong>
                      Removal:
                    </strong>{" "}

                    {reasonLabel(
                      selectedRecord.removalReason
                    )}

                    {selectedRecord.copyrightClaimant ? (
                      <span>
                        Copyright
                        strike by{" "}
                        {
                          selectedRecord.copyrightClaimant
                        }

                        {selectedRecord.copyrightCaseId
                          ? ` · ${selectedRecord.copyrightCaseId}`
                          : ""}
                      </span>
                    ) : null}

                    {selectedRecord.removalNote ? (
                      <span>
                        {
                          selectedRecord.removalNote
                        }
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section
                className={
                  styles.detailSection
                }
              >
                <h4>
                  Dates
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Published
                    </dt>

                    <dd>
                      {
                        selectedRecord.publishedAt
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Added to
                      Poster
                    </dt>

                    <dd>
                      {
                        selectedRecord.addedAt
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
                  Audit history
                </h4>

                <div
                  className={
                    styles.auditList
                  }
                >
                  {selectedRecord.audit.map(
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
              <a
                className={
                  styles.secondaryButton
                }
                href={
                  selectedRecord.originalUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Open original
              </a>

              {selectedRecord.status ===
              "active" ? (
                <button
                  type="button"
                  className={
                    styles.dangerButton
                  }
                  onClick={() => {
                    beginRemove(
                      selectedRecord
                    );

                    setSelectedId(
                      null
                    );
                  }}
                >
                  Remove from
                  Poster
                </button>
              ) : (
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() =>
                    restoreRecord(
                      selectedRecord
                    )
                  }
                >
                  Restore
                </button>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {removalRecord ? (
        <div
          className={
            styles.modalLayer
          }
        >
          <button
            type="button"
            className={
              styles.modalBackdrop
            }
            aria-label="Cancel removal"
            onClick={
              cancelRemove
            }
          />

          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-content-title"
          >
            <div
              className={
                styles.modalEyebrow
              }
            >
              Remove content
            </div>

            <h3
              id="remove-content-title"
            >
              Remove from
              Poster?
            </h3>

            <p
              className={
                styles.modalTitle
              }
            >
              {
                removalRecord.title
              }
            </p>

            <p
              className={
                styles.modalTitle
              }
            >
              Poster Content ID:{" "}
              <strong>
                {
                  removalRecord.id
                }
              </strong>
            </p>

            {removalRecord.copyrightClaimant ? (
              <div
                className={
                  styles.copyrightNotice
                }
              >
                Copyright strike
                by{" "}
                <strong>
                  {
                    removalRecord.copyrightClaimant
                  }
                </strong>

                {removalRecord.copyrightCaseId
                  ? ` · ${removalRecord.copyrightCaseId}`
                  : ""}
              </div>
            ) : null}

            <fieldset
              className={
                styles.reasonGroup
              }
            >
              <legend>
                Why are you
                removing this?
              </legend>

              {REMOVAL_REASONS.map(
                (
                  reason
                ) => (
                  <label
                    key={
                      reason.value
                    }
                    className={
                      styles.reasonOption
                    }
                  >
                    <input
                      type="radio"
                      name="removal-reason"
                      value={
                        reason.value
                      }
                      checked={
                        removeReason ===
                        reason.value
                      }
                      onChange={() =>
                        setRemoveReason(
                          reason.value
                        )
                      }
                    />

                    <span>
                      {
                        reason.label
                      }
                    </span>
                  </label>
                )
              )}
            </fieldset>

            <label
              className={
                styles.noteField
              }
            >
              <span>
                Note
                (optional)
              </span>

              <textarea
                value={
                  removeNote
                }
                rows={3}
                placeholder="Add a short internal note..."
                onChange={(
                  event
                ) =>
                  setRemoveNote(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label
              className={
                styles.checkboxOption
              }
            >
              <input
                type="checkbox"
                checked={
                  preventReimport
                }
                onChange={(
                  event
                ) =>
                  setPreventReimport(
                    event.target
                      .checked
                  )
                }
              />

              <span>
                <strong>
                  Prevent
                  re-import
                </strong>

                Do not allow
                automated
                ingestion to
                bring this
                content back.
              </span>
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  cancelRemove
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
                  confirmRemove
                }
              >
                {preventReimport
                  ? "Remove + prevent re-import"
                  : "Remove from Poster"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}