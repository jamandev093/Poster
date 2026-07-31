export type AdminAccountStatus =
  | "pending_verification"
  | "active"
  | "suspended"
  | "disabled"
  | "deleted";

export type AdminPlatformRole =
  | "super_admin"
  | "operations_admin"
  | "content_moderator"
  | "copyright_admin"
  | "support_analyst"
  | "analytics_viewer";

export type AdminPlatformPermission =
  | "admin.access"
  | "dashboard.read"
  | "users.metrics.read"
  | "content.read"
  | "content.manage"
  | "sources.read"
  | "sources.manage"
  | "reports.read"
  | "reports.manage"
  | "copyright.read"
  | "copyright.manage"
  | "monetization.requests.read"
  | "monetization.requests.manage"
  | "monetization.campaigns.read"
  | "monetization.campaigns.manage"
  | "audit.read";

export interface AuthenticationAccount {
  id: string;
  email: string;
  fullName: string;
  status: AdminAccountStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthenticationSession {
  id: string;
  userId: string;
  organizationId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AuthenticationResponse {
  account: AuthenticationAccount;
  session: AuthenticationSession;
}

export interface AdminOrganizationMembership {
  membershipId: string;
  organizationId: string;
  role: string;
  isPrimaryContact: boolean;
}

export interface AdminAccessResponse {
  account: {
    id: string;
    email: string;
    fullName: string;
    status: AdminAccountStatus;
  };

  access: {
    sessionId: string;
    platformRoles:
      readonly AdminPlatformRole[];
    platformPermissions:
      readonly AdminPlatformPermission[];
  };

  organizations:
    readonly AdminOrganizationMembership[];
}

export interface AdminAuthenticatedIdentity {
  account: AuthenticationAccount;
  session: AuthenticationSession;
  access: AdminAccessResponse;

  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface ApiValidationIssue {
  path: string;
  message: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?:
      readonly ApiValidationIssue[];
  };
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export type AdminAuthStatus =
  | "restoring"
  | "authenticated"
  | "unauthenticated"
  | "forbidden";

