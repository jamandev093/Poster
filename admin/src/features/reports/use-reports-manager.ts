"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  useCopyrightCases,
  type AdminCopyrightCaseSummary,
} from "../copyright/copyright-api";

import {
  useReportActions,
  useReportDetails,
  useReports,
  type AdminReportDetails,
  type AdminReportStatus,
  type AdminReportSummary,
} from "./reports-api";

export type ReportsFilter =
  | "all"
  | AdminReportStatus;

export type ReportPendingAction =
  | "resolve"
  | "dismiss"
  | "route_copyright";

export interface ReportCounts {
  all: number;

  needs_action: number;

  resolved: number;

  dismissed: number;
}

function selectSummaryFromDetails(
  details:
    AdminReportDetails
): AdminReportSummary {
  return {
    report:
      details.report,
  };
}

function normalizeIdentifier(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function findMatchingCopyrightCase(
  report:
    AdminReportSummary,
  cases:
    readonly AdminCopyrightCaseSummary[]
): AdminCopyrightCaseSummary | null {
  if (
    report.report.reportType !==
      "copyright" ||
    report.report.affectedKind !==
      "content"
  ) {
    return null;
  }

  const affectedIdentifier =
    normalizeIdentifier(
      report.report
        .affectedRecordId
    );

  return (
    cases.find(
      item =>
        normalizeIdentifier(
          item.content.id
        ) ===
          affectedIdentifier ||
        normalizeIdentifier(
          item.content.publicId
        ) ===
          affectedIdentifier
    ) ??
    null
  );
}

export function useReportsManager() {
  const {
    data:
      reportList,
    error:
      listError,
    isLoading:
      isListLoading,
    isRefreshing:
      isListRefreshing,
    refresh:
      refreshList,
    replaceReport,
  } =
    useReports();

  const {
    data:
      copyrightList,
    error:
      copyrightListError,
    isLoading:
      isCopyrightListLoading,
    isRefreshing:
      isCopyrightListRefreshing,
    refresh:
      refreshCopyrightList,
  } =
    useCopyrightCases();

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      ReportsFilter
    >(
      "needs_action"
    );

  const [
    selectedReportId,
    setSelectedReportId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    pendingAction,
    setPendingAction,
  ] =
    useState<
      ReportPendingAction |
      null
    >(
      null
    );

  const [
    routingError,
    setRoutingError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const {
    data:
      selectedDetails,
    error:
      detailsError,
    isLoading:
      isDetailsLoading,
    isRefreshing:
      isDetailsRefreshing,
    refresh:
      refreshDetails,
    replace:
      replaceDetails,
  } =
    useReportDetails(
      selectedReportId
    );

  const reports =
    useMemo(
      () =>
        reportList?.reports ??
        [],
      [
        reportList,
      ]
    );

  const copyrightCases =
    useMemo(
      () =>
        copyrightList?.cases ??
        [],
      [
        copyrightList,
      ]
    );

  const handleCompleted =
    useCallback(
      (
        details:
          AdminReportDetails
      ) => {
        replaceDetails(
          details
        );

        replaceReport(
          selectSummaryFromDetails(
            details
          )
        );

        setPendingAction(
          null
        );

        setRoutingError(
          null
        );
      },
      [
        replaceDetails,
        replaceReport,
      ]
    );

  const actionOptions =
    useMemo(
      () => ({
        onCompleted:
          handleCompleted,
      }),
      [
        handleCompleted,
      ]
    );

  const {
    action:
      runningAction,
    error:
      actionError,
    isRunning:
      isActionRunning,
    resolve,
    dismiss,
    routeToCopyright,
    clearError,
  } =
    useReportActions(
      actionOptions
    );

  const visibleReports =
    useMemo(
      () => {
        if (
          activeFilter ===
          "all"
        ) {
          return reports;
        }

        return reports.filter(
          item =>
            item.report.status ===
            activeFilter
        );
      },
      [
        activeFilter,
        reports,
      ]
    );

  const counts =
    useMemo<
      ReportCounts
    >(
      () => ({
        all:
          reports.length,

        needs_action:
          reports.filter(
            item =>
              item.report.status ===
              "needs_action"
          ).length,

        resolved:
          reports.filter(
            item =>
              item.report.status ===
              "resolved"
          ).length,

        dismissed:
          reports.filter(
            item =>
              item.report.status ===
              "dismissed"
          ).length,
      }),
      [
        reports,
      ]
    );

  const selectedSummary =
    useMemo(
      () =>
        reports.find(
          item =>
            item.report.id ===
            selectedReportId
        ) ??
        null,
      [
        reports,
        selectedReportId,
      ]
    );

  const selectedReport =
    selectedDetails?.report ??
    selectedSummary?.report ??
    null;

  const matchingCopyrightCase =
    useMemo(
      () =>
        selectedSummary
          ? findMatchingCopyrightCase(
              selectedSummary,
              copyrightCases
            )
          : null,
      [
        copyrightCases,
        selectedSummary,
      ]
    );

  const clearActionErrors =
    useCallback(
      () => {
        clearError();

        setRoutingError(
          null
        );
      },
      [
        clearError,
      ]
    );

  const openReport =
    useCallback(
      (
        reportId: string
      ) => {
        clearActionErrors();

        setPendingAction(
          null
        );

        setSelectedReportId(
          reportId
        );
      },
      [
        clearActionErrors,
      ]
    );

  const beginAction =
    useCallback(
      (
        reportId: string,
        action:
          ReportPendingAction
      ) => {
        clearActionErrors();

        setSelectedReportId(
          reportId
        );

        setPendingAction(
          action
        );
      },
      [
        clearActionErrors,
      ]
    );

  const cancelAction =
    useCallback(
      () => {
        if (
          isActionRunning
        ) {
          return;
        }

        clearActionErrors();

        setPendingAction(
          null
        );
      },
      [
        clearActionErrors,
        isActionRunning,
      ]
    );

  const closeDrawer =
    useCallback(
      () => {
        if (
          isActionRunning
        ) {
          return;
        }

        clearActionErrors();

        setSelectedReportId(
          null
        );

        setPendingAction(
          null
        );
      },
      [
        clearActionErrors,
        isActionRunning,
      ]
    );

  const executeAction =
    useCallback(
      async () => {
        if (
          !selectedDetails ||
          !pendingAction ||
          isActionRunning
        ) {
          return;
        }

        const report =
          selectedDetails.report;

        if (
          pendingAction ===
          "resolve"
        ) {
          await resolve(
            report.id,
            {
              expectedRowVersion:
                report.rowVersion,

              resolutionNote:
                null,
            }
          );

          return;
        }

        if (
          pendingAction ===
          "dismiss"
        ) {
          await dismiss(
            report.id,
            {
              expectedRowVersion:
                report.rowVersion,

              resolutionNote:
                null,
            }
          );

          return;
        }

        if (
          !matchingCopyrightCase
        ) {
          setRoutingError(
            "No authoritative Copyright case matches this report's affected content. Open Copyright and create or verify the case before routing."
          );

          return;
        }

        await routeToCopyright(
          report.id,
          {
            expectedRowVersion:
              report.rowVersion,

            copyrightCaseId:
              matchingCopyrightCase
                .case
                .id,

            resolutionNote:
              `Linked to Copyright case ${matchingCopyrightCase.case.publicId}.`,
          }
        );
      },
      [
        dismiss,
        isActionRunning,
        matchingCopyrightCase,
        pendingAction,
        resolve,
        routeToCopyright,
        selectedDetails,
      ]
    );

  const refreshAll =
    useCallback(
      () => {
        refreshList();

        refreshCopyrightList();

        if (
          selectedReportId
        ) {
          refreshDetails();
        }
      },
      [
        refreshCopyrightList,
        refreshDetails,
        refreshList,
        selectedReportId,
      ]
    );

  const listStatus =
    isListLoading
      ? "Loading authoritative reports"
      : isListRefreshing
        ? "Refreshing authoritative reports"
        : listError
          ? "Reports refresh failed"
          : "Reports are current";

  return {
    reportList,
    reports,
    visibleReports,
    counts,

    activeFilter,
    setActiveFilter,

    selectedReportId,
    selectedSummary,
    selectedDetails,
    selectedReport,

    pendingAction,
    runningAction,

    matchingCopyrightCase,

    listError,
    detailsError,
    actionError,
    routingError,
    copyrightListError,

    isListLoading,
    isListRefreshing,
    isDetailsLoading,
    isDetailsRefreshing,
    isActionRunning,
    isCopyrightListLoading,
    isCopyrightListRefreshing,

    listStatus,

    refreshList,
    refreshDetails,
    refreshCopyrightList,
    refreshAll,

    openReport,
    beginAction,
    cancelAction,
    closeDrawer,
    executeAction,
    clearActionErrors,
  };
}