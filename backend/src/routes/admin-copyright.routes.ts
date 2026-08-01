import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  CopyrightApplicationError,
  type AdminCopyrightCaseDetails,
  type AdminCopyrightCaseSummary,
  type AdminCopyrightService,
} from "../application/copyright/index.js";

import type {
  ContentSourceAuditEventRecord,
  DiscoveryContentRecord,
} from "../domains/content-sources/index.js";

import type {
  CopyrightAuditEventRecord,
  CopyrightCaseRecord,
  CopyrightEvidenceReferenceRecord,
  CopyrightVerificationCheckRecord,
} from "../domains/copyright/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminCopyrightRoutesOptions {
  service:
    AdminCopyrightService;
}

interface CopyrightCaseParams {
  caseId: string;
}

interface CopyrightCaseActionBody {
  expectedRowVersion?: unknown;
}

interface CopyrightRemoveBody
  extends CopyrightCaseActionBody {
  contentExpectedRowVersion?: unknown;

  internalNote?: unknown;

  preventReimport?: unknown;
}

interface CopyrightRestoreBody
  extends CopyrightCaseActionBody {
  contentExpectedRowVersion?: unknown;
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

function requiredBoolean(
  value: unknown,
  field: string
): boolean {
  if (
    typeof value !== "boolean"
  ) {
    throw new TypeError(
      `${field} must be a boolean.`
    );
  }

  return value;
}

function serializeContent(
  record:
    DiscoveryContentRecord
) {
  return {
    id:
      record.id,

    publicId:
      record.publicId,

    sourceId:
      record.sourceId,

    title:
      record.title,

    publisherName:
      record.publisherName,

    originalUrl:
      record.originalUrl,

    acquisitionMethod:
      record.acquisitionMethod,

    status:
      record.status,

    publishedAt:
      record
        .publishedAt
        ?.toISOString() ??
      null,

    addedAt:
      record
        .addedAt
        .toISOString(),

    removedAt:
      record
        .removedAt
        ?.toISOString() ??
      null,

    removalReason:
      record.removalReason,

    removalNote:
      record.removalNote,

    copyrightCaseId:
      record.copyrightCaseId,

    copyrightClaimant:
      record.copyrightClaimant,

    preventReimport:
      record.preventReimport,

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

function serializeCase(
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

function serializeVerificationCheck(
  record:
    CopyrightVerificationCheckRecord
) {
  return {
    id:
      record.id,

    caseId:
      record.caseId,

    checkKey:
      record.checkKey,

    label:
      record.label,

    status:
      record.status,

    detail:
      record.detail,

    verifiedByUserId:
      record.verifiedByUserId,

    verifiedAt:
      record
        .verifiedAt
        ?.toISOString() ??
      null,

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

function serializeEvidence(
  record:
    CopyrightEvidenceReferenceRecord
) {
  return {
    id:
      record.id,

    caseId:
      record.caseId,

    evidenceType:
      record.evidenceType,

    label:
      record.label,

    referenceValue:
      record.referenceValue,

    storageObjectKey:
      record.storageObjectKey,

    sha256Digest:
      record.sha256Digest,

    submittedAt:
      record
        .submittedAt
        .toISOString(),

    createdAt:
      record
        .createdAt
        .toISOString(),
  };
}

function serializeAudit(
  record:
    CopyrightAuditEventRecord
) {
  return {
    id:
      record.id,

    caseId:
      record.caseId,

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

function serializeContentAudit(
  record:
    ContentSourceAuditEventRecord
) {
  return {
    id:
      record.id,

    entityType:
      record.entityType,

    sourceId:
      record.sourceId,

    contentId:
      record.contentId,

    action:
      record.action,

    actorUserId:
      record.actorUserId,

    actorLabel:
      record.actorLabel,

    metadata:
      record.metadata,

    occurredAt:
      record
        .occurredAt
        .toISOString(),
  };
}

function serializeSummary(
  summary:
    AdminCopyrightCaseSummary
) {
  return {
    case:
      serializeCase(
        summary.case
      ),

    content:
      serializeContent(
        summary.content
      ),
  };
}

function serializeDetails(
  details:
    AdminCopyrightCaseDetails
) {
  return {
    case:
      serializeCase(
        details.case
      ),

    content:
      serializeContent(
        details.content
      ),

    verificationChecks:
      details
        .verificationChecks
        .map(
          serializeVerificationCheck
        ),

    evidence:
      details
        .evidence
        .map(
          serializeEvidence
        ),

    audit:
      details
        .audit
        .map(
          serializeAudit
        ),

    contentAudit:
      details
        .contentAudit
        .map(
          serializeContentAudit
        ),
  };
}

function sendApplicationError(
  error:
    CopyrightApplicationError,
  reply:
    FastifyReply
) {
  const statusCode =
    error.code ===
      "COPYRIGHT_CASE_NOT_FOUND" ||
    error.code ===
      "COPYRIGHT_CONTENT_NOT_FOUND"
      ? 404
      : error.code ===
          "COPYRIGHT_VERIFICATION_INCOMPLETE" ||
        error.code ===
          "COPYRIGHT_RESTORE_BLOCKED"
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
          "INVALID_COPYRIGHT_ACTION",

        message:
          error.message,
      },
    });
}

export const adminCopyrightRoutes:
  FastifyPluginAsync<
    AdminCopyrightRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/copyright",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "copyright.read"
        );

        const cases =
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

            cases:
              cases.map(
                serializeSummary
              ),
          });
      }
    );

    app.get<{
      Params:
        CopyrightCaseParams;
    }>(
      "/copyright/:caseId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "copyright.read"
        );

        try {
          const details =
            await options
              .service
              .getById(
                request
                  .params
                  .caseId
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
              CopyrightApplicationError
          ) {
            return sendApplicationError(
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
        CopyrightCaseParams;

      Body:
        CopyrightRemoveBody;
    }>(
      "/copyright/:caseId/remove",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "copyright.manage"
        );

        try {
          const authorization =
            request
              .authorizationContext;

          if (
            !authorization
          ) {
            throw new Error(
              "Authorization context is unavailable after permission enforcement."
            );
          }

          const details =
            await options
              .service
              .remove({
                caseId:
                  request
                    .params
                    .caseId,

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                contentExpectedRowVersion:
                  requiredString(
                    request.body
                      ?.contentExpectedRowVersion,
                    "contentExpectedRowVersion"
                  ),

                internalNote:
                  optionalString(
                    request.body
                      ?.internalNote,
                    "internalNote"
                  ),

                preventReimport:
                  requiredBoolean(
                    request.body
                      ?.preventReimport,
                    "preventReimport"
                  ),

                actorUserId:
                  authorization.userId,

                actorLabel:
                  authorization.fullName,
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
              CopyrightApplicationError
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
        CopyrightCaseParams;

      Body:
        CopyrightCaseActionBody;
    }>(
      "/copyright/:caseId/dismiss",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "copyright.manage"
        );

        try {
          const authorization =
            request
              .authorizationContext;

          if (
            !authorization
          ) {
            throw new Error(
              "Authorization context is unavailable after permission enforcement."
            );
          }

          const details =
            await options
              .service
              .dismiss({
                caseId:
                  request
                    .params
                    .caseId,

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                actorUserId:
                  authorization.userId,

                actorLabel:
                  authorization.fullName,
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
              CopyrightApplicationError
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
        CopyrightCaseParams;

      Body:
        CopyrightRestoreBody;
    }>(
      "/copyright/:caseId/restore",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "copyright.manage"
        );

        try {
          const authorization =
            request
              .authorizationContext;

          if (
            !authorization
          ) {
            throw new Error(
              "Authorization context is unavailable after permission enforcement."
            );
          }

          const details =
            await options
              .service
              .restore({
                caseId:
                  request
                    .params
                    .caseId,

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                contentExpectedRowVersion:
                  requiredString(
                    request.body
                      ?.contentExpectedRowVersion,
                    "contentExpectedRowVersion"
                  ),

                actorUserId:
                  authorization.userId,

                actorLabel:
                  authorization.fullName,
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
              CopyrightApplicationError
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