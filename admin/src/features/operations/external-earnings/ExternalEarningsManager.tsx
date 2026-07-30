"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  earningEventLabel,
  earningStatusLabel,
  payoutStatusLabel,
} from "./external-earning.constants";

import {
  EMPTY_EXTERNAL_EARNING_DRAFT,
  hasExternalEarningErrors,
  validateExternalEarning,
} from "./external-earning.validation";

import {
  INITIAL_EXTERNAL_EARNINGS,
} from "./external-earning.mock";

import {
  INITIAL_EXTERNAL_PROGRAMS,
} from "../external-programs/external-program.mock";

import {
  INITIAL_EXTERNAL_PROMOTIONS,
} from "../external-promotions/external-promotion.mock";

import ExternalEarningEditor from "./ExternalEarningEditor";
import ExternalEarningDetails from "./ExternalEarningDetails";

import type {
  ExternalEarningAuditEntry,
  ExternalEarningDraft,
  ExternalEarningErrors,
  ExternalEarningRecord,
  ExternalEarningStatus,
} from "./external-earning.types";

import styles from "./ExternalEarningsManager.module.css";

type WorkspaceMode =
  | "closed"
  | "create"
  | "edit"
  | "details";

type StatusFilter =
  | "all"
  | ExternalEarningStatus;

function currentTimestamp() {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(new Date());
}

