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
  fetchReports,
} from "./reports-api.service";

import type {
  AdminReportSummary,
  AdminReportsListResponse,
} from "./reports-api.types";

export function useReports() {
  const [
    data,
    setData,
  ] =
    useState<
      AdminReportsListResponse |
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
          "initial" |
          "refresh"
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
            await fetchReports();

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
      []
    );

  useEffect(
    () => {
      let isActive =
        true;

      queueMicrotask(
        () => {
          if (
            isActive
          ) {
            void load(
              "initial"
            );
          }
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

  const replaceReport =
    useCallback(
      (
        replacement:
          AdminReportSummary
      ) => {
        setData(
          current => {
            if (
              !current
            ) {
              return current;
            }

            return {
              ...current,

              reports:
                current.reports.map(
                  item =>
                    item.report.id ===
                    replacement.report.id
                      ? replacement
                      : item
                ),
            };
          }
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
    replaceReport,
  };
}