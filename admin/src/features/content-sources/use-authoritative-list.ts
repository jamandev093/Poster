"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const REFRESH_INTERVAL_MS =
  60_000;

interface AuthoritativeListState<TData> {
  data:
    TData |
    null;

  error:
    string |
    null;

  isLoading: boolean;

  isRefreshing: boolean;
}

export function useAuthoritativeList<TData>(
  load:
    (
      signal:
        AbortSignal
    ) => Promise<TData>
) {
  const [
    state,
    setState,
  ] =
    useState<
      AuthoritativeListState<TData>
    >({
      data:
        null,

      error:
        null,

      isLoading:
        true,

      isRefreshing:
        false,
    });

  const mountedRef =
    useRef(
      false
    );

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const requestIdRef =
    useRef(
      0
    );

  const loadData =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh"
      ) => {
        requestRef
          .current
          ?.abort();

        const controller =
          new AbortController();

        requestRef.current =
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
            await load(
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
            error:
              null,

            isLoading:
              false,

            isRefreshing:
              false,
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
                  : "Authoritative data could not be loaded.",

              isLoading:
                false,

              isRefreshing:
                false,
            })
          );
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current =
              null;
          }
        }
      },
      [
        load,
      ]
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      void loadData(
        "initial"
      );

      const interval =
        window.setInterval(
          () => {
            void loadData(
              "refresh"
            );
          },
          REFRESH_INTERVAL_MS
        );

      return () => {
        mountedRef.current =
          false;

        window.clearInterval(
          interval
        );

        requestRef
          .current
          ?.abort();

        requestRef.current =
          null;
      };
    },
    [
      loadData,
    ]
  );

  const refresh =
    useCallback(
      () => {
        void loadData(
          state.data
            ? "refresh"
            : "initial"
        );
      },
      [
        loadData,
        state.data,
      ]
    );

  return {
    ...state,
    refresh,
  };
}