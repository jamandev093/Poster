import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  findCopyrightCaseById,
  type CopyrightCaseRecord,
} from "../../domains/copyright/index.js";

import {
  appendAdminReportAuditEvent,
  findAdminReportById,
  listActionableAdminReports,
  listAdminReportAuditEvents,
  listAdminReports,
  resolveAdminReport,
  routeAdminReportToCopyright,
  type AdminReportRecord,
} from "../../domains/reports/index.js";

import {
  ReportsApplicationError,
} from "./reports.errors.js";

import type {
  AdminReportDetails,
  AdminReportSummary,
  ReportActionInput,
  RouteReportToCopyrightInput,
} from "./admin-reports.types.js";

export interface AdminReportsService {
  list:
    () => Promise<
      AdminReportSummary[]
    >;

  listActionable:
    () => Promise<
      AdminReportSummary[]
    >;

  getById:
    (
      reportId: string
    ) => Promise<
      AdminReportDetails
    >;

  resolve:
    (
      input:
        ReportActionInput
    ) => Promise<
      AdminReportDetails
    >;

  dismiss:
    (
      input:
        ReportActionInput
    ) => Promise<
      AdminReportDetails
    >;

  routeToCopyright:
    (
      input:
        RouteReportToCopyrightInput
    ) => Promise<
      AdminReportDetails
    >;
}

export interface AdminReportsServiceDependencies {
  listReports:
    typeof listAdminReports;

  listActionableReports:
    typeof listActionableAdminReports;

  findReport:
    typeof findAdminReportById;

  resolveReport:
    typeof resolveAdminReport;

  routeReportToCopyright:
    typeof routeAdminReportToCopyright;

  listAudit:
    typeof listAdminReportAuditEvents;

  appendAudit:
    typeof appendAdminReportAuditEvent;

  findCopyrightCase:
    typeof findCopyrightCaseById;

  now:
    () => Date;
}

export interface CreateAdminReportsServiceOptions {
  dependencies?:
    Partial<
      AdminReportsServiceDependencies
    >;
}

function buildSummary(
  report:
    AdminReportRecord
): AdminReportSummary {
  return {
    report,
  };
}

function assertNeedsAction(
  report:
    AdminReportRecord,
  actionLabel: string
): void {
  if (
    report.status !==
    "needs_action"
  ) {
    throw new ReportsApplicationError(
      "REPORT_STATE_CONFLICT",
      `Only reports requiring action can be ${actionLabel}.`
    );
  }
}

function assertCopyrightRoutingAllowed(
  report:
    AdminReportRecord
): void {
  if (
    report.reportType !==
    "copyright"
  ) {
    throw new ReportsApplicationError(
      "REPORT_COPYRIGHT_TYPE_REQUIRED",
      "Only Copyright reports can be routed to the Copyright workflow."
    );
  }

  if (
    report.routedToCopyright ||
    report.copyrightCaseId
  ) {
    throw new ReportsApplicationError(
      "REPORT_COPYRIGHT_ALREADY_ROUTED",
      "This report has already been routed to the Copyright workflow."
    );
  }
}

function assertCopyrightCaseMatchesReport(
  report:
    AdminReportRecord,
  copyrightCase:
    CopyrightCaseRecord
): void {
  if (
    report.affectedKind !==
    "content"
  ) {
    throw new ReportsApplicationError(
      "REPORT_COPYRIGHT_CONTENT_MISMATCH",
      "A Copyright report must identify an affected content record."
    );
  }

  const affectedRecordId =
    report.affectedRecordId
      .trim()
      .toLowerCase();

  const matchesInternalId =
    affectedRecordId ===
    copyrightCase.contentId
      .trim()
      .toLowerCase();

  /*
   * Reports may use a public Poster Content ID while the
   * Copyright case stores the internal UUID. The strict
   * public-ID relationship is validated by the route/service
   * caller where content metadata is available.
   *
   * A direct UUID mismatch is rejected here. Non-UUID public
   * identifiers remain eligible for the linked workflow.
   */
  const affectedLooksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        affectedRecordId
      );

  if (
    affectedLooksLikeUuid &&
    !matchesInternalId
  ) {
    throw new ReportsApplicationError(
      "REPORT_COPYRIGHT_CONTENT_MISMATCH",
      "The selected Copyright case does not reference the content affected by this report."
    );
  }
}

