import type {
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";

import {
  z,
} from "zod";

import {
  AdminAnalyticsError,
  type AdminAnalyticsService,
} from "../application/monetization/index.js";

import type {
  MonetizationAnalyticsCampaignRecord,
  MonetizationAnalyticsOverviewRecord,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const AnalyticsQuerySchema =
  z
    .object({
      startDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "startDate must use YYYY-MM-DD."
          ),

      endDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "endDate must use YYYY-MM-DD."
          ),

      campaignId:
        z
          .string()
          .uuid()
          .optional(),

      organizationId:
        z
          .string()
          .uuid()
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
    MonetizationAnalyticsCampaignRecord
) {
  return {
    ...campaign,

    latestSourceEventWatermark:
      campaign
        .latestSourceEventWatermark
        ?.toISOString() ??
      null,
  };
}

function serializeOverview(
  overview:
    MonetizationAnalyticsOverviewRecord
) {
  return {
    ...overview,

    latestSourceEventWatermark:
      overview
        .latestSourceEventWatermark
        ?.toISOString() ??
      null,

    campaigns:
      overview
        .campaigns
        .map(
          serializeCampaign
        ),
  };
}

function sendAnalyticsError(
  error:
    AdminAnalyticsError,
  reply:
    FastifyReply
) {
  return reply
    .status(
      422
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

export interface AdminAnalyticsRoutesOptions {
  service:
    AdminAnalyticsService;
}

export const adminAnalyticsRoutes:
  FastifyPluginAsync<
    AdminAnalyticsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/monetization/analytics",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.analytics.read"
        );

        const query =
          parseRequestValue(
            AnalyticsQuerySchema,
            request.query,
            "query"
          );

        try {
          const overview =
            await options
              .service
              .getOverview({
                startDate:
                  query.startDate,

                endDate:
                  query.endDate,

                campaignId:
                  query.campaignId ??
                  null,

                organizationId:
                  query.organizationId ??
                  null,
              });

          return reply
            .status(
              200
            )
            .send(
              serializeOverview(
                overview
              )
            );
        } catch (
          error
        ) {
          if (
            error instanceof
              AdminAnalyticsError
          ) {
            return sendAnalyticsError(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );
  };