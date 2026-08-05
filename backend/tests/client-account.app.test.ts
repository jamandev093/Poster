import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  ClientAccountService,
} from "../src/application/client-account/index.js";

import type {
  OrganizationRecord,
  UserIdentityRecord,
} from "../src/domains/identity/identity.types.js";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000001302";

const MEMBERSHIP_ID =
  "00000000-0000-4000-8000-000000001303";

const NOW =
  new Date("2026-08-05T10:30:00.000Z");

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

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue({
          userId:
            USER_ID,

          sessionId:
            SESSION_ID,

          email:
            "client@example.com",

          fullName:
            "Client Owner",

          accountStatus:
            "active",

          platformRoles:
            [],

          platformPermissions:
            [],

          organizationMemberships: [
            {
              membershipId:
                MEMBERSHIP_ID,

              organizationId:
                ORGANIZATION_ID,

              role:
                "owner",

              isPrimaryContact:
                true,
            },
          ],
        }),
  };
}

function createClientAccountService():
  ClientAccountService {
  return {
    getAccount:
      vi.fn<ClientAccountService["getAccount"]>()
        .mockResolvedValue({
          user:
            USER,
          organization:
            ORGANIZATION,
        }),

    getCurrentOrganization:
      vi.fn<ClientAccountService["getCurrentOrganization"]>()
        .mockResolvedValue(
          ORGANIZATION
        ),

    updateCurrentOrganization:
      vi.fn<ClientAccountService["updateCurrentOrganization"]>()
        .mockResolvedValue({
          ...ORGANIZATION,
          displayName:
            "Updated Client",
          legalName:
            "Updated Client Pvt Ltd",
          rowVersion:
            "8",
        }),

    updateAccount:
      vi.fn<ClientAccountService["updateAccount"]>()
        .mockResolvedValue({
          user:
            USER,
          organization: {
            ...ORGANIZATION,
            displayName:
              "Updated Client",
            legalName:
              "Updated Client Pvt Ltd",
            rowVersion:
              "8",
          },
        }),
  };
}

describe(
  "Client account app wiring",
  () => {
    it(
      "registers Client account routes behind Client auth context",
      async () => {
        const clientAccountService =
          createClientAccountService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            clientAccountService,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/client/account",

            headers: {
              authorization:
                "Bearer payload.signature",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toMatchObject({
          account: {
            user: {
              id:
                USER_ID,
              email:
                "client@example.com",
            },
            organization: {
              id:
                ORGANIZATION_ID,
              name:
                "Example Client",
            },
          },
        });

        expect(
          vi.mocked(
            clientAccountService.getAccount
          )
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
          organizationId:
            ORGANIZATION_ID,
        });
      }
    );
  }
);