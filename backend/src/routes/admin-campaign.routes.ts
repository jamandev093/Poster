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
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  type MonetizationCampaignRecord,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

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
  };