import type {
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import {
  ClientAccountConflictError,
  ClientAccountNotFoundError,
  ClientAccountValidationError,
  type ClientAccountActor,
  type ClientAccountService,
  type ClientAccountSnapshot,
  type UpdateClientOrganizationProfileInput,
} from "../application/client-account/index.js";

import type {
  OrganizationRecord,
  UserIdentityRecord,
} from "../domains/identity/identity.types.js";

export interface ClientAccountRouteDependencies {
  authenticateClientRequest: (
    request:
      FastifyRequest
  ) => Promise<ClientAccountActor>;

  clientAccountService:
    ClientAccountService;
}

const UpdateOrganizationBodySchema =
  z.object({
    name:
      z.string()
        .min(1),

    websiteUrl:
      z.string()
        .nullable()
        .optional(),

    billingEmail:
      z.string()
        .nullable()
        .optional(),

    countryCode:
      z.string()
        .length(2),

    expectedRowVersion:
      z.string()
        .regex(
          /^[0-9]+$/
        ),
  });

const UpdateAccountBodySchema =
  z.object({
    organization:
      UpdateOrganizationBodySchema,
  });

function serializeUser(
  user:
    UserIdentityRecord
) {
  return {
    id:
      user.id,

    email:
      user.email,

    fullName:
      user.fullName,

    status:
      user.status,

    emailVerifiedAt:
      user.emailVerifiedAt?.toISOString() ??
      null,

    createdAt:
      user.createdAt.toISOString(),

    updatedAt:
      user.updatedAt.toISOString(),

    rowVersion:
      user.rowVersion,
  };
}

function serializeOrganization(
  organization:
    OrganizationRecord
) {
  return {
    id:
      organization.id,

    name:
      organization.displayName ??
      organization.legalName,

    legalName:
      organization.legalName,

    displayName:
      organization.displayName,

    status:
      organization.status,

    websiteUrl:
      organization.websiteUrl,

    billingEmail:
      organization.billingEmail,

    countryCode:
      organization.countryCode,

    suspendedAt:
      organization.suspendedAt?.toISOString() ??
      null,

    closedAt:
      organization.closedAt?.toISOString() ??
      null,

    createdAt:
      organization.createdAt.toISOString(),

    updatedAt:
      organization.updatedAt.toISOString(),

    rowVersion:
      organization.rowVersion,
  };
}

function serializeAccount(
  snapshot:
    ClientAccountSnapshot
) {
  return {
    user:
      serializeUser(
        snapshot.user
      ),

    organization:
      serializeOrganization(
        snapshot.organization
      ),

    primaryContact: {
      id:
        snapshot.user.id,

      fullName:
        snapshot.user.fullName,

      businessEmail:
        snapshot.user.email,

      emailVerified:
        snapshot.user.emailVerifiedAt !==
        null,
    },
  };
}

function mapRouteError(
  error:
    unknown
): {
  statusCode:
    number;

  body:
    Record<string, unknown>;
} | null {
  if (
    error instanceof ClientAccountValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      statusCode:
        400,

      body: {
        error:
          "Bad Request",

        message:
          error instanceof ClientAccountValidationError
            ? error.message
            : "Invalid Client account request.",

        issues:
          error instanceof ClientAccountValidationError
            ? error.issues
            : error.issues,
      },
    };
  }

  if (
    error instanceof ClientAccountNotFoundError
  ) {
    return {
      statusCode:
        404,

      body: {
        error:
          "Not Found",

        message:
          error.message,
      },
    };
  }

  if (
    error instanceof ClientAccountConflictError
  ) {
    return {
      statusCode:
        409,

      body: {
        error:
          "Conflict",

        message:
          error.message,
      },
    };
  }

  return null;
}

function parseOrganizationInput(
  actor:
    ClientAccountActor,

  body:
    unknown
): UpdateClientOrganizationProfileInput {
  const parsed =
    UpdateOrganizationBodySchema.parse(
      body
    );

  return {
    userId:
      actor.userId,

    organizationId:
      actor.organizationId,

    name:
      parsed.name,

    websiteUrl:
      parsed.websiteUrl ??
      null,

    billingEmail:
      parsed.billingEmail ??
      null,

    countryCode:
      parsed.countryCode,

    expectedRowVersion:
      parsed.expectedRowVersion,
  };
}

async function handleRouteError(
  error:
    unknown,

  reply:
    Parameters<
      Parameters<FastifyPluginAsync>[0]["get"]
    > extends never
      ? never
      : any
) {
  const mapped =
    mapRouteError(
      error
    );

  if (mapped) {
    return reply
      .code(
        mapped.statusCode
      )
      .send(
        mapped.body
      );
  }

  throw error;
}

export function clientAccountRoutes(
  dependencies:
    ClientAccountRouteDependencies
): FastifyPluginAsync {
  return async app => {
    app.get(
      "/account",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await dependencies.authenticateClientRequest(
              request
            );

          const account =
            await dependencies.clientAccountService.getAccount(
              actor
            );

          return reply.send({
            account:
              serializeAccount(
                account
              ),
          });
        } catch (error) {
          return await handleRouteError(
            error,
            reply
          );
        }
      }
    );

    app.patch(
      "/account",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await dependencies.authenticateClientRequest(
              request
            );

          const parsed =
            UpdateAccountBodySchema.parse(
              request.body
            );

          const account =
            await dependencies.clientAccountService.updateAccount({
              userId:
                actor.userId,

              organizationId:
                actor.organizationId,

              organization: {
                name:
                  parsed.organization.name,

                websiteUrl:
                  parsed.organization.websiteUrl ??
                  null,

                billingEmail:
                  parsed.organization.billingEmail ??
                  null,

                countryCode:
                  parsed.organization.countryCode,

                expectedRowVersion:
                  parsed.organization.expectedRowVersion,
              },
            });

          return reply.send({
            account:
              serializeAccount(
                account
              ),
          });
        } catch (error) {
          return await handleRouteError(
            error,
            reply
          );
        }
      }
    );

    app.get(
      "/organizations/current",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await dependencies.authenticateClientRequest(
              request
            );

          const organization =
            await dependencies.clientAccountService.getCurrentOrganization(
              actor
            );

          return reply.send({
            organization:
              serializeOrganization(
                organization
              ),
          });
        } catch (error) {
          return await handleRouteError(
            error,
            reply
          );
        }
      }
    );

    app.patch(
      "/organizations/current",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await dependencies.authenticateClientRequest(
              request
            );

          const organization =
            await dependencies.clientAccountService.updateCurrentOrganization(
              parseOrganizationInput(
                actor,
                request.body
              )
            );

          return reply.send({
            organization:
              serializeOrganization(
                organization
              ),
          });
        } catch (error) {
          return await handleRouteError(
            error,
            reply
          );
        }
      }
    );
  };
}