"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAdminSourceDetails,
} from "./source-api.service";

import type {
  AdminSourceDetailsResponse,
} from "./source-api.types";

interface SourceDetailsState {
  data:
    AdminSourceDetailsResponse |
    null;

  error:
    string |
    null;

  isLoading: boolean;
}

export function useSourceDetails(
  sourceId:
    string |
    null
) {
  const [
    state,
    setState,
  ] =
    useState<SourceDetailsState>({
      data:
        null,

      error:
        null,

      isLoading:
        false,
    });

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const load =
    useCallback(
      async () => {
        requestRef
          .current
          ?.abort();

        if (
          !sourceId
        ) {
          setState({
            data:
              null,

            error:
              null,

            isLoading:
              false,
          });

          return;
        }

        const controller =
          new AbortController();

        requestRef.current =
          controller;

        setState(
          current => ({
            ...current,

            error:
              null,

            isLoading:
              true,
          })
        );

        try {
          const data =
            await fetchAdminSourceDetails(
              sourceId,
              controller.signal
            );

          if (
            controller.signal.aborted
          ) {
            return;
          }

          setState({
            data,
            error:
              null,

            isLoading:
              false,
          });
        } catch (
          error
        ) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          setState({
            data:
              null,

            error:
              error instanceof Error
                ? error.message
                : "Source details could not be loaded.",

            isLoading:
              false,
          });
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
        sourceId,
      ]
    );

  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void load();
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        requestRef
          .current
          ?.abort();
      };
    },
    [
      load,
    ]
  );

  return {
    ...state,
    refresh:
      load,
  };
}