import {
  randomUUID,
} from "node:crypto";

import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import type {
  AdminPosterPromotionService,
} from "../application/monetization/admin-poster-promotion.service.js";

import {
  MONETIZATION_PLACEMENTS,
  type PosterPromotionCreativeRecord,
  type PosterPromotionRecord,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const PosterPromotionParamsSchema =
  z
    .object({
      campaignId:
        z
          .string()
          .uuid(),
    })
    .strict();

const PosterPromotionMediaSchema =
  z
    .object({
      assetId:
        z
          .string()
          .uuid(),

      type:
        z.enum([
          "image",
          "video",
        ]),

      fileName:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            255
          ),

      mimeType:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            255
          ),

      sizeBytes:
        z
          .number()
          .int()
          .positive(),
    })
    .strict();

const PosterPromotionCreateBodySchema =
  z
    .object({
      organizationId:
        z
          .string()
          .uuid(),

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

      mode:
        z.enum([
          "draft",
          "schedule",
        ]),

      purpose:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            2000
          ),

      headline:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            120
          ),

      body:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            500
          ),

      callToAction:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            40
          ),

      destinationUrl:
        z
          .string()
          .trim()
          .max(
            2048
          ),

      media:
        PosterPromotionMediaSchema
          .nullable(),
    })
    .strict();

const PosterPromotionUpdateBodySchema =
  PosterPromotionCreateBodySchema
    .omit({
      organizationId:
        true,
    })
    .extend({
      expectedCampaignRowVersion:
        z
          .string()
          .regex(
            /^(0|[1-9]\d*)$/
          ),

      expectedCreativeRowVersion:
        z
          .string()
          .regex(
            /^(0|[1-9]\d*)$/
          ),
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodType
>(
  schema:
    TSchema,
  value:
    unknown,
  root:
    string
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

function createCampaignReference():
  string {
  return `CMP-POSTER-${randomUUID()
    .replaceAll(
      "-",
      ""
    )
    .slice(
      0,
      12
    )
    .toUpperCase()}`;
}

function serializeCreative(
  creative:
    PosterPromotionCreativeRecord
) {
  return {
    ...creative,

    createdAt:
      creative
        .createdAt
        .toISOString(),

    updatedAt:
      creative
        .updatedAt
        .toISOString(),
  };
}

function serializePosterPromotion(
  record:
    PosterPromotionRecord
) {
  return {
    campaign: {
      ...record.campaign,

      createdAt:
        record
          .campaign
          .createdAt
          .toISOString(),

      updatedAt:
        record
          .campaign
          .updatedAt
          .toISOString(),
    },

    creative:
      serializeCreative(
        record.creative
      ),
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
          "POSTER_PROMOTION_NOT_FOUND",

        message:
          "Poster Promotion was not found.",

        requestId:
          request.id,
      },
    });
}

export interface AdminPosterPromotionRoutesOptions {
  service:
    AdminPosterPromotionService;
}

export const adminPosterPromotionRoutes:
  FastifyPluginAsync<
    AdminPosterPromotionRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.post(
      "/monetization/poster-promotions",
      async (
        request,
        reply
      ) => {
        const authorization =
          requirePlatformPermission(
            request,
            "monetization.campaigns.manage"
          );

        const body =
          parseRequestValue(
            PosterPromotionCreateBodySchema,
            request.body,
            "body"
          );

        const created =
          await options
            .service
            .create({
              actorUserId:
                authorization.userId,

              organizationId:
                body.organizationId,

              campaignReference:
                createCampaignReference(),

              name:
                body.name,

              placements:
                body.placements,

              scheduledStartDate:
                body.scheduledStartDate,

              scheduledEndDate:
                body.scheduledEndDate,

              mode:
                body.mode,

              purpose:
                body.purpose,

              headline:
                body.headline,

              body:
                body.body,

              callToAction:
                body.callToAction,

              destinationUrl:
                body.destinationUrl,

              media:
                body.media,
            });

        return reply
          .status(
            201
          )
          .send(
            serializePosterPromotion(
              created
            )
          );
      }
    );

    app.get(
      "/monetization/poster-promotions/:campaignId",
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
            PosterPromotionParamsSchema,
            request.params,
            "params"
          );

        const record =
          await options
            .service
            .get(
              params.campaignId
            );

        if (
          !record
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
          .send(
            serializePosterPromotion(
              record
            )
          );
      }
    );

    app.patch(
      "/monetization/poster-promotions/:campaignId",
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
            PosterPromotionParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseRequestValue(
            PosterPromotionUpdateBodySchema,
            request.body,
            "body"
          );

        const updated =
          await options
            .service
            .update({
              campaignId:
                params.campaignId,

              actorUserId:
                authorization.userId,

              expectedCampaignRowVersion:
                body.expectedCampaignRowVersion,

              expectedCreativeRowVersion:
                body.expectedCreativeRowVersion,

              name:
                body.name,

              placements:
                body.placements,

              scheduledStartDate:
                body.scheduledStartDate,

              scheduledEndDate:
                body.scheduledEndDate,

              mode:
                body.mode,

              purpose:
                body.purpose,

              headline:
                body.headline,

              body:
                body.body,

              callToAction:
                body.callToAction,

              destinationUrl:
                body.destinationUrl,

              media:
                body.media,
            });

        return reply
          .status(
            200
          )
          .send(
            serializePosterPromotion(
              updated
            )
          );
      }
    );
  };