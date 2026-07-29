import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import {
  AuthenticationAccessTokenInvalidError,
  AuthenticationForbiddenError,
  AuthenticationRequiredError,
} from "../domains/authentication/authentication.errors.js";

import {
  hasPlatformPermission,
} from "../domains/authorization/authorization.policy.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../domains/authorization/authorization.types.js";

import type {
  AuthorizationContextService,
} from "../application/authorization/authorization-context.service.js";

declare module "fastify" {
  interface FastifyRequest {
    authorizationContext:
      AuthorizationContext |
      null;
  }
}

export interface RegisterAuthorizationContextOptions {
  authorizationContextService:
    AuthorizationContextService;
}

const BEARER_ACCESS_TOKEN_PATTERN =
  /^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;

export function registerAuthorizationContext(
  app:
    FastifyInstance,
  options:
    RegisterAuthorizationContextOptions
): void {
  app.decorateRequest(
    "authorizationContext",
    null
  );

  app.addHook(
    "onRequest",
    async (
      request
    ) => {
      const authorizationHeader =
        request
          .headers
          .authorization;

      if (
        authorizationHeader ===
        undefined
      ) {
        return;
      }

      const match =
        BEARER_ACCESS_TOKEN_PATTERN.exec(
          authorizationHeader
        );

      const accessToken =
        match?.[1];

      if (
        !accessToken
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      request.authorizationContext =
        await options
          .authorizationContextService
          .resolve(
            accessToken
          );
    }
  );
}

export function requireAuthenticatedRequest(
  request:
    FastifyRequest
): AuthorizationContext {
  if (
    !request
      .authorizationContext
  ) {
    throw new AuthenticationRequiredError();
  }

  return request
    .authorizationContext;
}

export function requirePlatformPermission(
  request:
    FastifyRequest,
  permission:
    PlatformPermission
): AuthorizationContext {
  const context =
    requireAuthenticatedRequest(
      request
    );

  if (
    !hasPlatformPermission(
      context.platformPermissions,
      permission
    )
  ) {
    throw new AuthenticationForbiddenError(
      `The authenticated identity lacks platform permission "${permission}".`
    );
  }

  return context;
}