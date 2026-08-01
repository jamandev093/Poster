import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  ContentSourceApplicationError,
  type AdminContentService,
} from "../application/content-sources/index.js";

import type {
  ContentRemovalReason,
  DiscoveryContentRecord,
} from "../domains/content-sources/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminContentRoutesOptions {
  service:
    AdminContentService;
}

interface ContentParams {
  contentId: string;
}

interface RemoveContentBody {
  expectedRowVersion?: unknown;

  reason?: unknown;

  note?: unknown;

  copyrightCaseId?: unknown;

  copyrightClaimant?: unknown;

  preventReimport?: unknown;
}

interface RestoreContentBody {
  expectedRowVersion?: unknown;
}

const REMOVAL_REASONS =
  new Set<
    ContentRemovalReason
  >([
    "copyright",
    "publisher_request",
    "misleading_unsafe",
    "broken_unavailable",
    "other",
  ]);

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

function parseRemovalReason(
  value: unknown
): ContentRemovalReason {
  if (
    typeof value !== "string" ||
    !REMOVAL_REASONS.has(
      value as ContentRemovalReason
    )
  ) {
    throw new TypeError(
      "reason is invalid."
    );
  }

  return value as ContentRemovalReason;
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

function serializeDetails(
  details:
    Awaited<
      ReturnType<
        AdminContentService[
          "getById"
        ]
      >
    >
) {
  return {
    record:
      serializeContent(
        details.record
      ),

    audit:
      details.audit.map(
        event => ({
          id:
            event.id,

          action:
            event.action,

          actorUserId:
            event.actorUserId,

          actorLabel:
            event.actorLabel,

          metadata:
            event.metadata,

          occurredAt:
            event
              .occurredAt
              .toISOString(),
        })
      ),
  };
}

function sendApplicationError(
  error:
    ContentSourceApplicationError,
  reply:
    FastifyReply
) {
  const statusCode =
    error.code ===
      "CONTENT_NOT_FOUND"
      ? 404
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

export const adminContentRoutes:
  FastifyPluginAsync<
    AdminContentRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/content",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "content.read"
        );

        const records =
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

            records:
              records.map(
                serializeContent
              ),
          });
      }
    );

    app.get<{
      Params:
        ContentParams;
    }>(
      "/content/:contentId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "content.read"
        );

        try {
          const details =
            await options
              .service
              .getById(
                request
                  .params
                  .contentId
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
              ContentSourceApplicationError
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
        ContentParams;

      Body:
        RemoveContentBody;
    }>(
      "/content/:contentId/remove",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "content.manage"
        );

        try {
          const reason =
            parseRemovalReason(
              request.body?.reason
            );

          const copyrightCaseId =
            optionalString(
              request.body
                ?.copyrightCaseId,
              "copyrightCaseId"
            );

          const copyrightClaimant =
            optionalString(
              request.body
                ?.copyrightClaimant,
              "copyrightClaimant"
            );

          if (
            reason === "copyright" &&
            (
              !copyrightCaseId ||
              !copyrightClaimant
            )
          ) {
            throw new TypeError(
              "Copyright removal requires copyrightCaseId and copyrightClaimant."
            );
          }

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
                contentId:
                  request
                    .params
                    .contentId,

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                reason,

                note:
                  optionalString(
                    request.body?.note,
                    "note"
                  ),

                copyrightCaseId,

                copyrightClaimant,

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
              ContentSourceApplicationError
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
            return reply
              .status(
                400
              )
              .send({
                error: {
                  code:
                    "INVALID_CONTENT_ACTION",

                  message:
                    error.message,
                },
              });
          }

          throw error;
        }
      }
    );

    app.post<{
      Params:
        ContentParams;

      Body:
        RestoreContentBody;
    }>(
      "/content/:contentId/restore",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "content.manage"
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
                contentId:
                  request
                    .params
                    .contentId,

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
              ContentSourceApplicationError
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
            return reply
              .status(
                400
              )
              .send({
                error: {
                  code:
                    "INVALID_CONTENT_ACTION",

                  message:
                    error.message,
                },
              });
          }

          throw error;
        }
      }
    );
  };