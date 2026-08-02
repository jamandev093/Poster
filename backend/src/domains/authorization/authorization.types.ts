import type {
  OrganizationRole,
  UserStatus,
} from "../identity/identity.types.js";

export const PLATFORM_ROLES = [
  "super_admin",
  "operations_admin",
  "content_moderator",
  "copyright_admin",
  "support_analyst",
  "analytics_viewer",
] as const;

export type PlatformRole =
  (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ROLE_ASSIGNMENT_STATUSES = [
  "active",
  "revoked",
] as const;

export type PlatformRoleAssignmentStatus =
  (typeof PLATFORM_ROLE_ASSIGNMENT_STATUSES)[number];

export const PLATFORM_PERMISSIONS = [
  "admin.access",
  "dashboard.read",
  "system.status.read",
  "users.metrics.read",
  "users.audience_insights.read",
  "content.read",
  "content.manage",
  "sources.read",
  "sources.manage",
  "reports.read",
  "reports.manage",
  "copyright.read",
  "copyright.manage",
  "monetization.requests.read",
  "monetization.requests.manage",
  "monetization.campaigns.read",
  "monetization.campaigns.manage",
  "monetization.analytics.read",
  "operations.business_identity.read",
  "operations.business_identity.manage",
  "audit.read",
] as const;

export type PlatformPermission =
  (typeof PLATFORM_PERMISSIONS)[number];

export interface PlatformRoleAssignmentRecord {
  id: string;

  userId: string;

  role:
    PlatformRole;

  status:
    PlatformRoleAssignmentStatus;

  grantedByUserId:
    | string
    | null;

  grantedAt: Date;

  revokedAt:
    | Date
    | null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface GrantPlatformRoleInput {
  userId: string;

  role:
    PlatformRole;

  grantedByUserId?:
    | string
    | null;

  grantedAt: Date;
}

export interface RevokePlatformRoleInput {
  assignmentId: string;

  expectedRowVersion: string;

  revokedAt: Date;
}

export interface AuthorizationOrganizationMembership {
  membershipId: string;

  organizationId: string;

  role:
    OrganizationRole;

  isPrimaryContact:
    boolean;
}

export interface AuthorizationContext {
  userId: string;

  sessionId: string;

  email: string;

  fullName: string;

  accountStatus:
    UserStatus;

  platformRoles:
    readonly PlatformRole[];

  platformPermissions:
    readonly PlatformPermission[];

  organizationMemberships:
    readonly AuthorizationOrganizationMembership[];
}
