import {
  describe,
  expect,
  it,
} from "vitest";

import {
  hasPlatformPermission,
  listPlatformPermissionsForRoles,
} from "../src/domains/authorization/authorization.policy.js";

import {
  PLATFORM_PERMISSIONS,
} from "../src/domains/authorization/authorization.types.js";

describe(
  "Poster platform authorization policy",
  () => {
    it(
      "grants every platform permission to a super Admin",
      () => {
        expect(
          listPlatformPermissionsForRoles([
            "super_admin",
          ])
        ).toEqual(
          PLATFORM_PERMISSIONS
        );
      }
    );

    it(
      "combines permissions without duplicates",
      () => {
        const permissions =
          listPlatformPermissionsForRoles([
            "content_moderator",
            "copyright_admin",
          ]);

        expect(
          permissions
        ).toContain(
          "content.manage"
        );

        expect(
          permissions
        ).toContain(
          "copyright.manage"
        );

        expect(
          permissions.filter(
            (
              permission
            ) =>
              permission ===
              "admin.access"
          )
        ).toHaveLength(
          1
        );
      }
    );

    it(
      "does not grant management permissions to analytics viewers",
      () => {
        const permissions =
          listPlatformPermissionsForRoles([
            "analytics_viewer",
          ]);

        expect(
          hasPlatformPermission(
            permissions,
            "dashboard.read"
          )
        ).toBe(
          true
        );

        expect(
          hasPlatformPermission(
            permissions,
            "content.manage"
          )
        ).toBe(
          false
        );
      }
    );
  }
);