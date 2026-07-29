import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import type {
  AdminCommercialRequestService,
} from "../application/monetization/admin-commercial-request.service.js";

import {
  COMMERCIAL_REQUEST_STATUSES,
  COMMERCIAL_REQUEST_TYPES,
  type CommercialRequestRecord,
  type MonetizationCampaignRecord,
} from "../domains/monetization/commercial.types.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
  parseHttpRequestBody,
} from "../http/request-validation.js";

const ListQuerySchema =
  z
    .object({
      organizationId:
        z
          .string()
          .uuid()
          .optional(),

      status:
        z
          .enum(
            COMMERCIAL_REQUEST_STATUSES
          )
          .optional(),

      requestType:
        z
          .enum(
            COMMERCIAL_REQUEST_TYPES
          )
          .optional(),

      limit:
        z
          .coerce
          .number()
          .int()
          .min(
            1
          )
          .max(
            100
          )
          .default(
            50
          ),

      offset:
        z
          .coerce
          .number()
          .int()
          .min(
            0
          )
          .default(
            0
          ),
    })
    .strict();

const RequestParamsSchema =
  z
    .object({
      requestId:
        z
          .string()
          .uuid(),
    })
    .strict();

const DecisionSchema =
  z
    .object({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^\d+$/
          ),

      decisionNote:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            2000
          ),
    })
    .strict();

const ApprovalSchema =
  z
    .object({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^\d+$/
          ),

      decisionNote:
        z
          .string()
          .trim()
          .max(
            2000
          )
          .nullable()
          .optional(),

      campaignName:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            160
          )
          .nullable()
          .optional(),
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodType
>(
  schema: TSchema,
  value: unknown,
  root: string
): z.output<TSchema> {
  const result =
    schema.safeParse(
      value
    );

  if (!result.success) {
    throw new ApiRequestValidationError(
      result.error.issues.map(
        (
          issue
        ) => ({
          path:
            [
              root,
              ...issue.path.map(
                String
              ),
            ].join(
              "."
            ),

          message:
            issue.message,
        })
      )
    );
  }

  return result.data;
}

function sendNotFound(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply
    .status(
      404
    )
    .send({
      error: {
        code:
          "COMMERCIAL_REQUEST_NOT_FOUND",

        message:
          "The advertising request was not found.",

        requestId:
          request.id,
      },
    });
}

function sendConflict(
  request: FastifyRequest,
  reply: FastifyReply,
  currentStatus: string
) {
  return reply
    .status(
      409
    )
    .send({
      error: {
        code:
          "COMMERCIAL_REQUEST_STATE_CONFLICT",

        message:
          "The advertising request changed or cannot be reviewed in its current state.",

        requestId:
          request.id,

        currentStatus,
      },
    });
}

function serializeRequest(
  value: CommercialRequestRecord
) {
  return {
    ...value,

    submittedAt:
      value.submittedAt.toISOString(),

    decidedAt:
      value.decidedAt?.toISOString() ?? null,

    createdAt:
      value.createdAt.toISOString(),

    updatedAt:
      value.updatedAt.toISOString(),
  };
}

function serializeCampaign(
  value: MonetizationCampaignRecord
) {
  return {
    ...value,

    createdAt:
      value.createdAt.toISOString(),

    updatedAt:
      value.updatedAt.toISOString(),
  };
}

export interface AdminCommercialRequestRoutesOptions {
  service: AdminCommercialRequestService;
}

export const adminCommercialRequestRoutes:
  FastifyPluginAsync<AdminCommercialRequestRoutesOptions> =
  async (
    app,
    options
  ) => {
    app.get(
      "/monetization/requests",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.requests.read"
        );

        const query =
          parseRequestValue(
            ListQuerySchema,
            request.query,
            "query"
          );

        const result =
          await options
            .service
            .list(
              query
            );

        return reply
          .status(
            200
          )
          .send({
            ...result,

            items:
              result.items.map(
                serializeRequest
              ),
          });
      }
    );

    app.get(
      "/monetization/requests/:requestId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.requests.read"
        );

        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        const detail =
          await options
            .service
            .get(
              params.requestId
            );

        if (!detail) {
          return sendNotFound(
            request,
            reply
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                detail.request
              ),

            revisions:
              detail.revisions.map(
                (
                  revision
                ) => ({
                  ...revision,

                  createdAt:
                    revision.createdAt.toISOString(),
                })
              ),
          });
      }
    );

    app.post(
      "/monetization/requests/:requestId/request-changes",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "monetization.requests.manage"
          );

        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseHttpRequestBody(
            DecisionSchema,
            request.body
          );

        const outcome =
          await options
            .service
            .requestChanges({
              requestId:
                params.requestId,

              actorUserId:
                context.userId,

              expectedRowVersion:
                body.expectedRowVersion,

              decisionNote:
                body.decisionNote,
            });

        if (
          outcome.status === "not_found"
        ) {
          return sendNotFound(
            request,
            reply
          );
        }

        if (
          outcome.status === "conflict"
        ) {
          return sendConflict(
            request,
            reply,
            outcome.request.status
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                outcome.request
              ),
          });
      }
    );

    app.post(
      "/monetization/requests/:requestId/reject",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "monetization.requests.manage"
          );

        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseHttpRequestBody(
            DecisionSchema,
            request.body
          );

        const outcome =
          await options
            .service
            .reject({
              requestId:
                params.requestId,

              actorUserId:
                context.userId,

              expectedRowVersion:
                body.expectedRowVersion,

              decisionNote:
                body.decisionNote,
            });

        if (
          outcome.status === "not_found"
        ) {
          return sendNotFound(
            request,
            reply
          );
        }

        if (
          outcome.status === "conflict"
        ) {
          return sendConflict(
            request,
            reply,
            outcome.request.status
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                outcome.request
              ),
          });
      }
    );

    app.post(
      "/monetization/requests/:requestId/approve",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "monetization.requests.manage"
          );

        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseHttpRequestBody(
            ApprovalSchema,
            request.body
          );

        const outcome =
          await options
            .service
            .approve({
              requestId:
                params.requestId,

              actorUserId:
                context.userId,

              expectedRowVersion:
                body.expectedRowVersion,

              decisionNote:
                body.decisionNote ?? null,

              campaignName:
                body.campaignName ?? null,
            });

        if (
          outcome.status === "not_found"
        ) {
          return sendNotFound(
            request,
            reply
          );
        }

        if (
          outcome.status === "conflict"
        ) {
          return sendConflict(
            request,
            reply,
            outcome.request.status
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                outcome.request
              ),

            campaign:
              serializeCampaign(
                outcome.campaign
              ),

            idempotent:
              outcome.idempotent,
          });
      }
    );
  };