function createIdentifier(
  prefix: string
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function recordToDraft(
  earning: ExternalEarningRecord
): ExternalEarningDraft {
  return {
    programId:
      earning.programId,

    promotionId:
      earning.promotionId,

    externalConversionId:
      earning.externalConversionId,

    externalOrderId:
      earning.externalOrderId,

    externalPayoutId:
      earning.externalPayoutId,

    eventType:
      earning.eventType,

    source:
      earning.source,

    conversionDate:
      earning.conversionDate,

    confirmationDate:
      earning.confirmationDate,

    payoutDate:
      earning.payoutDate,

    status:
      earning.status,

    payoutStatus:
      earning.payoutStatus,

    currency:
      earning.amount.currency,

    grossAmount:
      String(
        earning.amount.grossAmount
      ),

    commissionAmount:
      String(
        earning.amount
          .commissionAmount
      ),

    taxWithheld:
      String(
        earning.amount.taxWithheld
      ),

    fees:
      String(
        earning.amount.fees
      ),

    netAmount:
      String(
        earning.amount.netAmount
      ),

    customerCountry:
      earning.customerCountry,

    statementReference:
      earning.statementReference,

    evidenceUrl:
      earning.evidenceUrl,

    reversalReason:
      earning.reversalReason,

    rejectionReason:
      earning.rejectionReason,

    notes:
      earning.notes,
  };
}

function numberValue(
  value: string
) {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}

function formatAmount(
  value: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatCurrencyTotals(
  inrAmount: number,
  usdAmount: number
) {
  return [
    formatAmount(
      inrAmount,
      "INR"
    ),
    formatAmount(
      usdAmount,
      "USD"
    ),
  ].join(" · ");
}

function auditMessageForStatus(
  status: ExternalEarningStatus
) {
  switch (status) {
    case "confirmed":
      return "External conversion confirmed.";

    case "approved":
      return "External earning approved.";

    case "payable":
      return "External earning marked payable.";

    case "paid":
      return "External earning marked paid.";

    case "reversed":
      return "External earning reversed.";

    case "rejected":
      return "External earning rejected.";

    default:
      return "External earning status updated.";
  }
}

function auditActionForStatus(
  status: ExternalEarningStatus
): ExternalEarningAuditEntry["action"] {
  switch (status) {
    case "confirmed":
      return "confirmed";

    case "approved":
      return "approved";

    case "payable":
      return "marked_payable";

    case "paid":
      return "marked_paid";

    case "reversed":
      return "reversed";

    case "rejected":
      return "rejected";

    default:
      return "updated";
  }
}

export default function ExternalEarningsManager() {
  const [
    earnings,
    setEarnings,
  ] = useState<
    ExternalEarningRecord[]
  >(
    INITIAL_EXTERNAL_EARNINGS
  );

  const [
    workspaceMode,
    setWorkspaceMode,
  ] = useState<WorkspaceMode>(
    "closed"
  );

  const [
    selectedEarningId,
    setSelectedEarningId,
  ] = useState<string | null>(
    null
  );

  const [
    draft,
    setDraft,
  ] = useState<
    ExternalEarningDraft
  >({
    ...EMPTY_EXTERNAL_EARNING_DRAFT,
  });

  const [
    errors,
    setErrors,
  ] = useState<
    ExternalEarningErrors
  >({});

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>(
    "all"
  );

  const approvedPrograms =
    useMemo(
      () =>
        INITIAL_EXTERNAL_PROGRAMS
          .filter(
            (program) =>
              program.status ===
              "approved"
          )
          .map((program) => ({
            id: program.id,
            programName:
              program.programName,
            platformName:
              program.platformName,
          })),
      []
    );

  const promotionOptions =
    useMemo(
      () =>
        INITIAL_EXTERNAL_PROMOTIONS
          .map((promotion) => ({
            id: promotion.id,
            programId:
              promotion.programId,
            name: promotion.name,
            headline:
              promotion.headline,
          })),
      []
    );

  const selectedEarning =
    useMemo(
      () =>
        earnings.find(
          (earning) =>
            earning.id ===
            selectedEarningId
        ) ?? null,
      [
        earnings,
        selectedEarningId,
      ]
    );

  const programNames =
    useMemo(
      () =>
        new Map(
          approvedPrograms.map(
            (program) => [
              program.id,
              program.programName,
            ]
          )
        ),
      [approvedPrograms]
    );

  const promotionNames =
    useMemo(
      () =>
        new Map(
          promotionOptions.map(
            (promotion) => [
              promotion.id,
              promotion.name,
            ]
          )
        ),
      [promotionOptions]
    );

  const filteredEarnings =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      return earnings.filter(
        (earning) => {
          if (
            statusFilter !==
              "all" &&
            earning.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            !normalizedQuery
          ) {
            return true;
          }

          const searchableText = [
            earning
              .externalConversionId,
            earning.externalOrderId,
            earning.externalPayoutId,
            earning.statementReference,
            earning.customerCountry,
            programNames.get(
              earning.programId
            ) ?? "",
            promotionNames.get(
              earning.promotionId
            ) ?? "",
            earningEventLabel(
              earning.eventType
            ),
            earningStatusLabel(
              earning.status
            ),
            payoutStatusLabel(
              earning.payoutStatus
            ),
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedQuery
          );
        }
      );
    }, [
      earnings,
      programNames,
      promotionNames,
      searchQuery,
      statusFilter,
    ]);

  const summary =
    useMemo(() => {
      const activeRecords =
        earnings.filter(
          (earning) =>
            earning.status !==
              "reversed" &&
            earning.status !==
              "rejected"
        );

      const sumNetByCurrency = (
        statuses: ExternalEarningStatus[],
        currency: string
      ) =>
        activeRecords
          .filter(
            (earning) =>
              statuses.includes(
                earning.status
              ) &&
              earning.amount.currency ===
                currency
          )
          .reduce(
            (total, earning) =>
              total +
              earning.amount.netAmount,
            0
          );

      const approvedInr =
        sumNetByCurrency(
          [
            "approved",
            "payable",
            "paid",
          ],
          "INR"
        );

      const approvedUsd =
        sumNetByCurrency(
          [
            "approved",
            "payable",
            "paid",
          ],
          "USD"
        );

      const payableInr =
        sumNetByCurrency(
          ["payable"],
          "INR"
        );

      const payableUsd =
        sumNetByCurrency(
          ["payable"],
          "USD"
        );

      const paidInr =
        sumNetByCurrency(
          ["paid"],
          "INR"
        );

      const paidUsd =
        sumNetByCurrency(
          ["paid"],
          "USD"
        );

      return {
        total:
          earnings.length,

        pending:
          earnings.filter(
            (earning) =>
              earning.status ===
                "pending" ||
              earning.status ===
                "confirmed"
          ).length,

        approvedInr,

        approvedUsd,

        payableInr,

        payableUsd,

        paidInr,

        paidUsd,

        reversed:
          earnings.filter(
            (earning) =>
              earning.status ===
                "reversed" ||
              earning.status ===
                "rejected"
          ).length,
      };
    }, [earnings]);

  const closeWorkspace = () => {
    setWorkspaceMode(
      "closed"
    );

    setSelectedEarningId(
      null
    );

    setErrors({});
  };

  const openCreate = () => {
    setDraft({
      ...EMPTY_EXTERNAL_EARNING_DRAFT,
    });

    setErrors({});

    setSelectedEarningId(
      null
    );

    setWorkspaceMode(
      "create"
    );
  };

  const openDetails = (
    earningId: string
  ) => {
    setSelectedEarningId(
      earningId
    );

    setErrors({});

    setWorkspaceMode(
      "details"
    );
  };

  const openEdit = (
    earning: ExternalEarningRecord
  ) => {
    setSelectedEarningId(
      earning.id
    );

    setDraft(
      recordToDraft(earning)
    );

    setErrors({});

    setWorkspaceMode(
      "edit"
    );
  };

  const saveDraft = () => {
    const nextErrors =
      validateExternalEarning(
        draft
      );

    setErrors(nextErrors);

    if (
      hasExternalEarningErrors(
        nextErrors
      )
    ) {
      return;
    }

    const timestamp =
      currentTimestamp();

    if (
      workspaceMode ===
      "create"
    ) {
      const newId =
        createIdentifier(
          "external-earning"
        );

      const newRecord:
        ExternalEarningRecord = {
        id: newId,

        programId:
          draft.programId,

        promotionId:
          draft.promotionId,

        externalConversionId:
          draft.externalConversionId
            .trim(),

        externalOrderId:
          draft.externalOrderId
            .trim(),

        externalPayoutId:
          draft.externalPayoutId
            .trim(),

        eventType:
          draft.eventType,

        source:
          draft.source,

        conversionDate:
          draft.conversionDate,

        confirmationDate:
          draft.confirmationDate,

        payoutDate:
          draft.payoutDate,

        status:
          draft.status,

        payoutStatus:
          draft.payoutStatus,

        amount: {
          currency:
            draft.currency
              .trim()
              .toUpperCase(),

          grossAmount:
            numberValue(
              draft.grossAmount
            ),

          commissionAmount:
            numberValue(
              draft.commissionAmount
            ),

          taxWithheld:
            numberValue(
              draft.taxWithheld
            ),

          fees:
            numberValue(
              draft.fees
            ),

          netAmount:
            numberValue(
              draft.netAmount
            ),
        },

        customerCountry:
          draft.customerCountry
            .trim(),

        statementReference:
          draft.statementReference
            .trim(),

        evidenceUrl:
          draft.evidenceUrl
            .trim(),

        reversalReason:
          draft.reversalReason
            .trim(),

        rejectionReason:
          draft.rejectionReason
            .trim(),

        notes:
          draft.notes.trim(),

        createdAt:
          timestamp,

        updatedAt:
          timestamp,

        auditHistory: [
          {
            id:
              createIdentifier(
                "earning-audit"
              ),

            action:
              "created",

            message:
              "External earning record created.",

            actor:
              "Admin",

            occurredAt:
              timestamp,
          },
        ],
      };

      setEarnings(
        (current) => [
          newRecord,
          ...current,
        ]
      );

      setSelectedEarningId(
        newId
      );

      setWorkspaceMode(
        "details"
      );

      return;
    }

    if (
      workspaceMode ===
        "edit" &&
      selectedEarning
    ) {
      setEarnings(
        (current) =>
          current.map(
            (earning) => {
              if (
                earning.id !==
                selectedEarning.id
              ) {
                return earning;
              }

              return {
                ...earning,

                programId:
                  draft.programId,

                promotionId:
                  draft.promotionId,

                externalConversionId:
                  draft
                    .externalConversionId
                    .trim(),

                externalOrderId:
                  draft.externalOrderId
                    .trim(),

                externalPayoutId:
                  draft.externalPayoutId
                    .trim(),

                eventType:
                  draft.eventType,

                source:
                  draft.source,

                conversionDate:
                  draft.conversionDate,

                confirmationDate:
                  draft.confirmationDate,

                payoutDate:
                  draft.payoutDate,

                status:
                  draft.status,

                payoutStatus:
                  draft.payoutStatus,

                amount: {
                  currency:
                    draft.currency
                      .trim()
                      .toUpperCase(),

                  grossAmount:
                    numberValue(
                      draft.grossAmount
                    ),

                  commissionAmount:
                    numberValue(
                      draft
                        .commissionAmount
                    ),

                  taxWithheld:
                    numberValue(
                      draft.taxWithheld
                    ),

                  fees:
                    numberValue(
                      draft.fees
                    ),

                  netAmount:
                    numberValue(
                      draft.netAmount
                    ),
                },

                customerCountry:
                  draft.customerCountry
                    .trim(),

                statementReference:
                  draft
                    .statementReference
                    .trim(),

                evidenceUrl:
                  draft.evidenceUrl
                    .trim(),

                reversalReason:
                  draft.reversalReason
                    .trim(),

                rejectionReason:
                  draft.rejectionReason
                    .trim(),

                notes:
                  draft.notes.trim(),

                updatedAt:
                  timestamp,

                auditHistory: [
                  ...earning.auditHistory,

                  {
                    id:
                      createIdentifier(
                        "earning-audit"
                      ),

                    action:
                      "updated",

                    message:
                      "External earning details updated.",

                    actor:
                      "Admin",

                    occurredAt:
                      timestamp,
                  },
                ],
              };
            }
          )
      );

      setWorkspaceMode(
        "details"
      );
    }
  };

  const changeStatus = (
    status: ExternalEarningStatus
  ) => {
    if (!selectedEarning) {
      return;
    }

    if (
      status === "paid" &&
      (!selectedEarning
        .externalPayoutId ||
        !selectedEarning
          .payoutDate)
    ) {
      openEdit(
        selectedEarning
      );

      setErrors({
        externalPayoutId:
          "Enter the external payout ID before marking this earning paid.",

        payoutDate:
          "Enter the payout date before marking this earning paid.",
      });

      return;
    }

    if (
      status === "reversed" &&
      !selectedEarning
        .reversalReason
    ) {
      openEdit(
        selectedEarning
      );

      setDraft({
        ...recordToDraft(
          selectedEarning
        ),
        status:
          "reversed",
        payoutStatus:
          "reversed",
      });

      setErrors({
        reversalReason:
          "Enter the reversal reason before reversing this earning.",
      });

      return;
    }

    if (
      status === "rejected" &&
      !selectedEarning
        .rejectionReason
    ) {
      openEdit(
        selectedEarning
      );

      setDraft({
        ...recordToDraft(
          selectedEarning
        ),
        status:
          "rejected",
      });

      setErrors({
        rejectionReason:
          "Enter the rejection reason before rejecting this earning.",
      });

      return;
    }

    const timestamp =
      currentTimestamp();

    setEarnings(
      (current) =>
        current.map(
          (earning) => {
            if (
              earning.id !==
              selectedEarning.id
            ) {
              return earning;
            }

            return {
              ...earning,

              status,

              payoutStatus:
                status === "paid"
                  ? "paid"
                  : status ===
                      "reversed"
                    ? "reversed"
                    : earning
                        .payoutStatus,

              updatedAt:
                timestamp,

              auditHistory: [
                ...earning.auditHistory,

                {
                  id:
                    createIdentifier(
                      "earning-audit"
                    ),

                  action:
                    auditActionForStatus(
                      status
                    ),

                  message:
                    auditMessageForStatus(
                      status
                    ),

                  actor:
                    "Admin",

                  occurredAt:
                    timestamp,
                },
              ],
            };
          }
        )
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            Operations
          </p>

          <h1>External Earnings</h1>

          <p className={styles.intro}>
            Track externally reported
            conversions, commissions,
            payout states and
            reconciliation evidence.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={openCreate}
        >
          Add earning
        </button>
      </header>

      <section
        className={styles.summaryGrid}
        aria-label="External earnings summary"
      >
        <SummaryCard
          label="Total records"
          value={String(
            summary.total
          )}
          description="All externally reported earnings"
        />

        <SummaryCard
          label="Needs review"
          value={String(
            summary.pending
          )}
          description="Pending or confirmed records"
        />

        <SummaryCard
          label="Approved net"
          value={formatCurrencyTotals(
            summary.approvedInr,
            summary.approvedUsd
          )}
          description="Approved, payable and paid earnings by currency"
        />

        <SummaryCard
          label="Payable net"
          value={formatCurrencyTotals(
            summary.payableInr,
            summary.payableUsd
          )}
          description="Earnings ready for payout by currency"
        />

        <SummaryCard
          label="Paid net"
          value={formatCurrencyTotals(
            summary.paidInr,
            summary.paidUsd
          )}
          description="Recorded payouts by currency"
        />

        <SummaryCard
          label="Exceptions"
          value={String(
            summary.reversed
          )}
          description="Reversed or rejected records"
        />
      </section>

      <section className={styles.workspace}>
        <div className={styles.toolbar}>
          <div
            className={styles.searchField}
          >
            <label
              htmlFor="external-earnings-search"
            >
              Search earnings
            </label>

            <input
              id="external-earnings-search"
              type="search"
              value={searchQuery}
              placeholder="Conversion, order, payout, program or promotion"
              onChange={(event) => {
                setSearchQuery(
                  event.target.value
                );
              }}
            />
          </div>

          <label
            className={styles.filterField}
          >
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                );
              }}
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="payable">
                Payable
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="reversed">
                Reversed
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </label>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Conversion</th>
                <th>Program / promotion</th>
                <th>Outcome</th>
                <th>Status</th>
                <th>Commission</th>
                <th>Net earning</th>
                <th>Payout</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {filteredEarnings.map(
                (earning) => {
                  const programName =
                    programNames.get(
                      earning.programId
                    ) ??
                    "Unknown program";

                  const promotionName =
                    promotionNames.get(
                      earning.promotionId
                    ) ??
                    "Unknown promotion";

                  return (
                    <tr key={earning.id}>
                      <td>
                        <strong>
                          {
                            earning
                              .externalConversionId
                          }
                        </strong>

                        <span>
                          {
                            earning
                              .conversionDate
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {promotionName}
                        </strong>

                        <span>
                          {programName}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {earningEventLabel(
                            earning.eventType
                          )}
                        </strong>

                        <span>
                          {
                            earning
                              .customerCountry
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            styles.statusBadge
                          }
                          data-status={
                            earning.status
                          }
                        >
                          {earningStatusLabel(
                            earning.status
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatAmount(
                            earning.amount
                              .commissionAmount,
                            earning.amount
                              .currency
                          )}
                        </strong>

                        <span>
                          Gross{" "}
                          {formatAmount(
                            earning.amount
                              .grossAmount,
                            earning.amount
                              .currency
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatAmount(
                            earning.amount
                              .netAmount,
                            earning.amount
                              .currency
                          )}
                        </strong>

                        <span>
                          After tax and fees
                        </span>
                      </td>

                      <td>
                        <strong>
                          {payoutStatusLabel(
                            earning
                              .payoutStatus
                          )}
                        </strong>

                        <span>
                          {earning.payoutDate ||
                            "No payout date"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            styles.viewButton
                          }
                          onClick={() => {
                            openDetails(
                              earning.id
                            );
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {filteredEarnings.length ===
          0 ? (
            <div
              className={styles.emptyState}
            >
              <h2>
                No earnings found
              </h2>

              <p>
                Adjust the search or
                status filter, or add a
                new external earning.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {workspaceMode !==
      "closed" ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeWorkspace();
            }
          }}
        >
          <aside
            className={styles.drawer}
            aria-label="External earning workspace"
          >
            {workspaceMode ===
              "details" &&
            selectedEarning ? (
              <ExternalEarningDetails
                earning={
                  selectedEarning
                }
                programName={
                  programNames.get(
                    selectedEarning
                      .programId
                  ) ??
                  "Unknown program"
                }
                promotionName={
                  promotionNames.get(
                    selectedEarning
                      .promotionId
                  ) ??
                  "Unknown promotion"
                }
                onEdit={() => {
                  openEdit(
                    selectedEarning
                  );
                }}
                onClose={
                  closeWorkspace
                }
                onStatusChange={
                  changeStatus
                }
              />
            ) : null}

            {workspaceMode ===
              "create" ||
            workspaceMode ===
              "edit" ? (
              <div
                className={
                  styles.editorPanel
                }
              >
                <header
                  className={
                    styles.editorHeader
                  }
                >
                  <div>
                    <p>
                      External earning
                    </p>

                    <h2>
                      {workspaceMode ===
                      "create"
                        ? "Add earning"
                        : "Edit earning"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeWorkspace
                    }
                    aria-label="Close earning editor"
                  >
                    ×
                  </button>
                </header>

                <div
                  className={
                    styles.editorBody
                  }
                >
                  <ExternalEarningEditor
                    draft={draft}
                    errors={errors}
                    programs={
                      approvedPrograms
                    }
                    promotions={
                      promotionOptions
                    }
                    submitLabel={
                      workspaceMode ===
                      "create"
                        ? "Create earning"
                        : "Save changes"
                    }
                    onChange={(
                      nextDraft
                    ) => {
                      setDraft(
                        nextDraft
                      );

                      if (
                        Object.keys(
                          errors
                        ).length > 0
                      ) {
                        setErrors({});
                      }
                    }}
                    onSubmit={
                      saveDraft
                    }
                    onCancel={() => {
                      if (
                        selectedEarning
                      ) {
                        setWorkspaceMode(
                          "details"
                        );
                      } else {
                        closeWorkspace();
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  description: string;
}

function SummaryCard({
  label,
  value,
  description,
}: SummaryCardProps) {
  return (
    <article
      className={styles.summaryCard}
    >
      <span>{label}</span>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  );
}




