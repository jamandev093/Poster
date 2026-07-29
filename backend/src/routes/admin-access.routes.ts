import type {
  FastifyPluginAsync,
} from "fastify";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

/**
 * Admin bootstrap endpoint.
 *
 * Admin clients use this response to determine whether the
 * authenticated identity can enter the operational Admin UI.
 */
export const adminAccessRoutes:
  FastifyPluginAsync =
  async (
    app
  ) => {
    app.get(
      "/access",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "admin.access"
          );

        return reply
          .status(
            200
          )
          .send({
            account: {
              id:
                context.userId,

              email:
                context.email,

              fullName:
                context.fullName,

              status:
                context.accountStatus,
            },

            access: {
              sessionId:
                context.sessionId,

              platformRoles:
                context.platformRoles,

              platformPermissions:
                context.platformPermissions,
            },

            organizations:
              context
                .organizationMemberships,
          });
      }
    );
  };