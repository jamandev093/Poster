"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getAnalyticsErrorMessage,
} from "./analytics-api.errors";

import {
  fetchAdminAnalytics,
} from "./analytics-api.service";

import type {
  AdminAnalyticsOverview,
  AdminAnalyticsQuery,
} from "./analytics-api.types";

export function useAdminAnalytics(
  query:
    AdminAnalyticsQuery
) {
  const {
    startDate,
    endDate,
    campaignId =
      null,
    organizationId =
      null,
  } =
    query;

  const [
    data,
    setData,
  ] =
    useState<
      AdminAnalyticsOverview |
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
      true
    );

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(
      false
    );

  const requestIdRef =
    useRef(
      0
    );

  const load =
    useCallback(
      async (
        mode:
          "initial" |
          "refresh"
      ) => {
        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        if (
          mode ===
          "initial"
        ) {
          setIsLoading(
            true
          );
        } else {
          setIsRefreshing(
            true
          );
        }

        setError(
          null
        );

        try {
          const response =
            await fetchAdminAnalytics({
              startDate,
              endDate,
              campaignId,
              organizationId,
            });

          if (
            requestIdRef.current ===
            requestId
          ) {
            setData(
              response
            );
          }
        } catch (
          requestError
        ) {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setError(
              getAnalyticsErrorMessage(
                requestError
              )
            );
          }
        } finally {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          }
        }
      },
      [
        campaignId,
        endDate,
        organizationId,
        startDate,
      ]
    );

  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void load(
              "initial"
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        requestIdRef.current +=
          1;
      };
    },
    [
      load,
    ]
  );

  const refresh =
    useCallback(
      () => {
        void load(
          "refresh"
        );
      },
      [
        load,
      ]
    );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}