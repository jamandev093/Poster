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
  RefundsTable,
} from "./RefundsTable";

import styles from "./RefundsDashboardPanel.module.css";

export interface RefundsDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  enabled?:
    boolean;
}

export function RefundsDashboardPanel(
  props:
    RefundsDashboardPanelProps
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

  const refunds =
    data?.refunds ??
    [];

  const activeRefunds =
    refunds.filter(
      (
        refund
      ) =>
        refund.status ===
          "requested" ||
        refund.status ===
          "under_review" ||
        refund.status ===
          "approved" ||
        refund.status ===
          "processing" ||
        refund.status ===
          "partially_refunded"
    );

  const failedRefunds =
    refunds.filter(
      (
        refund
      ) =>
        refund.status ===
        "failed"
    );

  const refundedMinor =
    refunds.reduce(
      (
        total,
        refund
      ) =>
        total +
        refund.refundedAmountMinor,
      0
    );

  return (
    <section
      aria-label="Refund workspace"
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description="Review requested, approved, processing, completed, rejected, failed, and cancelled refunds."
        isRefreshing={
          isRefreshing
        }
        onRefresh={
          refresh
        }
        refreshLabel="Refresh refunds"
        title="Refunds"
      />

      <DashboardState
        error={
          error
        }
        errorTitle="Unable to load refunds"
        isEmpty={
          Boolean(
            data &&
            refunds.length ===
              0
          )
        }
        isLoading={
          isLoading
        }
        isRefreshing={
          isRefreshing
        }
        loadingDescription="Preparing refund requests, approvals, provider references, and completed amounts."
        loadingTitle="Loading refunds"
        onRefresh={
          refresh
        }
        refreshLabel="Refresh refunds"
      >
        {data ? (
          <>
            <div
              aria-label="Refund summary"
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
                  Refund records
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    refunds.length
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
                  Active refunds
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    styles.summaryValueAttention,
                  ].join(
                    " "
                  )}
                >
                  {formatFinancialCount(
                    activeRefunds.length
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
                  className={[
                    styles.summaryValue,
                    styles.summaryValueSuccess,
                  ].join(
                    " "
                  )}
                >
                  {formatMoneyMinor(
                    refundedMinor,
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
                  Failed refunds
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    failedRefunds.length >
                    0
                      ? styles.summaryValueDanger
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
                    failedRefunds.length
                  )}
                </span>
              </div>
            </div>

            <RefundsTable
              refunds={
                refunds
              }
            />
          </>
        ) : null}
      </DashboardState>
    </section>
  );
}