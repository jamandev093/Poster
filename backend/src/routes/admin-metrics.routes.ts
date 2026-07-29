import type {
  FastifyPluginAsync,
} from "fastify";

import type {
  AdminUserMetricsService,
} from "../application/admin-metrics/admin-user-metrics.service.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminMetricsRoutesOptions {
  userMetricsService:
    AdminUserMetricsService;
}

function serializeUserMetrics(
  snapshot:
    Awaited<
      ReturnType<
        AdminUserMetricsService[
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

    windows:
      snapshot.windows,

    metrics: {
      totalUsers:
        snapshot.totalUsers,

      dailyActiveUsers:
        snapshot.dailyActiveUsers,

      monthlyActiveUsers:
        snapshot.monthlyActiveUsers,

      liveActiveUsers:
        snapshot.liveActiveUsers,
    },
  };
}

/**
 * Protected operational metrics for the Poster Admin.
 *
 * The same authoritative service powers the dedicated Users
 * screen and the compact dashboard summary. Permission checks
 * remain route-specific.
 */
export const adminMetricsRoutes:
  FastifyPluginAsync<
    AdminMetricsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/users/metrics",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "users.metrics.read"
        );

        const snapshot =
          await options
            .userMetricsService
            .getSnapshot();

        return reply
          .status(
            200
          )
          .send(
            serializeUserMetrics(
              snapshot
            )
          );
      }
    );

    app.get(
      "/dashboard/summary",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "dashboard.read"
        );

        const snapshot =
          await options
            .userMetricsService
            .getSnapshot();

        const serialized =
          serializeUserMetrics(
            snapshot
          );

        return reply
          .status(
            200
          )
          .send({
            generatedAt:
              serialized.generatedAt,

            users: {
              windows:
                serialized.windows,

              metrics:
                serialized.metrics,
            },
          });
      }
    );
  };