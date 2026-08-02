"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ProgrammaticOverviewResponse,
} from "./programmatic.types";

import {
  getProgrammaticOverview,
} from "./programmatic.service";

interface ProgrammaticOverviewState {
  overview:
    ProgrammaticOverviewResponse;

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  error:
    unknown;
}

const EMPTY_OVERVIEW:
  ProgrammaticOverviewResponse = {
  providers:
    [],

  slotMappings:
    [],
};

export function useProgrammaticOverview() {
  const [
    state,
    setState,
  ] =
    useState<
      ProgrammaticOverviewState
    >({
      overview:
        EMPTY_OVERVIEW,

      isLoading:
        true,

      isRefreshing:
        false,

      error:
        null,
    });

  const load =
    useCallback(
      async (
        refresh:
          boolean
      ) => {
        setState(
          current => ({
            ...current,

            isLoading:
              refresh
                ? current.isLoading
                : true,

            isRefreshing:
              refresh,

            error:
              null,
          })
        );

        try {
          const overview =
            await getProgrammaticOverview();

          setState({
            overview,

            isLoading:
              false,

            isRefreshing:
              false,

            error:
              null,
          });
        } catch (
          error
        ) {
          setState(
            current => ({
              ...current,

              isLoading:
                false,

              isRefreshing:
                false,

              error,
            })
          );
        }
      },
      []
    );

  useEffect(
    () => {
      const timer =
        setTimeout(
          () => {
            void load(
              false
            );
          },
          0
        );

      return () =>
        clearTimeout(
          timer
        );
    },
    [
      load,
    ]
  );

  return {
    ...state,

    refresh:
      () =>
        load(
          true
        ),
  };
}