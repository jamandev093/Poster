import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  BusinessIdentityError,
  type PublicBusinessIdentity,
  type PublicBusinessIdentityService,
} from "../application/business-identity/index.js";

function serializePublicIdentity(
  identity:
    PublicBusinessIdentity
) {
  return {
    ...identity,

    updatedAt:
      identity.updatedAt.toISOString(),
  };
}

function sendBusinessIdentityError(
  error:
    BusinessIdentityError,
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
      },
    });
}

async function runBusinessIdentityOperation(
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
      BusinessIdentityError
    ) {
      return sendBusinessIdentityError(
        error,
        request,
        reply
      );
    }

    throw error;
  }
}

export interface PublicBusinessIdentityRoutesOptions {
  service:
    PublicBusinessIdentityService;
}

export const publicBusinessIdentityRoutes:
  FastifyPluginAsync<
    PublicBusinessIdentityRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/public/business-identity",
      async (
        request,
        reply
      ) =>
        await runBusinessIdentityOperation(
          request,
          reply,
          async () => {
            const identity =
              await options
                .service
                .getPublicIdentity();

            return reply
              .status(
                200
              )
              .send({
                identity:
                  serializePublicIdentity(
                    identity
                  ),
              });
          }
        )
    );
  };