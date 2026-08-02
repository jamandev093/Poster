"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  BusinessIdentity,
} from "./business-identity.types";

import {
  getBusinessIdentity,
} from "./business-identity.service";

interface BusinessIdentityState {
  identity:
    BusinessIdentity | null;

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  error:
    unknown;
}

export function useBusinessIdentity() {
  const [
    state,
    setState,
  ] =
    useState<
      BusinessIdentityState
    >({
      identity:
        null,

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
          const response =
            await getBusinessIdentity();

          setState({
            identity:
              response.identity,

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