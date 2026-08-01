"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchCopyrightCases,
} from "./copyright-api.service";

import type {
  AdminCopyrightListResponse,
} from "./copyright-api.types";

const REFRESH_INTERVAL_MS =
  60_000;

interface CopyrightCasesState {
  data:
    AdminCopyrightListResponse |
    null;

  error:
    string |
    null;

  isLoading: boolean;

  isRefreshing: boolean;
}

const INITIAL_STATE:
  CopyrightCasesState = {
  data:
    null,

  error:
    null,

  isLoading:
    true,

  isRefreshing:
    false,
};

export function useCopyrightCases() {
  const [
    state,
    setState,
  ] =
    useState<
      CopyrightCasesState
    >(
      INITIAL_STATE
    );

  const mountedRef =
    useRef(
      false
    );

  const requestIdRef =
    useRef(
      0
    );

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const load =
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
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        setState(
          current => ({
            ...current,

            error:
              null,

            isLoading:
              mode ===
                "initial" &&
              current.data ===
                null,

            isRefreshing:
              mode ===
                "refresh" ||
              current.data !==
                null,
          })
        );

        try {
          const data =
            await fetchCopyrightCases(
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
            controller
              .signal
              .aborted ||
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
                error instanceof
                  Error
                  ? error.message
                  : "Copyright cases could not be loaded.",

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

        requestRef
          .current
          ?.abort();

        requestRef.current =
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

  const replaceCase =
    useCallback(
      (
        updated:
          AdminCopyrightListResponse[
            "cases"
          ][number]
      ) => {
        setState(
          current => {
            if (
              !current.data
            ) {
              return current;
            }

            const exists =
              current
                .data
                .cases
                .some(
                  item =>
                    item.case.id ===
                    updated.case.id
                );

            return {
              ...current,

              data: {
                ...current.data,

                generatedAt:
                  new Date()
                    .toISOString(),

                cases:
                  exists
                    ? current
                        .data
                        .cases
                        .map(
                          item =>
                            item
                              .case
                              .id ===
                            updated
                              .case
                              .id
                              ? updated
                              : item
                        )
                    : [
                        updated,
                        ...current
                          .data
                          .cases,
                      ],
              },
            };
          }
        );
      },
      []
    );

  return {
    ...state,
    refresh,
    replaceCase,
  };
}