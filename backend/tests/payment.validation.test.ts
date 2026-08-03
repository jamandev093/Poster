import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateLedgerBalanceAfter,
  validateLedgerEntryInput,
  validateWalletFundingOrderInput,
} from "../src/domains/payments/index.js";

const BASE_FUNDING_INPUT = {
  organizationId: "00000000-0000-4000-8000-000000001101",
  walletId: "00000000-0000-4000-8000-000000001201",
  amountMinorUnits: 500000n,
  currency: "INR" as const,
  provider: "razorpay" as const,
  actorUserId: "00000000-0000-4000-8000-000000001301",
  idempotencyKey: "wallet-funding-0001",
};

const BASE_LEDGER_INPUT = {
  organizationId: "00000000-0000-4000-8000-000000001101",
  walletId: "00000000-0000-4000-8000-000000001201",
  entryType: "payment_credit" as const,
  direction: "credit" as const,
  amountMinorUnits: 500000n,
  currency: "INR" as const,
  balanceBeforeMinorUnits: 100000n,
  balanceAfterMinorUnits: 600000n,
  idempotencyKey: "ledger-entry-0001",
  actorUserId: "00000000-0000-4000-8000-000000001301",
  campaignId: null,
  invoiceId: null,
  paymentId: null,
  refundId: null,
  providerReference: "razorpay-payment-0001",
};

describe("Payment and Wallet validation", () => {
  it("accepts a valid Razorpay Wallet funding order", () => {
    expect(validateWalletFundingOrderInput(BASE_FUNDING_INPUT)).toEqual([]);
  });

  it("rejects Wallet funding outside allowed amount bounds", () => {
    expect(
      validateWalletFundingOrderInput({
        ...BASE_FUNDING_INPUT,
        amountMinorUnits: 9999n,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "amountMinorUnits" }),
      ])
    );

    expect(
      validateWalletFundingOrderInput({
        ...BASE_FUNDING_INPUT,
        amountMinorUnits: 100000001n,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "amountMinorUnits" }),
      ])
    );
  });

  it("calculates credit, debit, and neutral ledger balances", () => {
    expect(
      calculateLedgerBalanceAfter({
        balanceBeforeMinorUnits: 100000n,
        amountMinorUnits: 25000n,
        direction: "credit",
      })
    ).toBe(125000n);

    expect(
      calculateLedgerBalanceAfter({
        balanceBeforeMinorUnits: 100000n,
        amountMinorUnits: 25000n,
        direction: "debit",
      })
    ).toBe(75000n);

    expect(
      calculateLedgerBalanceAfter({
        balanceBeforeMinorUnits: 100000n,
        amountMinorUnits: 25000n,
        direction: "neutral",
      })
    ).toBe(100000n);
  });

  it("accepts a valid ledger entry", () => {
    expect(validateLedgerEntryInput(BASE_LEDGER_INPUT)).toEqual([]);
  });

  it("rejects ledger entries with mismatched or negative balances", () => {
    expect(
      validateLedgerEntryInput({
        ...BASE_LEDGER_INPUT,
        balanceAfterMinorUnits: 500000n,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "balanceAfterMinorUnits" }),
      ])
    );

    expect(
      validateLedgerEntryInput({
        ...BASE_LEDGER_INPUT,
        direction: "debit",
        amountMinorUnits: 700000n,
        balanceAfterMinorUnits: -100000n,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "balanceAfterMinorUnits" }),
      ])
    );
  });
});
