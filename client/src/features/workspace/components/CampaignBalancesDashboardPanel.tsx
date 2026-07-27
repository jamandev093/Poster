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
  CampaignBalancesTable,
} from "./CampaignBalancesTable";

import {
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

import {
  DashboardState,
} from "./DashboardState";

import styles from "./CampaignBalancesDashboardPanel.module.css";

export interface CampaignBalancesDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  enabled?:
    boolean;
}

export function CampaignBalancesDashboardPanel(
  props:
    CampaignBalancesDashboardPanelProps
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

  const balances =
    data?.campaignBalances ??
    [];

  const totals =
    balances.reduce(
      (
        current,
        balance
      ) => ({
        paidMinor:
          current.paidMinor +
          balance.paidMinor,

        availableMinor:
          current.availableMinor +
          balance.availableMinor,

        reservedMinor:
          current.reservedMinor +
          balance.reservedMinor,

        finalizedSpendMinor:
          current.finalizedSpendMinor +
          balance.finalizedSpendMinor,
      }),
      {
        paidMinor:
          0,

        availableMinor:
          0,

        reservedMinor:
          0,

        finalizedSpendMinor:
          0,
      }
    );

  return (
    <section
      aria-label="Campaign balances workspace"
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description="Review campaign funding, available and reserved funds, validated spend, credits, refunds, disputes, and remaining balances."
        isRefreshing={
          isRefreshing
        }
        onRefresh={
          refresh
        }
        refreshLabel="Refresh campaign balances"
        title="Campaign balances"
      />

      <DashboardState
        error={
          error
        }
        errorTitle="Unable to load campaign balances"
        isEmpty={
          Boolean(
            data &&
            balances.length ===
              0
          )
        }
        isLoading={
          isLoading
        }
        isRefreshing={
          isRefreshing
        }
        loadingDescription="Preparing campaign funding, spend, credit, refund, and reconciliation information."
        loadingTitle="Loading campaign balances"
        onRefresh={
          refresh
        }
        refreshLabel="Refresh campaign balances"
      >
        {data ? (
          <>
            <div
              aria-label="Campaign balance summary"
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
                  Funded campaigns
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatFinancialCount(
                    balances.length
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
                  Paid funds
                </span>

                <span
                  className={
                    styles.summaryValue
                  }
                >
                  {formatMoneyMinor(
                    totals.paidMinor,
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
                  Available
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
                    totals.availableMinor,
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
                  Finalized spend
                </span>

                <span
                  className={[
                    styles.summaryValue,
                    styles.summaryValueAttention,
                  ].join(
                    " "
                  )}
                >
                  {formatMoneyMinor(
                    totals.finalizedSpendMinor,
                    props.currency
                  )}
                </span>
              </div>
            </div>

            <CampaignBalancesTable
              balances={
                balances
              }
            />
          </>
        ) : null}
      </DashboardState>
    </section>
  );
}