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
  createProductionAdminPosterPromotionMediaService,
  type AdminPosterPromotionMediaService,
} from "../application/media/admin-poster-promotion-media.service.js";

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

const PosterPromotionMediaUploadBodySchema =
  z
    .object({
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
          .positive()
          .max(
            20 *
            1024 *
            1024
          ),
    })
    .superRefine(
      (
        value,
        context
      ) => {
        const mimeType =
          value.mimeType
            .trim()
            .toLowerCase();

        const accepted =
          value.type ===
            "image"
            ? [
                "image/jpeg",
                "image/png",
                "image/webp",
              ]
            : [
                "video/mp4",
                "video/webm",
              ];

        if (
          !accepted.includes(
            mimeType
          )
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "mimeType",
            ],

            message:
              "Unsupported Poster Promotion media MIME type.",
          });
        }

        if (
          value.type ===
            "image" &&
          value.sizeBytes >
            10 *
            1024 *
            1024
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "sizeBytes",
            ],

            message:
              "Poster Promotion images must not exceed 10 MB.",
          });
        }
      }
    );

const PosterPromotionMediaAssetParamsSchema =
  z
    .object({
      assetId:
        z
          .string()
          .uuid(),
    })
    .strict();

const PosterPromotionMediaVerifyBodySchema =
  z
    .object({
      expectedRowVersion:
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

  mediaService?:
    AdminPosterPromotionMediaService;
}

export const adminPosterPromotionRoutes:
  FastifyPluginAsync<
    AdminPosterPromotionRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    const mediaService =
      options.mediaService ??
      createProductionAdminPosterPromotionMediaService();

    app.post(
      "/monetization/poster-promotions/media/uploads",
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
            PosterPromotionMediaUploadBodySchema,
            request.body,
            "body"
          );

        const result =
          await mediaService
            .createUpload({
              actorUserId:
                authorization.userId,

              type:
                body.type,

              fileName:
                body.fileName,

              mimeType:
                body.mimeType,

              sizeBytes:
                body.sizeBytes,
            });

        return reply
          .status(
            201
          )
          .send({
            media: {
              assetId:
                result.asset.assetId,

              type:
                result.asset.mediaType,

              fileName:
                result.asset.fileName,

              mimeType:
                result.asset.mimeType,

              sizeBytes:
                result.asset.sizeBytes,

              status:
                result.asset.status,

              rowVersion:
                result.asset.rowVersion,
            },

            upload: {
              url:
                result.upload.url,

              method:
                result.upload.method,

              expiresAt:
                result.upload
                  .expiresAt
                  .toISOString(),

              requiredHeaders:
                result.upload
                  .requiredHeaders,
            },
          });
      }
    );

    app.post(
      "/monetization/poster-promotions/media/:assetId/verify",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.campaigns.manage"
        );

        const params =
          parseRequestValue(
            PosterPromotionMediaAssetParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseRequestValue(
            PosterPromotionMediaVerifyBodySchema,
            request.body,
            "body"
          );

        const result =
          await mediaService
            .verifyUpload({
              assetId:
                params.assetId,

              expectedRowVersion:
                body.expectedRowVersion,
            });

        if (
          result.status ===
          "ready"
        ) {
          return reply
            .status(
              200
            )
            .send({
              status:
                "ready",

              media: {
                assetId:
                  result.asset.assetId,

                type:
                  result.asset.mediaType,

                fileName:
                  result.asset.fileName,

                mimeType:
                  result.asset.mimeType,

                sizeBytes:
                  result.asset.sizeBytes,

                rowVersion:
                  result.asset.rowVersion,
              },
            });
        }

        if (
          result.status ===
          "not_found"
        ) {
          return reply
            .status(
              404
            )
            .send({
              error: {
                code:
                  "POSTER_PROMOTION_MEDIA_NOT_FOUND",

                message:
                  "Poster Promotion media asset was not found.",

                requestId:
                  request.id,
              },
            });
        }

        if (
          result.status ===
          "not_uploaded"
        ) {
          return reply
            .status(
              409
            )
            .send({
              error: {
                code:
                  "POSTER_PROMOTION_MEDIA_NOT_UPLOADED",

                message:
                  "Poster Promotion media upload is not available in storage yet.",

                requestId:
                  request.id,
              },
            });
        }

        if (
          result.status ===
          "invalid_upload"
        ) {
          return reply
            .status(
              422
            )
            .send({
              error: {
                code:
                  "POSTER_PROMOTION_MEDIA_INVALID",

                message:
                  "Uploaded Poster Promotion media does not match the expected content type or size.",

                requestId:
                  request.id,
              },
            });
        }

        if (
          result.status ===
          "conflict"
        ) {
          return reply
            .status(
              409
            )
            .send({
              error: {
                code:
                  "POSTER_PROMOTION_MEDIA_CONFLICT",

                message:
                  "Poster Promotion media changed before verification completed.",

                requestId:
                  request.id,
              },
            });
        }

        return reply
          .status(
            409
          )
          .send({
            error: {
              code:
                "POSTER_PROMOTION_MEDIA_INVALID_STATE",

              message:
                "Poster Promotion media is not in a verifiable upload state.",

              requestId:
                request.id,
            },
          });
      }
    );

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