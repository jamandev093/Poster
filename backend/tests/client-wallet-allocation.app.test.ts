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
  ClientWalletAllocationMutationResult,
  ClientWalletAllocationService,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const SESSION_ID =
  "00000000-0000-4000-8000-000000001302";

const MEMBERSHIP_ID =
  "00000000-0000-4000-8000-000000001303";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ALLOCATION_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-04T08:00:00.000Z");

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

function createMutationResult():
  ClientWalletAllocationMutationResult {
  return {
    wallet: {
      id:
        WALLET_ID,

      organizationId:
        ORGANIZATION_ID,

      currency:
        "INR",

      status:
        "active",

      availableBalance: {
        minorUnits:
          750000n,

        currency:
          "INR",
      },

      reservedBalance: {
        minorUnits:
          450000n,

        currency:
          "INR",
      },

      totalCredited: {
        minorUnits:
          1200000n,

        currency:
          "INR",
      },

      totalSpent: {
        minorUnits:
          0n,

        currency:
          "INR",
      },

      totalRefunded: {
        minorUnits:
          0n,

        currency:
          "INR",
      },

      rowVersion:
        "8",
    },

    allocation: {
      id:
        ALLOCATION_ID,

      organizationId:
        ORGANIZATION_ID,

      walletId:
        WALLET_ID,

      campaignId:
        CAMPAIGN_ID,

      currency:
        "INR",

      status:
        "active",

      allocated: {
        minorUnits:
          250000n,

        currency:
          "INR",
      },

      reserved: {
        minorUnits:
          250000n,

        currency:
          "INR",
      },

      spent: {
        minorUnits:
          0n,

        currency:
          "INR",
      },

      released: {
        minorUnits:
          0n,

        currency:
          "INR",
      },

      refunded: {
        minorUnits:
          0n,

        currency:
          "INR",
      },

      createdByUserId:
        USER_ID,

      createdAt:
        NOW,

      updatedAt:
        NOW,

      rowVersion:
        "3",
    },
  };
}

describe(
  "Client Wallet allocation app registration",
  () => {
    it(
      "registers allocation mutation route with auth context and injected service",
      async () => {
        const allocateCampaignWalletFunds =
          vi.fn<
            ClientWalletAllocationService[
              "allocateCampaignWalletFunds"
            ]
          >()
            .mockResolvedValue(
              createMutationResult()
            );

        const releaseCampaignWalletFunds =
          vi.fn<
            ClientWalletAllocationService[
              "releaseCampaignWalletFunds"
            ]
          >()
            .mockResolvedValue(
              createMutationResult()
            );

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            walletAllocationService: {
              allocateCampaignWalletFunds,
              releaseCampaignWalletFunds,
            },
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/client/wallet/campaign-allocations",

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              campaignId:
                CAMPAIGN_ID,

              amountMinorUnits:
                "250000",

              currency:
                "INR",

              idempotencyKey:
                "alloc-app-0001",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          response.json()
        ).toMatchObject({
          wallet: {
            id:
              WALLET_ID,

            availableBalance: {
              minorUnits:
                "750000",

              currency:
                "INR",
            },
          },

          allocation: {
            id:
              ALLOCATION_ID,

            campaignId:
              CAMPAIGN_ID,

            rowVersion:
              "3",
          },
        });

        expect(
          allocateCampaignWalletFunds
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          actorUserId:
            USER_ID,

          campaignId:
            CAMPAIGN_ID,

          amountMinorUnits:
            250000n,

          currency:
            "INR",

          idempotencyKey:
            "alloc-app-0001",
        });

        expect(
          releaseCampaignWalletFunds
        ).not.toHaveBeenCalled();
      }
    );
  }
);