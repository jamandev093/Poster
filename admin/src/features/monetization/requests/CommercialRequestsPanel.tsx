"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CommercialRequest,
  CommercialRequestStatus,
  CommercialRequestType,
} from "../monetization.types";

import CommercialRequestDrawer from "./CommercialRequestDrawer";

import type {
  CommercialRequestDetail,
  CommercialRequestGateway,
} from "./commercial-request.types";

import styles from "./CommercialRequests.module.css";

interface CommercialRequestsPanelProps {
  gateway:
    CommercialRequestGateway;
}

function statusLabel(
  status:
    CommercialRequestStatus
): string {
  return status
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}

function typeLabel(
  type:
    CommercialRequestType
): string {
  return type ===
    "direct_sponsorship"
    ? "Direct sponsorship"
    : "Affiliate";
}

function formatDate(
  value:
    string
): string {
  const date =
    new Date(
      value
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
      dateStyle:
        "medium",
    }
  ).format(
    date
  );
}

export default function CommercialRequestsPanel(
  props:
    CommercialRequestsPanelProps
) {
  const [
    requests,
    setRequests,
  ] =
    useState<
      CommercialRequest[]
    >(
      []
    );

  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      | "all"
      | CommercialRequestStatus
    >(
      "pending_review"
    );

  const [
    type,
    setType,
  ] =
    useState<
      | "all"
      | CommercialRequestType
    >(
      "all"
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      CommercialRequestDetail | null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    busy,
    setBusy,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    note,
    setNote,
  ] =
    useState(
      ""
    );

  const [
    campaignName,
    setCampaignName,
  ] =
    useState(
      ""
    );

  const loadRequests =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          null
        );

        try {
          setRequests(
            await props
              .gateway
              .list({
                query,

                status,

                type,
              })
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Advertising requests could not be loaded."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        props.gateway,
        query,
        status,
        type,
      ]
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadRequests();
          },
          0
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      loadRequests,
    ]
  );

  const counts =
    useMemo(
      () => ({
        pending:
          requests.filter(
            (
              request
            ) =>
              request.status ===
              "pending_review"
          ).length,

        visible:
          requests.length,
      }),
      [
        requests,
      ]
    );

  const openRequest =
    async (
      requestId:
        string
    ) => {
      setError(
        null
      );

      try {
        const detail =
          await props
            .gateway
            .get(
              requestId
            );

        if (!detail) {
          setError(
            "Advertising request was not found."
          );

          return;
        }

        setSelected(
          detail
        );

        setNote(
          detail
            .request
            .reviewNote ??
          ""
        );

        setCampaignName(
          detail
            .request
            .campaignName
        );
      } catch (
        detailError
      ) {
        setError(
          detailError instanceof
            Error
            ? detailError.message
            : "Advertising request details could not be loaded."
        );
      }
    };

  const performDecision =
    async (
      action:
        | "changes"
        | "reject"
        | "approve"
    ) => {
      if (!selected) {
        return;
      }

      setBusy(
        true
      );

      setError(
        null
      );

      try {
        const updated =
          action ===
          "changes"
            ? await props
                .gateway
                .requestChanges({
                  requestId:
                    selected
                      .request
                      .id,

                  note:
                    note.trim(),
                })
            : action ===
              "reject"
            ? await props
                .gateway
                .reject({
                  requestId:
                    selected
                      .request
                      .id,

                  note:
                    note.trim(),
                })
            : await props
                .gateway
                .approve({
                  requestId:
                    selected
                      .request
                      .id,

                  note:
                    note.trim(),

                  campaignName:
                    campaignName.trim(),
                });

        await loadRequests();

        setSelected(
          (
            current
          ) =>
            current
              ? {
                  ...current,

                  request:
                    updated,
                }
              : null
        );
      } catch (
        decisionError
      ) {
        setError(
          decisionError instanceof
            Error
            ? decisionError.message
            : "The Admin decision could not be completed."
        );
      } finally {
        setBusy(
          false
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
          <span>
            Monetization
          </span>

          <h2>
            Advertising requests
          </h2>

          <p>
            Review Client submissions before any campaign is created.
            Approval creates a draft only and never starts delivery
            automatically.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {
              counts.pending
            }
          </strong>

          <span>
            awaiting action
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
            placeholder="Search request, organization or campaign…"
            aria-label="Search advertising requests"
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
          />

          <select
            value={
              status
            }
            aria-label="Filter request status"
            onChange={(
              event
            ) =>
              setStatus(
                event.target.value as
                  | "all"
                  | CommercialRequestStatus
              )
            }
          >
            <option value="all">
              All statuses
            </option>

            <option value="pending_review">
              Pending review
            </option>

            <option value="changes_requested">
              Changes requested
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

          <select
            value={
              type
            }
            aria-label="Filter request type"
            onChange={(
              event
            ) =>
              setType(
                event.target.value as
                  | "all"
                  | CommercialRequestType
              )
            }
          >
            <option value="all">
              All request types
            </option>

            <option value="direct_sponsorship">
              Direct sponsorship
            </option>

            <option value="affiliate">
              Affiliate
            </option>
          </select>
        </div>

        {error ? (
          <div
            className={
              styles.error
            }
            role="alert"
          >
            {
              error
            }

            <button
              type="button"
              onClick={() =>
                void loadRequests()
              }
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div
            className={
              styles.empty
            }
          >
            Loading advertising requests…
          </div>
        ) : requests.length ===
          0 ? (
          <div
            className={
              styles.empty
            }
          >
            No advertising requests match the current filters.
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
                    Request
                  </th>

                  <th>
                    Organization
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Placement
                  </th>

                  <th>
                    Submitted
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
                {requests.map(
                  (
                    request
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className={
                            styles.requestButton
                          }
                          onClick={() =>
                            void openRequest(
                              request.id
                            )
                          }
                        >
                          {
                            request.campaignName
                          }
                        </button>

                        <span>
                          {
                            request.id
                          }
                        </span>
                      </td>

                      <td>
                        {
                          request.organization
                        }
                      </td>

                      <td>
                        {typeLabel(
                          request.type
                        )}
                      </td>

                      <td>
                        {request.requestedPlacements.join(
                          ", "
                        )}
                      </td>

                      <td>
                        {formatDate(
                          request.submittedAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`${styles.status} ${
                            styles[
                              request.status
                            ]
                          }`}
                        >
                          {statusLabel(
                            request.status
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            styles.reviewButton
                          }
                          onClick={() =>
                            void openRequest(
                              request.id
                            )
                          }
                        >
                          {request.status ===
                          "pending_review"
                            ? "Review"
                            : "View"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <CommercialRequestDrawer
          detail={
            selected
          }
          busy={
            busy
          }
          note={
            note
          }
          campaignName={
            campaignName
          }
          onNoteChange={
            setNote
          }
          onCampaignNameChange={
            setCampaignName
          }
          onClose={() =>
            setSelected(
              null
            )
          }
          onRequestChanges={() =>
            void performDecision(
              "changes"
            )
          }
          onReject={() =>
            void performDecision(
              "reject"
            )
          }
          onApprove={() =>
            void performDecision(
              "approve"
            )
          }
        />
      ) : null}
    </div>
  );
}


