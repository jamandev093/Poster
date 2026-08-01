"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchSystemStatus,
  type SystemStatusSnapshot,
} from "./system-status-api";

export function useSystemStatus() {
  const [
    data,
    setData,
  ] =
    useState<
      SystemStatusSnapshot |
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
          const snapshot =
            await fetchSystemStatus();

          if (
            requestIdRef.current ===
            requestId
          ) {
            setData(
              snapshot
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
                : "System Status could not be loaded."
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