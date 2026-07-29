import type {
  FastifyRequest,
} from "fastify";

import {
  AuthenticationForbiddenError,
} from "../domains/authentication/authentication.errors.js";

import type {
  OrganizationRole,
} from "../domains/identity/identity.types.js";

import {
  requireAuthenticatedRequest,
} from "./authorization-context.js";

export function requireOrganizationRole(
  request: FastifyRequest,
  organizationId: string,
  allowedRoles: readonly OrganizationRole[]
) {
  const context =
    requireAuthenticatedRequest(
      request
    );

  const membership =
    context
      .organizationMemberships
      .find(
        (
          candidate
        ) =>
          candidate.organizationId === organizationId
      );

  if (
    !membership ||
    !allowedRoles.includes(
      membership.role
    )
  ) {
    throw new AuthenticationForbiddenError(
      `The authenticated identity cannot manage organization "${organizationId}".`
    );
  }

  return {
    context,
    membership,
  };
}
