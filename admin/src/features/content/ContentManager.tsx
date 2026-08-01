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
  useAdminContent,
} from "./use-admin-content";

import {
  useContentActions,
} from "./use-content-actions";

import {
  useContentDetails,
} from "./use-content-details";

import type {
  AdminContentDetailsResponse,
  AdminContentRecord,
  RemovalReason,
} from "./content-api.types";

import styles from "./ContentManager.module.css";

const REMOVAL_REASONS: Array<{
  value:
    RemovalReason;

  label:
    string;
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
  reason:
    RemovalReason |
    null
): string {
  return (
    REMOVAL_REASONS.find(
      item =>
        item.value ===
        reason
    )?.label ??
    "Not specified"
  );
}

function sourceMethodLabel(
  method:
    AdminContentRecord[
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

function formatDate(
  value:
    string |
    null
): string {
  if (
    !value
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatTimestamp(
  value: string
): string {
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

  const contentList =
    useAdminContent();

  const [
    updatedRecords,
    setUpdatedRecords,
  ] =
    useState<
      Record<
        string,
        AdminContentRecord
      >
    >(
      {}
    );

  const [
    updatedDetails,
    setUpdatedDetails,
  ] =
    useState<
      Record<
        string,
        AdminContentDetailsResponse
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
      | AdminContentRecord[
          "status"
        ]
    >(
      "all"
    );

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(
      requestedRecordId
    );

  const [
    removeTargetId,
    setRemoveTargetId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    removeReason,
    setRemoveReason,
  ] =
    useState<
      RemovalReason
    >(
      "copyright"
    );

  const [
    removeNote,
    setRemoveNote,
  ] =
    useState(
      ""
    );

  const [
    preventReimport,
    setPreventReimport,
  ] =
    useState(
      false
    );

  const records =
    useMemo(
      () =>
        (
          contentList
            .data
            ?.records ??
          []
        ).map(
          record =>
            updatedRecords[
              record.id
            ] ??
            record
        ),
      [
        contentList.data,
        updatedRecords,
      ]
    );

  const selectedDetails =
    useContentDetails(
      selectedId
    );

  const selectedRecord =
    selectedId
      ? updatedDetails[
          selectedId
        ]?.record ??
        selectedDetails
          .data
          ?.record ??
        records.find(
          record =>
            record.id ===
            selectedId
        ) ??
        null
      : null;

  const selectedAudit =
    selectedId
      ? updatedDetails[
          selectedId
        ]?.audit ??
        selectedDetails
          .data
          ?.audit ??
        []
      : [];

  const removalRecord =
    removeTargetId
      ? records.find(
          record =>
            record.id ===
            removeTargetId
        ) ??
        null
      : null;

  const handleActionCompleted =
    useCallback(
      (
        details:
          AdminContentDetailsResponse
      ) => {
        setUpdatedRecords(
          current => ({
            ...current,

            [details.record.id]:
              details.record,
          })
        );

        setUpdatedDetails(
          current => ({
            ...current,

            [details.record.id]:
              details,
          })
        );

        contentList.refresh();
      },
      [
        contentList,
      ]
    );

  const contentActions =
    useContentActions({
      onCompleted:
        handleActionCompleted,
    });

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  const visibleRecords =
    useMemo(
      () =>
        records.filter(
          record => {
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
              record.publicId,
              record.title,
              record.publisherName,
              record.originalUrl,
              record.acquisitionMethod,
              sourceMethodLabel(
                record.acquisitionMethod
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
        records,
      ]
    );

  const counts =
    useMemo(
      () => ({
        all:
          records.length,

        active:
          records.filter(
            record =>
              record.status ===
              "active"
          ).length,

        removed:
          records.filter(
            record =>
              record.status ===
              "removed"
          ).length,
      }),
      [
        records,
      ]
    );

  const beginRemove =
    (
      record:
        AdminContentRecord
    ) => {
      setRemoveTargetId(
        record.id
      );

      setRemoveReason(
        record.copyrightCaseId
          ? "copyright"
          : "other"
      );

      setRemoveNote(
        ""
      );

      setPreventReimport(
        Boolean(
          record.copyrightCaseId
        )
      );

      contentActions.clearError();
    };

  const cancelRemove =
    () => {
      setRemoveTargetId(
        null
      );

      setRemoveNote(
        ""
      );

      setPreventReimport(
        false
      );

      contentActions.clearError();
    };

  const confirmRemove =
    async () => {
      if (
        !removalRecord
      ) {
        return;
      }

      const result =
        await contentActions
          .remove(
            removalRecord.id,
            {
              expectedRowVersion:
                removalRecord.rowVersion,

              reason:
                removeReason,

              note:
                removeNote
                  .trim() ||
                null,

              copyrightCaseId:
                removeReason ===
                  "copyright"
                  ? removalRecord
                      .copyrightCaseId
                  : null,

              copyrightClaimant:
                removeReason ===
                  "copyright"
                  ? removalRecord
                      .copyrightClaimant
                  : null,

              preventReimport,
            }
          );

      if (
        result
      ) {
        cancelRemove();
      }
    };

  const restoreRecord =
    async (
      record:
        AdminContentRecord
    ) => {
      contentActions.clearError();

      const result =
        await contentActions
          .restore(
            record.id,
            record.rowVersion
          );

      if (
        result
      ) {
        setSelectedId(
          result.record.id
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
            Content control
          </div>

          <h2>
            Content
          </h2>

          <p>
            Search what Poster displays, verify source
            attribution, and remove or restore content only
            when needed.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {contentList.isLoading
              ? "—"
              : counts.active}
          </strong>

          <span>
            active records
          </span>
        </div>
      </header>

      {contentList.error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <div>
            <strong>
              Content could not be refreshed
            </strong>

            <p>
              {contentList.error}

              {contentList.data
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
              contentList.refresh
            }
            disabled={
              contentList.isLoading ||
              contentList.isRefreshing
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
          contentList.isLoading ||
          contentList.isRefreshing
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
                contentList.refresh
              }
              disabled={
                contentList.isLoading ||
                contentList.isRefreshing
              }
            >
              {contentList.isRefreshing
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

        {contentList.isLoading &&
        !contentList.data ? (
          <div
            className={
              styles.empty
            }
          >
            Loading authoritative content…
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
                  record => (
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
                          {record.title}
                        </button>

                        <span
                          className={
                            styles.website
                          }
                        >
                          {record.publicId}
                        </span>

                        {record.copyrightClaimant ? (
                          <span
                            className={
                              styles.copyrightLink
                            }
                          >
                            Copyright strike by{" "}
                            {
                              record.copyrightClaimant
                            }
                          </span>
                        ) : null}
                      </td>

                      <td>
                        {
                          record.publisherName
                        }
                      </td>

                      <td>
                        {sourceMethodLabel(
                          record.acquisitionMethod
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
                          {record.status ===
                          "active"
                            ? "Active"
                            : "Removed"}
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
                            disabled={
                              contentActions.isRunning
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
                            onClick={() => {
                              void restoreRecord(
                                record
                              );
                            }}
                            disabled={
                              contentActions.isRunning ||
                              record.preventReimport ||
                              record.removalReason ===
                                "copyright"
                            }
                            title={
                              record.preventReimport ||
                              record.removalReason ===
                                "copyright"
                                ? "Copyright or prevent-reimport content must be resolved through the Copyright workflow."
                                : undefined
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
        )}

        {contentList.data ? (
          <div
            className={
              styles.freshnessBar
            }
          >
            <span>
              Generated{" "}
              {formatTimestamp(
                contentList
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

      {selectedId ? (
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
                  {selectedRecord
                    ?.publicId ??
                    "Content"}
                </span>

                <h3>
                  Content details
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
              {selectedDetails.isLoading &&
              !selectedRecord ? (
                <div
                  className={
                    styles.detailState
                  }
                >
                  Loading content details…
                </div>
              ) : selectedDetails.error &&
                !selectedRecord ? (
                <div
                  className={
                    styles.detailState
                  }
                  role="alert"
                >
                  <strong>
                    Content details could not be loaded
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
              ) : selectedRecord ? (
                <>
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
                          Poster Content ID
                        </dt>

                        <dd>
                          {
                            selectedRecord.publicId
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
                            selectedRecord.publisherName
                          }
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
                            selectedRecord.originalUrl
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Source method
                        </dt>

                        <dd>
                          {sourceMethodLabel(
                            selectedRecord.acquisitionMethod
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
                          {selectedRecord.status ===
                          "active"
                            ? "Active"
                            : "Removed"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Prevent re-import
                        </span>

                        <strong>
                          {selectedRecord.preventReimport
                            ? "Yes"
                            : "No"}
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
                        </strong>

                        <span>
                          {reasonLabel(
                            selectedRecord.removalReason
                          )}
                        </span>

                        {selectedRecord.copyrightClaimant ? (
                          <span>
                            Copyright strike by{" "}
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
                          {formatDate(
                            selectedRecord.publishedAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Added to Poster
                        </dt>

                        <dd>
                          {formatDate(
                            selectedRecord.addedAt
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
                      Audit history
                    </h4>

                    <div
                      className={
                        styles.auditList
                      }
                    >
                      {selectedAudit.length >
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
              ) : null}
            </div>

            {selectedRecord ? (
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
                    disabled={
                      contentActions.isRunning
                    }
                  >
                    Remove from Poster
                  </button>
                ) : (
                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={() => {
                      void restoreRecord(
                        selectedRecord
                      );
                    }}
                    disabled={
                      contentActions.isRunning ||
                      selectedRecord.preventReimport ||
                      selectedRecord.removalReason ===
                        "copyright"
                    }
                  >
                    Restore
                  </button>
                )}
              </div>
            ) : null}
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
              Remove from Poster?
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
                  removalRecord.publicId
                }
              </strong>
            </p>

            {removalRecord.copyrightClaimant ? (
              <div
                className={
                  styles.copyrightNotice
                }
              >
                <strong>
                  Copyright strike by{" "}
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
                Removal reason
              </legend>

              {REMOVAL_REASONS.map(
                option => (
                  <label
                    key={
                      option.value
                    }
                    className={
                      styles.reasonOption
                    }
                  >
                    <input
                      type="radio"
                      name="content-removal-reason"
                      value={
                        option.value
                      }
                      checked={
                        removeReason ===
                        option.value
                      }
                      onChange={() =>
                        setRemoveReason(
                          option.value
                        )
                      }
                    />

                    <span>
                      {
                        option.label
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
                Internal note
              </span>

              <textarea
                value={
                  removeNote
                }
                onChange={
                  event =>
                    setRemoveNote(
                      event.target
                        .value
                    )
                }
                placeholder="Optional operational context."
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
                onChange={
                  event =>
                    setPreventReimport(
                      event.target
                        .checked
                    )
                }
              />

              <span>
                <strong>
                  Prevent re-import
                </strong>

                Block future ingestion of this original URL.
              </span>
            </label>

            {contentActions.error ? (
              <div
                className={
                  styles.actionError
                }
                role="alert"
              >
                {
                  contentActions.error
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
                  cancelRemove
                }
                disabled={
                  contentActions.isRunning
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
                  void confirmRemove();
                }}
                disabled={
                  contentActions.isRunning ||
                  (
                    removeReason ===
                      "copyright" &&
                    (
                      !removalRecord.copyrightCaseId ||
                      !removalRecord.copyrightClaimant
                    )
                  )
                }
              >
                {contentActions.isRunning
                  ? "Removing…"
                  : preventReimport
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