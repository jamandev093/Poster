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
  WalletFundingValidationError,
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
  new Date("2026-08-03T07:30:00.000Z");

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const WALLET:
  AdvertiserWalletRecord = {
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
        0n,

      currency:
        "INR",
    },

    reservedBalance: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    totalCredited: {
      minorUnits:
        0n,

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

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  };

const FUNDING_ORDER:
  WalletFundingOrderRecord = {
    id:
      FUNDING_ORDER_ID,

    organizationId:
      ORGANIZATION_ID,

    walletId:
      WALLET_ID,

    requestedByUserId:
      USER_ID,

    provider:
      "razorpay",

    providerOrderId:
      null,

    providerReceipt:
      null,

    amount: {
      minorUnits:
        500000n,

      currency:
        "INR",
    },

    status:
      "created",

    idempotencyKey:
      "wallet-funding-0001",

    providerPayload: {},

    expiresAt:
      new Date("2026-08-03T07:45:00.000Z"),

    creditedAt:
      null,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  };

function createDependencies(
  overrides:
    Partial<WalletFundingServiceDependencies> =
    {}
) {
  const findWalletByOrganizationId =
    vi.fn<
      WalletFundingServiceDependencies[
        "findWalletByOrganizationId"
      ]
    >()
      .mockResolvedValue(
        WALLET
      );

  const createWallet =
    vi.fn<
      WalletFundingServiceDependencies[
        "createWallet"
      ]
    >()
      .mockResolvedValue(
        WALLET
      );

  const createFundingOrder =
    vi.fn<
      WalletFundingServiceDependencies[
        "createFundingOrder"
      ]
    >()
      .mockResolvedValue(
        FUNDING_ORDER
      );

  const dependencies:
    WalletFundingServiceDependencies = {
      findWalletByOrganizationId,
      createWallet,
      createFundingOrder,

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
    findWalletByOrganizationId,
    createWallet,
    createFundingOrder,
  };
}

describe(
  "Wallet funding service",
  () => {
    it(
      "creates a funding order for an existing Wallet",
      async () => {
        const {
          dependencies,
          findWalletByOrganizationId,
          createWallet,
          createFundingOrder,
        } =
          createDependencies();

        const service =
          createWalletFundingService(
            dependencies
          );

        const order =
          await service.startFunding({
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

            providerPayload: {
              source:
                "client-wallet",
            },
          });

        expect(
          order.id
        ).toBe(
          FUNDING_ORDER_ID
        );

        expect(
          findWalletByOrganizationId
        ).toHaveBeenCalledWith(
          ORGANIZATION_ID,
          EXECUTOR
        );

        expect(
          createWallet
        ).not.toHaveBeenCalled();

        const firstCall =
          createFundingOrder.mock.calls[0];

        expect(
          firstCall
        ).toBeDefined();

        expect(
          firstCall?.[0]
        ).toMatchObject({
          organizationId:
            ORGANIZATION_ID,

          walletId:
            WALLET_ID,

          requestedByUserId:
            USER_ID,

          provider:
            "razorpay",

          idempotencyKey:
            "wallet-funding-0001",
        });

        expect(
          firstCall?.[0].expiresAt?.toISOString()
        ).toBe(
          "2026-08-03T07:45:00.000Z"
        );
      }
    );

    it(
      "creates a Wallet before creating the funding order when one does not exist",
      async () => {
        const {
          dependencies,
          createWallet,
          createFundingOrder,
        } =
          createDependencies({
            findWalletByOrganizationId:
              vi.fn<
                WalletFundingServiceDependencies[
                  "findWalletByOrganizationId"
                ]
              >()
                .mockResolvedValue(
                  null
                ),
          });

        const service =
          createWalletFundingService(
            dependencies
          );

        await service.startFunding({
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
        });

        expect(
          createWallet
        ).toHaveBeenCalledWith(
          {
            organizationId:
              ORGANIZATION_ID,

            currency:
              "INR",
          },
          EXECUTOR
        );

        expect(
          createFundingOrder
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "rejects invalid funding requests before transaction writes",
      async () => {
        const {
          dependencies,
          findWalletByOrganizationId,
          createWallet,
          createFundingOrder,
        } =
          createDependencies();

        const service =
          createWalletFundingService(
            dependencies
          );

        await expect(
          service.startFunding({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            amountMinorUnits:
              9999n,

            currency:
              "INR",

            idempotencyKey:
              "wallet-funding-0001",
          })
        ).rejects.toBeInstanceOf(
          WalletFundingValidationError
        );

        expect(
          findWalletByOrganizationId
        ).not.toHaveBeenCalled();

        expect(
          createWallet
        ).not.toHaveBeenCalled();

        expect(
          createFundingOrder
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "uses an explicit expiry when provided",
      async () => {
        const {
          dependencies,
          createFundingOrder,
        } =
          createDependencies();

        const explicitExpiry =
          new Date(
            "2026-08-03T08:00:00.000Z"
          );

        const service =
          createWalletFundingService(
            dependencies
          );

        await service.startFunding({
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

          expiresAt:
            explicitExpiry,
        });

        const firstCall =
          createFundingOrder.mock.calls[0];

        expect(
          firstCall
        ).toBeDefined();

        expect(
          firstCall?.[0].expiresAt
        ).toBe(
          explicitExpiry
        );
      }
    );
  }
);