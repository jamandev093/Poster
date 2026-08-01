import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  ContentSourceApplicationError,
  type AdminSourceDetails,
  type AdminSourceListItem,
  type AdminSourceService,
} from "../application/content-sources/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminSourceRoutesOptions {
  service:
    AdminSourceService;
}

interface SourceParams {
  sourceId: string;
}

interface LifecycleBody {
  expectedRowVersion?: unknown;
}

interface BlockSourceBody
  extends LifecycleBody {
  removeExistingContent?: unknown;
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

function serializeSource(
  source:
    AdminSourceListItem
) {
  return {
    id:
      source.id,

    publicId:
      source.publicId,

    name:
      source.name,

    websiteUrl:
      source.websiteUrl,

    acquisitionMethod:
      source.acquisitionMethod,

    status:
      source.status,

    health:
      source.health,

    displayPolicy:
      source.displayPolicy,

    operationalNote:
      source.operationalNote,

    lastSyncAt:
      source
        .lastSyncAt
        ?.toISOString() ??
      null,

    lastSyncError:
      source.lastSyncError,

    activeContentCount:
      source.activeContentCount,

    createdAt:
      source
        .createdAt
        .toISOString(),

    updatedAt:
      source
        .updatedAt
        .toISOString(),

    pausedAt:
      source
        .pausedAt
        ?.toISOString() ??
      null,

    blockedAt:
      source
        .blockedAt
        ?.toISOString() ??
      null,

    rowVersion:
      source.rowVersion,
  };
}

function serializeSourceDetails(
  details:
    AdminSourceDetails
) {
  return {
    source:
      serializeSource(
        details.source
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
      "SOURCE_NOT_FOUND"
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

export const adminSourceRoutes:
  FastifyPluginAsync<
    AdminSourceRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/sources",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "sources.read"
        );

        const sources =
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

            sources:
              sources.map(
                serializeSource
              ),
          });
      }
    );

    app.get<{
      Params:
        SourceParams;
    }>(
      "/sources/:sourceId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "sources.read"
        );

        try {
          const details =
            await options
              .service
              .getById(
                request
                  .params
                  .sourceId
              );

          return reply
            .status(
              200
            )
            .send(
              serializeSourceDetails(
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

    const registerLifecycleRoute =
      (
        path: string,
        action:
          "pause" |
          "enable" |
          "unblock"
      ) => {
        app.post<{
          Params:
            SourceParams;

          Body:
            LifecycleBody;
        }>(
          path,
          async (
            request,
            reply
          ) => {
            requirePlatformPermission(
              request,
              "sources.manage"
            );

            try {
              const authorization =
                request
                  .authorizationContext;

              const source =
                await options
                  .service[
                    action
                  ]({
                    sourceId:
                      request
                        .params
                        .sourceId,

                    expectedRowVersion:
                      requiredString(
                        request.body
                          ?.expectedRowVersion,
                        "expectedRowVersion"
                      ),

                    actorUserId:
                      authorization!
                        .userId,

                    actorLabel:
                      authorization!
                        .fullName,
                  });

              return reply
                .status(
                  200
                )
                .send({
                  source:
                    serializeSource(
                      source
                    ),
                });
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
                        "INVALID_SOURCE_ACTION",

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

    registerLifecycleRoute(
      "/sources/:sourceId/pause",
      "pause"
    );

    registerLifecycleRoute(
      "/sources/:sourceId/enable",
      "enable"
    );

    registerLifecycleRoute(
      "/sources/:sourceId/unblock",
      "unblock"
    );

    app.post<{
      Params:
        SourceParams;

      Body:
        BlockSourceBody;
    }>(
      "/sources/:sourceId/block",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "sources.manage"
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

          const source =
            await options
              .service
              .block({
                sourceId:
                  request
                    .params
                    .sourceId,

                expectedRowVersion:
                  requiredString(
                    request.body
                      ?.expectedRowVersion,
                    "expectedRowVersion"
                  ),

                removeExistingContent:
                  requiredBoolean(
                    request.body
                      ?.removeExistingContent,
                    "removeExistingContent"
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
            .send({
              source:
                serializeSource(
                  source
                ),
            });
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
                    "INVALID_SOURCE_ACTION",

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