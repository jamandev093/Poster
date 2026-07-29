import {
  PLATFORM_PERMISSIONS,
  type PlatformPermission,
  type PlatformRole,
} from "./authorization.types.js";

const PLATFORM_ROLE_PERMISSION_MAP:
  Readonly<
    Record<
      PlatformRole,
      readonly PlatformPermission[]
    >
  > = {
    super_admin:
      PLATFORM_PERMISSIONS,

    operations_admin: [
      "admin.access",
      "dashboard.read",
      "users.metrics.read",
      "content.read",
      "content.manage",
      "sources.read",
      "sources.manage",
      "reports.read",
      "reports.manage",
      "copyright.read",
      "copyright.manage",
      "audit.read",
    ],

    content_moderator: [
      "admin.access",
      "dashboard.read",
      "content.read",
      "content.manage",
      "sources.read",
      "reports.read",
      "reports.manage",
    ],

    copyright_admin: [
      "admin.access",
      "dashboard.read",
      "reports.read",
      "copyright.read",
      "copyright.manage",
      "audit.read",
    ],

    support_analyst: [
      "admin.access",
      "dashboard.read",
      "users.metrics.read",
      "reports.read",
    ],

    analytics_viewer: [
      "admin.access",
      "dashboard.read",
      "users.metrics.read",
      "content.read",
      "sources.read",
      "reports.read",
      "copyright.read",
    ],
  };

export function listPlatformPermissionsForRoles(
  roles:
    readonly PlatformRole[]
): PlatformPermission[] {
  const permissionSet =
    new Set<
      PlatformPermission
    >();

  for (
    const role
    of roles
  ) {
    for (
      const permission
      of PLATFORM_ROLE_PERMISSION_MAP[
        role
      ]
    ) {
      permissionSet.add(
        permission
      );
    }
  }

  return PLATFORM_PERMISSIONS.filter(
    (
      permission
    ) =>
      permissionSet.has(
        permission
      )
  );
}

export function hasPlatformPermission(
  permissions:
    readonly PlatformPermission[],
  requiredPermission:
    PlatformPermission
): boolean {
  return permissions.includes(
    requiredPermission
  );
}