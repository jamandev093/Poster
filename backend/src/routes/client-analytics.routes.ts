import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import {
  ClientAnalyticsError,
  type ClientAnalyticsService,
} from "../application/monetization/client-analytics.service.js";

import type {
  MonetizationAnalyticsCampaignRecord,
  MonetizationAnalyticsOverviewRecord,
} from "../domains/monetization/index.js";

import {
  ClientWalletRouteAuthenticationError,
} from "./client-wallet.routes.js";

const AnalyticsQuerySchema =
  z
    .object({
      startDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      endDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      campaignId:
        z
          .string()
          .uuid()
          .optional(),
    })
    .strict();

export interface ClientAnalyticsRouteActor {
  userId:
    string;

  organizationId:
    string;
}

export interface ClientAnalyticsRoutesDependencies {
  authenticateClientRequest:
    (
      request:
        FastifyRequest
    ) => Promise<
      ClientAnalyticsRouteActor
    >;

  service:
    ClientAnalyticsService;
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

function sendClientAnalyticsError(
  error:
    ClientAnalyticsError,
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

export function createClientAnalyticsRoutes(
  dependencies:
    ClientAnalyticsRoutesDependencies
): FastifyPluginAsync {
  return async app => {
    app.get(
      "/api/v1/client/analytics",
      async (
        request,
        reply
      ) => {
        const actor =
          await dependencies
            .authenticateClientRequest(
              request
            );

        const parsed =
          AnalyticsQuerySchema
            .safeParse(
              request.query
            );

        if (
          !parsed.success
        ) {
          return reply
            .status(
              400
            )
            .send({
              error: {
                code:
                  "CLIENT_ANALYTICS_REQUEST_INVALID",

                message:
                  "The Client analytics query is invalid.",
              },
            });
        }

        try {
          const overview =
            await dependencies
              .service
              .getOverview({
                organizationId:
                  actor.organizationId,

                startDate:
                  parsed
                    .data
                    .startDate,

                endDate:
                  parsed
                    .data
                    .endDate,

                campaignId:
                  parsed
                    .data
                    .campaignId ??
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
              ClientAnalyticsError
          ) {
            return sendClientAnalyticsError(
              error,
              reply
            );
          }

          throw error;
        }
      }
    );
  };
}