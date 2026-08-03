import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientWalletReadOverview,
  ClientWalletReadService,
} from "../src/application/payments/index.js";

import {
  ClientWalletReadRouteAuthenticationError,
  createClientWalletReadRoutes,
  type ClientWalletReadRoutesDependencies,
} from "../src/routes/client-wallet-read.routes.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const NOW =
  "2026-08-03T13:55:00.000Z";

const OVERVIEW: ClientWalletReadOverview = {
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
        "500000",

      currency:
        "INR",
    },

    reservedBalance: {
      minorUnits:
        "0",

      currency:
        "INR",
    },

    totalCredited: {
      minorUnits:
        "500000",

      currency:
        "INR",
    },

    totalSpent: {
      minorUnits:
        "0",

      currency:
        "INR",
    },

    totalRefunded: {
      minorUnits:
        "0",

      currency:
        "INR",
    },

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  },

  fundingOrders:
    [],

  ledgerEntries:
    [],

  payments:
    [],

  invoices:
    [],

  refunds:
    [],

  campaignAllocations:
    [],

  generatedAt:
    NOW,
};

function createService(): ClientWalletReadService {
  return {
    getOverview:
      vi.fn<
        ClientWalletReadService[
          "getOverview"
        ]
      >()
        .mockResolvedValue(
          OVERVIEW
        ),

    listFundingOrders:
      vi.fn<
        ClientWalletReadService[
          "listFundingOrders"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listLedgerEntries:
      vi.fn<
        ClientWalletReadService[
          "listLedgerEntries"
        ]
      >()
        .mockResolvedValue(
          [
            {
              id:
                "00000000-0000-4000-8000-000000002201",

              organizationId:
                ORGANIZATION_ID,

              walletId:
                WALLET_ID,

              fundingOrderId:
                null,

              campaignId:
                null,

              allocationId:
                null,

              invoiceId:
                null,

              paymentId:
                null,

              refundId:
                null,

              entryType:
                "payment_credit",

              direction:
                "credit",

              status:
                "posted",

              amount: {
                minorUnits:
                  "500000",

                currency:
                  "INR",
              },

              balanceBefore: {
                minorUnits:
                  "0",

                currency:
                  "INR",
              },

              balanceAfter: {
                minorUnits:
                  "500000",

                currency:
                  "INR",
              },

              idempotencyKey:
                "wallet-credit:pay_0001",

              providerReference:
                "pay_0001",

              metadata:
                {},

              createdByUserId:
                USER_ID,

              createdAt:
                NOW,

              rowVersion:
                "1",
            },
          ]
        ),

    listPayments:
      vi.fn<
        ClientWalletReadService[
          "listPayments"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listInvoices:
      vi.fn<
        ClientWalletReadService[
          "listInvoices"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listRefunds:
      vi.fn<
        ClientWalletReadService[
          "listRefunds"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listCampaignAllocations:
      vi.fn<
        ClientWalletReadService[
          "listCampaignAllocations"
        ]
      >()
        .mockResolvedValue(
          []
        ),
  };
}

function createApp(
  options: {
    authenticateClientRequest?: ClientWalletReadRoutesDependencies[
      "authenticateClientRequest"
    ];
    walletReadService?: ClientWalletReadService;
  } = {}
) {
  const app =
    Fastify();

  const authenticateClientRequest =
    options.authenticateClientRequest ??
    vi.fn<
      ClientWalletReadRoutesDependencies[
        "authenticateClientRequest"
      ]
    >()
      .mockResolvedValue({
        userId:
          USER_ID,

        organizationId:
          ORGANIZATION_ID,
      });

  const walletReadService =
    options.walletReadService ??
    createService();

  app.register(
    createClientWalletReadRoutes({
      authenticateClientRequest,

      walletReadService,
    })
  );

  return {
    app,
    authenticateClientRequest,
    walletReadService,
  };
}

describe("Client Wallet read routes", () => {
  it("returns a Client Wallet overview for an authenticated Client", async () => {
    const {
      app,
      walletReadService,
    } =
      createApp();

    const response =
      await app.inject({
        method:
          "GET",

        url:
          "/api/v1/client/wallet?limit=7",
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
      wallet: {
        id:
          WALLET_ID,

        availableBalance: {
          minorUnits:
            "500000",

          currency:
            "INR",
        },
      },

      fundingOrders:
        [],

      ledgerEntries:
        [],

      payments:
        [],

      invoices:
        [],

      refunds:
        [],

      campaignAllocations:
        [],
    });

    expect(
      vi.mocked(
        walletReadService.getOverview
      )
    ).toHaveBeenCalledWith({
      organizationId:
        ORGANIZATION_ID,

      limit:
        7,
    });
  });

  it("returns ledger entries with default pagination limit", async () => {
    const {
      app,
      walletReadService,
    } =
      createApp();

    const response =
      await app.inject({
        method:
          "GET",

        url:
          "/api/v1/client/wallet/ledger",
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
      ledgerEntries: [
        {
          walletId:
            WALLET_ID,

          entryType:
            "payment_credit",

          amount: {
            minorUnits:
              "500000",
          },
        },
      ],
    });

    expect(
      vi.mocked(
        walletReadService.listLedgerEntries
      )
    ).toHaveBeenCalledWith({
      organizationId:
        ORGANIZATION_ID,

      limit:
        25,
    });
  });

  it("rejects invalid limits", async () => {
    const {
      app,
    } =
      createApp();

    const response =
      await app.inject({
        method:
          "GET",

        url:
          "/api/v1/client/wallet/payments?limit=500",
      });

    await app.close();

    expect(
      response.statusCode
    ).toBe(
      400
    );
  });

  it("rejects unauthenticated Client Wallet read requests", async () => {
    const {
      app,
      walletReadService,
    } =
      createApp({
        authenticateClientRequest:
          vi.fn<
            ClientWalletReadRoutesDependencies[
              "authenticateClientRequest"
            ]
          >()
            .mockRejectedValue(
              new ClientWalletReadRouteAuthenticationError()
            ),
      });

    const response =
      await app.inject({
        method:
          "GET",

        url:
          "/api/v1/client/wallet",
      });

    await app.close();

    expect(
      response.statusCode
    ).toBe(
      401
    );

    expect(
      walletReadService.getOverview
    ).not.toHaveBeenCalled();
  });
});