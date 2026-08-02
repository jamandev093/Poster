"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AffiliateDetailResponse,
} from "./affiliate.types";

import {
  getAffiliateDetail,
} from "./affiliate.service";

interface AffiliateDetailState {
  detail:
    AffiliateDetailResponse |
    null;

  isLoading:
    boolean;

  error:
    unknown;
}

export function useAffiliateDetail(
  campaignId:
    string | null
) {
  const [
    state,
    setState,
  ] =
    useState<
      AffiliateDetailState
    >({
      detail:
        null,

      isLoading:
        false,

      error:
        null,
    });

  const load =
    useCallback(
      async () => {
        if (
          !campaignId
        ) {
          setState({
            detail:
              null,

            isLoading:
              false,

            error:
              null,
          });

          return;
        }

        setState(
          current => ({
            ...current,

            isLoading:
              true,

            error:
              null,
          })
        );

        try {
          const detail =
            await getAffiliateDetail(
              campaignId
            );

          setState({
            detail,

            isLoading:
              false,

            error:
              null,
          });
        } catch (
          error
        ) {
          setState({
            detail:
              null,

            isLoading:
              false,

            error,
          });
        }
      },
      [
        campaignId,
      ]
    );

  useEffect(
    () => {
      const timer =
        setTimeout(
          () => {
            void load();
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
      load,
  };
}