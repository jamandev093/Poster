"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getReportsErrorMessage,
} from "./reports-api.errors";

import {
  fetchReportDetails,
} from "./reports-api.service";

import type {
  AdminReportDetails,
} from "./reports-api.types";

export function useReportDetails(
  reportId:
    string |
    null
) {
  const [
    data,
    setData,
  ] =
    useState<
      AdminReportDetails |
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
      false
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
          "initial" |
          "refresh"
      ) => {
        if (
          !reportId
        ) {
          setData(
            null
          );

          setError(
            null
          );

          setIsLoading(
            false
          );

          setIsRefreshing(
            false
          );

          return;
        }

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
            await fetchReportDetails(
              reportId
            );

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
              getReportsErrorMessage(
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
      [
        reportId,
      ]
    );

  useEffect(
    () => {
      let isActive =
        true;

      queueMicrotask(
        () => {
          if (
            !isActive
          ) {
            return;
          }

          setData(
            null
          );

          void load(
            "initial"
          );
        }
      );

      return () => {
        isActive =
          false;

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

  const replace =
    useCallback(
      (
        replacement:
          AdminReportDetails
      ) => {
        setData(
          replacement
        );

        setError(
          null
        );
      },
      []
    );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
    replace,
  };
}