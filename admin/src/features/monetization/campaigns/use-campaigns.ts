"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  listAdminCampaigns,
  type AdminCampaignListResponse,
} from "./campaign-api";

export function useCampaigns() {
  const [
    data,
    setData,
  ] =
    useState<
      AdminCampaignListResponse |
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
            await listAdminCampaigns({
              limit:
                100,

              offset:
                0,
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
              requestError instanceof
                Error
                ? requestError.message
                : "Campaigns could not be loaded."
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
      []
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