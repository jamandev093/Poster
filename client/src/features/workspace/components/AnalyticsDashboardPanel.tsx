"use client";

import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  ConversionRateDenominator,
} from "../analytics/analytics.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  formatFinancialCount,
  formatFinancialDateTime,
} from "../payments/payment.formatters";

import {
  useAnalyticsDashboard,
} from "../hooks/useAnalyticsDashboard";

import {
  AnalyticsDashboardSummary,
} from "./AnalyticsDashboardSummary";

import {
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

import {
  DashboardState,
} from "./DashboardState";

import styles from "./AnalyticsDashboardPanel.module.css";

/**
 * Connected analytics dashboard panel.
 *
 * This component coordinates presentation and loading state.
 * Analytics authority, aggregation, validation, and billing
 * finalization remain inside service and Backend layers.
 */

export interface AnalyticsDashboardPanelProps {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    string[];

  conversionRateDenominator?:
    ConversionRateDenominator;

  title?:
    string;

  description?:
    string;

  enabled?:
    boolean;
}

export function AnalyticsDashboardPanel(
  props:
    AnalyticsDashboardPanelProps
) {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useAnalyticsDashboard({
      organizationId:
        props.organizationId,

      currency:
        props.currency,

      campaignIds:
        props.campaignIds,

      conversionRateDenominator:
        props.conversionRateDenominator,

      enabled:
        props.enabled,
    });

  const isEmpty =
    Boolean(
      data &&
      data.campaignRows.length ===
        0
    );

  const metadata =
    data
      ? `Data through ${formatFinancialDateTime(
          data.totals.quality
            .dataThrough
        )}`
      : undefined;

  return (
    <section
      aria-label={
        props.title ??
        "Campaign performance"
      }
      className={
        styles.panel
      }
    >
      <DashboardSectionHeader
        description={
          props.description ??
          "Review validated delivery, engagement, conversions, spend, and traffic-quality information."
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
          "Campaign performance"
        }
      />

      <div
        className={
          styles.content
        }
      >
        <DashboardState
          emptyDescription="Analytics will appear after campaign delivery begins."
          emptyTitle="No campaign analytics yet"
          error={
            error
          }
          errorTitle="Unable to load campaign analytics"
          isEmpty={
            isEmpty
          }
          isLoading={
            isLoading
          }
          isRefreshing={
            isRefreshing
          }
          loadingDescription="Preparing validated campaign performance and spend information."
          loadingTitle="Loading campaign analytics"
          onRefresh={
            refresh
          }
          refreshLabel="Refresh analytics"
        >
          {data ? (
            <>
              <AnalyticsDashboardSummary
                totals={
                  data.totals
                }
              />

              {data
                .campaignsWithoutAnalytics
                .length >
              0 ? (
                <div
                  className={
                    styles.secondaryNotice
                  }
                  role="status"
                >
                  {formatFinancialCount(
                    data
                      .campaignsWithoutAnalytics
                      .length
                  )}{" "}
                  campaign
                  {data
                    .campaignsWithoutAnalytics
                    .length ===
                  1
                    ? ""
                    : "s"}{" "}
                  currently
                  {data
                    .campaignsWithoutAnalytics
                    .length ===
                  1
                    ? " has"
                    : " have"}{" "}
                  no analytics snapshot for this view.
                </div>
              ) : null}

              {data
                .untrackedConversionCampaigns >
              0 ? (
                <div
                  className={
                    styles.secondaryNotice
                  }
                  role="status"
                >
                  {formatFinancialCount(
                    data
                      .untrackedConversionCampaigns
                  )}{" "}
                  campaign
                  {data
                    .untrackedConversionCampaigns ===
                  1
                    ? " does"
                    : "s do"}{" "}
                  not currently have conversion tracking
                  configured.
                </div>
              ) : null}
            </>
          ) : null}
        </DashboardState>
      </div>
    </section>
  );
}
