import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ClientAccountConflictError,
  ClientAccountValidationError,
  createClientAccountService,
} from "../src/application/client-account/index.js";

import type {
  OrganizationRecord,
  UserIdentityRecord,
} from "../src/domains/identity/identity.types.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date("2026-08-05T10:00:00.000Z");

const USER: UserIdentityRecord = {
  id:
    USER_ID,

  email:
    "client@example.com",

  passwordHash:
    "hash",

  fullName:
    "Client Owner",

  status:
    "active",

  emailVerifiedAt:
    NOW,

  lastLoginAt:
    NOW,

  deletedAt:
    null,

  failedLoginAttempts:
    0,

  lockedUntil:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "4",
};

const ORGANIZATION: OrganizationRecord = {
  id:
    ORGANIZATION_ID,

  legalName:
    "Example Client Pvt Ltd",

  displayName:
    "Example Client",

  status:
    "active",

  websiteUrl:
    "https://example.com",

  billingEmail:
    "billing@example.com",

  countryCode:
    "IN",

  suspendedAt:
    null,

  closedAt:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "7",
};

function createDependencies() {
  return {
    findUserById:
      vi.fn()
        .mockResolvedValue(
          USER
        ),

    findOrganizationById:
      vi.fn()
        .mockResolvedValue(
          ORGANIZATION
        ),

    updateOrganizationProfile:
      vi.fn()
        .mockResolvedValue({
          ...ORGANIZATION,
          legalName:
            "Updated Client Pvt Ltd",
          displayName:
            "Updated Client Pvt Ltd",
          rowVersion:
            "8",
        }),
  };
}

describe(
  "Client account service",
  () => {
    it(
      "returns the authenticated Client account and organization",
      async () => {
        const dependencies =
          createDependencies();

        const service =
          createClientAccountService(
            dependencies
          );

        const account =
          await service.getAccount({
            userId:
              USER_ID,
            organizationId:
              ORGANIZATION_ID,
          });

        expect(
          account.user.id
        ).toBe(
          USER_ID
        );

        expect(
          account.organization.id
        ).toBe(
          ORGANIZATION_ID
        );

        expect(
          account.organization.displayName
        ).toBe(
          "Example Client"
        );
      }
    );

    it(
      "updates current organization profile with row-version protection",
      async () => {
        const dependencies =
          createDependencies();

        const service =
          createClientAccountService(
            dependencies
          );

        const organization =
          await service.updateCurrentOrganization({
            userId:
              USER_ID,

            organizationId:
              ORGANIZATION_ID,

            name:
              " Updated Client Pvt Ltd ",

            websiteUrl:
              " https://updated.example.com ",

            billingEmail:
              " billing-updated@example.com ",

            countryCode:
              "in",

            expectedRowVersion:
              "7",
          });

        expect(
          organization.displayName
        ).toBe(
          "Updated Client Pvt Ltd"
        );

        expect(
          dependencies.updateOrganizationProfile
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          expectedRowVersion:
            "7",

          legalName:
            "Updated Client Pvt Ltd",

          displayName:
            "Updated Client Pvt Ltd",

          websiteUrl:
            "https://updated.example.com",

          billingEmail:
            "billing-updated@example.com",

          countryCode:
            "IN",
        });
      }
    );

    it(
      "rejects invalid organization update input",
      async () => {
        const service =
          createClientAccountService(
            createDependencies()
          );

        await expect(
          service.updateCurrentOrganization({
            userId:
              USER_ID,

            organizationId:
              ORGANIZATION_ID,

            name:
              " ",

            countryCode:
              "India",

            expectedRowVersion:
              "abc",
          })
        ).rejects.toBeInstanceOf(
          ClientAccountValidationError
        );
      }
    );

    it(
      "maps stale organization row version to a conflict",
      async () => {
        const dependencies =
          createDependencies();

        dependencies.updateOrganizationProfile
          .mockResolvedValueOnce(
            null
          );

        const service =
          createClientAccountService(
            dependencies
          );

        await expect(
          service.updateCurrentOrganization({
            userId:
              USER_ID,

            organizationId:
              ORGANIZATION_ID,

            name:
              "Updated Client Pvt Ltd",

            countryCode:
              "IN",

            expectedRowVersion:
              "7",
          })
        ).rejects.toBeInstanceOf(
          ClientAccountConflictError
        );
      }
    );
  }
);