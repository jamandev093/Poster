"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAudienceInsights,
} from "./audience-insights.service";

import type {
  AdminAudienceInsightsResponse,
} from "./audience-insights.types";

const REFRESH_INTERVAL_MS =
  60_000;

interface AudienceInsightsState {
  data:
    AdminAudienceInsightsResponse |
    null;

  error:
    string |
    null;

  isLoading: boolean;

  isRefreshing: boolean;
}

const INITIAL_STATE:
  AudienceInsightsState = {
  data: null,
  error: null,
  isLoading: true,
  isRefreshing: false,
};

export function useAudienceInsights() {
  const [
    state,
    setState,
  ] =
    useState<AudienceInsightsState>(
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

  const load =
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
            await fetchAudienceInsights(
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
                  : "Audience Insights could not be loaded.",

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

      void load(
        "initial"
      );

      const intervalId =
        window.setInterval(
          () => {
            void load(
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
      load,
    ]
  );

  const refresh =
    useCallback(
      () => {
        void load(
          state.data
            ? "refresh"
            : "initial"
        );
      },
      [
        load,
        state.data,
      ]
    );

  return {
    ...state,
    refresh,
  };
}
