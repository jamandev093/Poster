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
  InvoiceTable,
} from "./InvoiceTable";

import styles from "./InvoicesDashboardPanel.module.css";

export interface InvoicesDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  enabled?:
    boolean;
}

export function InvoicesDashboardPanel(
  props:
    InvoicesDashboardPanelProps
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

  const invoices =
    data?.invoices ??
    [];

  const outstandingMinor =
    invoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        invoice.outstandingMinor,
      0
    );

  const payableCount =
    invoices.filter(
      (
        invoice
      ) =>
        invoice.outstandingMinor >
          0 &&
        (
          invoice.status ===
            "issued" ||
          invoice.status ===
            "payment_pending" ||
          invoice.status ===
            "partially_paid" ||
          invoice.status ===
            "overdue"
        )
    ).length;

  return (
    <section
      aria-label="Invoice workspace"
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description="Review issued invoices, outstanding balances, due dates, status, and available invoice documents."
        isRefreshing={
          isRefreshing
        }
        onRefresh={
          refresh
        }
        refreshLabel="Refresh invoices"
        title="Invoices"
      />

      <DashboardState
        error={
          error
        }
        errorTitle="Unable to load invoices"
        isEmpty={
          Boolean(
            data &&
            invoices.length ===
              0
          )
        }
        isLoading={
          isLoading
        }
        isRefreshing={
          isRefreshing
        }
        loadingDescription="Preparing invoice and outstanding-balance information."
        loadingTitle="Loading invoices"
        onRefresh={
          refresh
        }
        refreshLabel="Refresh invoices"
      >
        {data ? (
          <>
            <div
              aria-label="Invoice summary"
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
                  Total invoices
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    invoices.length
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
                  Payable invoices
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    payableCount
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
                  Outstanding
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatMoneyMinor(
                    outstandingMinor,
                    props.currency
                  )}
                </span>
              </div>
            </div>

            <InvoiceTable
              invoices={
                invoices
              }
            />
          </>
        ) : null}
      </DashboardState>
    </section>
  );
}