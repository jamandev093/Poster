import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import {
  ProgrammaticError,
  type AdminProgrammaticService,
} from "../application/monetization/index.js";

import {
  PROGRAMMATIC_APPROVED_FRAMES,
  PROGRAMMATIC_APPROVED_SCREENS,
  PROGRAMMATIC_MAPPING_STATUSES,
  PROGRAMMATIC_PROVIDER_HEALTH_STATUSES,
  PROGRAMMATIC_PROVIDER_STATUSES,
} from "../domains/monetization/index.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const JsonObjectSchema =
  z
    .record(
      z.string(),
      z.unknown()
    )
    .default({});

const ProviderBodySchema =
  z
    .object({
      providerKey:
        z
          .string()
          .trim()
          .min(3)
          .max(64),

      displayName:
        z
          .string()
          .trim()
          .min(2)
          .max(160),

      status:
        z.enum(
          PROGRAMMATIC_PROVIDER_STATUSES
        ),

      healthStatus:
        z.enum(
          PROGRAMMATIC_PROVIDER_HEALTH_STATUSES
        ),

      notes:
        z
          .string()
          .trim()
          .max(2000)
          .nullable()
          .default(null),
    })
    .strict();

const SlotMappingBodySchema =
  z
    .object({
      providerId:
        z
          .string()
          .uuid(),

      screen:
        z.enum(
          PROGRAMMATIC_APPROVED_SCREENS
        ),

      placement:
        z
          .string()
          .trim()
          .min(2)
          .max(80),

      frame:
        z.enum(
          PROGRAMMATIC_APPROVED_FRAMES
        ),

      status:
        z.enum(
          PROGRAMMATIC_MAPPING_STATUSES
        ),

      safetyRules:
        JsonObjectSchema,

      regionRules:
        JsonObjectSchema,

      deviceRules:
        JsonObjectSchema,

      frequencyRules:
        JsonObjectSchema,

      fallbackRules:
        JsonObjectSchema,
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

function serializeProvider(
  provider:
    Awaited<
      ReturnType<
        AdminProgrammaticService[
          "createProvider"
        ]
      >
    >
) {
  return {
    ...provider,

    createdAt:
      provider.createdAt.toISOString(),

    updatedAt:
      provider.updatedAt.toISOString(),
  };
}

function serializeSlotMapping(
  mapping:
    Awaited<
      ReturnType<
        AdminProgrammaticService[
          "createSlotMapping"
        ]
      >
    >
) {
  return {
    ...mapping,

    createdAt:
      mapping.createdAt.toISOString(),

    updatedAt:
      mapping.updatedAt.toISOString(),
  };
}

function sendProgrammaticError(
  error:
    ProgrammaticError,
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

        details:
          error.issues.map(
            issue => ({
              path:
                issue.field,

              message:
                issue.message,
            })
          ),
      },
    });
}

async function runProgrammaticOperation(
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
      ProgrammaticError
    ) {
      return sendProgrammaticError(
        error,
        request,
        reply
      );
    }

    throw error;
  }
}

export interface AdminProgrammaticRoutesOptions {
  service:
    AdminProgrammaticService;
}

export const adminProgrammaticRoutes:
  FastifyPluginAsync<
    AdminProgrammaticRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/monetization/programmatic",
      async (
        request,
        reply
      ) => {
        requirePlatformPermission(
          request,
          "monetization.campaigns.read"
        );

        const overview =
          await options.service.list();

        return reply
          .status(200)
          .send({
            providers:
              overview.providers.map(
                serializeProvider
              ),

            slotMappings:
              overview.slotMappings.map(
                serializeSlotMapping
              ),
          });
      }
    );

    app.post(
      "/monetization/programmatic/providers",
      async (
        request,
        reply
      ) =>
        await runProgrammaticOperation(
          request,
          reply,
          async () => {
            const authorization =
              requirePlatformPermission(
                request,
                "monetization.campaigns.manage"
              );

            const body =
              parseRequestValue(
                ProviderBodySchema,
                request.body,
                "body"
              );

            const provider =
              await options.service.createProvider({
                actorUserId:
                  authorization.userId,

                providerKey:
                  body.providerKey,

                displayName:
                  body.displayName,

                status:
                  body.status,

                healthStatus:
                  body.healthStatus,

                notes:
                  body.notes,
              });

            return reply
              .status(201)
              .send(
                serializeProvider(
                  provider
                )
              );
          }
        )
    );

    app.post(
      "/monetization/programmatic/slot-mappings",
      async (
        request,
        reply
      ) =>
        await runProgrammaticOperation(
          request,
          reply,
          async () => {
            const authorization =
              requirePlatformPermission(
                request,
                "monetization.campaigns.manage"
              );

            const body =
              parseRequestValue(
                SlotMappingBodySchema,
                request.body,
                "body"
              );

            const mapping =
              await options.service.createSlotMapping({
                actorUserId:
                  authorization.userId,

                providerId:
                  body.providerId,

                screen:
                  body.screen,

                placement:
                  body.placement,

                frame:
                  body.frame,

                status:
                  body.status,

                safetyRules:
                  body.safetyRules,

                regionRules:
                  body.regionRules,

                deviceRules:
                  body.deviceRules,

                frequencyRules:
                  body.frequencyRules,

                fallbackRules:
                  body.fallbackRules,
              });

            return reply
              .status(201)
              .send(
                serializeSlotMapping(
                  mapping
                )
              );
          }
        )
    );
  };