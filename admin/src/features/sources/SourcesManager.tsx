"use client";

import {
  useMemo,
  useState,
} from "react";

import styles from "./SourcesManager.module.css";

type SourceStatus =
  | "active"
  | "paused"
  | "blocked";

type SourceHealth =
  | "healthy"
  | "issue"
  | "offline";

type SourceMethod =
  | "API"
  | "RSS"
  | "Embed"
  | "Agreement"
  | "Link-only";

interface SourceAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface SourceRecord {
  id: string;
  name: string;
  website: string;
  method: SourceMethod;
  status: SourceStatus;
  health: SourceHealth;
  lastSync: string;
  activeContentCount: number;
  note?: string;
  audit: SourceAuditEntry[];
}

const INITIAL_SOURCES: SourceRecord[] = [
  {
    id: "SRC-1001",
    name: "Reuters",
    website: "https://www.reuters.com",
    method: "API",
    status: "active",
    health: "healthy",
    lastSync: "4 min ago",
    activeContentCount: 3240,
    audit: [
      {
        id: "audit-src-1001-1",
        action:
          "Source sync completed successfully",
        actor: "System",
        timestamp:
          "19 Jul 2026 · 10:24",
      },
    ],
  },
  {
    id: "SRC-1002",
    name: "BBC",
    website: "https://www.bbc.com",
    method: "RSS",
    status: "active",
    health: "healthy",
    lastSync: "8 min ago",
    activeContentCount: 1284,
    audit: [
      {
        id: "audit-src-1002-1",
        action:
          "Source sync completed successfully",
        actor: "System",
        timestamp:
          "19 Jul 2026 · 10:20",
      },
    ],
  },
  {
    id: "SRC-1003",
    name: "Example News",
    website: "https://example.com",
    method: "RSS",
    status: "paused",
    health: "issue",
    lastSync: "3 hrs ago",
    activeContentCount: 416,
    note:
      "Feed returned repeated errors. Paused until checked.",
    audit: [
      {
        id: "audit-src-1003-2",
        action: "Source paused",
        actor: "Admin",
        timestamp:
          "19 Jul 2026 · 08:02",
      },
      {
        id: "audit-src-1003-1",
        action:
          "Repeated RSS sync failures detected",
        actor: "System",
        timestamp:
          "19 Jul 2026 · 07:58",
      },
    ],
  },
];

function statusLabel(
  status: SourceStatus
): string {
  switch (status) {
    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "blocked":
      return "Blocked";
  }
}

function healthLabel(
  health: SourceHealth
): string {
  switch (health) {
    case "healthy":
      return "Healthy";

    case "issue":
      return "Issue";

    case "offline":
      return "Offline";
  }
}

