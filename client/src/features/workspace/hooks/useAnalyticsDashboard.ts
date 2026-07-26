"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  ConversionRateDenominator,
} from "../analytics/analytics.types";

import type {
  AnalyticsDashboardViewModel,
} from "../adapters/analytics-dashboard.adapter";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  analyticsWorkspaceService,
} from "../services/analytics-workspace.service";

import type {
  AnalyticsWorkspaceService,
} from "../services/analytics-workspace.service";

/**
 * Client-side analytics dashboard loading hook.
 *
 * Responsibilities:
 *
 * - asynchronous loading;
 * - loading and refresh state;
 * - normalized errors;
 * - manual refresh;
 * - stale-request protection;
 * - unmount protection.
 *
 * Analytics calculations and fixture access remain inside the
 * adapter and service layers.
 */

export interface UseAnalyticsDashboardOptions {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    string[];

  conversionRateDenominator?:
    ConversionRateDenominator;

  enabled?:
    boolean;

  service?:
    AnalyticsWorkspaceService;
}

export interface UseAnalyticsDashboardResult {
  data:
    AnalyticsDashboardViewModel |
    null;

  error:
    string |
    null;

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  hasLoaded:
    boolean;

  refresh:
    () => Promise<void>;
}

function normalizeError(
  error:
    unknown
): string {
  if (
    error instanceof
    Error
  ) {
    return (
      error.message.trim() ||
      "Unable to load analytics."
    );
  }

  if (
    typeof error ===
      "string"
  ) {
    return (
      error.trim() ||
      "Unable to load analytics."
    );
  }

  return "Unable to load analytics.";
}

function createCampaignFilterKey(
  campaignIds:
    string[] |
    undefined
): string {
  if (
    !campaignIds ||
    campaignIds.length ===
      0
  ) {
    return "";
  }

  return Array.from(
    new Set(
      campaignIds
    )
  )
    .sort()
    .join(
      "|"
    );
}

export function useAnalyticsDashboard(
  options:
    UseAnalyticsDashboardOptions
): UseAnalyticsDashboardResult {
  const {
    organizationId,
    currency,
    conversionRateDenominator,
    enabled = true,
    service =
      analyticsWorkspaceService,
  } =
    options;

  const campaignFilterKey =
    createCampaignFilterKey(
      options.campaignIds
    );

  const campaignIds =
    useMemo(
      () =>
        campaignFilterKey
          ? campaignFilterKey.split(
              "|"
            )
          : undefined,
      [
        campaignFilterKey,
      ]
    );

  const [
    data,
    setData,
  ] =
    useState<
      AnalyticsDashboardViewModel |
      null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      enabled
    );

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(
      false
    );

  const [
    hasLoaded,
    setHasLoaded,
  ] =
    useState(
      false
    );

  const mountedRef =
    useRef(
      false
    );

  const requestSequenceRef =
    useRef(
      0
    );

  const dataRef =
    useRef<
      AnalyticsDashboardViewModel |
      null
    >(
      null
    );

  useEffect(
    () => {
      dataRef.current =
        data;
    },
    [
      data,
    ]
  );

  const loadDashboard =
    useCallback(
      async (
        mode:
          "initial" |
          "refresh"
      ): Promise<void> => {
        if (
          !enabled
        ) {
          return;
        }

        const requestSequence =
          requestSequenceRef
            .current +
          1;

        requestSequenceRef.current =
          requestSequence;

        const hasExistingData =
          dataRef.current !==
          null;

        if (
          mountedRef.current
        ) {
          setError(
            null
          );

          if (
            mode ===
              "refresh" ||
            hasExistingData
          ) {
            setIsRefreshing(
              true
            );
          } else {
            setIsLoading(
              true
            );
          }
        }

        try {
          const result =
            await service.getDashboard({
              organizationId,

              currency,

              campaignIds,

              conversionRateDenominator,
            });

          if (
            !mountedRef.current ||
            requestSequence !==
              requestSequenceRef
                .current
          ) {
            return;
          }

          setData(
            result
          );

          setHasLoaded(
            true
          );
        } catch (
          loadError
        ) {
          if (
            !mountedRef.current ||
            requestSequence !==
              requestSequenceRef
                .current
          ) {
            return;
          }

          setError(
            normalizeError(
              loadError
            )
          );

          setHasLoaded(
            true
          );
        } finally {
          if (
            !mountedRef.current ||
            requestSequence !==
              requestSequenceRef
                .current
          ) {
            return;
          }

          setIsLoading(
            false
          );

          setIsRefreshing(
            false
          );
        }
      },
      [
        campaignIds,
        conversionRateDenominator,
        currency,
        enabled,
        organizationId,
        service,
      ]
    );

  const refresh =
    useCallback(
      async (): Promise<void> => {
        await loadDashboard(
          "refresh"
        );
      },
      [
        loadDashboard,
      ]
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      const initializationTimer =
        window.setTimeout(
          () => {
            if (
              !mountedRef.current
            ) {
              return;
            }

            if (
              enabled
            ) {
              void loadDashboard(
                "initial"
              );

              return;
            }

            requestSequenceRef.current +=
              1;

            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          initializationTimer
        );

        mountedRef.current =
          false;

        requestSequenceRef.current +=
          1;
      };
    },
    [
      enabled,
      loadDashboard,
    ]
  );

  return {
    data,

    error,

    isLoading,

    isRefreshing,

    hasLoaded,

    refresh,
  };
}


