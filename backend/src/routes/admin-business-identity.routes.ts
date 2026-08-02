import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import {
  BusinessIdentityError,
  type AdminBusinessIdentityService,
} from "../application/business-identity/index.js";

import type {
  BusinessIdentityRecord,
  JsonObject,
} from "../domains/business-identity/index.js";

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

const BusinessIdentityBodySchema =
  z
    .object({
      publicBrandName:
        z
          .string()
          .trim()
          .min(2)
          .max(120),

      legalBusinessName:
        z
          .string()
          .trim()
          .max(180)
          .nullable()
          .default(null),

      websiteUrl:
        z
          .string()
          .trim()
          .url(),

      officialBusinessEmail:
        z
          .string()
          .trim()
          .email(),

      supportEmail:
        z
          .string()
          .trim()
          .email()
          .nullable()
          .default(null),

      publisherRelationsEmail:
        z
          .string()
          .trim()
          .email()
          .nullable()
          .default(null),

      advertisingEmail:
        z
          .string()
          .trim()
          .email()
          .nullable()
          .default(null),

      copyrightEmail:
        z
          .string()
          .trim()
          .email()
          .nullable()
          .default(null),

      signalUrl:
        z
          .string()
          .trim()
          .url()
          .nullable()
          .default(null),

      signalLabel:
        z
          .string()
          .trim()
          .max(120)
          .nullable()
          .default(null),

      copyrightPortalUrl:
        z
          .string()
          .trim()
          .url()
          .nullable()
          .default(null),

      clientPortalUrl:
        z
          .string()
          .trim()
          .url()
          .nullable()
          .default(null),

      socialLinks:
        JsonObjectSchema,

      expectedRowVersion:
        z
          .string()
          .trim()
          .min(1),
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

function serializeIdentity(
  identity:
    BusinessIdentityRecord
) {
  return {
    ...identity,

    createdAt:
      identity.createdAt.toISOString(),

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

export interface AdminBusinessIdentityRoutesOptions {
  service:
    AdminBusinessIdentityService;
}

export const adminBusinessIdentityRoutes:
  FastifyPluginAsync<
    AdminBusinessIdentityRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/operations/business-identity",
      async (
        request,
        reply
      ) =>
        await runBusinessIdentityOperation(
          request,
          reply,
          async () => {
            requirePlatformPermission(
              request,
              "operations.business_identity.read"
            );

            const identity =
              await options
                .service
                .getOfficial();

            return reply
              .status(
                200
              )
              .send({
                identity:
                  serializeIdentity(
                    identity
                  ),
              });
          }
        )
    );

    app.patch(
      "/operations/business-identity",
      async (
        request,
        reply
      ) =>
        await runBusinessIdentityOperation(
          request,
          reply,
          async () => {
            const authorization =
              requirePlatformPermission(
                request,
                "operations.business_identity.manage"
              );

            const body =
              parseRequestValue(
                BusinessIdentityBodySchema,
                request.body,
                "body"
              );

            const identity =
              await options
                .service
                .updateOfficial({
                  actorUserId:
                    authorization.userId,

                  publicBrandName:
                    body.publicBrandName,

                  legalBusinessName:
                    body.legalBusinessName,

                  websiteUrl:
                    body.websiteUrl,

                  officialBusinessEmail:
                    body.officialBusinessEmail,

                  supportEmail:
                    body.supportEmail,

                  publisherRelationsEmail:
                    body.publisherRelationsEmail,

                  advertisingEmail:
                    body.advertisingEmail,

                  copyrightEmail:
                    body.copyrightEmail,

                  signalUrl:
                    body.signalUrl,

                  signalLabel:
                    body.signalLabel,

                  copyrightPortalUrl:
                    body.copyrightPortalUrl,

                  clientPortalUrl:
                    body.clientPortalUrl,

                  socialLinks:
                    body.socialLinks as JsonObject,

                  expectedRowVersion:
                    body.expectedRowVersion,
                });

            return reply
              .status(
                200
              )
              .send({
                identity:
                  serializeIdentity(
                    identity
                  ),
              });
          }
        )
    );
  };