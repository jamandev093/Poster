import {
  describe,
  expect,
  it,
} from "vitest";

import {
  listPlatformPermissionsForRoles,
} from "../src/domains/authorization/authorization.policy.js";

describe(
  "Poster commercial workflow permissions",
  () => {
    it(
      "grants request and campaign management to operations Admins",
      () => {
        const permissions =
          listPlatformPermissionsForRoles([
            "operations_admin",
          ]);

        expect(
          permissions
        ).toEqual(
          expect.arrayContaining([
            "monetization.requests.read",
            "monetization.requests.manage",
            "monetization.campaigns.read",
            "monetization.campaigns.manage",
          ])
        );
      }
    );

    it(
      "keeps analytics viewers read-only",
      () => {
        const permissions =
          listPlatformPermissionsForRoles([
            "analytics_viewer",
          ]);

        expect(
          permissions
        ).toContain(
          "monetization.requests.read"
        );

        expect(
          permissions
        ).toContain(
          "monetization.campaigns.read"
        );

        expect(
          permissions
        ).not.toContain(
          "monetization.requests.manage"
        );

        expect(
          permissions
        ).not.toContain(
          "monetization.campaigns.manage"
        );
      }
    );
  }
);
