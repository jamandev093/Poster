"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AffiliateCampaign,
} from "./affiliate.types";

import {
  listAffiliateCampaigns,
} from "./affiliate.service";

interface AffiliateCampaignState {
  campaigns:
    AffiliateCampaign[];

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  error:
    unknown;
}

export function useAffiliateCampaigns() {
  const [
    state,
    setState,
  ] =
    useState<
      AffiliateCampaignState
    >({
      campaigns:
        [],

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
          const result =
            await listAffiliateCampaigns();

          setState({
            campaigns:
              result.items,

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