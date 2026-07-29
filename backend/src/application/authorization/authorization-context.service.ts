import {
  AuthenticationAccessTokenInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import type {
  AuthenticationAccessTokenService,
} from "../../domains/authentication/access-token.service.js";

import {
  listPlatformPermissionsForRoles,
} from "../../domains/authorization/authorization.policy.js";

import {
  listActivePlatformRoleAssignmentsForUser,
} from "../../domains/authorization/platform-role.repository.js";

import type {
  AuthorizationContext,
  PlatformRole,
} from "../../domains/authorization/authorization.types.js";

import {
  listActiveMembershipsForUser,
} from "../../domains/identity/membership.repository.js";

import {
  findUserSessionById,
} from "../../domains/identity/session.repository.js";

import {
  findUserById,
} from "../../domains/identity/user.repository.js";

export interface AuthorizationContextService {
  resolve:
    (
      accessToken:
        string
    ) => Promise<
      AuthorizationContext
    >;
}

export interface AuthorizationContextServiceDependencies {
  findUserById:
    typeof findUserById;

  findUserSessionById:
    typeof findUserSessionById;

  listActiveMembershipsForUser:
    typeof listActiveMembershipsForUser;

  listActivePlatformRoleAssignmentsForUser:
    typeof listActivePlatformRoleAssignmentsForUser;

  now:
    () => Date;
}

export interface CreateAuthorizationContextServiceOptions {
  accessTokenService:
    AuthenticationAccessTokenService;

  dependencies?:
    Partial<
      AuthorizationContextServiceDependencies
    >;
}

export function createAuthorizationContextService(
  options:
    CreateAuthorizationContextServiceOptions
): AuthorizationContextService {
  const dependencies:
    AuthorizationContextServiceDependencies = {
    findUserById,

    findUserSessionById,

    listActiveMembershipsForUser,

    listActivePlatformRoleAssignmentsForUser,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    resolve:
      async (
        accessToken
      ) => {
        const claims =
          options
            .accessTokenService
            .verify(
              accessToken
            );

        const [
          user,
          session,
          memberships,
          platformRoleAssignments,
        ] =
          await Promise.all([
            dependencies
              .findUserById(
                claims.userId
              ),

            dependencies
              .findUserSessionById(
                claims.sessionId
              ),

            dependencies
              .listActiveMembershipsForUser(
                claims.userId
              ),

            dependencies
              .listActivePlatformRoleAssignmentsForUser(
                claims.userId
              ),
          ]);

        const now =
          dependencies
            .now();

        if (
          !user ||
          user.status !==
            "active" ||
          user.deletedAt !==
            null ||
          !session ||
          session.userId !==
            claims.userId ||
          session.revokedAt !==
            null ||
          session.expiresAt <=
            now
        ) {
          throw new AuthenticationAccessTokenInvalidError();
        }

        const platformRoles =
          Array.from(
            new Set<
              PlatformRole
            >(
              platformRoleAssignments.map(
                (
                  assignment
                ) =>
                  assignment.role
              )
            )
          );

        const platformPermissions =
          listPlatformPermissionsForRoles(
            platformRoles
          );

        return {
          userId:
            user.id,

          sessionId:
            session.id,

          email:
            user.email,

          fullName:
            user.fullName,

          accountStatus:
            user.status,

          platformRoles,

          platformPermissions,

          organizationMemberships:
            memberships.map(
              (
                membership
              ) => ({
                membershipId:
                  membership.id,

                organizationId:
                  membership.organizationId,

                role:
                  membership.role,

                isPrimaryContact:
                  membership.isPrimaryContact,
              })
            ),
        };
      },
  };
}