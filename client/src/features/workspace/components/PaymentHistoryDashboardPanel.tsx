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
  PaymentHistoryTable,
} from "./PaymentHistoryTable";

import styles from "./PaymentHistoryDashboardPanel.module.css";

export interface PaymentHistoryDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  enabled?:
    boolean;
}

export function PaymentHistoryDashboardPanel(
  props:
    PaymentHistoryDashboardPanelProps
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

  const payments =
    data?.payments ??
    [];

  const verifiedPayments =
    payments.filter(
      (
        payment
      ) =>
        payment.paymentVerified &&
        payment.riskAccepted
    );

  const capturedMinor =
    verifiedPayments.reduce(
      (
        total,
        payment
      ) =>
        total +
        payment.capturedAmountMinor,
      0
    );

  const refundedMinor =
    payments.reduce(
      (
        total,
        payment
      ) =>
        total +
        payment.refundedAmountMinor,
      0
    );

  return (
    <section
      aria-label="Payment history workspace"
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description="Review verified payments, provider references, payment methods, captured amounts, refunds, and risk checks."
        isRefreshing={
          isRefreshing
        }
        onRefresh={
          refresh
        }
        refreshLabel="Refresh payment history"
        title="Payment history"
      />

      <DashboardState
        error={
          error
        }
        errorTitle="Unable to load payment history"
        isEmpty={
          Boolean(
            data &&
            payments.length ===
              0
          )
        }
        isLoading={
          isLoading
        }
        isRefreshing={
          isRefreshing
        }
        loadingDescription="Preparing verified payment and provider-reference information."
        loadingTitle="Loading payment history"
        onRefresh={
          refresh
        }
        refreshLabel="Refresh payment history"
      >
        {data ? (
          <>
            <div
              aria-label="Payment history summary"
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
                  Payment records
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    payments.length
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
                  Verified payments
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    verifiedPayments.length
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
                  Captured
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatMoneyMinor(
                    capturedMinor,
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
                  Refunded
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatMoneyMinor(
                    refundedMinor,
                    props.currency
                  )}
                </span>
              </div>
            </div>

            <PaymentHistoryTable
              payments={
                payments
              }
            />
          </>
        ) : null}
      </DashboardState>
    </section>
  );
}