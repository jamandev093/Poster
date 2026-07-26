import {
  formatFinancialCount,
  formatMoneyMinor,
  formatPercentage,
} from "../payments/payment.formatters";

import type {
  AnalyticsDashboardTotals,
} from "../adapters/analytics-dashboard.adapter";

import {
  AnalyticsMetricCard,
} from "./AnalyticsMetricCard";

import {
  AnalyticsMetricGrid,
} from "./AnalyticsMetricGrid";

import styles from "./AnalyticsDashboardSummary.module.css";

/**
 * Analytics dashboard KPI summary.
 *
 * This component formats already-adapted dashboard totals.
 * Raw event validation, aggregation, invalid-traffic detection,
 * and billing finalization remain outside React.
 */

export interface AnalyticsDashboardSummaryProps {
  totals:
    AnalyticsDashboardTotals;
}

function getFreshnessMessage(
  totals:
    AnalyticsDashboardTotals
): string | undefined {
  switch (
    totals.quality
      .freshnessStatus
  ) {
    case "live":
      return undefined;

    case "recent":
      return "Analytics are recent and may still include activity awaiting final validation.";

    case "delayed":
      return "Analytics processing is delayed. Recent activity may not appear yet.";

    case "stale":
      return "Analytics are stale. Refresh or check again after processing completes.";

    case "unavailable":
      return "Analytics freshness information is currently unavailable.";
  }
}

export function AnalyticsDashboardSummary(
  props:
    AnalyticsDashboardSummaryProps
) {
  const {
    totals,
  } =
    props;

  const freshnessMessage =
    getFreshnessMessage(
      totals
    );

  return (
    <div
      className={
        styles.summary
      }
    >
      <AnalyticsMetricGrid>
        <AnalyticsMetricCard
          label="Qualified impressions"
          supportingText={`${formatFinancialCount(
            totals.impressions.raw
          )} raw impressions`}
          value={formatFinancialCount(
            totals.impressions
              .qualified
          )}
        />

        <AnalyticsMetricCard
          label="Valid clicks"
          supportingText={`${formatFinancialCount(
            totals.clicks.invalid
          )} invalid clicks excluded`}
          value={formatFinancialCount(
            totals.clicks.valid
          )}
        />

        <AnalyticsMetricCard
          label="CTR"
          supportingText="Based on valid clicks and qualified impressions"
          value={formatPercentage(
            totals.rates
              .ctrPercentage
          )}
        />

        <AnalyticsMetricCard
          label="Conversions"
          supportingText={
            totals.conversions
              .availability ===
            "not_tracked"
              ? "Conversion tracking is not configured"
              : `${formatFinancialCount(
                  totals.conversions
                    .pendingValidation
                )} awaiting validation`
          }
          tone={
            totals.conversions
              .availability ===
            "not_tracked"
              ? "attention"
              : "neutral"
          }
          value={
            totals.conversions
              .availability ===
            "not_tracked"
              ? "Not tracked"
              : formatFinancialCount(
                  totals.conversions
                    .finalized
                )
          }
        />

        <AnalyticsMetricCard
          label="Estimated spend"
          supportingText="Recent activity before final billing validation"
          tone="information"
          value={formatMoneyMinor(
            totals.financials
              .estimatedSpendMinor,
            totals.financials
              .currency
          )}
        />

        <AnalyticsMetricCard
          label="Pending validation"
          supportingText="Not yet included in finalized billed spend"
          tone={
            totals.financials
              .pendingValidationSpendMinor >
            0
              ? "attention"
              : "neutral"
          }
          value={formatMoneyMinor(
            totals.financials
              .pendingValidationSpendMinor,
            totals.financials
              .currency
          )}
        />

        <AnalyticsMetricCard
          label="Finalized spend"
          supportingText="Validated chargeable campaign delivery"
          tone="success"
          value={formatMoneyMinor(
            totals.financials
              .finalizedSpendMinor,
            totals.financials
              .currency
          )}
        />

        <AnalyticsMetricCard
          label="Invalid-traffic credit"
          supportingText="Invalid, duplicate, bot, test, and internal activity excluded"
          tone="success"
          value={formatMoneyMinor(
            totals.financials
              .invalidTrafficCreditMinor,
            totals.financials
              .currency
          )}
        />
      </AnalyticsMetricGrid>

      {freshnessMessage ? (
        <div
          className={[
            styles.notice,
            totals.quality
              .freshnessStatus ===
              "delayed" ||
            totals.quality
              .freshnessStatus ===
              "stale" ||
            totals.quality
              .freshnessStatus ===
              "unavailable"
              ? styles.warning
              : "",
          ]
            .filter(
              Boolean
            )
            .join(
              " "
            )}
          role="status"
        >
          {freshnessMessage}
        </div>
      ) : null}

      {totals.quality
        .warningMessages.map(
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
    </div>
  );
}
