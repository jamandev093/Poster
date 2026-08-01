import type {
  FastifyPluginAsync,
} from "fastify";

import type {
  AdminSystemStatusService,
} from "../application/system-status/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminSystemStatusRoutesOptions {
  service:
    AdminSystemStatusService;
}

function serializeSnapshot(
  snapshot:
    Awaited<
      ReturnType<
        AdminSystemStatusService[
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

    environment:
      snapshot.environment,

    summary:
      snapshot.summary,

    groups:
      snapshot.groups.map(
        group => ({
          key:
            group.key,

          title:
            group.title,

          description:
            group.description,

          services:
            group.services.map(
              service => ({
                key:
                  service.key,

                name:
                  service.name,

                area:
                  service.area,

                status:
                  service.status,

                statusLabel:
                  service.statusLabel,

                description:
                  service.description,

                checkedAt:
                  service.checkedAt
                    ?.toISOString() ??
                  null,

                latencyMilliseconds:
                  service
                    .latencyMilliseconds,

                metadata:
                  service.metadata,
              })
            ),
        })
      ),
  };
}

export const adminSystemStatusRoutes:
  FastifyPluginAsync<
    AdminSystemStatusRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/system-status",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "system.status.read"
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
            serializeSnapshot(
              snapshot
            )
          );
      }
    );
  };