function methodLabel(
  method: SourceMethod
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
  method: SourceMethod
): string {
  switch (method) {
    case "API":
      return "Use only provider-permitted API fields and preview data.";

    case "RSS":
      return "Use only fields permitted by the authorized publisher feed.";

    case "Embed":
      return "Use the provider-controlled official embed or oEmbed.";

    case "Agreement":
      return "Use only the display rights defined by the publisher agreement.";

    case "Link-only":
      return "Minimal link-only discovery. No extracted preview or media.";
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

export default function SourcesManager() {
  const [
    sources,
    setSources,
  ] = useState<SourceRecord[]>(
    INITIAL_SOURCES
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    "all" | SourceStatus
  >("all");

  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(
    null
  );

  const [
    blockTargetId,
    setBlockTargetId,
  ] = useState<string | null>(
    null
  );

  const [
    unblockTargetId,
    setUnblockTargetId,
  ] = useState<string | null>(
    null
  );

  const [
    removeExistingContent,
    setRemoveExistingContent,
  ] = useState(false);

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleSources =
    useMemo(() => {
      return sources.filter(
        (source) => {
          if (
            filter !== "all" &&
            source.status !== filter
          ) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return [
            source.name,
            source.website,
            source.method,
            methodLabel(
              source.method
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
      sources,
    ]);

  const selectedSource =
    useMemo(
      () =>
        sources.find(
          (source) =>
            source.id ===
            selectedId
        ) ?? null,
      [
        selectedId,
        sources,
      ]
    );

  const blockTarget =
    useMemo(
      () =>
        sources.find(
          (source) =>
            source.id ===
            blockTargetId
        ) ?? null,
      [
        blockTargetId,
        sources,
      ]
    );

  const unblockTarget =
    useMemo(
      () =>
        sources.find(
          (source) =>
            source.id ===
            unblockTargetId
        ) ?? null,
      [
        sources,
        unblockTargetId,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          sources.length,

        active:
          sources.filter(
            (source) =>
              source.status ===
              "active"
          ).length,

        paused:
          sources.filter(
            (source) =>
              source.status ===
              "paused"
          ).length,

        blocked:
          sources.filter(
            (source) =>
              source.status ===
              "blocked"
          ).length,
      }),
      [sources]
    );

  const updateSourceStatus = (
    sourceId: string,
    status: SourceStatus,
    action: string
  ) => {
    setSources(
      (current) =>
        current.map(
          (source) =>
            source.id ===
            sourceId
              ? {
                  ...source,
                  status,
                  audit: [
                    {
                      id:
                        `${source.id}-${Date.now()}`,
                      action,
                      actor:
                        "Admin",
                      timestamp:
                        nowLabel(),
                    },
                    ...source.audit,
                  ],
                }
              : source
        )
    );
  };

  const pauseSource = (
    source: SourceRecord
  ) => {
    updateSourceStatus(
      source.id,
      "paused",
      "Source paused"
    );
  };

  const enablePausedSource = (
    source: SourceRecord
  ) => {
    updateSourceStatus(
      source.id,
      "active",
      "Source enabled"
    );
  };

  const requestEnable = (
    source: SourceRecord
  ) => {
    if (
      source.status ===
      "blocked"
    ) {
      setUnblockTargetId(
        source.id
      );

      return;
    }

    enablePausedSource(
      source
    );
  };

  const beginBlock = (
    source: SourceRecord
  ) => {
    setBlockTargetId(
      source.id
    );

    setRemoveExistingContent(
      false
    );
  };

  const cancelBlock = () => {
    setBlockTargetId(null);

    setRemoveExistingContent(
      false
    );
  };

  const confirmBlock = () => {
    if (!blockTarget) {
      return;
    }

    const action =
      removeExistingContent
        ? "Source blocked and existing content marked for removal"
        : "Source blocked";

    setSources(
      (current) =>
        current.map(
          (source) =>
            source.id ===
            blockTarget.id
              ? {
                  ...source,
                  status:
                    "blocked",
                  audit: [
                    {
                      id:
                        `${source.id}-${Date.now()}`,
                      action,
                      actor:
                        "Admin",
                      timestamp:
                        nowLabel(),
                    },
                    ...source.audit,
                  ],
                }
              : source
        )
    );

    cancelBlock();
  };

  const cancelUnblock = () => {
    setUnblockTargetId(
      null
    );
  };

  const confirmUnblock = () => {
    if (!unblockTarget) {
      return;
    }

    updateSourceStatus(
      unblockTarget.id,
      "active",
      "Source unblocked and enabled"
    );

    cancelUnblock();
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
            Publisher control
          </div>

          <h2>
            Sources
          </h2>

          <p>
            Keep source management
            simple: see how content
            arrives, whether syncing
            is healthy, and pause,
            enable or block only when
            necessary.
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
            active sources
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
            value={query}
            className={
              styles.search
            }
            placeholder="Search source or website..."
            aria-label="Search sources"
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
                  "paused",
                  "Paused",
                ],
                [
                  "blocked",
                  "Blocked",
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
                  Source
                </th>

                <th>
                  Method
                </th>

                <th>
                  Status
                </th>

                <th>
                  Health
                </th>

                <th>
                  Last sync
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleSources.map(
                (source) => (
                  <tr
                    key={
                      source.id
                    }
                  >
                    <td>
                      <button
                        type="button"
                        className={
                          styles.sourceButton
                        }
                        onClick={() =>
                          setSelectedId(
                            source.id
                          )
                        }
                      >
                        {
                          source.name
                        }
                      </button>

                      <span
                        className={
                          styles.website
                        }
                      >
                        {
                          source.website
                        }
                      </span>

                      <span
                        className={
                          styles.website
                        }
                      >
                        {source.activeContentCount.toLocaleString()}{" "}
                        active content
                      </span>
                    </td>

                    <td>
                      {methodLabel(
                        source.method
                      )}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          source.status ===
                          "active"
                            ? styles.statusActive
                            : source.status ===
                              "paused"
                            ? styles.statusPaused
                            : styles.statusBlocked
                        }`}
                      >
                        {statusLabel(
                          source.status
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.health} ${
                          source.health ===
                          "healthy"
                            ? styles.healthHealthy
                            : source.health ===
                              "issue"
                            ? styles.healthIssue
                            : styles.healthOffline
                        }`}
                      >
                        {healthLabel(
                          source.health
                        )}
                      </span>
                    </td>

                    <td>
                      {
                        source.lastSync
                      }
                    </td>

                    <td>
                      {source.status ===
                      "active" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            pauseSource(
                              source
                            )
                          }
                        >
                          Pause
                        </button>
                      ) : source.status ===
                        "paused" ? (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            requestEnable(
                              source
                            )
                          }
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            requestEnable(
                              source
                            )
                          }
                        >
                          Unblock
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {visibleSources.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No sources found.
            </div>
          ) : null}
        </div>
      </section>

      {selectedSource ? (
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
            aria-label="Close source details"
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
                    selectedSource.id
                  }
                </span>

                <h3>
                  {
                    selectedSource.name
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
                  Source
                </h4>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>
                      Website
                    </dt>

                    <dd
                      className={
                        styles.breakText
                      }
                    >
                      {
                        selectedSource.website
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Acquisition
                      method
                    </dt>

                    <dd>
                      {methodLabel(
                        selectedSource.method
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
                        selectedSource.method
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Status
                    </dt>

                    <dd>
                      {statusLabel(
                        selectedSource.status
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Sync health
                    </dt>

                    <dd>
                      {healthLabel(
                        selectedSource.health
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Last sync
                    </dt>

                    <dd>
                      {
                        selectedSource.lastSync
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Active content
                    </dt>

                    <dd>
                      {selectedSource.activeContentCount.toLocaleString()}
                    </dd>
                  </div>
                </dl>

                {selectedSource.note ? (
                  <div
                    className={
                      styles.note
                    }
                  >
                    {
                      selectedSource.note
                    }
                  </div>
                ) : null}
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
                  {selectedSource.audit.map(
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
                href={
                  selectedSource.website
                }
                target="_blank"
                rel="noreferrer"
                className={
                  styles.secondaryButton
                }
              >
                Open website
              </a>

              {selectedSource.status ===
              "active" ? (
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    pauseSource(
                      selectedSource
                    )
                  }
                >
                  Pause
                </button>
              ) : selectedSource.status ===
                "paused" ? (
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() =>
                    enablePausedSource(
                      selectedSource
                    )
                  }
                >
                  Enable
                </button>
              ) : (
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() => {
                    setUnblockTargetId(
                      selectedSource.id
                    );

                    setSelectedId(
                      null
                    );
                  }}
                >
                  Unblock source
                </button>
              )}

              {selectedSource.status !==
              "blocked" ? (
                <button
                  type="button"
                  className={
                    styles.dangerButton
                  }
                  onClick={() => {
                    beginBlock(
                      selectedSource
                    );

                    setSelectedId(
                      null
                    );
                  }}
                >
                  Block source
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {blockTarget ? (
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
            aria-label="Cancel block"
            onClick={
              cancelBlock
            }
          />

          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-source-title"
          >
            <div
              className={
                styles.modalEyebrow
              }
            >
              Block source
            </div>

            <h3
              id="block-source-title"
            >
              Block{" "}
              {
                blockTarget.name
              }
              ?
            </h3>

            <p>
              Poster will stop
              future ingestion from
              this source until an
              operator explicitly
              unblocks it.
            </p>

            <label
              className={
                styles.checkboxOption
              }
            >
              <input
                type="checkbox"
                checked={
                  removeExistingContent
                }
                onChange={(
                  event
                ) =>
                  setRemoveExistingContent(
                    event.target
                      .checked
                  )
                }
              />

              <span>
                <strong>
                  Also remove
                  existing content
                </strong>

                Mark current Poster
                content from this
                source for removal.
              </span>
            </label>

            <div
              className={
                styles.warning
              }
            >
              Use Block for
              publisher opt-out,
              copyright restriction,
              unauthorized sources,
              or serious policy
              issues. Use Pause for
              temporary technical
              problems.
            </div>

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
                  cancelBlock
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
                  confirmBlock
                }
              >
                Block source
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {unblockTarget ? (
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
            aria-label="Cancel unblock"
            onClick={
              cancelUnblock
            }
          />

          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="unblock-source-title"
          >
            <div
              className={
                styles.modalEyebrow
              }
            >
              Unblock source
            </div>

            <h3
              id="unblock-source-title"
            >
              Unblock{" "}
              {
                unblockTarget.name
              }
              ?
            </h3>

            <p>
              This will allow
              Poster to resume
              future ingestion from
              this source.
            </p>

            <div
              className={
                styles.warning
              }
            >
              Only unblock a source
              after the publisher
              opt-out, copyright
              restriction,
              authorization issue,
              or serious policy
              reason that caused the
              block has been
              cleared.
            </div>

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
                  cancelUnblock
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  confirmUnblock
                }
              >
                Unblock source
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}