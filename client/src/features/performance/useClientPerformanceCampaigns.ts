"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useClientCampaigns,
} from "../campaigns/useClientCampaigns";

import type {
  ClientCampaignListItem,
  UseClientCampaignsResult,
} from "../campaigns/useClientCampaigns";

import {
  getClientAnalyticsOverview,
  type ClientAnalyticsOverview,
} from "./client-analytics.service";

export type ClientPerformanceWindow =
  | "7d"
  | "30d"
  | "90d";

const WINDOW_DAYS:
  Record<
    ClientPerformanceWindow,
    number
  > = {
  "7d":
    7,

  "30d":
    30,

  "90d":
    90,
};

function toIsoDate(
  value:
    Date
): string {
  return value
    .toISOString()
    .slice(
      0,
      10
    );
}

export function getClientAnalyticsDateRange(
  window:
    ClientPerformanceWindow,
  now:
    Date =
    new Date()
) {
  const end =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

  const start =
    new Date(
      end
    );

  start.setUTCDate(
    start.getUTCDate() -
      (
        WINDOW_DAYS[
          window
        ] -
        1
      )
  );

  return {
    startDate:
      toIsoDate(
        start
      ),

    endDate:
      toIsoDate(
        end
      ),
  };
}

function parseMetricCount(
  value:
    string
): number {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed <
      0
  ) {
    return 0;
  }

  return parsed;
}

export function applyClientAnalyticsToCampaigns(
  campaigns:
    ClientCampaignListItem[],
  overview:
    ClientAnalyticsOverview |
    null
): ClientCampaignListItem[] {
  if (!overview) {
    return campaigns;
  }

  const byCampaignId =
    new Map(
      overview
        .campaigns
        .map(
          analytics => [
            analytics.campaignId,
            analytics,
          ] as const
        )
    );

  return campaigns.map(
    campaign => {
      if (
        !campaign
          .linkedCampaignId
      ) {
        return campaign;
      }

      const analytics =
        byCampaignId.get(
          campaign
            .linkedCampaignId
        );

      if (!analytics) {
        return campaign;
      }

      return {
        ...campaign,

        performance: {
          impressions:
            parseMetricCount(
              analytics
                .validImpressions
            ),

          clicks:
            parseMetricCount(
              analytics
                .validClicks
            ),

          conversions:
            parseMetricCount(
              analytics
                .validConversions
            ),
        },
      };
    }
  );
}

function getErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
      Error &&
    error.message
  ) {
    return error.message;
  }

  return "Unable to load validated Client analytics.";
}

export function useClientPerformanceCampaigns(
  window:
    ClientPerformanceWindow,
  limit:
    number =
    100
): UseClientCampaignsResult {
  const {
    campaigns:
      baseCampaigns,

    isLoading:
      baseIsLoading,

    isRefreshing:
      baseIsRefreshing,

    errorMessage:
      baseErrorMessage,

    walletErrorMessage,
    refresh:
      refreshBaseCampaigns,
  } =
    useClientCampaigns(
      limit
    );

  const range =
    useMemo(
      () =>
        getClientAnalyticsDateRange(
          window
        ),
      [
        window,
      ]
    );

  const [
    overview,
    setOverview,
  ] =
    useState<
      ClientAnalyticsOverview |
      null
    >(
      null
    );

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] =
    useState(
      true
    );

  const [
    analyticsRefreshing,
    setAnalyticsRefreshing,
  ] =
    useState(
      false
    );

  const [
    analyticsError,
    setAnalyticsError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const sequence =
    useRef(
      0
    );

  const loadAnalytics =
    useCallback(
      async (
        refreshing:
          boolean
      ) => {
        const requestId =
          ++sequence.current;

        if (refreshing) {
          setAnalyticsRefreshing(
            true
          );
        } else {
          setAnalyticsLoading(
            true
          );
        }

        setAnalyticsError(
          null
        );

        try {
          const nextOverview =
            await getClientAnalyticsOverview(
              range
            );

          if (
            sequence.current ===
            requestId
          ) {
            setOverview(
              nextOverview
            );
          }
        } catch (
          error
        ) {
          if (
            sequence.current ===
            requestId
          ) {
            setAnalyticsError(
              getErrorMessage(
                error
              )
            );
          }
        } finally {
          if (
            sequence.current ===
            requestId
          ) {
            setAnalyticsLoading(
              false
            );

            setAnalyticsRefreshing(
              false
            );
          }
        }
      },
      [
        range,
      ]
    );

  useEffect(
    () => {
      const timeoutId =
        globalThis.setTimeout(
          () => {
            void loadAnalytics(
              false
            );
          },
          0
        );

      return () => {
        globalThis.clearTimeout(
          timeoutId
        );

        sequence.current +=
          1;
      };
    },
    [
      loadAnalytics,
    ]
  );

  const campaigns =
    useMemo(
      () =>
        applyClientAnalyticsToCampaigns(
          baseCampaigns,
          overview
        ),
      [
        baseCampaigns,
        overview,
      ]
    );

  const refresh =
    useCallback(
      async () => {
        await Promise.all([
          refreshBaseCampaigns(),
          loadAnalytics(
            true
          ),
        ]);
      },
      [
        refreshBaseCampaigns,
        loadAnalytics,
      ]
    );

  return {
    campaigns,

    isLoading:
      baseIsLoading ||
      analyticsLoading,

    isRefreshing:
      baseIsRefreshing ||
      analyticsRefreshing,

    errorMessage:
      baseErrorMessage ??
      analyticsError,

    walletErrorMessage:
      walletErrorMessage,

    refresh,
  };
}