import type {
  AdvertisingActorReference,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  CurrencyExchangeReference,
  MoneyAmount,
  SupportedCurrency,
} from "./currency.types";

import type {
  PaymentId,
  PaymentProvider,
} from "./payment.types";

/**
 * Canonical payment-settlement contracts.
 *
 * Settlement is intentionally separate from:
 *
 * - advertiser payment confirmation;
 * - invoice payment state;
 * - Client campaign-balance credit;
 * - campaign spend deductions;
 * - refunds.
 *
 * A verified captured payment may make campaign funds
 * available before the provider finishes bank settlement,
 * subject to Poster risk and finance policy.
 */

export type SettlementId =
  `SET-${string}`;

export type SettlementBatchId =
  `STB-${string}`;

export type SettlementAdjustmentId =
  `SAD-${string}`;

export type SettlementProviderEventId =
  `SWE-${string}`;

export type BankAccountReferenceId =
  `BNK-${string}`;

export type SettlementStatus =
  | "not_initiated"
  | "queued"
  | "processing"
  | "settled"
  | "failed"
  | "on_hold"
  | "reversed";

export type SettlementMode =
  | "standard"
  | "instant"
  | "manual";

export type SettlementSource =
  | "razorpay"
  | "manual_bank_transfer";

export type SettlementAdjustmentType =
  | "provider_fee"
  | "tax"
  | "fx_adjustment"
  | "chargeback"
  | "settlement_reversal"
  | "manual_correction";

export type SettlementHoldReason =
  | "risk_review"
  | "provider_review"
  | "bank_account_issue"
  | "compliance_review"
  | "dispute"
  | "insufficient_provider_balance"
  | "manual_operations_hold"
  | "other";

export interface SettlementBankAccountReference {
  id:
    BankAccountReferenceId;

  accountHolderName:
    string;

  bankName?:
    string;

  accountLastFour:
    string;

  countryCode:
    string;

  currency:
    SupportedCurrency;

  verified:
    boolean;
}

export interface SettlementProviderReference {
  provider:
    PaymentProvider;

  providerSettlementId?:
    string;

  providerBatchId?:
    string;

  providerStatus?:
    string;

  providerUtr?:
    string;

  providerEventId?:
    string;
}

export interface SettlementPaymentAllocation {
  paymentId:
    PaymentId;

  grossAmount:
    MoneyAmount;

  providerFee:
    MoneyAmount;

  taxAmount:
    MoneyAmount;

  adjustmentAmount:
    MoneyAmount;

  netSettlementAmount:
    MoneyAmount;

  allocatedAt:
    string;
}

export interface SettlementAdjustment {
  id:
    SettlementAdjustmentId;

  type:
    SettlementAdjustmentType;

  description:
    string;

  amount:
    MoneyAmount;

  providerReference?:
    string;

  createdBy:
    AdvertisingActorReference;

  createdAt:
    string;
}

export interface AdvertiserPaymentSettlement {
  id:
    SettlementId;

  batchId?:
    SettlementBatchId;

  organizationId:
    OrganizationId;

  source:
    SettlementSource;

  mode:
    SettlementMode;

  status:
    SettlementStatus;

  settlementCurrency:
    SupportedCurrency;

  grossAmount:
    MoneyAmount;

  providerFee:
    MoneyAmount;

  taxAmount:
    MoneyAmount;

  adjustmentAmount:
    MoneyAmount;

  netAmount:
    MoneyAmount;

  paymentAllocations:
    SettlementPaymentAllocation[];

  adjustments:
    SettlementAdjustment[];

  exchangeReference?:
    CurrencyExchangeReference;

  bankAccount:
    SettlementBankAccountReference;

  providerReference:
    SettlementProviderReference;

  holdReason?:
    SettlementHoldReason;

  holdNote?:
    string;

  failureCode?:
    string;

  failureMessage?:
    string;

  expectedSettlementAt?:
    string;

  processingAt?:
    string;

  settledAt?:
    string;

  failedAt?:
    string;

  heldAt?:
    string;

  reversedAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface SettlementBatch {
  id:
    SettlementBatchId;

  source:
    SettlementSource;

  mode:
    SettlementMode;

  status:
    SettlementStatus;

  settlementCurrency:
    SupportedCurrency;

  settlementIds:
    SettlementId[];

  grossAmount:
    MoneyAmount;

  providerFee:
    MoneyAmount;

  taxAmount:
    MoneyAmount;

  adjustmentAmount:
    MoneyAmount;

  netAmount:
    MoneyAmount;

  providerBatchReference?:
    string;

  bankAccountId:
    BankAccountReferenceId;

  expectedSettlementAt?:
    string;

  settledAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface SettlementStatusSummary {
  status:
    SettlementStatus;

  processing:
    boolean;

  completed:
    boolean;

  failed:
    boolean;

  held:
    boolean;

  terminal:
    boolean;
}

function assertNonNegativeMinorAmount(
  amount:
    MoneyAmount,
  label:
    string
): void {
  if (
    !Number.isSafeInteger(
      amount.amountMinor
    ) ||
    amount.amountMinor < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer in minor units.`
    );
  }
}

function assertCurrency(
  amount:
    MoneyAmount,
  currency:
    SupportedCurrency,
  label:
    string
): void {
  if (
    amount.currency !==
    currency
  ) {
    throw new Error(
      `${label} currency must match the settlement currency.`
    );
  }
}

export function calculateNetSettlementAmountMinor(
  grossAmountMinor:
    number,
  providerFeeMinor:
    number,
  taxMinor:
    number,
  adjustmentMinor:
    number
): number {
  const values = [
    grossAmountMinor,
    providerFeeMinor,
    taxMinor,
    adjustmentMinor,
  ];

  if (
    values.some(
      (
        value
      ) =>
        !Number.isSafeInteger(
          value
        )
    )
  ) {
    throw new Error(
      "Settlement calculations require safe integers in minor units."
    );
  }

  if (
    grossAmountMinor < 0 ||
    providerFeeMinor < 0 ||
    taxMinor < 0
  ) {
    throw new Error(
      "Settlement gross amount, provider fee, and tax must not be negative."
    );
  }

  return Math.max(
    grossAmountMinor -
      providerFeeMinor -
      taxMinor +
      adjustmentMinor,
    0
  );
}

export function getSettlementStatusSummary(
  status:
    SettlementStatus
): SettlementStatusSummary {
  switch (status) {
    case "not_initiated":
    case "queued":
      return {
        status,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        held:
          false,
        terminal:
          false,
      };

    case "processing":
      return {
        status,
        processing:
          true,
        completed:
          false,
        failed:
          false,
        held:
          false,
        terminal:
          false,
      };

    case "settled":
      return {
        status,
        processing:
          false,
        completed:
          true,
        failed:
          false,
        held:
          false,
        terminal:
          true,
      };

    case "failed":
      return {
        status,
        processing:
          false,
        completed:
          false,
        failed:
          true,
        held:
          false,
        terminal:
          true,
      };

    case "on_hold":
      return {
        status,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        held:
          true,
        terminal:
          false,
      };

    case "reversed":
      return {
        status,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        held:
          false,
        terminal:
          true,
      };
  }
}

export function assertSettlementCurrencyConsistency(
  settlement:
    AdvertiserPaymentSettlement
): void {
  const currency =
    settlement.settlementCurrency;

  const directAmounts = [
    {
      label:
        "Gross amount",
      value:
        settlement.grossAmount,
    },
    {
      label:
        "Provider fee",
      value:
        settlement.providerFee,
    },
    {
      label:
        "Tax amount",
      value:
        settlement.taxAmount,
    },
    {
      label:
        "Adjustment amount",
      value:
        settlement.adjustmentAmount,
    },
    {
      label:
        "Net amount",
      value:
        settlement.netAmount,
    },
  ];

  directAmounts.forEach(
    (
      entry
    ) => {
      assertCurrency(
        entry.value,
        currency,
        entry.label
      );

      assertNonNegativeMinorAmount(
        entry.value,
        entry.label
      );
    }
  );

  settlement.paymentAllocations.forEach(
    (
      allocation
    ) => {
      const allocationAmounts = [
        allocation.grossAmount,
        allocation.providerFee,
        allocation.taxAmount,
        allocation.adjustmentAmount,
        allocation.netSettlementAmount,
      ];

      allocationAmounts.forEach(
        (
          amount
        ) => {
          assertCurrency(
            amount,
            currency,
            "Settlement payment allocation"
          );

          assertNonNegativeMinorAmount(
            amount,
            "Settlement payment allocation"
          );
        }
      );
    }
  );

  settlement.adjustments.forEach(
    (
      adjustment
    ) => {
      assertCurrency(
        adjustment.amount,
        currency,
        "Settlement adjustment"
      );

      assertNonNegativeMinorAmount(
        adjustment.amount,
        "Settlement adjustment"
      );
    }
  );
}

export function isSettlementComplete(
  settlement:
    AdvertiserPaymentSettlement
): boolean {
  return (
    settlement.status ===
      "settled" &&
    Boolean(
      settlement.settledAt
    )
  );
}

export function isSettlementDelayed(
  settlement:
    AdvertiserPaymentSettlement,
  currentAt:
    string
): boolean {
  if (
    settlement.status ===
      "settled" ||
    settlement.status ===
      "failed" ||
    settlement.status ===
      "reversed" ||
    !settlement
      .expectedSettlementAt
  ) {
    return false;
  }

  const expected =
    new Date(
      settlement
        .expectedSettlementAt
    ).getTime();

  const current =
    new Date(
      currentAt
    ).getTime();

  if (
    Number.isNaN(
      expected
    ) ||
    Number.isNaN(
      current
    )
  ) {
    return false;
  }

  return current >
    expected;
}

export function canCampaignBalanceBeAvailableBeforeSettlement(
  paymentVerified:
    boolean,
  riskAccepted:
    boolean,
  settlementStatus:
    SettlementStatus
): boolean {
  if (
    !paymentVerified ||
    !riskAccepted
  ) {
    return false;
  }

  return (
    settlementStatus ===
      "not_initiated" ||
    settlementStatus ===
      "queued" ||
    settlementStatus ===
      "processing" ||
    settlementStatus ===
      "settled"
  );
}
