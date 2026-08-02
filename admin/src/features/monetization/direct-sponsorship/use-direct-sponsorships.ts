"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getDirectSponsorshipErrorMessage,
} from "./direct-sponsorship.errors";

import {
  listDirectSponsorships,
} from "./direct-sponsorship.service";

import type {
  DirectSponsorshipListResult,
} from "./direct-sponsorship.types";

export function useDirectSponsorships() {
  const [
    data,
    setData,
  ] =
    useState<
      DirectSponsorshipListResult |
      null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true
    );

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(
      false
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
        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        if (
          mode ===
          "initial"
        ) {
          setIsLoading(
            true
          );
        } else {
          setIsRefreshing(
            true
          );
        }

        setError(
          null
        );

        try {
          const response =
            await listDirectSponsorships();

          if (
            requestIdRef.current ===
            requestId
          ) {
            setData(
              response
            );
          }
        } catch (
          requestError
        ) {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setError(
              getDirectSponsorshipErrorMessage(
                requestError
              )
            );
          }
        } finally {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          }
        }
      },
      []
    );

  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void load(
              "initial"
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        requestIdRef.current +=
          1;
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
          "refresh"
        );
      },
      [
        load,
      ]
    );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}