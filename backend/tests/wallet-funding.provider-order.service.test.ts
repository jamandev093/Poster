import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import type {
  AdvertiserWalletRecord,
  WalletFundingOrderRecord,
} from "../src/domains/payments/index.js";

import {
  WalletFundingConflictError,
  createWalletFundingService,
  type WalletFundingServiceDependencies,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-03T11:45:00.000Z");

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const WALLET: AdvertiserWalletRecord = {
  id: WALLET_ID,
  organizationId: ORGANIZATION_ID,
  currency: "INR",
  status: "active",
  availableBalance: { minorUnits: 0n, currency: "INR" },
  reservedBalance: { minorUnits: 0n, currency: "INR" },
  totalCredited: { minorUnits: 0n, currency: "INR" },
  totalSpent: { minorUnits: 0n, currency: "INR" },
  totalRefunded: { minorUnits: 0n, currency: "INR" },
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "1",
};

const CREATED_ORDER: WalletFundingOrderRecord = {
  id: FUNDING_ORDER_ID,
  organizationId: ORGANIZATION_ID,
  walletId: WALLET_ID,
  requestedByUserId: USER_ID,
  provider: "razorpay",
  providerOrderId: null,
  providerReceipt: null,
  amount: { minorUnits: 500000n, currency: "INR" },
  status: "created",
  idempotencyKey: "wallet-funding-0001",
  providerPayload: {},
  expiresAt: null,
  creditedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "1",
};

const ATTACHED_ORDER: WalletFundingOrderRecord = {
  ...CREATED_ORDER,
  providerOrderId: "order_razorpay_0001",
  providerReceipt: "wf_00000000000040008000000000001501",
  status: "pending_provider",
  providerPayload: {
    id: "order_razorpay_0001",
  },
  rowVersion: "2",
};

function createDependencies(
  overrides: Partial<WalletFundingServiceDependencies> = {}
) {
  const createProviderOrderMock =
    vi.fn<
      NonNullable<
        WalletFundingServiceDependencies[
          "createProviderOrder"
        ]
      >
    >()
      .mockResolvedValue({
        providerOrderId:
          "order_razorpay_0001",

        receipt:
          "wf_00000000000040008000000000001501",

        rawPayload: {
          id:
            "order_razorpay_0001",
        },
      });

  const attachProviderOrderMock =
    vi.fn<
      NonNullable<
        WalletFundingServiceDependencies[
          "attachProviderOrder"
        ]
      >
    >()
      .mockResolvedValue(
        ATTACHED_ORDER
      );

  const createFundingOrderMock =
    vi.fn<
      WalletFundingServiceDependencies[
        "createFundingOrder"
      ]
    >()
      .mockResolvedValue(
        CREATED_ORDER
      );

  const dependencies: WalletFundingServiceDependencies = {
    findWalletByOrganizationId:
      vi.fn<
        WalletFundingServiceDependencies[
          "findWalletByOrganizationId"
        ]
      >()
        .mockResolvedValue(
          WALLET
        ),

    createWallet:
      vi.fn<
        WalletFundingServiceDependencies[
          "createWallet"
        ]
      >()
        .mockResolvedValue(
          WALLET
        ),

    createFundingOrder:
      createFundingOrderMock,

    createProviderOrder:
      createProviderOrderMock,

    attachProviderOrder:
      attachProviderOrderMock,

    runTransaction:
      async operation =>
        await operation(
          EXECUTOR
        ),

    now:
      () => NOW,

    ...overrides,
  };

  return {
    dependencies,
    createProviderOrderMock,
    attachProviderOrderMock,
    createFundingOrderMock,
  };
}

function validInput() {
  return {
    organizationId:
      ORGANIZATION_ID,

    actorUserId:
      USER_ID,

    amountMinorUnits:
      500000n,

    currency:
      "INR" as const,

    idempotencyKey:
      "wallet-funding-0001",
  };
}

describe("Wallet funding provider order service", () => {
  it("creates and attaches a Razorpay provider order after local funding order creation", async () => {
    const {
      dependencies,
      createProviderOrderMock,
      attachProviderOrderMock,
    } =
      createDependencies();

    const service =
      createWalletFundingService(
        dependencies
      );

    const order =
      await service.startFunding(
        validInput()
      );

    expect(order).toMatchObject({
      id:
        FUNDING_ORDER_ID,

      providerOrderId:
        "order_razorpay_0001",

      status:
        "pending_provider",
    });

    expect(
      createProviderOrderMock
    ).toHaveBeenCalledTimes(
      1
    );

    expect(
      attachProviderOrderMock
    ).toHaveBeenCalledTimes(
      1
    );

    const providerCall =
      createProviderOrderMock.mock.calls[0]?.[0];

    if (providerCall === undefined) {
      throw new Error("Missing provider order call.");
    }

    expect(providerCall).toMatchObject({
      amountMinorUnits:
        500000n,

      currency:
        "INR",

      notes: {
        organizationId:
          ORGANIZATION_ID,

        walletId:
          WALLET_ID,

        fundingOrderId:
          FUNDING_ORDER_ID,
      },
    });

    expect(
      providerCall.receipt
    ).toMatch(
      /^wf_[0-9a-f]{32}$/
    );

    const attachCall =
      attachProviderOrderMock.mock.calls[0]?.[0];

    if (attachCall === undefined) {
      throw new Error("Missing provider attachment call.");
    }

    expect(attachCall).toMatchObject({
      fundingOrderId:
        FUNDING_ORDER_ID,

      providerOrderId:
        "order_razorpay_0001",

      expectedRowVersion:
        "1",
    });
  });

  it("does not create a duplicate provider order when the funding order already has one", async () => {
    const existingOrder: WalletFundingOrderRecord = {
      ...CREATED_ORDER,
      providerOrderId:
        "order_existing",

      providerReceipt:
        "wf_existing",

      status:
        "pending_provider",
    };

    const createFundingOrderMock =
      vi.fn<
        WalletFundingServiceDependencies[
          "createFundingOrder"
        ]
      >()
        .mockResolvedValue(
          existingOrder
        );

    const {
      dependencies,
      createProviderOrderMock,
      attachProviderOrderMock,
    } =
      createDependencies({
        createFundingOrder:
          createFundingOrderMock,
      });

    const service =
      createWalletFundingService(
        dependencies
      );

    const order =
      await service.startFunding(
        validInput()
      );

    expect(order).toBe(existingOrder);

    expect(
      createProviderOrderMock
    ).not.toHaveBeenCalled();

    expect(
      attachProviderOrderMock
    ).not.toHaveBeenCalled();
  });

  it("fails when provider order attachment loses optimistic row version", async () => {
    const attachProviderOrderMock =
      vi.fn<
        NonNullable<
          WalletFundingServiceDependencies[
            "attachProviderOrder"
          ]
        >
      >()
        .mockResolvedValue(
          null
        );

    const {
      dependencies,
    } =
      createDependencies({
        attachProviderOrder:
          attachProviderOrderMock,
      });

    const service =
      createWalletFundingService(
        dependencies
      );

    await expect(
      service.startFunding(
        validInput()
      )
    ).rejects.toBeInstanceOf(
      WalletFundingConflictError
    );
  });
});