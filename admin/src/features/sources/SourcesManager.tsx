"use client";

import {
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  useAdminSources,
} from "./use-admin-sources";

import {
  useSourceActions,
} from "./use-source-actions";

import {
  useSourceDetails,
} from "./use-source-details";

import type {
  AdminSourceRecord,
} from "./source-api.types";

import styles from "./SourcesManager.module.css";

function statusLabel(
  status:
    AdminSourceRecord[
      "status"
    ]
): string {
  switch (
    status
  ) {
    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "blocked":
      return "Blocked";
  }
}

function healthLabel(
  health:
    AdminSourceRecord[
      "health"
    ]
): string {
  switch (
    health
  ) {
    case "healthy":
      return "Healthy";

    case "issue":
      return "Issue";

    case "offline":
      return "Offline";
  }
}

function methodLabel(
  method:
    AdminSourceRecord[
      "acquisitionMethod"
    ]
): string {
  switch (
    method
  ) {
    case "api":
      return "Official API";

    case "rss":
      return "Authorized RSS";

    case "embed":
      return "Official Embed/oEmbed";

    case "agreement":
      return "Publisher Agreement";

    case "link_only":
      return "Link-only";
  }
}

function formatTimestamp(
  value:
    string |
    null
): string {
  if (
    !value
  ) {
    return "Not yet synced";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    new Date(
      value
    )
  );
}

export default function SourcesManager() {
  return (
    <Suspense fallback={null}>
      <SourcesManagerContent />
    </Suspense>
  );
}

