"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchUsersMetrics,
} from "./users-metrics.service";

import type {
  AdminUserMetricsResponse,
} from "./users-metrics.types";

const REFRESH_INTERVAL_MS =
  60_000;

interface UsersMetricsState {
  data:
    AdminUserMetricsResponse |
    null;

  error:
    string |
    null;

  isLoading: boolean;

  isRefreshing: boolean;
}

const INITIAL_STATE:
  UsersMetricsState = {
  data: null,
  error: null,
  isLoading: true,
  isRefreshing: false,
};

export function useUsersMetrics() {
  const [
    state,
    setState,
  ] =
    useState<UsersMetricsState>(
      INITIAL_STATE
    );

  const mountedRef =
    useRef(
      false
    );

  const activeRequestRef =
    useRef<AbortController | null>(
      null
    );

  const requestIdRef =
    useRef(
      0
    );

  const loadMetrics =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh"
      ) => {
        activeRequestRef
          .current
          ?.abort();

        const controller =
          new AbortController();

        activeRequestRef.current =
          controller;

        const requestId =
          requestIdRef.current + 1;

        requestIdRef.current =
          requestId;

        setState(
          current => ({
            ...current,

            error:
              null,

            isLoading:
              mode === "initial" &&
              current.data === null,

            isRefreshing:
              mode === "refresh" ||
              current.data !== null,
          })
        );

        try {
          const data =
            await fetchUsersMetrics(
              controller.signal
            );

          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setState({
            data,
            error: null,
            isLoading: false,
            isRefreshing: false,
          });
        } catch (
          error
        ) {
          if (
            controller.signal.aborted ||
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setState(
            current => ({
              ...current,

              error:
                error instanceof Error
                  ? error.message
                  : "User metrics could not be loaded.",

              isLoading:
                false,

              isRefreshing:
                false,
            })
          );
        } finally {
          if (
            activeRequestRef.current ===
            controller
          ) {
            activeRequestRef.current =
              null;
          }
        }
      },
      []
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      void loadMetrics(
        "initial"
      );

      const intervalId =
        window.setInterval(
          () => {
            void loadMetrics(
              "refresh"
            );
          },
          REFRESH_INTERVAL_MS
        );

      return () => {
        mountedRef.current =
          false;

        window.clearInterval(
          intervalId
        );

        activeRequestRef
          .current
          ?.abort();

        activeRequestRef.current =
          null;
      };
    },
    [
      loadMetrics,
    ]
  );

  const refresh =
    useCallback(
      () => {
        void loadMetrics(
          state.data
            ? "refresh"
            : "initial"
        );
      },
      [
        loadMetrics,
        state.data,
      ]
    );

  return {
    ...state,
    refresh,
  };
}