export function createAdminReportsService(
  options:
    CreateAdminReportsServiceOptions =
    {}
): AdminReportsService {
  const dependencies:
    AdminReportsServiceDependencies = {
    listReports:
      listAdminReports,

    listActionableReports:
      listActionableAdminReports,

    findReport:
      findAdminReportById,

    resolveReport:
      resolveAdminReport,

    routeReportToCopyright:
      routeAdminReportToCopyright,

    listAudit:
      listAdminReportAuditEvents,

    appendAudit:
      appendAdminReportAuditEvent,

    findCopyrightCase:
      findCopyrightCaseById,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  const getRequiredReport =
    async (
      reportId: string
    ): Promise<
      AdminReportRecord
    > => {
      const report =
        await dependencies
          .findReport(
            reportId
          );

      if (
        !report
      ) {
        throw new ReportsApplicationError(
          "REPORT_NOT_FOUND",
          "Admin report was not found."
        );
      }

      return report;
    };


  const buildDetails =
    async (
      report:
        AdminReportRecord
    ): Promise<
      AdminReportDetails
    > => {
      const [
        audit,
        copyrightCase,
      ] =
        await Promise.all([
          dependencies
            .listAudit(
              report.id
            ),

          report.copyrightCaseId
            ? dependencies
                .findCopyrightCase(
                  report.copyrightCaseId
                )
            : Promise.resolve(
                null
              ),
        ]);

      return {
        report,
        audit,
        copyrightCase,
      };
    };

  return {
    list:
      async () => {
        const reports =
          await dependencies
            .listReports();

        return reports.map(
          buildSummary
        );
      },

    listActionable:
      async () => {
        const reports =
          await dependencies
            .listActionableReports();

        return reports.map(
          buildSummary
        );
      },

    getById:
      async reportId =>
        await buildDetails(
          await getRequiredReport(
            reportId
          )
        ),

    resolve:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedReport =
          await runDatabaseTransaction(
            async executor => {
              const report =
                await dependencies
                  .findReport(
                    input.reportId,
                    executor
                  );

              if (
                !report
              ) {
                throw new ReportsApplicationError(
                  "REPORT_NOT_FOUND",
                  "Admin report was not found."
                );
              }

              assertNeedsAction(
                report,
                "resolved"
              );

              if (
                report.reportType ===
                "copyright"
              ) {
                throw new ReportsApplicationError(
                  "REPORT_COPYRIGHT_TYPE_REQUIRED",
                  "Copyright reports must be routed to Copyright or dismissed."
                );
              }

              const resolvedReport =
                await dependencies
                  .resolveReport(
                    {
                      reportId:
                        report.id,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      status:
                        "resolved",

                      resolutionNote:
                        input.resolutionNote ??
                        null,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !resolvedReport
              ) {
                throw new ReportsApplicationError(
                  "REPORT_VERSION_CONFLICT",
                  "The report changed before resolution completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    reportId:
                      resolvedReport.id,

                    action:
                      "Report resolved",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      report.status,

                    resultingStatus:
                      resolvedReport.status,

                    metadata: {
                      reportType:
                        resolvedReport.reportType,

                      affectedKind:
                        resolvedReport.affectedKind,

                      affectedRecordId:
                        resolvedReport.affectedRecordId,

                      resolutionNote:
                        resolvedReport.resolutionNote,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return resolvedReport;
            }
          );

        return await buildDetails(
          updatedReport
        );
      },

    dismiss:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedReport =
          await runDatabaseTransaction(
            async executor => {
              const report =
                await dependencies
                  .findReport(
                    input.reportId,
                    executor
                  );

              if (
                !report
              ) {
                throw new ReportsApplicationError(
                  "REPORT_NOT_FOUND",
                  "Admin report was not found."
                );
              }

              assertNeedsAction(
                report,
                "dismissed"
              );

              const dismissedReport =
                await dependencies
                  .resolveReport(
                    {
                      reportId:
                        report.id,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      status:
                        "dismissed",

                      resolutionNote:
                        input.resolutionNote ??
                        null,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !dismissedReport
              ) {
                throw new ReportsApplicationError(
                  "REPORT_VERSION_CONFLICT",
                  "The report changed before dismissal completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    reportId:
                      dismissedReport.id,

                    action:
                      "Report dismissed - no further operational action required",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      report.status,

                    resultingStatus:
                      dismissedReport.status,

                    metadata: {
                      reportType:
                        dismissedReport.reportType,

                      affectedKind:
                        dismissedReport.affectedKind,

                      affectedRecordId:
                        dismissedReport.affectedRecordId,

                      resolutionNote:
                        dismissedReport.resolutionNote,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return dismissedReport;
            }
          );

        return await buildDetails(
          updatedReport
        );
      },

    routeToCopyright:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedReport =
          await runDatabaseTransaction(
            async executor => {
              const report =
                await dependencies
                  .findReport(
                    input.reportId,
                    executor
                  );

              if (
                !report
              ) {
                throw new ReportsApplicationError(
                  "REPORT_NOT_FOUND",
                  "Admin report was not found."
                );
              }

              assertNeedsAction(
                report,
                "routed to Copyright"
              );

              assertCopyrightRoutingAllowed(
                report
              );

              const copyrightCase =
                await dependencies
                  .findCopyrightCase(
                    input.copyrightCaseId,
                    executor
                  );

              if (
                !copyrightCase
              ) {
                throw new ReportsApplicationError(
                  "REPORT_COPYRIGHT_CASE_NOT_FOUND",
                  "The selected Copyright case was not found."
                );
              }

              assertCopyrightCaseMatchesReport(
                report,
                copyrightCase
              );

              const routedReport =
                await dependencies
                  .routeReportToCopyright(
                    {
                      reportId:
                        report.id,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      copyrightCaseId:
                        copyrightCase.id,

                      resolutionNote:
                        input.resolutionNote ??
                        null,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !routedReport
              ) {
                throw new ReportsApplicationError(
                  "REPORT_VERSION_CONFLICT",
                  "The report changed before Copyright routing completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    reportId:
                      routedReport.id,

                    action:
                      "Report routed to Copyright management",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      report.status,

                    resultingStatus:
                      routedReport.status,

                    metadata: {
                      reportType:
                        routedReport.reportType,

                      affectedKind:
                        routedReport.affectedKind,

                      affectedRecordId:
                        routedReport.affectedRecordId,

                      copyrightCaseId:
                        copyrightCase.id,

                      copyrightCasePublicId:
                        copyrightCase.publicId,

                      copyrightContentId:
                        copyrightCase.contentId,

                      resolutionNote:
                        routedReport.resolutionNote,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return routedReport;
            }
          );

        return await buildDetails(
          updatedReport
        );
      },
  };
}