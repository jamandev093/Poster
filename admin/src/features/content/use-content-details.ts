"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAdminContentDetails,
} from "./content-api.service";

import type {
  AdminContentDetailsResponse,
} from "./content-api.types";

interface ContentDetailsState {
  data:
    AdminContentDetailsResponse |
    null;

  error:
    string |
    null;

  isLoading: boolean;
}

export function useContentDetails(
  contentId:
    string |
    null
) {
  const [
    state,
    setState,
  ] =
    useState<ContentDetailsState>({
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
          !contentId
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
            await fetchAdminContentDetails(
              contentId,
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
                : "Content details could not be loaded.",

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
        contentId,
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