import type {
  FastifyPluginAsync,
} from "fastify";

import type {
  AdminWalletOperationsService,
} from "../application/payments/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

export interface AdminWalletOperationsRoutesOptions {
  service:
    AdminWalletOperationsService;
}

export const adminWalletOperationsRoutes:
  FastifyPluginAsync<
    AdminWalletOperationsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/payments/wallet-operations",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.campaigns.read"
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
            snapshot
          );
      }
    );
  };