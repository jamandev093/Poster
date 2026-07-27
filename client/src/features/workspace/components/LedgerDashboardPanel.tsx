"use client";

import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  formatFinancialCount,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  usePaymentDashboard,
} from "../hooks/usePaymentDashboard";

import {
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

import {
  DashboardState,
} from "./DashboardState";

import {
  LedgerTable,
} from "./LedgerTable";

import styles from "./LedgerDashboardPanel.module.css";

export interface LedgerDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  enabled?:
    boolean;
}

export function LedgerDashboardPanel(
  props:
    LedgerDashboardPanelProps
) {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    usePaymentDashboard({
      organizationId:
        props.organizationId,

      currency:
        props.currency,

      enabled:
        props.enabled,
    });

  const ledger =
    data?.ledger ??
    [];

  const finalizedEntries =
    ledger.filter(
      (
        entry
      ) =>
        entry.status ===
        "finalized"
    );

  const pendingEntries =
    ledger.filter(
      (
        entry
      ) =>
        entry.status ===
        "pending"
    );

  const totalCreditsMinor =
    finalizedEntries.reduce(
      (
        total,
        entry
      ) =>
        entry.direction ===
        "credit"
          ? total +
            entry.amountMinor
          : total,
      0
    );

  const totalDebitsMinor =
    finalizedEntries.reduce(
      (
        total,
        entry
      ) =>
        entry.direction ===
        "debit"
          ? total +
            entry.amountMinor
          : total,
      0
    );

  return (
    <section
      aria-label="Ledger workspace"
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description="Review immutable payment credits, campaign spend, reconciliations, refunds, disputes, and balance movements."
        isRefreshing={
          isRefreshing
        }
        onRefresh={
          refresh
        }
        refreshLabel="Refresh ledger"
        title="Financial ledger"
      />

      <div
        className={
          styles.notice
        }
        role="note"
      >
        Ledger records are read-only in the Client workspace.
        Corrections and reversals are recorded as additional
        Backend-authorized entries rather than editing or deleting
        historical records.
      </div>

      <DashboardState
        error={
          error
        }
        errorTitle="Unable to load the financial ledger"
        isEmpty={
          Boolean(
            data &&
            ledger.length ===
              0
          )
        }
        isLoading={
          isLoading
        }
        isRefreshing={
          isRefreshing
        }
        loadingDescription="Preparing immutable financial entries and balance movements."
        loadingTitle="Loading financial ledger"
        onRefresh={
          refresh
        }
        refreshLabel="Refresh ledger"
      >
        {data ? (
          <>
            <div
              aria-label="Ledger summary"
              className={
                styles.summary
              }
            >
              <div
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  Ledger entries
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    ledger.length
                  )}
                </span>
              </div>

              <div
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  Finalized credits
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    styles.summaryValueCredit,
                  ].join(
                    " "
                  )}
                >
                  {formatMoneyMinor(
                    totalCreditsMinor,
                    props.currency
                  )}
                </span>
              </div>

              <div
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  Finalized debits
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    styles.summaryValueDebit,
                  ].join(
                    " "
                  )}
                >
                  {formatMoneyMinor(
                    totalDebitsMinor,
                    props.currency
                  )}
                </span>
              </div>

              <div
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  Pending entries
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    pendingEntries.length >
                    0
                      ? styles.summaryValueAttention
                      : "",
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    )}
                >
                  {formatFinancialCount(
                    pendingEntries.length
                  )}
                </span>
              </div>
            </div>

            <LedgerTable
              entries={
                ledger
              }
            />
          </>
        ) : null}
      </DashboardState>
    </section>
  );
}