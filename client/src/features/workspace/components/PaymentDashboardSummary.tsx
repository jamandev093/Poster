import type {
  PaymentDashboardSummary as PaymentDashboardSummaryModel,
} from "../adapters/payment-dashboard.adapter";

import {
  formatFinancialCount,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  FinancialSummaryCard,
} from "./FinancialSummaryCard";

import {
  FinancialSummaryGrid,
} from "./FinancialSummaryGrid";

import styles from "./PaymentDashboardSummary.module.css";

/**
 * Advertiser financial dashboard summary.
 *
 * This component formats already-adapted payment dashboard
 * totals.
 *
 * Backend balance authority, payment verification, ledger
 * mutation, refunds, and settlement processing remain outside
 * React.
 */

export interface PaymentDashboardSummaryViewProps {
  summary:
    PaymentDashboardSummaryModel;
}

export function PaymentDashboardSummaryView(
  props:
    PaymentDashboardSummaryViewProps
) {
  const {
    summary,
  } =
    props;

  return (
    <div
      className={
        styles.summary
      }
    >
      <FinancialSummaryGrid>
        <FinancialSummaryCard
          description="Verified advertiser payments allocated to campaigns"
          label="Paid funds"
          tone="information"
          value={formatMoneyMinor(
            summary.totalPaidMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Funds currently eligible for campaign delivery"
          label="Available balance"
          status={{
            label:
              summary
                .totalAvailableMinor >
              0
                ? "Available"
                : "Unavailable",

            tone:
              summary
                .totalAvailableMinor >
              0
                ? "success"
                : "danger",
          }}
          tone={
            summary.totalAvailableMinor >
            0
              ? "success"
              : "danger"
          }
          value={formatMoneyMinor(
            summary.totalAvailableMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Funds reserved for planned or pending campaign activity"
          label="Reserved funds"
          status={
            summary.totalReservedMinor >
            0
              ? {
                  label:
                    "Reserved",

                  tone:
                    "information",
                }
              : undefined
          }
          value={formatMoneyMinor(
            summary.totalReservedMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Recent delivery before final traffic and billing validation"
          label="Estimated spend"
          tone="information"
          value={formatMoneyMinor(
            summary
              .totalEstimatedSpendMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Activity still awaiting validation and reconciliation"
          label="Pending validation"
          status={
            summary
              .totalPendingValidationSpendMinor >
            0
              ? {
                  label:
                    "Processing",

                  tone:
                    "attention",
                }
              : undefined
          }
          tone={
            summary
              .totalPendingValidationSpendMinor >
            0
              ? "attention"
              : "neutral"
          }
          value={formatMoneyMinor(
            summary
              .totalPendingValidationSpendMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Validated chargeable campaign delivery"
          label="Finalized spend"
          tone="success"
          value={formatMoneyMinor(
            summary
              .totalFinalizedSpendMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Invalid, duplicate, bot, test, and internal activity excluded from billing"
          label="Invalid-traffic credit"
          tone="success"
          value={formatMoneyMinor(
            summary
              .totalInvalidTrafficCreditMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Completed advertiser refunds"
          label="Refunded"
          status={
            summary.totalRefundedMinor >
            0
              ? {
                  label:
                    "Refunded",

                  tone:
                    "information",
                }
              : undefined
          }
          value={formatMoneyMinor(
            summary.totalRefundedMinor,
            summary.currency
          )}
        />

        <FinancialSummaryCard
          description="Funds still available after finalized deductions and adjustments"
          details={[
            {
              label:
                "Unpaid invoices",

              value:
                formatFinancialCount(
                  summary
                    .unpaidInvoiceCount
                ),
            },
            {
              label:
                "Active refunds",

              value:
                formatFinancialCount(
                  summary
                    .activeRefundCount
                ),
            },
            {
              label:
                "Pending settlements",

              value:
                formatFinancialCount(
                  summary
                    .unsettledSettlementCount
                ),
            },
          ]}
          label="Remaining balance"
          tone={
            summary.totalRemainingMinor >
            0
              ? "success"
              : "danger"
          }
          value={formatMoneyMinor(
            summary.totalRemainingMinor,
            summary.currency
          )}
        />
      </FinancialSummaryGrid>

      {summary.totalDisputedMinor > 0 ? (
        <div
          className={[
            styles.notice,
            styles.danger,
          ].join(
            " "
          )}
          role="alert"
        >
          {formatMoneyMinor(
            summary.totalDisputedMinor,
            summary.currency
          )}{" "}
          is currently disputed and unavailable for campaign
          delivery.
        </div>
      ) : null}

      {summary.unpaidInvoiceCount > 0 ? (
        <div
          className={[
            styles.notice,
            styles.warning,
          ].join(
            " "
          )}
          role="status"
        >
          {formatFinancialCount(
            summary.unpaidInvoiceCount
          )}{" "}
          invoice
          {summary.unpaidInvoiceCount ===
          1
            ? ""
            : "s"}{" "}
          currently
          {summary.unpaidInvoiceCount ===
          1
            ? " has"
            : " have"}{" "}
          an outstanding balance.
        </div>
      ) : null}

      {summary.activeRefundCount > 0 ? (
        <div
          className={
            styles.notice
          }
          role="status"
        >
          {formatFinancialCount(
            summary.activeRefundCount
          )}{" "}
          refund
          {summary.activeRefundCount ===
          1
            ? " is"
            : "s are"}{" "}
          currently being processed.
        </div>
      ) : null}
    </div>
  );
}

