import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  ReportsApplicationError,
  type AdminReportDetails,
  type AdminReportSummary,
  type AdminReportsService,
} from "../application/reports/index.js";

import type {
  CopyrightCaseRecord,
} from "../domains/copyright/index.js";

import type {
  AdminReportAuditEventRecord,
  AdminReportRecord,
} from "../domains/reports/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminReportsRoutesOptions {
  service:
    AdminReportsService;
}

interface ReportParams {
  reportId: string;
}

interface ReportActionBody {
  expectedRowVersion?: unknown;

  resolutionNote?: unknown;
}

interface RouteCopyrightBody
  extends ReportActionBody {
  copyrightCaseId?: unknown;
}

function requiredString(
  value: unknown,
  field: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new TypeError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function optionalString(
  value: unknown,
  field: string
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string"
  ) {
    throw new TypeError(
      `${field} must be a string.`
    );
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function requiredUuid(
  value: unknown,
  field: string
): string {
  const normalized =
    requiredString(
      value,
      field
    );

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(
      normalized
    )
  ) {
    throw new TypeError(
      `${field} must be a valid UUID.`
    );
  }

  return normalized;
}

function serializeReport(
  record:
    AdminReportRecord
) {
  return {
    id:
      record.id,

    publicId:
      record.publicId,

    reportType:
      record.reportType,

    status:
      record.status,

    reporterName:
      record.reporterName,

    reporterReference:
      record.reporterReference,

    affectedKind:
      record.affectedKind,

    affectedRecordId:
      record.affectedRecordId,

    affectedTitle:
      record.affectedTitle,

    affectedMetadata:
      record.affectedMetadata,

    reason:
      record.reason,

    routedToCopyright:
      record.routedToCopyright,

    copyrightCaseId:
      record.copyrightCaseId,

    resolutionNote:
      record.resolutionNote,

    receivedAt:
      record
        .receivedAt
        .toISOString(),

    resolvedAt:
      record
        .resolvedAt
        ?.toISOString() ??
      null,

    resolvedByUserId:
      record.resolvedByUserId,

    createdAt:
      record
        .createdAt
        .toISOString(),

    updatedAt:
      record
        .updatedAt
        .toISOString(),

    rowVersion:
      record.rowVersion,
  };
}

function serializeAudit(
  record:
    AdminReportAuditEventRecord
) {
  return {
    id:
      record.id,

    reportId:
      record.reportId,

    action:
      record.action,

    actorUserId:
      record.actorUserId,

    actorLabel:
      record.actorLabel,

    previousStatus:
      record.previousStatus,

    resultingStatus:
      record.resultingStatus,

    metadata:
      record.metadata,

    occurredAt:
      record
        .occurredAt
        .toISOString(),
  };
}

function serializeCopyrightCase(
  record:
    CopyrightCaseRecord
) {
  return {
    id:
      record.id,

    publicId:
      record.publicId,

    requestType:
      record.requestType,

    status:
      record.status,

    contentId:
      record.contentId,

    claimantName:
      record.claimantName,

    claimantType:
      record.claimantType,

    claimantBusinessEmail:
      record.claimantBusinessEmail,

    claimantWebsiteUrl:
      record.claimantWebsiteUrl,

    claimantReference:
      record.claimantReference,

    requestReason:
      record.requestReason,

    submittedOriginalUrl:
      record.submittedOriginalUrl,

    supportingInformation:
      record.supportingInformation,

    verificationStatus:
      record.verificationStatus,

    actionTaken:
      record.actionTaken,

    preventReimport:
      record.preventReimport,

    receivedAt:
      record
        .receivedAt
        .toISOString(),

    resolvedAt:
      record
        .resolvedAt
        ?.toISOString() ??
      null,

    resolvedByUserId:
      record.resolvedByUserId,

    createdAt:
      record
        .createdAt
        .toISOString(),

    updatedAt:
      record
        .updatedAt
        .toISOString(),

    rowVersion:
      record.rowVersion,
  };
}

function serializeSummary(
  summary:
    AdminReportSummary
) {
  return {
    report:
      serializeReport(
        summary.report
      ),
  };
}

function serializeDetails(
  details:
    AdminReportDetails
) {
  return {
    report:
      serializeReport(
        details.report
      ),

    audit:
      details
        .audit
        .map(
          serializeAudit
        ),

    copyrightCase:
      details.copyrightCase
        ? serializeCopyrightCase(
            details.copyrightCase
          )
        : null,
  };
}

function sendApplicationError(
  error:
    ReportsApplicationError,
  reply:
    FastifyReply
) {
  const statusCode =
    error.code ===
      "REPORT_NOT_FOUND" ||
    error.code ===
      "REPORT_COPYRIGHT_CASE_NOT_FOUND"
      ? 404
      : error.code ===
          "REPORT_COPYRIGHT_TYPE_REQUIRED" ||
        error.code ===
          "REPORT_COPYRIGHT_CONTENT_MISMATCH"
        ? 422
        : 409;

  return reply
    .status(
      statusCode
    )
    .send({
      error: {
        code:
          error.code,

        message:
          error.message,
      },
    });
}

function sendInvalidRequest(
  error: TypeError,
  reply:
    FastifyReply
) {
  return reply
    .status(
      400
    )
    .send({
      error: {
        code:
          "INVALID_REPORT_ACTION",

        message:
          error.message,
      },
    });
}

function getAuthorizationActor(
  request: {
    authorizationContext:
      {
        userId: string;

        fullName: string;
      } |
      null;
  }
) {
  const authorization =
    request.authorizationContext;

  if (
    !authorization
  ) {
    throw new Error(
      "Authorization context is unavailable after permission enforcement."
    );
  }

  return {
    actorUserId:
      authorization.userId,

    actorLabel:
      authorization.fullName,
  };
}

export const adminReportsRoutes:
  FastifyPluginAsync<
    AdminReportsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/reports",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.read"
        );

        const reports =
          await options
            .service
            .list();

        return reply
          .status(
            200
          )
          .send({
            generatedAt:
              new Date()
                .toISOString(),

            reports:
              reports.map(
                serializeSummary
              ),
          });
      }
    );

    app.get(
      "/reports/actionable",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.read"
        );

        const reports =
          await options
            .service
            .listActionable();

        return reply
          .status(
            200
          )
          .send({
            generatedAt:
              new Date()
                .toISOString(),

            reports:
              reports.map(
                serializeSummary
              ),
          });
      }
    );

    app.get<{
      Params:
        ReportParams;
    }>(
      "/reports/:reportId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.read"
        );

        try {
          const reportId =
            requiredUuid(
              request
                .params
                .reportId,
              "reportId"
            );

          const details =
            await options
              .service
              .getById(
                reportId
              );

          return reply
            .status(
              200
            )
            .send(
              serializeDetails(
                details
              )
            );
        } catch (
          error
        ) {
          if (
            error instanceof
              ReportsApplicationError
          ) {
            return sendApplicationError(
              error,
              reply
            );
          }

          if (
            error instanceof
              TypeError
          ) {
            return sendInvalidRequest(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );

    app.post<{
      Params:
        ReportParams;

      Body:
        ReportActionBody;
    }>(
      "/reports/:reportId/resolve",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.manage"
        );

        try {
          const actor =
            getAuthorizationActor(
              request
            );

          const details =
            await options
              .service
              .resolve({
                reportId:
                  requiredUuid(
                    request
                      .params
                      .reportId,
                    "reportId"
                  ),

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                resolutionNote:
                  optionalString(
                    request.body
                      ?.resolutionNote,
                    "resolutionNote"
                  ),

                ...actor,
              });

          return reply
            .status(
              200
            )
            .send(
              serializeDetails(
                details
              )
            );
        } catch (
          error
        ) {
          if (
            error instanceof
              ReportsApplicationError
          ) {
            return sendApplicationError(
              error,
              reply
            );
          }

          if (
            error instanceof
              TypeError
          ) {
            return sendInvalidRequest(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );

    app.post<{
      Params:
        ReportParams;

      Body:
        ReportActionBody;
    }>(
      "/reports/:reportId/dismiss",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.manage"
        );

        try {
          const actor =
            getAuthorizationActor(
              request
            );

          const details =
            await options
              .service
              .dismiss({
                reportId:
                  requiredUuid(
                    request
                      .params
                      .reportId,
                    "reportId"
                  ),

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                resolutionNote:
                  optionalString(
                    request.body
                      ?.resolutionNote,
                    "resolutionNote"
                  ),

                ...actor,
              });

          return reply
            .status(
              200
            )
            .send(
              serializeDetails(
                details
              )
            );
        } catch (
          error
        ) {
          if (
            error instanceof
              ReportsApplicationError
          ) {
            return sendApplicationError(
              error,
              reply
            );
          }

          if (
            error instanceof
              TypeError
          ) {
            return sendInvalidRequest(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );

    app.post<{
      Params:
        ReportParams;

      Body:
        RouteCopyrightBody;
    }>(
      "/reports/:reportId/route-copyright",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "reports.manage"
        );

        try {
          const actor =
            getAuthorizationActor(
              request
            );

          const details =
            await options
              .service
              .routeToCopyright({
                reportId:
                  requiredUuid(
                    request
                      .params
                      .reportId,
                    "reportId"
                  ),

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                copyrightCaseId:
                  requiredUuid(
                    request.body
                      ?.copyrightCaseId,
                    "copyrightCaseId"
                  ),

                resolutionNote:
                  optionalString(
                    request.body
                      ?.resolutionNote,
                    "resolutionNote"
                  ),

                ...actor,
              });

          return reply
            .status(
              200
            )
            .send(
              serializeDetails(
                details
              )
            );
        } catch (
          error
        ) {
          if (
            error instanceof
              ReportsApplicationError
          ) {
            return sendApplicationError(
              error,
              reply
            );
          }

          if (
            error instanceof
              TypeError
          ) {
            return sendInvalidRequest(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );
  };