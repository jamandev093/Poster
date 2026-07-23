export type WorkspaceAccountStatus =
  | "active"
  | "restricted"
  | "disabled";

export type WorkspaceAccountRole =
  | "primary_client";

export interface WorkspaceOrganizationProfile {
  website: string;
  industry: string;
  country: string;
  billingEmail: string;
}

export interface WorkspacePrimaryClient {
  fullName: string;
  jobTitle: string;
  businessEmail: string;
  phone: string;

  role: WorkspaceAccountRole;
  emailVerified: boolean;
}

export interface WorkspaceAccountProfile {
  status: WorkspaceAccountStatus;

  organization: WorkspaceOrganizationProfile;

  primaryClient: WorkspacePrimaryClient;
}

/**
 * Frontend-only canonical Client account profile.
 *
 * The organization name itself remains owned by the
 * canonical workspace organization record.
 *
 * Backend integration will later replace this object
 * with authenticated organization-scoped account data.
 */
export const workspaceAccountProfile:
  WorkspaceAccountProfile = {
  status: "active",

  organization: {
    website:
      "https://examplecloud.com",

    industry:
      "Professional learning",

    country:
      "India",

    billingEmail:
      "billing@examplecloud.com",
  },

  primaryClient: {
    fullName:
      "Aarav Mehta",

    jobTitle:
      "Marketing Manager",

    businessEmail:
      "marketing@examplecloud.com",

    phone:
      "",

    role:
      "primary_client",

    emailVerified:
      true,
  },
};

export function getWorkspaceAccountStatusLabel(
  status: WorkspaceAccountStatus
): string {
  switch (status) {
    case "active":
      return "Active";

    case "restricted":
      return "Restricted";

    case "disabled":
      return "Disabled";
  }
}

export function getWorkspaceAccountRoleLabel(
  role: WorkspaceAccountRole
): string {
  switch (role) {
    case "primary_client":
      return "Primary client";
  }
}