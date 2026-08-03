import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  WalletFundingService,
} from "../src/application/payments/index.js";

import type {
  WalletFundingOrderRecord,
} from "../src/domains/payments/index.js";

import {
  ClientWalletRouteAuthenticationError,
  createClientWalletRoutes,
  type ClientWalletRoutesDependencies,
} from "../src/routes/client-wallet.routes.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-03T09:00:00.000Z");

const FUNDING_ORDER: WalletFundingOrderRecord = {
  id: FUNDING_ORDER_ID,
  organizationId: ORGANIZATION_ID,
  walletId: WALLET_ID,
  requestedByUserId: USER_ID,
  provider: "razorpay",
  providerOrderId: null,
  providerReceipt: null,
  amount: {
    minorUnits: 500000n,
    currency: "INR",
  },
  status: "created",
  idempotencyKey: "wallet-funding-0001",
  providerPayload: {},
  expiresAt: new Date("2026-08-03T09:15:00.000Z"),
  creditedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "1",
};

function registerApp(
  authenticateClientRequest:
    ClientWalletRoutesDependencies["authenticateClientRequest"],
  startFunding:
    WalletFundingService["startFunding"]
) {
  const app =
    Fastify();

  app.register(
    createClientWalletRoutes({
      authenticateClientRequest,

      walletFundingService: {
        startFunding,
      },
    })
  );

  return app;
}

describe("Client Wallet routes", () => {
  it("starts a Wallet funding order for an authenticated Client", async () => {
    const authenticateClientRequest =
      vi.fn<
        ClientWalletRoutesDependencies[
          "authenticateClientRequest"
        ]
      >()
        .mockResolvedValue({
          userId:
            USER_ID,

          organizationId:
            ORGANIZATION_ID,
        });

    const startFunding =
      vi.fn<
        WalletFundingService[
          "startFunding"
        ]
      >()
        .mockResolvedValue(
          FUNDING_ORDER
        );

    const app =
      registerApp(
        authenticateClientRequest,
        startFunding
      );

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/funding-orders",

        payload: {
          amountMinorUnits:
            "500000",

          currency:
            "INR",

          idempotencyKey:
            "wallet-funding-0001",

          providerPayload: {
            source:
              "client-wallet",
          },
        },
      });

    await app.close();

    expect(response.statusCode).toBe(201);

    expect(response.json()).toMatchObject({
      order: {
        id:
          FUNDING_ORDER_ID,

        amountMinorUnits:
          "500000",

        currency:
          "INR",

        status:
          "created",

        provider:
          "razorpay",
      },
    });

    const firstCall =
      startFunding.mock.calls[0];

    expect(firstCall).toBeDefined();

    expect(firstCall?.[0]).toMatchObject({
      organizationId:
        ORGANIZATION_ID,

      actorUserId:
        USER_ID,

      amountMinorUnits:
        500000n,

      currency:
        "INR",

      idempotencyKey:
        "wallet-funding-0001",

      provider:
        "razorpay",
    });
  });

  it("rejects invalid Wallet funding body", async () => {
    const authenticateClientRequest =
      vi.fn<
        ClientWalletRoutesDependencies[
          "authenticateClientRequest"
        ]
      >()
        .mockResolvedValue({
          userId:
            USER_ID,

          organizationId:
            ORGANIZATION_ID,
        });

    const startFunding =
      vi.fn<
        WalletFundingService[
          "startFunding"
        ]
      >()
        .mockResolvedValue(
          FUNDING_ORDER
        );

    const app =
      registerApp(
        authenticateClientRequest,
        startFunding
      );

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/funding-orders",

        payload: {
          amountMinorUnits:
            "abc",

          currency:
            "INR",

          idempotencyKey:
            "wallet-funding-0001",
        },
      });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(startFunding).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated Client Wallet funding requests", async () => {
    const authenticateClientRequest =
      vi.fn<
        ClientWalletRoutesDependencies[
          "authenticateClientRequest"
        ]
      >()
        .mockRejectedValue(
          new ClientWalletRouteAuthenticationError()
        );

    const startFunding =
      vi.fn<
        WalletFundingService[
          "startFunding"
        ]
      >()
        .mockResolvedValue(
          FUNDING_ORDER
        );

    const app =
      registerApp(
        authenticateClientRequest,
        startFunding
      );

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/funding-orders",

        payload: {
          amountMinorUnits:
            "500000",

          currency:
            "INR",

          idempotencyKey:
            "wallet-funding-0001",
        },
      });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(startFunding).not.toHaveBeenCalled();
  });
});