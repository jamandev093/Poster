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
  AdvertiserPaymentRecord,
  AdvertiserWalletLedgerEntryRecord,
  AdvertiserWalletRecord,
  WalletFundingOrderRecord,
} from "../src/domains/payments/index.js";

import {
  WalletCreditingConflictError,
  WalletCreditingValidationError,
  createWalletCreditingService,
  type WalletCreditingServiceDependencies,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const PAYMENT_ID =
  "00000000-0000-4000-8000-000000001901";

const LEDGER_ID =
  "00000000-0000-4000-8000-000000002201";

const NOW =
  new Date("2026-08-03T08:00:00.000Z");

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const WALLET:
  AdvertiserWalletRecord = {
    id: WALLET_ID,
    organizationId: ORGANIZATION_ID,
    currency: "INR",
    status: "active",
    availableBalance: { minorUnits: 100000n, currency: "INR" },
    reservedBalance: { minorUnits: 0n, currency: "INR" },
    totalCredited: { minorUnits: 100000n, currency: "INR" },
    totalSpent: { minorUnits: 0n, currency: "INR" },
    totalRefunded: { minorUnits: 0n, currency: "INR" },
    createdAt: NOW,
    updatedAt: NOW,
    rowVersion: "4",
  };

const FUNDING_ORDER:
  WalletFundingOrderRecord = {
    id: FUNDING_ORDER_ID,
    organizationId: ORGANIZATION_ID,
    walletId: WALLET_ID,
    requestedByUserId: USER_ID,
    provider: "razorpay",
    providerOrderId: "order_razorpay_0001",
    providerReceipt: "receipt-0001",
    amount: { minorUnits: 500000n, currency: "INR" },
    status: "pending_provider",
    idempotencyKey: "wallet-funding-0001",
    providerPayload: {},
    expiresAt: null,
    creditedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    rowVersion: "2",
  };

const PAYMENT:
  AdvertiserPaymentRecord = {
    id: PAYMENT_ID,
    organizationId: ORGANIZATION_ID,
    walletId: WALLET_ID,
    fundingOrderId: FUNDING_ORDER_ID,
    invoiceId: null,
    campaignId: null,
    provider: "razorpay",
    providerOrderId: "order_razorpay_0001",
    providerPaymentId: "pay_razorpay_0001",
    providerSignatureDigest: "digest-0001",
    status: "captured",
    amount: { minorUnits: 500000n, currency: "INR" },
    captured: { minorUnits: 500000n, currency: "INR" },
    refunded: { minorUnits: 0n, currency: "INR" },
    methodDetails: {},
    providerPayload: {},
    webhookVerifiedAt: NOW,
    paidAt: NOW,
    failedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    rowVersion: "1",
  };

const LEDGER:
  AdvertiserWalletLedgerEntryRecord = {
    id: LEDGER_ID,
    organizationId: ORGANIZATION_ID,
    walletId: WALLET_ID,
    fundingOrderId: FUNDING_ORDER_ID,
    campaignId: null,
    allocationId: null,
    invoiceId: null,
    paymentId: PAYMENT_ID,
    refundId: null,
    entryType: "payment_credit",
    direction: "credit",
    status: "posted",
    amount: { minorUnits: 500000n, currency: "INR" },
    balanceBefore: { minorUnits: 100000n, currency: "INR" },
    balanceAfter: { minorUnits: 600000n, currency: "INR" },
    idempotencyKey: "wallet-credit:pay_razorpay_0001",
    providerReference: "pay_razorpay_0001",
    metadata: {},
    createdByUserId: USER_ID,
    createdAt: NOW,
    rowVersion: "1",
  };

const UPDATED_WALLET:
  AdvertiserWalletRecord = {
    ...WALLET,
    availableBalance: { minorUnits: 600000n, currency: "INR" },
    totalCredited: { minorUnits: 600000n, currency: "INR" },
    rowVersion: "5",
  };

const CREDITED_FUNDING_ORDER:
  WalletFundingOrderRecord = {
    ...FUNDING_ORDER,
    status: "credited",
    creditedAt: NOW,
    rowVersion: "3",
  };

function createDependencies(
  overrides:
    Partial<WalletCreditingServiceDependencies> =
    {}
) {
  const dependencies:
    WalletCreditingServiceDependencies = {
      findFundingOrderById:
        vi.fn<
          WalletCreditingServiceDependencies[
            "findFundingOrderById"
          ]
        >().mockResolvedValue(FUNDING_ORDER),

      markFundingOrderCredited:
        vi.fn<
          WalletCreditingServiceDependencies[
            "markFundingOrderCredited"
          ]
        >().mockResolvedValue(CREDITED_FUNDING_ORDER),

      findWalletByOrganizationId:
        vi.fn<
          WalletCreditingServiceDependencies[
            "findWalletByOrganizationId"
          ]
        >().mockResolvedValue(WALLET),

      updateWalletBalances:
        vi.fn<
          WalletCreditingServiceDependencies[
            "updateWalletBalances"
          ]
        >().mockResolvedValue(UPDATED_WALLET),

      findPaymentByProviderPaymentId:
        vi.fn<
          WalletCreditingServiceDependencies[
            "findPaymentByProviderPaymentId"
          ]
        >().mockResolvedValue(null),

      createPayment:
        vi.fn<
          WalletCreditingServiceDependencies[
            "createPayment"
          ]
        >().mockResolvedValue(PAYMENT),

      createLedgerEntry:
        vi.fn<
          WalletCreditingServiceDependencies[
            "createLedgerEntry"
          ]
        >().mockResolvedValue(LEDGER),

      runTransaction:
        async operation =>
          await operation(EXECUTOR),

      now:
        () => NOW,

      ...overrides,
    };

  return dependencies;
}

function createValidInput() {
  return {
    organizationId: ORGANIZATION_ID,
    actorUserId: USER_ID,
    fundingOrderId: FUNDING_ORDER_ID,
    provider: "razorpay" as const,
    providerOrderId: "order_razorpay_0001",
    providerPaymentId: "pay_razorpay_0001",
    providerSignatureDigest: "digest-0001",
    amountMinorUnits: 500000n,
    currency: "INR" as const,
    methodDetails: { method: "upi" },
    providerPayload: { provider: "razorpay" },
  };
}

describe("Wallet crediting service", () => {
  it("credits a verified payment into Wallet, ledger, and funding order", async () => {
    const dependencies =
      createDependencies();

    const service =
      createWalletCreditingService(dependencies);

    const result =
      await service.creditVerifiedPayment(
        createValidInput()
      );

    expect(result).toMatchObject({
      payment: {
        id: PAYMENT_ID,
      },
      wallet: {
        id: WALLET_ID,
      },
      fundingOrder: {
        status: "credited",
      },
    });

    expect(dependencies.createPayment).toHaveBeenCalledTimes(1);
    expect(dependencies.createLedgerEntry).toHaveBeenCalledTimes(1);
    expect(dependencies.updateWalletBalances).toHaveBeenCalledTimes(1);
    expect(dependencies.markFundingOrderCredited).toHaveBeenCalledTimes(1);

    const walletUpdate =
      vi.mocked(dependencies.updateWalletBalances).mock.calls[0]?.[0];

    expect(walletUpdate).toMatchObject({
      walletId: WALLET_ID,
      availableBalanceMinorUnits: 600000n,
      totalCreditedMinorUnits: 600000n,
      expectedRowVersion: "4",
    });
  });

  it("returns an existing payment on provider replay without duplicate writes", async () => {
    const dependencies =
      createDependencies({
        findPaymentByProviderPaymentId:
          vi.fn<
            WalletCreditingServiceDependencies[
              "findPaymentByProviderPaymentId"
            ]
          >().mockResolvedValue(PAYMENT),
      });

    const service =
      createWalletCreditingService(dependencies);

    const result =
      await service.creditVerifiedPayment(
        createValidInput()
      );

    expect(result).toBe(PAYMENT);
    expect(dependencies.createPayment).not.toHaveBeenCalled();
    expect(dependencies.createLedgerEntry).not.toHaveBeenCalled();
    expect(dependencies.updateWalletBalances).not.toHaveBeenCalled();
  });

  it("rejects invalid payment input before transaction writes", async () => {
    const dependencies =
      createDependencies();

    const service =
      createWalletCreditingService(dependencies);

    await expect(
      service.creditVerifiedPayment({
        ...createValidInput(),
        amountMinorUnits: 0n,
      })
    ).rejects.toBeInstanceOf(
      WalletCreditingValidationError
    );

    expect(dependencies.findFundingOrderById).not.toHaveBeenCalled();
    expect(dependencies.createPayment).not.toHaveBeenCalled();
  });

  it("rejects mismatched funding order amount", async () => {
    const dependencies =
      createDependencies({
        findFundingOrderById:
          vi.fn<
            WalletCreditingServiceDependencies[
              "findFundingOrderById"
            ]
          >().mockResolvedValue({
            ...FUNDING_ORDER,
            amount: { minorUnits: 100000n, currency: "INR" },
          }),
      });

    const service =
      createWalletCreditingService(dependencies);

    await expect(
      service.creditVerifiedPayment(createValidInput())
    ).rejects.toBeInstanceOf(
      WalletCreditingConflictError
    );

    expect(dependencies.createPayment).not.toHaveBeenCalled();
  });

  it("fails when Wallet optimistic update returns null", async () => {
    const dependencies =
      createDependencies({
        updateWalletBalances:
          vi.fn<
            WalletCreditingServiceDependencies[
              "updateWalletBalances"
            ]
          >().mockResolvedValue(null),
      });

    const service =
      createWalletCreditingService(dependencies);

    await expect(
      service.creditVerifiedPayment(createValidInput())
    ).rejects.toBeInstanceOf(
      WalletCreditingConflictError
    );

    expect(dependencies.markFundingOrderCredited).not.toHaveBeenCalled();
  });
});