export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "disabled",
  "deleted",
] as const;

export type UserStatus =
  (typeof USER_STATUSES)[number];

export type MutableUserStatus =
  Exclude<
    UserStatus,
    "deleted"
  >;

export const ORGANIZATION_STATUSES = [
  "pending",
  "active",
  "suspended",
  "closed",
] as const;

export type OrganizationStatus =
  (typeof ORGANIZATION_STATUSES)[number];

export const ORGANIZATION_ROLES = [
  "owner",
  "admin",
  "finance",
  "campaign_manager",
  "viewer",
] as const;

export type OrganizationRole =
  (typeof ORGANIZATION_ROLES)[number];

export const MEMBERSHIP_STATUSES = [
  "invited",
  "active",
  "suspended",
  "revoked",
] as const;

export type MembershipStatus =
  (typeof MEMBERSHIP_STATUSES)[number];

export interface UserIdentityRecord {
  id: string;

  email: string;

  passwordHash: string;

  fullName: string;

  status: UserStatus;

  emailVerifiedAt:
    Date |
    null;

  lastLoginAt:
    Date |
    null;

  failedLoginAttempts: number;

  lockedUntil:
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt:
    Date |
    null;

  /**
   * PostgreSQL bigint values are represented as strings so
   * their precision is never silently lost in JavaScript.
   */
  rowVersion: string;
}

export interface OrganizationRecord {
  id: string;

  legalName: string;

  displayName: string;

  websiteUrl:
    string |
    null;

  billingEmail:
    string |
    null;

  countryCode: string;

  status: OrganizationStatus;

  createdAt: Date;

  updatedAt: Date;

  suspendedAt:
    Date |
    null;

  closedAt:
    Date |
    null;

  rowVersion: string;
}

export interface OrganizationMembershipRecord {
  id: string;

  organizationId: string;

  userId: string;

  role: OrganizationRole;

  status: MembershipStatus;

  isPrimaryContact: boolean;

  invitedByUserId:
    string |
    null;

  invitedAt:
    Date |
    null;

  joinedAt:
    Date |
    null;

  suspendedAt:
    Date |
    null;

  revokedAt:
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface UserSessionRecord {
  id: string;

  userId: string;

  organizationId:
    string |
    null;

  refreshTokenDigest: string;

  ipAddress:
    string |
    null;

  userAgent:
    string |
    null;

  createdAt: Date;

  lastSeenAt: Date;

  expiresAt: Date;

  revokedAt:
    Date |
    null;

  revocationReason:
    string |
    null;
}

export interface CreateUserInput {
  email: string;

  passwordHash: string;

  fullName: string;
}

export interface MarkUserEmailVerifiedInput {
  userId: string;

  expectedRowVersion: string;

  verifiedAt: Date;
}

export interface RecordSuccessfulUserLoginInput {
  userId: string;

  expectedRowVersion: string;

  loggedInAt: Date;
}

export interface UpdateUserPasswordInput {
  userId: string;

  expectedRowVersion: string;

  passwordHash: string;
}

export interface UpdateUserStatusInput {
  userId: string;

  expectedRowVersion: string;

  status: MutableUserStatus;
}


export interface SoftDeleteUserInput {
  userId: string;

  expectedRowVersion: string;

  deletedAt: Date;
}

export interface CreateOrganizationInput {
  legalName: string;

  displayName: string;

  websiteUrl?:
    string |
    null;

  billingEmail?:
    string |
    null;

  countryCode: string;
}

export interface UpdateOrganizationProfileInput {
  organizationId: string;

  expectedRowVersion: string;

  legalName: string;

  displayName: string;

  websiteUrl?:
    string |
    null;

  billingEmail?:
    string |
    null;

  countryCode: string;
}

export interface UpdateOrganizationStatusInput {
  organizationId: string;

  expectedRowVersion: string;

  status: OrganizationStatus;

  changedAt: Date;
}

export interface CreateOrganizationMembershipInput {
  organizationId: string;

  userId: string;

  role: OrganizationRole;

  status?: MembershipStatus;

  isPrimaryContact?: boolean;

  invitedByUserId?:
    string |
    null;

  invitedAt?:
    Date |
    null;

  joinedAt?:
    Date |
    null;
}

export interface UpdateOrganizationMembershipRoleInput {
  membershipId: string;

  expectedRowVersion: string;

  role: OrganizationRole;
}

export interface UpdateOrganizationMembershipStatusInput {
  membershipId: string;

  expectedRowVersion: string;

  status: MembershipStatus;

  changedAt: Date;
}

export interface CreateUserSessionInput {
  userId: string;

  organizationId?:
    string |
    null;

  refreshTokenDigest: string;

  ipAddress?:
    string |
    null;

  userAgent?:
    string |
    null;

  expiresAt: Date;
}

export interface TouchUserSessionInput {
  sessionId: string;

  seenAt: Date;
}

export interface RevokeUserSessionInput {
  sessionId: string;

  revokedAt: Date;

  reason?:
    string |
    null;
}

export interface RevokeAllUserSessionsInput {
  userId: string;

  revokedAt: Date;

  reason?:
    string |
    null;
}

export function normalizeIdentityEmail(
  email: string
): string {
  return email
    .trim()
    .toLowerCase();
}

export function normalizeRequiredIdentityText(
  value: string
): string {
  return value.trim();
}

export function normalizeOptionalIdentityText(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

export function normalizeCountryCode(
  countryCode: string
): string {
  return countryCode
    .trim()
    .toUpperCase();
}
