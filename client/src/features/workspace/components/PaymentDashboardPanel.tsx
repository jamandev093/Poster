"use client";

import type {
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  formatFinancialCount,
  formatFinancialDateTime,
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
  PaymentDashboardSummaryView,
} from "./PaymentDashboardSummary";

import styles from "./PaymentDashboardPanel.module.css";

/**
 * Connected advertiser financial dashboard panel.
 *
 * This component coordinates financial presentation and
 * asynchronous loading state.
 *
 * Payment verification, ledger authority, refunds, settlement
 * processing, and balance mutation remain outside React.
 */

export interface PaymentDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    CampaignId[];

  title?:
    string;

  description?:
    string;

  enabled?:
    boolean;
}

export function PaymentDashboardPanel(
  props:
    PaymentDashboardPanelProps
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

      campaignIds:
        props.campaignIds,

      enabled:
        props.enabled,
    });

  const isEmpty =
    Boolean(
      data &&
      data.campaignBalances.length ===
        0 &&
      data.invoices.length ===
        0 &&
      data.payments.length ===
        0
    );

  const latestBudgetUpdate =
    data?.campaignBalances
      .map(
        (
          budget
        ) =>
          budget.updatedAt
      )
      .filter(
        (
          value
        ) =>
          !Number.isNaN(
            new Date(
              value
            ).getTime()
          )
      )
      .sort(
        (
          first,
          second
        ) =>
          new Date(
            second
          ).getTime() -
          new Date(
            first
          ).getTime()
      )[0];

  const metadata =
    latestBudgetUpdate
      ? `Updated ${formatFinancialDateTime(
          latestBudgetUpdate
        )}`
      : undefined;

  return (
    <section
      aria-label={
        props.title ??
        "Payments and balance"
      }
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description={
          props.description ??
          "Review verified payments, available campaign funds, finalized spend, refunds, and current balance."
        }
        isRefreshing={
          isRefreshing
        }
        metadata={
          metadata
        }
        onRefresh={
          refresh
        }
        title={
          props.title ??
          "Payments and balance"
        }
      />

      <div
        className={
          styles.content
        }
      >
        <DashboardState
          emptyDescription="Invoices, verified payments, balances, and refunds will appear here."
          emptyTitle="No financial activity yet"
          error={
            error
          }
          errorTitle="Unable to load payment information"
          isEmpty={
            isEmpty
          }
          isLoading={
            isLoading
          }
          isRefreshing={
            isRefreshing
          }
          loadingDescription="Preparing verified payment, balance, and ledger information."
          loadingTitle="Loading payment information"
          onRefresh={
            refresh
          }
          refreshLabel="Refresh payments"
        >
          {data ? (
            <>
              <PaymentDashboardSummaryView
                summary={
                  data.summary
                }
              />

              {data.warnings.map(
                (
                  warning
                ) => (
                  <div
                    className={[
                      styles.notice,
                      styles.warning,
                    ].join(
                      " "
                    )}
                    key={
                      warning
                    }
                    role="status"
                  >
                    {warning}
                  </div>
                )
              )}

              {data.ledger.length >
              0 ? (
                <div
                  className={
                    styles.notice
                  }
                  role="status"
                >
                  {formatFinancialCount(
                    data.ledger.length
                  )}{" "}
                  ledger entr
                  {data.ledger.length ===
                  1
                    ? "y is"
                    : "ies are"}{" "}
                  available for this financial view.
                </div>
              ) : null}

              {data.settlements.length >
              0 ? (
                <div
                  className={
                    styles.notice
                  }
                  role="status"
                >
                  {formatFinancialCount(
                    data.settlements.length
                  )}{" "}
                  settlement record
                  {data.settlements.length ===
                  1
                    ? " is"
                    : "s are"}{" "}
                  linked to the selected payment scope.
                </div>
              ) : null}
            </>
          ) : null}
        </DashboardState>
      </div>
    </section>
  );
}
