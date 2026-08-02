"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  PosterPromotionCampaign,
  PosterPromotionDetailResponse,
} from "./poster-promotion.api-types";

import {
  getPosterPromotion,
  listPosterPromotionCampaigns,
} from "./poster-promotion.service";

interface PosterPromotionListState {
  campaigns:
    PosterPromotionCampaign[];

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  error:
    unknown;
}

export function usePosterPromotions() {
  const [
    state,
    setState,
  ] =
    useState<
      PosterPromotionListState
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
            await listPosterPromotionCampaigns();

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

export function usePosterPromotionDetail(
  campaignId:
    string | null
) {
  const [
    detail,
    setDetail,
  ] =
    useState<
      PosterPromotionDetailResponse |
      null
    >(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      unknown
    >(
      null
    );

  const load =
    useCallback(
      async () => {
        if (
          !campaignId
        ) {
          setDetail(
            null
          );

          setError(
            null
          );

          return;
        }

        setIsLoading(
          true
        );

        setError(
          null
        );

        try {
          const result =
            await getPosterPromotion(
              campaignId
            );

          setDetail(
            result
          );
        } catch (
          nextError
        ) {
          setError(
            nextError
          );

          setDetail(
            null
          );
        } finally {
          setIsLoading(
            false
          );
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
    detail,
    isLoading,
    error,
    refresh:
      load,
  };
}
