"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  getReportsErrorMessage,
} from "./reports-api.errors";

import {
  dismissReport,
  resolveReport,
  routeReportToCopyright,
} from "./reports-api.service";

import type {
  AdminReportDetails,
  ReportActionRequest,
  ReportRunningAction,
  RouteReportToCopyrightRequest,
} from "./reports-api.types";

interface UseReportActionsOptions {
  onCompleted?:
    (
      details:
        AdminReportDetails
    ) => void;
}

export function useReportActions(
  options:
    UseReportActionsOptions =
    {}
) {
  const [
    action,
    setAction,
  ] =
    useState<
      ReportRunningAction |
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

  const requestIdRef =
    useRef(
      0
    );

  const run =
    useCallback(
      async (
        runningAction:
          ReportRunningAction,
        operation:
          () => Promise<
            AdminReportDetails
          >
      ): Promise<
        AdminReportDetails |
        null
      > => {
        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        setAction(
          runningAction
        );

        setError(
          null
        );

        try {
          const details =
            await operation();

          if (
            requestIdRef.current ===
            requestId
          ) {
            options.onCompleted?.(
              details
            );
          }

          return details;
        } catch (
          actionError
        ) {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setError(
              getReportsErrorMessage(
                actionError
              )
            );
          }

          return null;
        } finally {
          if (
            requestIdRef.current ===
            requestId
          ) {
            setAction(
              null
            );
          }
        }
      },
      [
        options,
      ]
    );

  const resolve =
    useCallback(
      async (
        reportId: string,
        input:
          ReportActionRequest
      ) =>
        await run(
          "resolve",
          async () =>
            await resolveReport(
              reportId,
              input
            )
        ),
      [
        run,
      ]
    );

  const dismiss =
    useCallback(
      async (
        reportId: string,
        input:
          ReportActionRequest
      ) =>
        await run(
          "dismiss",
          async () =>
            await dismissReport(
              reportId,
              input
            )
        ),
      [
        run,
      ]
    );

  const routeToCopyright =
    useCallback(
      async (
        reportId: string,
        input:
          RouteReportToCopyrightRequest
      ) =>
        await run(
          "route_copyright",
          async () =>
            await routeReportToCopyright(
              reportId,
              input
            )
        ),
      [
        run,
      ]
    );

  const clearError =
    useCallback(
      () => {
        setError(
          null
        );
      },
      []
    );

  return {
    action,
    error,

    isRunning:
      action !==
      null,

    resolve,
    dismiss,
    routeToCopyright,
    clearError,
  };
}