import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import type {
  AccountSelectedInterestsService,
} from "../application/authentication/index.js";

const MAX_SELECTED_INTERESTS =
  80;

const SelectedInterestsPatchRequestSchema =
  z
    .object({
      selectedInterests:
        z
          .array(
            z
              .string()
              .trim()
              .min(
                1
              )
              .max(
                120
              )
          )
          .max(
            MAX_SELECTED_INTERESTS
          ),
    })
    .strict();

export interface AccountSelectedInterestsRoutesOptions {
  service:
    AccountSelectedInterestsService;
}

function sendUnauthorized(
  reply:
    FastifyReply
) {
  return reply
    .code(
      401
    )
    .send({
      code:
        "UNAUTHORIZED",

      message:
        "Authentication is required.",
    });
}

function getAuthenticatedUserId(
  request:
    FastifyRequest,
  reply:
    FastifyReply
): string | null {
  const authorization =
    request.authorizationContext;

  if (!authorization) {
    sendUnauthorized(
      reply
    );

    return null;
  }

  return authorization.userId;
}

function sendValidationFailure(
  reply:
    FastifyReply,
  message:
    string,
  details:
    unknown[] =
    []
) {
  return reply
    .code(
      400
    )
    .send({
      code:
        "REQUEST_VALIDATION_FAILED",

      message,

      details,
    });
}

function isSelectedInterestRequestError(
  error:
    unknown
): error is Error {
  if (
    !(error instanceof Error)
  ) {
    return false;
  }

  return (
    error.message.startsWith(
      "Unknown interest topic:"
    ) ||
    error.message.includes(
      "Selected interest"
    ) ||
    error.message.includes(
      "selected interests"
    ) ||
    error.message.includes(
      "User id is required"
    )
  );
}

export const accountSelectedInterestsRoutes:
  FastifyPluginAsync<
    AccountSelectedInterestsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/account/interests",
      async (
        request,
        reply
      ) => {
        const userId =
          getAuthenticatedUserId(
            request,
            reply
          );

        if (!userId) {
          return reply;
        }

        const snapshot =
          await options
            .service
            .getSelectedInterests({
              userId,
            });

        return reply
          .code(
            200
          )
          .send(
            snapshot
          );
      }
    );

    app.patch(
      "/account/interests",
      async (
        request,
        reply
      ) => {
        const userId =
          getAuthenticatedUserId(
            request,
            reply
          );

        if (!userId) {
          return reply;
        }

        const parseResult =
          SelectedInterestsPatchRequestSchema
            .safeParse(
              request.body
            );

        if (!parseResult.success) {
          return sendValidationFailure(
            reply,
            "Invalid selected interests request.",
            parseResult.error.issues.map(
              (issue) => ({
                path:
                  issue.path.join(
                    "."
                  ),

                message:
                  issue.message,
              })
            )
          );
        }

        try {
          const snapshot =
            await options
              .service
              .replaceSelectedInterests({
                userId,

                selectedInterests:
                  parseResult
                    .data
                    .selectedInterests,
              });

          return reply
            .code(
              200
            )
            .send(
              snapshot
            );
        } catch (
          error
        ) {
          if (
            isSelectedInterestRequestError(
              error
            )
          ) {
            return sendValidationFailure(
              reply,
              error.message
            );
          }

          throw error;
        }
      }
    );
  };
