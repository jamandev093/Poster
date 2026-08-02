import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import type {
  AdminCampaignService,
} from "../application/monetization/index.js";

import {
  CAMPAIGN_READINESS_STATUSES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  MONETIZATION_PLACEMENTS,
  type MonetizationCampaignRecord,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const TRANSITION_ACTIONS = [
  "schedule",
  "activate",
  "pause",
  "resume",
  "end",
  "disable",
] as const;

const ListCampaignsQuerySchema =
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
            CAMPAIGN_STATUSES
          )
          .optional(),

      campaignType:
        z
          .enum(
            CAMPAIGN_TYPES
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

const CampaignParamsSchema =
  z
    .object({
      campaignId:
        z
          .string()
          .uuid(),
    })
    .strict();

const CampaignOperationsBodySchema =
  z
    .object({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^(0|[1-9]\d*)$/
          ),

      name:
        z
          .string()
          .trim()
          .min(
            3
          )
          .max(
            160
          ),

      placements:
        z
          .array(
            z.enum(
              MONETIZATION_PLACEMENTS
            )
          )
          .min(
            1
          )
          .max(
            3
          ),

      scheduledStartDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      scheduledEndDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      readinessStatus:
        z.enum(
          CAMPAIGN_READINESS_STATUSES
        ),

      reason:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            1000
          )
          .nullable()
          .optional()
          .default(
            null
          ),
    })
    .strict();

const CampaignTransitionBodySchema =
  z
    .object({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^(0|[1-9]\d*)$/
          ),

      action:
        z.enum(
          TRANSITION_ACTIONS
        ),

      reason:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            1000
          )
          .nullable()
          .optional()
          .default(
            null
          ),
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

  if (
    !result.success
  ) {
    throw new ApiRequestValidationError(
      result.error.issues.map(
        issue => ({
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

function serializeCampaign(
  campaign:
    MonetizationCampaignRecord
) {
  return {
    ...campaign,

    createdAt:
      campaign
        .createdAt
        .toISOString(),

    updatedAt:
      campaign
        .updatedAt
        .toISOString(),
  };
}

function sendNotFound(
  request:
    FastifyRequest,
  reply:
    FastifyReply
) {
  return reply
    .status(
      404
    )
    .send({
      error: {
        code:
          "MONETIZATION_CAMPAIGN_NOT_FOUND",

        message:
          "The monetization campaign was not found.",

        requestId:
          request.id,
      },
    });
}

export interface AdminCampaignRoutesOptions {
  service:
    AdminCampaignService;
}

export const adminCampaignRoutes:
  FastifyPluginAsync<
    AdminCampaignRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/monetization/campaigns",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.campaigns.read"
        );

        const query =
          parseRequestValue(
            ListCampaignsQuerySchema,
            request.query,
            "query"
          );

        const result =
          await options
            .service
            .list({
              organizationId:
                query.organizationId ??
                null,

              status:
                query.status ??
                null,

              campaignType:
                query.campaignType ??
                null,

              limit:
                query.limit,

              offset:
                query.offset,
            });

        return reply
          .status(
            200
          )
          .send({
            ...result,

            items:
              result.items.map(
                serializeCampaign
              ),
          });
      }
    );

    app.get(
      "/monetization/campaigns/:campaignId",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.campaigns.read"
        );

        const params =
          parseRequestValue(
            CampaignParamsSchema,
            request.params,
            "params"
          );

        const campaign =
          await options
            .service
            .get(
              params.campaignId
            );

        if (
          !campaign
        ) {
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
            campaign:
              serializeCampaign(
                campaign
              ),
          });
      }
    );

    app.patch(
      "/monetization/campaigns/:campaignId/operations",
      async (
        request,
        reply
      ) => {
        const authorization =
          requirePlatformPermission(
            request,
            "monetization.campaigns.manage"
          );

        const params =
          parseRequestValue(
            CampaignParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseRequestValue(
            CampaignOperationsBodySchema,
            request.body,
            "body"
          );

        const campaign =
          await options
            .service
            .updateOperations({
              campaignId:
                params.campaignId,

              actorUserId:
                authorization.userId,

              expectedRowVersion:
                body.expectedRowVersion,

              name:
                body.name,

              placements:
                body.placements,

              scheduledStartDate:
                body.scheduledStartDate,

              scheduledEndDate:
                body.scheduledEndDate,

              readinessStatus:
                body.readinessStatus,

              reason:
                body.reason,
            });

        return reply
          .status(
            200
          )
          .send({
            campaign:
              serializeCampaign(
                campaign
              ),
          });
      }
    );

    app.post(
      "/monetization/campaigns/:campaignId/transitions",
      async (
        request,
        reply
      ) => {
        const authorization =
          requirePlatformPermission(
            request,
            "monetization.campaigns.manage"
          );

        const params =
          parseRequestValue(
            CampaignParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseRequestValue(
            CampaignTransitionBodySchema,
            request.body,
            "body"
          );

        const campaign =
          await options
            .service
            .transition({
              campaignId:
                params.campaignId,

              actorUserId:
                authorization.userId,

              expectedRowVersion:
                body.expectedRowVersion,

              action:
                body.action,

              reason:
                body.reason,
            });

        return reply
          .status(
            200
          )
          .send({
            campaign:
              serializeCampaign(
                campaign
              ),
          });
      }
    );
  };