"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  PaymentDashboardViewModel,
} from "../adapters/payment-dashboard.adapter";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  paymentWorkspaceService,
} from "../services/payment-workspace.service";

import type {
  PaymentWorkspaceService,
} from "../services/payment-workspace.service";

/**
 * Client-side payment dashboard loading hook.
 *
 * Responsibilities:
 *
 * - asynchronous financial dashboard loading;
 * - initial loading and background refresh state;
 * - normalized errors;
 * - manual refresh;
 * - campaign-filter normalization;
 * - stale-request protection;
 * - unmount protection.
 *
 * Payment processing, webhook verification, balance authority,
 * refund execution, and ledger mutation remain outside React.
 */

export interface UsePaymentDashboardOptions {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    CampaignId[];

  enabled?:
    boolean;

  service?:
    PaymentWorkspaceService;
}

export interface UsePaymentDashboardResult {
  data:
    PaymentDashboardViewModel |
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
      "Unable to load payment information."
    );
  }

  if (
    typeof error ===
      "string"
  ) {
    return (
      error.trim() ||
      "Unable to load payment information."
    );
  }

  return "Unable to load payment information.";
}

function createCampaignFilterKey(
  campaignIds:
    CampaignId[] |
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

export function usePaymentDashboard(
  options:
    UsePaymentDashboardOptions
): UsePaymentDashboardResult {
  const {
    organizationId,
    currency,
    enabled = true,
    service =
      paymentWorkspaceService,
  } =
    options;

  const campaignFilterKey =
    createCampaignFilterKey(
      options.campaignIds
    );

  const campaignIds =
    useMemo<
      CampaignId[] |
      undefined
    >(
      () =>
        campaignFilterKey
          ? campaignFilterKey
              .split(
                "|"
              ) as
              CampaignId[]
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
      PaymentDashboardViewModel |
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
      PaymentDashboardViewModel |
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

