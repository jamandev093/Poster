import type {
  FastifyPluginAsync,
} from "fastify";

import type {
  AdminAudienceInsightsService,
} from "../application/audience-insights/admin-audience-insights.service.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminAudienceInsightsRoutesOptions {
  service:
    AdminAudienceInsightsService;
}

function serializeAudienceInsights(
  snapshot:
    Awaited<
      ReturnType<
        AdminAudienceInsightsService[
          "getSnapshot"
        ]
      >
    >
) {
  return {
    generatedAt:
      snapshot
        .generatedAt
        .toISOString(),

    activeWindowDays:
      snapshot.activeWindowDays,

    privacy:
      snapshot.privacy,

    topics:
      snapshot.topics,
  };
}

/**
 * Aggregate-only audience reporting for Poster Admin.
 *
 * This route never exposes user UUIDs, email addresses,
 * sessions, profiles, or individual declared-interest rows.
 * Privacy suppression has already been applied by the domain
 * policy before the response reaches this serializer.
 */
export const adminAudienceInsightsRoutes:
  FastifyPluginAsync<
    AdminAudienceInsightsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/users/audience-insights",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "users.audience_insights.read"
        );

        const snapshot =
          await options
            .service
            .getSnapshot();

        return reply
          .status(
            200
          )
          .send(
            serializeAudienceInsights(
              snapshot
            )
          );
      }
    );
  };
