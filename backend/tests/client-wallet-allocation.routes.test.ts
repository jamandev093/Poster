import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientWalletAllocationService,
  ClientWalletAllocationMutationResult,
} from "../src/application/payments/index.js";

import {
  ClientWalletAllocationConflictError,
  ClientWalletAllocationInsufficientBalanceError,
} from "../src/application/payments/index.js";

import {
  ClientWalletAllocationRouteAuthenticationError,
  createClientWalletAllocationRoutes,
  type ClientWalletAllocationRoutesDependencies,
} from "../src/routes/client-wallet-allocation.routes.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ALLOCATION_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-04T08:00:00.000Z");

function createMutationResult(): ClientWalletAllocationMutationResult {
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

function createService(
  overrides:
    Partial<ClientWalletAllocationService> =
      {}
): ClientWalletAllocationService {
  return {
    allocateCampaignWalletFunds:
      vi.fn<
        ClientWalletAllocationService[
          "allocateCampaignWalletFunds"
        ]
      >()
        .mockResolvedValue(
          createMutationResult()
        ),

    releaseCampaignWalletFunds:
      vi.fn<
        ClientWalletAllocationService[
          "releaseCampaignWalletFunds"
        ]
      >()
        .mockResolvedValue(
          createMutationResult()
        ),

    ...overrides,
  };
}

function createApp(
  options: {
    authenticateClientRequest?: ClientWalletAllocationRoutesDependencies[
      "authenticateClientRequest"
    ];

    walletAllocationService?: ClientWalletAllocationService;
  } = {}
) {
  const app =
    Fastify();

  const authenticateClientRequest =
    options.authenticateClientRequest ??
    vi.fn<
      ClientWalletAllocationRoutesDependencies[
        "authenticateClientRequest"
      ]
    >()
      .mockResolvedValue({
        userId:
          USER_ID,

        organizationId:
          ORGANIZATION_ID,
      });

  const walletAllocationService =
    options.walletAllocationService ??
    createService();

  app.register(
    createClientWalletAllocationRoutes({
      authenticateClientRequest,
      walletAllocationService,
    })
  );

  return {
    app,
    authenticateClientRequest,
    walletAllocationService,
  };
}

describe(
  "Client Wallet allocation routes",
  () => {
    it(
      "allocates Wallet funds to a Client campaign",
      async () => {
        const {
          app,
          walletAllocationService,
        } =
          createApp();

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/client/wallet/campaign-allocations",

            payload: {
              campaignId:
                CAMPAIGN_ID,

              amountMinorUnits:
                "250000",

              currency:
                "INR",

              idempotencyKey:
                "alloc-route-0001",
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

            reservedBalance: {
              minorUnits:
                "450000",

              currency:
                "INR",
            },
          },

          allocation: {
            id:
              ALLOCATION_ID,

            campaignId:
              CAMPAIGN_ID,

            reserved: {
              minorUnits:
                "250000",

              currency:
                "INR",
            },

            rowVersion:
              "3",
          },
        });

        expect(
          walletAllocationService.allocateCampaignWalletFunds
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
            "alloc-route-0001",
        });
      }
    );

    it(
      "releases Wallet funds from a Client campaign allocation",
      async () => {
        const {
          app,
          walletAllocationService,
        } =
          createApp();

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/client/wallet/campaign-allocations/${CAMPAIGN_ID}/release`,

            payload: {
              amountMinorUnits:
                "100000",

              expectedRowVersion:
                "3",

              idempotencyKey:
                "release-route-0001",
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
          allocation: {
            id:
              ALLOCATION_ID,

            campaignId:
              CAMPAIGN_ID,
          },
        });

        expect(
          walletAllocationService.releaseCampaignWalletFunds
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          actorUserId:
            USER_ID,

          campaignId:
            CAMPAIGN_ID,

          amountMinorUnits:
            100000n,

          expectedRowVersion:
            "3",

          idempotencyKey:
            "release-route-0001",
        });
      }
    );

    it(
      "rejects invalid allocation route payloads",
      async () => {
        const {
          app,
          walletAllocationService,
        } =
          createApp();

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/client/wallet/campaign-allocations",

            payload: {
              campaignId:
                CAMPAIGN_ID,

              amountMinorUnits:
                "0",

              currency:
                "INR",

              idempotencyKey:
                "alloc-route-0002",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "client_wallet_allocation_validation_failed",
          },
        });

        expect(
          walletAllocationService.allocateCampaignWalletFunds
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "maps allocation conflicts to HTTP 409",
      async () => {
        const service =
          createService({
            releaseCampaignWalletFunds:
              vi.fn<
                ClientWalletAllocationService[
                  "releaseCampaignWalletFunds"
                ]
              >()
                .mockRejectedValue(
                  new ClientWalletAllocationConflictError()
                ),
          });

        const {
          app,
        } =
          createApp({
            walletAllocationService:
              service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/client/wallet/campaign-allocations/${CAMPAIGN_ID}/release`,

            payload: {
              expectedRowVersion:
                "3",

              idempotencyKey:
                "release-route-0002",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          409
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "client_wallet_allocation_conflict",
          },
        });
      }
    );

    it(
      "maps insufficient balance to HTTP 409",
      async () => {
        const service =
          createService({
            allocateCampaignWalletFunds:
              vi.fn<
                ClientWalletAllocationService[
                  "allocateCampaignWalletFunds"
                ]
              >()
                .mockRejectedValue(
                  new ClientWalletAllocationInsufficientBalanceError()
                ),
          });

        const {
          app,
        } =
          createApp({
            walletAllocationService:
              service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/client/wallet/campaign-allocations",

            payload: {
              campaignId:
                CAMPAIGN_ID,

              amountMinorUnits:
                "999999999",

              currency:
                "INR",

              idempotencyKey:
                "alloc-route-0003",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          409
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "client_wallet_allocation_insufficient_balance",
          },
        });
      }
    );

    it(
      "maps missing Client authentication to HTTP 401",
      async () => {
        const {
          app,
        } =
          createApp({
            authenticateClientRequest:
              vi.fn()
                .mockRejectedValue(
                  new ClientWalletAllocationRouteAuthenticationError()
                ),
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/client/wallet/campaign-allocations",

            payload: {
              campaignId:
                CAMPAIGN_ID,

              amountMinorUnits:
                "250000",

              currency:
                "INR",

              idempotencyKey:
                "alloc-route-0004",
            },
          });

        await app.close();

        expect(
          response.statusCode
        ).toBe(
          401
        );
      }
    );
  }
);