function SourcesManagerContent() {
  const searchParams =
    useSearchParams();

  const requestedRecordId =
    searchParams.get(
      "record"
    );

  const sourceList =
    useAdminSources();

  const {
    refresh:
      refreshSources,
  } =
    sourceList;

  const [
    updatedSources,
    setUpdatedSources,
  ] =
    useState<
      Record<
        string,
        AdminSourceRecord
      >
    >(
      {}
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
      | AdminSourceRecord[
          "status"
        ]
    >(
      "all"
    );

  const [
    selectedKey,
    setSelectedKey,
  ] =
    useState<
      string |
      null
    >(
      requestedRecordId
    );

  const [
    blockTargetId,
    setBlockTargetId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    unblockTargetId,
    setUnblockTargetId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    removeExistingContent,
    setRemoveExistingContent,
  ] =
    useState(
      false
    );

  const sources =
    useMemo(
      () =>
        (
          sourceList
            .data
            ?.sources ??
          []
        ).map(
          source =>
            updatedSources[
              source.id
            ] ??
            source
        ),
      [
        sourceList.data,
        updatedSources,
      ]
    );

  const selectedListSource =
    selectedKey
      ? sources.find(
          source =>
            source.id ===
              selectedKey ||
            source.publicId ===
              selectedKey
        ) ??
        null
      : null;

  const selectedDetails =
    useSourceDetails(
      selectedListSource
        ?.id ??
      null
    );

  const selectedSource =
    selectedListSource
      ? updatedSources[
          selectedListSource.id
        ] ??
        selectedDetails
          .data
          ?.source ??
        selectedListSource
      : null;

  const selectedAudit =
    selectedDetails
      .data
      ?.audit ??
    [];

  const blockTarget =
    blockTargetId
      ? sources.find(
          source =>
            source.id ===
            blockTargetId
        ) ??
        null
      : null;

  const unblockTarget =
    unblockTargetId
      ? sources.find(
          source =>
            source.id ===
            unblockTargetId
        ) ??
        null
      : null;

  const handleActionCompleted =
    useCallback(
      (
        source:
          AdminSourceRecord
      ) => {
        setUpdatedSources(
          current => ({
            ...current,

            [source.id]:
              source,
          })
        );

        refreshSources();
      },
      [
        refreshSources,
      ]
    );

  const sourceActions =
    useSourceActions({
      onCompleted:
        handleActionCompleted,
    });

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleSources =
    useMemo(
      () =>
        sources.filter(
          source => {
            if (
              filter !==
                "all" &&
              source.status !==
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
              source.publicId,
              source.name,
              source.websiteUrl,
              source.acquisitionMethod,
              methodLabel(
                source.acquisitionMethod
              ),
            ].some(
              value =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedQuery
                  )
            );
          }
        ),
      [
        filter,
        normalizedQuery,
        sources,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          sources.length,

        active:
          sources.filter(
            source =>
              source.status ===
              "active"
          ).length,

        paused:
          sources.filter(
            source =>
              source.status ===
              "paused"
          ).length,

        blocked:
          sources.filter(
            source =>
              source.status ===
              "blocked"
          ).length,
      }),
      [
        sources,
      ]
    );

  const refreshSelectedDetails =
    async (
      sourceId: string
    ) => {
      if (
        selectedSource?.id ===
        sourceId
      ) {
        await selectedDetails
          .refresh();
      }
    };

  const pauseSource =
    async (
      source:
        AdminSourceRecord
    ) => {
      sourceActions.clearError();

      const result =
        await sourceActions
          .pause(
            source
          );

      if (
        result
      ) {
        await refreshSelectedDetails(
          result.id
        );
      }
    };

  const enableSource =
    async (
      source:
        AdminSourceRecord
    ) => {
      sourceActions.clearError();

      const result =
        await sourceActions
          .enable(
            source
          );

      if (
        result
      ) {
        await refreshSelectedDetails(
          result.id
        );
      }
    };

  const requestEnable =
    (
      source:
        AdminSourceRecord
    ) => {
      sourceActions.clearError();

      if (
        source.status ===
        "blocked"
      ) {
        setUnblockTargetId(
          source.id
        );

        return;
      }

      void enableSource(
        source
      );
    };

  const beginBlock =
    (
      source:
        AdminSourceRecord
    ) => {
      sourceActions.clearError();

      setBlockTargetId(
        source.id
      );

      setRemoveExistingContent(
        false
      );
    };

  const cancelBlock =
    () => {
      setBlockTargetId(
        null
      );

      setRemoveExistingContent(
        false
      );

      sourceActions.clearError();
    };

  const confirmBlock =
    async () => {
      if (
        !blockTarget
      ) {
        return;
      }

      const result =
        await sourceActions
          .block(
            blockTarget,
            removeExistingContent
          );

      if (
        result
      ) {
        cancelBlock();

        await refreshSelectedDetails(
          result.id
        );
      }
    };

  const cancelUnblock =
    () => {
      setUnblockTargetId(
        null
      );

      sourceActions.clearError();
    };

  const confirmUnblock =
    async () => {
      if (
        !unblockTarget
      ) {
        return;
      }

      const result =
        await sourceActions
          .unblock(
            unblockTarget
          );

      if (
        result
      ) {
        cancelUnblock();

        await refreshSelectedDetails(
          result.id
        );
      }
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
            Review authoritative publisher sources, ingestion
            methods, health, active content and lifecycle
            safeguards.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {sourceList.isLoading
              ? "—"
              : counts.active}
          </strong>

          <span>
            active sources
          </span>
        </div>
      </header>

      {sourceList.error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <div>
            <strong>
              Sources could not be refreshed
            </strong>

            <p>
              {sourceList.error}

              {sourceList.data
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
              refreshSources
            }
            disabled={
              sourceList.isLoading ||
              sourceList.isRefreshing
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
          sourceList.isLoading ||
          sourceList.isRefreshing
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
            placeholder="Search ID, source or website..."
            aria-label="Search sources"
            onChange={
              event =>
                setQuery(
                  event.target
                    .value
                )
            }
          />

          <div
            className={
              styles.toolbarActions
            }
          >
            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                refreshSources
              }
              disabled={
                sourceList.isLoading ||
                sourceList.isRefreshing
              }
            >
              {sourceList.isRefreshing
                ? "Refreshing…"
                : "Refresh"}
            </button>

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
        </div>

        {sourceList.isLoading &&
        !sourceList.data ? (
          <div
            className={
              styles.empty
            }
          >
            Loading authoritative sources…
          </div>
        ) : (
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
                  source => (
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
                            setSelectedKey(
                              source.id
                            )
                          }
                        >
                          {source.name}
                        </button>

                        <span
                          className={
                            styles.website
                          }
                        >
                          {
                            source.websiteUrl
                          }
                        </span>

                        <span
                          className={
                            styles.website
                          }
                        >
                          {source.publicId}
                          {" · "}
                          {source.activeContentCount.toLocaleString()}
                          {" active content"}
                        </span>
                      </td>

                      <td>
                        {methodLabel(
                          source.acquisitionMethod
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
                        {formatTimestamp(
                          source.lastSyncAt
                        )}
                      </td>

                      <td>
                        {source.status ===
                        "active" ? (
                          <button
                            type="button"
                            className={
                              styles.actionButton
                            }
                            onClick={() => {
                              void pauseSource(
                                source
                              );
                            }}
                            disabled={
                              sourceActions.isRunning
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
                            disabled={
                              sourceActions.isRunning
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
                            disabled={
                              sourceActions.isRunning
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
        )}

        {sourceList.data ? (
          <div
            className={
              styles.freshnessBar
            }
          >
            <span>
              Generated{" "}
              {formatTimestamp(
                sourceList
                  .data
                  .generatedAt
              )}
            </span>

            <span>
              Auto-refresh every 60 seconds
            </span>
          </div>
        ) : null}
      </section>

      {selectedKey ? (
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
              setSelectedKey(
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
                  {selectedSource
                    ?.publicId ??
                    selectedKey}
                </span>

                <h3>
                  {selectedSource
                    ?.name ??
                    "Source details"}
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={() =>
                  setSelectedKey(
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
              {selectedDetails.isLoading &&
              !selectedSource ? (
                <div
                  className={
                    styles.detailState
                  }
                >
                  Loading source details…
                </div>
              ) : selectedDetails.error &&
                !selectedSource ? (
                <div
                  className={
                    styles.detailState
                  }
                  role="alert"
                >
                  <strong>
                    Source details could not be loaded
                  </strong>

                  <p>
                    {
                      selectedDetails.error
                    }
                  </p>

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() => {
                      void selectedDetails
                        .refresh();
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : selectedSource ? (
                <>
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
                          Source ID
                        </dt>

                        <dd>
                          {
                            selectedSource.publicId
                          }
                        </dd>
                      </div>

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
                            selectedSource.websiteUrl
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Acquisition method
                        </dt>

                        <dd>
                          {methodLabel(
                            selectedSource.acquisitionMethod
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Display policy
                        </dt>

                        <dd>
                          {
                            selectedSource.displayPolicy
                          }
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
                          {formatTimestamp(
                            selectedSource.lastSyncAt
                          )}
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

                    {selectedSource.operationalNote ? (
                      <div
                        className={
                          styles.note
                        }
                      >
                        {
                          selectedSource.operationalNote
                        }
                      </div>
                    ) : null}

                    {selectedSource.lastSyncError ? (
                      <div
                        className={
                          styles.warning
                        }
                      >
                        Last sync error:{" "}
                        {
                          selectedSource.lastSyncError
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
                      {selectedDetails.isLoading &&
                      selectedAudit.length ===
                        0 ? (
                        <div
                          className={
                            styles.detailState
                          }
                        >
                          Loading immutable audit history…
                        </div>
                      ) : selectedDetails.error &&
                        selectedAudit.length ===
                          0 ? (
                        <div
                          className={
                            styles.detailState
                          }
                          role="alert"
                        >
                          {
                            selectedDetails.error
                          }
                        </div>
                      ) : selectedAudit.length >
                        0 ? (
                        selectedAudit.map(
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
                                  }{" "}
                                  ·{" "}
                                  {formatTimestamp(
                                    entry.occurredAt
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div
                          className={
                            styles.detailState
                          }
                        >
                          No audit events yet.
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div
                  className={
                    styles.detailState
                  }
                >
                  The requested source was not found in the
                  current Backend snapshot.
                </div>
              )}
            </div>

            {selectedSource ? (
              <div
                className={
                  styles.drawerFooter
                }
              >
                <a
                  href={
                    selectedSource.websiteUrl
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
                    onClick={() => {
                      void pauseSource(
                        selectedSource
                      );
                    }}
                    disabled={
                      sourceActions.isRunning
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
                    onClick={() => {
                      void enableSource(
                        selectedSource
                      );
                    }}
                    disabled={
                      sourceActions.isRunning
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

                      setSelectedKey(
                        null
                      );
                    }}
                    disabled={
                      sourceActions.isRunning
                    }
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

                      setSelectedKey(
                        null
                      );
                    }}
                    disabled={
                      sourceActions.isRunning
                    }
                  >
                    Block source
                  </button>
                ) : null}
              </div>
            ) : null}
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
              {blockTarget.name}
              ?
            </h3>

            <p>
              Poster will stop future ingestion from this
              source until an authorized operator explicitly
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
                onChange={
                  event =>
                    setRemoveExistingContent(
                      event.target
                        .checked
                    )
                }
              />

              <span>
                <strong>
                  Also remove existing content
                </strong>

                Remove active Poster content from this source
                and prevent those original URLs from being
                re-imported.
              </span>
            </label>

            <div
              className={
                styles.warning
              }
            >
              Use Block for publisher opt-out, copyright
              restriction, unauthorized sources, or serious
              policy issues. Use Pause for temporary technical
              problems.
            </div>

            {sourceActions.error ? (
              <div
                className={
                  styles.actionError
                }
                role="alert"
              >
                {
                  sourceActions.error
                }
              </div>
            ) : null}

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
                disabled={
                  sourceActions.isRunning
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.dangerButton
                }
                onClick={() => {
                  void confirmBlock();
                }}
                disabled={
                  sourceActions.isRunning
                }
              >
                {sourceActions.isRunning
                  ? "Blocking…"
                  : removeExistingContent
                    ? "Block + remove content"
                    : "Block source"}
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
              {unblockTarget.name}
              ?
            </h3>

            <p>
              This will allow Poster to resume future
              ingestion from this source.
            </p>

            <div
              className={
                styles.warning
              }
            >
              Only unblock after the publisher opt-out,
              copyright restriction, authorization issue, or
              serious policy reason has been cleared.
            </div>

            {sourceActions.error ? (
              <div
                className={
                  styles.actionError
                }
                role="alert"
              >
                {
                  sourceActions.error
                }
              </div>
            ) : null}

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
                disabled={
                  sourceActions.isRunning
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={() => {
                  void confirmUnblock();
                }}
                disabled={
                  sourceActions.isRunning
                }
              >
                {sourceActions.isRunning
                  ? "Unblocking…"
                  : "Unblock source"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}