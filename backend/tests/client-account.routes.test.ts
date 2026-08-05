import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  clientAccountRoutes,
} from "../src/routes/client-account.routes.js";

import type {
  ClientAccountService,
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
  new Date("2026-08-05T10:15:00.000Z");

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

function createService(): ClientAccountService {
  return {
    getAccount:
      vi.fn()
        .mockResolvedValue({
          user:
            USER,
          organization:
            ORGANIZATION,
        }),

    getCurrentOrganization:
      vi.fn()
        .mockResolvedValue(
          ORGANIZATION
        ),

    updateCurrentOrganization:
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

    updateAccount:
      vi.fn()
        .mockResolvedValue({
          user:
            USER,
          organization: {
            ...ORGANIZATION,
            legalName:
              "Updated Client Pvt Ltd",
            displayName:
              "Updated Client Pvt Ltd",
            rowVersion:
              "8",
          },
        }),
  };
}

async function createApp(
  service:
    ClientAccountService =
      createService()
) {
  const app =
    Fastify();

  await app.register(
    clientAccountRoutes({
      authenticateClientRequest:
        async () => ({
          userId:
            USER_ID,
          organizationId:
            ORGANIZATION_ID,
        }),

      clientAccountService:
        service,
    })
  );

  return {
    app,
    service,
  };
}

describe(
  "Client account routes",
  () => {
    it(
      "returns the authenticated Client account",
      async () => {
        const {
          app,
          service,
        } =
          await createApp();

        const response =
          await app.inject({
            method:
              "GET",
            url:
              "/account",
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
              legalName:
                "Example Client Pvt Ltd",
              displayName:
                "Example Client",
            },
            primaryContact: {
              fullName:
                "Client Owner",
              businessEmail:
                "client@example.com",
              emailVerified:
                true,
            },
          },
        });

        expect(
          service.getAccount
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
          organizationId:
            ORGANIZATION_ID,
        });
      }
    );

    it(
      "updates the current organization",
      async () => {
        const {
          app,
          service,
        } =
          await createApp();

        const response =
          await app.inject({
            method:
              "PATCH",
            url:
              "/organizations/current",
            payload: {
              name:
                "Updated Client Pvt Ltd",
              websiteUrl:
                "https://updated.example.com",
              billingEmail:
                "billing-updated@example.com",
              countryCode:
                "IN",
              expectedRowVersion:
                "7",
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
          organization: {
            name:
              "Updated Client Pvt Ltd",
            displayName:
              "Updated Client Pvt Ltd",
            rowVersion:
              "8",
          },
        });

        expect(
          service.updateCurrentOrganization
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
          organizationId:
            ORGANIZATION_ID,
          name:
            "Updated Client Pvt Ltd",
          websiteUrl:
            "https://updated.example.com",
          billingEmail:
            "billing-updated@example.com",
          countryCode:
            "IN",
          expectedRowVersion:
            "7",
        });
      }
    );

    it(
      "rejects invalid update payloads",
      async () => {
        const {
          app,
        } =
          await createApp();

        const response =
          await app.inject({
            method:
              "PATCH",
            url:
              "/organizations/current",
            payload: {
              name:
                "",
              countryCode:
                "India",
              expectedRowVersion:
                "abc",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          400
        );
      }
    );
  }
);