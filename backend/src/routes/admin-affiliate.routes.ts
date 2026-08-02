import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import {
  AffiliateError,
  type AdminAffiliateDetailRecord,
  type AdminAffiliateService,
} from "../application/monetization/index.js";

import {
  AFFILIATE_COMMISSION_MODELS,
  AFFILIATE_DISCLOSURE,
  AFFILIATE_PAYOUT_READINESS_STATUSES,
  AFFILIATE_TRACKING_STATUSES,
  type AffiliateMetadataRecord,
  type MonetizationCampaignRecord,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const AffiliateParamsSchema =
  z
    .object({
      campaignId:
        z
          .string()
          .uuid(),
    })
    .strict();

const AffiliateMetadataBodySchema =
  z
    .object({
      partnerName:
        z
          .string()
          .trim()
          .min(
            2
          )
          .max(
            160
          ),

      offerName:
        z
          .string()
          .trim()
          .min(
            2
          )
          .max(
            160
          ),

      destinationUrl:
        z
          .string()
          .trim()
          .url()
          .max(
            2048
          ),

      commissionModel:
        z.enum(
          AFFILIATE_COMMISSION_MODELS
        ),

      commissionTerms:
        z
          .record(
            z.string(),
            z.unknown()
          )
          .default({}),

      trackingStatus:
        z.enum(
          AFFILIATE_TRACKING_STATUSES
        ),

      trackingUrl:
        z
          .string()
          .trim()
          .url()
          .max(
            2048
          )
          .nullable()
          .default(
            null
          ),

      payoutReadinessStatus:
        z.enum(
          AFFILIATE_PAYOUT_READINESS_STATUSES
        ),
    })
    .strict();

const AffiliateMetadataUpdateBodySchema =
  AffiliateMetadataBodySchema
    .extend({
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

function serializeMetadata(
  metadata:
    AffiliateMetadataRecord |
    null
) {
  if (
    !metadata
  ) {
    return null;
  }

  return {
    ...metadata,

    createdAt:
      metadata
        .createdAt
        .toISOString(),

    updatedAt:
      metadata
        .updatedAt
        .toISOString(),
  };
}

function serializeAffiliateDetail(
  detail:
    AdminAffiliateDetailRecord
) {
  return {
    campaign:
      serializeCampaign(
        detail.campaign
      ),

    metadata:
      serializeMetadata(
        detail.metadata
      ),
  };
}

function sendAffiliateError(
  error:
    AffiliateError,
  request:
    FastifyRequest,
  reply:
    FastifyReply
) {
  return reply
    .status(
      error.statusCode
    )
    .send({
      error: {
        code:
          error.code,

        message:
          error.message,

        requestId:
          request.id,

        ...(error.issues.length > 0
          ? {
              details:
                error.issues.map(
                  issue => ({
                    path:
                      issue.field,

                    message:
                      issue.message,
                  })
                ),
            }
          : {}),
      },
    });
}

async function runAffiliateOperation(
  request:
    FastifyRequest,
  reply:
    FastifyReply,
  operation:
    () => Promise<unknown>
) {
  try {
    return await operation();
  } catch (
    error
  ) {
    if (
      error instanceof
      AffiliateError
    ) {
      return sendAffiliateError(
        error,
        request,
        reply
      );
    }

    throw error;
  }
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
          "AFFILIATE_CAMPAIGN_NOT_FOUND",

        message:
          "The affiliate campaign was not found.",

        requestId:
          request.id,
      },
    });
}

export interface AdminAffiliateRoutesOptions {
  service:
    AdminAffiliateService;
}

export const adminAffiliateRoutes:
  FastifyPluginAsync<
    AdminAffiliateRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/monetization/affiliates/:campaignId",
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
            AffiliateParamsSchema,
            request.params,
            "params"
          );

        const detail =
          await options
            .service
            .get(
              params.campaignId
            );

        if (
          !detail
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
            serializeAffiliateDetail(
              detail
            )
          );
      }
    );

    app.post(
      "/monetization/affiliates/:campaignId/metadata",
      async (
        request,
        reply
      ) =>
        await runAffiliateOperation(
          request,
          reply,
          async () => {
            const authorization =
              requirePlatformPermission(
                request,
                "monetization.campaigns.manage"
              );

            const params =
              parseRequestValue(
                AffiliateParamsSchema,
                request.params,
                "params"
              );

            const body =
              parseRequestValue(
                AffiliateMetadataBodySchema,
                request.body,
                "body"
              );

            const detail =
              await options
                .service
                .createMetadata({
                  campaignId:
                    params.campaignId,

                  actorUserId:
                    authorization.userId,

                  partnerName:
                    body.partnerName,

                  offerName:
                    body.offerName,

                  destinationUrl:
                    body.destinationUrl,

                  disclosure:
                    AFFILIATE_DISCLOSURE,

                  commissionModel:
                    body.commissionModel,

                  commissionTerms:
                    body.commissionTerms,

                  trackingStatus:
                    body.trackingStatus,

                  trackingUrl:
                    body.trackingUrl,

                  payoutReadinessStatus:
                    body.payoutReadinessStatus,
                });

            return reply
              .status(
                201
              )
              .send(
                serializeAffiliateDetail(
                  detail
                )
              );
          }
        )
    );

    app.patch(
      "/monetization/affiliates/:campaignId/metadata",
      async (
        request,
        reply
      ) =>
        await runAffiliateOperation(
          request,
          reply,
          async () => {
            const authorization =
              requirePlatformPermission(
                request,
                "monetization.campaigns.manage"
              );

            const params =
              parseRequestValue(
                AffiliateParamsSchema,
                request.params,
                "params"
              );

            const body =
              parseRequestValue(
                AffiliateMetadataUpdateBodySchema,
                request.body,
                "body"
              );

            const detail =
              await options
                .service
                .updateMetadata({
                  campaignId:
                    params.campaignId,

                  actorUserId:
                    authorization.userId,

                  expectedRowVersion:
                    body.expectedRowVersion,

                  partnerName:
                    body.partnerName,

                  offerName:
                    body.offerName,

                  destinationUrl:
                    body.destinationUrl,

                  disclosure:
                    AFFILIATE_DISCLOSURE,

                  commissionModel:
                    body.commissionModel,

                  commissionTerms:
                    body.commissionTerms,

                  trackingStatus:
                    body.trackingStatus,

                  trackingUrl:
                    body.trackingUrl,

                  payoutReadinessStatus:
                    body.payoutReadinessStatus,
                });

            return reply
              .status(
                200
              )
              .send(
                serializeAffiliateDetail(
                  detail
                )
              );
          }
        )
    );
  };